import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

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

        return NextResponse.json(period);
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
        const { payrollItems } = body;

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
                    horasExtra: item.horasExtra || 0,
                    valorHoraExtra: item.valorHoraExtra || 0,
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

        // Check access - only SUPER_ADMIN can delete
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
