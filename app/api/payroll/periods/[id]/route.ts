import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

const updatePeriodSchema = z.object({
    payrollItems: z.array(z.object({
        id: z.string().min(1),
        diasTrabajados: z.coerce.number().int().min(0).max(31).optional(),
        horasExtra: z.coerce.number().nonnegative().optional(),
        valorHoraExtra: z.coerce.number().nonnegative().optional(),
        totalHaberes: z.coerce.number(),
        totalDescuentosLegales: z.coerce.number(),
        liquidoPagar: z.coerce.number(),
        earnings: z.array(z.object({
            tipo: z.string(),
            concepto: z.string(),
            monto: z.coerce.number(),
        })),
        deductions: z.array(z.object({
            tipo: z.string(),
            concepto: z.string(),
            monto: z.coerce.number(),
        })),
    })).min(1, "Debe haber al menos un ítem de liquidación"),
});

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { id } = await params;

        const period = await prisma.payrollPeriod.findUnique({
            where: { id },
            include: {
                company: true,
                payrollItems: {
                    include: {
                        worker: true,
                        earnings: true,
                        deductions: true,
                    },
                    orderBy: {
                        worker: {
                            apellidoPaterno: "asc",
                        },
                    },
                },
            },
        });

        if (!period) {
            return NextResponse.json({ error: "Período no encontrado" }, { status: 404 });
        }

        // Fetch monthly indicators for the period's year/month
        const [year, month] = period.yearMonth.split("-").map(Number);
        const indicadorMensual = await prisma.indicadorMensual.findUnique({
            where: { year_month: { year, month } },
            include: { afpRates: true, cesantiaRates: true },
        });

        // Check access
        if (session.user.role !== "SUPER_ADMIN") {
            const hasAccess = await prisma.userCompany.findFirst({
                where: {
                    userId: session.user.id,
                    companyId: period.companyId,
                },
            });

            if (!hasAccess) {
                return NextResponse.json({ error: "Sin acceso" }, { status: 403 });
            }
        }

        return NextResponse.json({ ...period, indicadores: indicadorMensual });
    } catch (error) {
        console.error("Error fetching period:", error);
        return NextResponse.json({ error: "Error al obtener período" }, { status: 500 });
    }
}

// PUT - Update payroll period items
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { payrollItems } = updatePeriodSchema.parse(body);

        // Get existing period
        const period = await prisma.payrollPeriod.findUnique({
            where: { id },
            include: { payrollItems: true },
        });

        if (!period) {
            return NextResponse.json({ error: "Período no encontrado" }, { status: 404 });
        }

        // Check access
        if (session.user.role !== "SUPER_ADMIN") {
            const hasAccess = await prisma.userCompany.findFirst({
                where: {
                    userId: session.user.id,
                    companyId: period.companyId,
                },
            });

            if (!hasAccess) {
                return NextResponse.json({ error: "Sin acceso" }, { status: 403 });
            }
        }

        // Update each payroll item
        for (const item of payrollItems) {
            // Delete existing earnings and deductions
            await prisma.payrollEarning.deleteMany({
                where: { payrollItemId: item.id },
            });
            await prisma.payrollDeduction.deleteMany({
                where: { payrollItemId: item.id },
            });

            // Update payroll item with new data
            await prisma.payrollItem.update({
                where: { id: item.id },
                data: {
                    diasTrabajados: item.diasTrabajados || 30,
                    // Number() tolera Decimals serializados como string por el GET
                    horasExtra: Number(item.horasExtra) || 0,
                    valorHoraExtra: Number(item.valorHoraExtra) || 0,
                    totalHaberes: item.totalHaberes,
                    totalDescuentosLegales: item.totalDescuentosLegales,
                    liquidoPagar: item.liquidoPagar,
                    earnings: {
                        create: item.earnings.map((e: any) => ({
                            tipo: e.tipo,
                            concepto: e.concepto,
                            monto: e.monto,
                        })),
                    },
                    deductions: {
                        create: item.deductions.map((d: any) => ({
                            tipo: d.tipo,
                            concepto: d.concepto,
                            monto: d.monto,
                        })),
                    },
                },
            });
        }

        return NextResponse.json({
            success: true,
            message: "Liquidación actualizada correctamente",
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Datos de entrada inválidos", issues: error.issues },
                { status: 400 }
            );
        }
        console.error("Error updating period:", error);
        return NextResponse.json({ error: "Error al actualizar período" }, { status: 500 });
    }
}

// DELETE - Delete payroll period
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { id } = await params;

        const period = await prisma.payrollPeriod.findUnique({
            where: { id },
        });

        if (!period) {
            return NextResponse.json({ error: "Período no encontrado" }, { status: 404 });
        }

        // Fetch monthly indicators for the period's year/month
        const [year, month] = period.yearMonth.split("-").map(Number);
        const indicadorMensual = await prisma.indicadorMensual.findUnique({
            where: { year_month: { year, month } },
            include: { afpRates: true, cesantiaRates: true },
        });

        // Check access
        if (session.user.role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "Solo administradores pueden eliminar períodos" }, { status: 403 });
        }

        // Delete in order: earnings/deductions -> items -> period
        await prisma.payrollEarning.deleteMany({
            where: { payrollItem: { periodId: id } },
        });
        await prisma.payrollDeduction.deleteMany({
            where: { payrollItem: { periodId: id } },
        });
        await prisma.payrollItem.deleteMany({
            where: { periodId: id },
        });
        await prisma.payrollPeriod.delete({
            where: { id },
        });

        return NextResponse.json({
            success: true,
            message: "Período eliminado correctamente",
        });
    } catch (error) {
        console.error("Error deleting period:", error);
        return NextResponse.json({ error: "Error al eliminar período" }, { status: 500 });
    }
}
