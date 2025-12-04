import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const body = await request.json();
        const { companyId, year, month, payrolls, systemValue } = body;

        // Validate access
        if (session.user.role !== "SUPER_ADMIN") {
            const hasAccess = await prisma.userCompany.findFirst({
                where: {
                    userId: session.user.id,
                    companyId,
                },
            });

            if (!hasAccess) {
                return NextResponse.json({ error: "Sin acceso" }, { status: 403 });
            }
        }

        const yearMonth = `${year}-${month.toString().padStart(2, "0")}`;
        const fechaInicio = new Date(year, month - 1, 1);
        const fechaFin = new Date(year, month, 0);

        // Check if period already exists
        const existingPeriod = await prisma.payrollPeriod.findUnique({
            where: {
                companyId_yearMonth: {
                    companyId,
                    yearMonth,
                },
            },
        });

        if (existingPeriod) {
            return NextResponse.json(
                { error: `Ya existe un período de liquidación para ${month}/${year}` },
                { status: 400 }
            );
        }

        // Create payroll period with all items
        const period = await prisma.payrollPeriod.create({
            data: {
                companyId,
                yearMonth,
                fechaInicio,
                fechaFin,
                status: "LIQUIDADA",
                payrollItems: {
                    create: payrolls.map((payroll: any) => ({
                        workerId: payroll.workerId,
                        diasTrabajados: 30,
                        horasExtra: (payroll.inputs?.horasExtras50 || 0) + (payroll.inputs?.horasExtras100 || 0),
                        valorHoraExtra: payroll.horasExtras,
                        totalHaberes: payroll.totalHaberes,
                        totalDescuentosLegales: payroll.totalDescuentos,
                        totalDescuentosVoluntarios: 0,
                        liquidoPagar: payroll.liquido,
                        earnings: {
                            create: payroll.detalleHaberes.map((item: any) => ({
                                tipo: mapEarningType(item.concepto),
                                concepto: item.concepto,
                                monto: item.monto,
                            })),
                        },
                        deductions: {
                            create: payroll.detalleDescuentos.map((item: any) => ({
                                tipo: mapDeductionType(item.concepto),
                                concepto: item.concepto,
                                monto: item.monto,
                            })),
                        },
                    })),
                },
            },
            include: {
                payrollItems: {
                    include: {
                        worker: true,
                        earnings: true,
                        deductions: true,
                    },
                },
            },
        });

        return NextResponse.json({
            success: true,
            periodId: period.id,
            message: `Período ${month}/${year} guardado correctamente`,
        });
    } catch (error) {
        console.error("Error saving payroll period:", error);
        return NextResponse.json(
            { error: "Error al guardar el período de liquidación" },
            { status: 500 }
        );
    }
}

function mapEarningType(concepto: string): string {
    if (concepto.includes("Sueldo Base")) return "SUELDO_BASE";
    if (concepto.includes("Horas Extra")) return "HORAS_EXTRA";
    if (concepto.includes("Gratificación")) return "GRATIFICACION";
    if (concepto.includes("Colación")) return "BONO_COLACION";
    if (concepto.includes("Movilización")) return "BONO_MOVILIZACION";
    if (concepto.includes("Viático")) return "BONO_VIATICO";
    return "OTRO";
}

function mapDeductionType(concepto: string): string {
    if (concepto.includes("AFP")) return "AFP";
    if (concepto.includes("Fonasa") || concepto.includes("Isapre")) return "SALUD";
    if (concepto.includes("Cesantía")) return "CESANTIA";
    if (concepto.includes("Impuesto")) return "IMPUESTO_UNICO";
    return "OTRO";
}
