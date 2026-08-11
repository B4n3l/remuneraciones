import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { renderToBuffer } from "@react-pdf/renderer";
import { LibroRemuneracionesPDF } from "@/lib/pdf/libro-template";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ companyId: string }> }
) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { companyId } = await params;
        const { searchParams } = new URL(request.url);
        const yearParam = searchParams.get("year");
        const monthParam = searchParams.get("month");

        if (!yearParam || !monthParam) {
            return NextResponse.json(
                { error: "Se requieren los parámetros year y month" },
                { status: 400 }
            );
        }

        const year = parseInt(yearParam, 10);
        const month = parseInt(monthParam, 10);

        if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
            return NextResponse.json(
                { error: "Año o mes inválido" },
                { status: 400 }
            );
        }

        const yearMonth = `${year}-${String(month).padStart(2, "0")}`;

        // Check access
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

        const period = await prisma.payrollPeriod.findUnique({
            where: {
                companyId_yearMonth: {
                    companyId,
                    yearMonth,
                },
            },
            include: {
                company: {
                    select: {
                        razonSocial: true,
                        rut: true,
                    },
                },
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
            return NextResponse.json(
                { error: "No existe liquidación para este período." },
                { status: 404 }
            );
        }

        const items = period.payrollItems.map((item) => {
            const sueldoBase = Number(
                item.earnings.find((e) => e.tipo === "SUELDO_BASE")?.monto ?? 0
            );
            const gratificacion = Number(
                item.earnings.find((e) => e.tipo === "GRATIFICACION")?.monto ?? 0
            );
            const horasExtraMonto = Number(
                item.earnings.find((e) => e.tipo === "HORAS_EXTRA")?.monto ?? 0
            );
            const bonos = Number(
                item.earnings
                    .filter((e) => e.tipo.startsWith("BONO_"))
                    .reduce((sum, e) => sum + Number(e.monto), 0)
            );
            const afp = Number(
                item.deductions.find((d) => d.tipo === "AFP")?.monto ?? 0
            );
            const salud = Number(
                item.deductions.find((d) => d.tipo === "SALUD")?.monto ?? 0
            );
            const cesantia = Number(
                item.deductions.find((d) => d.tipo === "CESANTIA")?.monto ?? 0
            );
            const impuesto = Number(
                item.deductions.find((d) => d.tipo === "IMPUESTO_UNICO")?.monto ?? 0
            );
            const totalDescuentos =
                Number(item.totalDescuentosLegales) +
                Number(item.totalDescuentosVoluntarios);

            return {
                worker: {
                    nombres: item.worker.nombres,
                    apellidoPaterno: item.worker.apellidoPaterno,
                    apellidoMaterno: item.worker.apellidoMaterno,
                    rut: item.worker.rut,
                    cargo: item.worker.cargo,
                },
                diasTrabajados: item.diasTrabajados,
                horasExtra: Number(item.horasExtra),
                totalHaberes: Number(item.totalHaberes),
                sueldoBase,
                gratificacion,
                horasExtraMonto,
                bonos,
                afp,
                salud,
                cesantia,
                impuesto,
                totalDescuentos,
                liquidoPagar: Number(item.liquidoPagar),
            };
        });

        const totals = items.reduce(
            (acc, item) => ({
                diasTrabajados: acc.diasTrabajados + item.diasTrabajados,
                horasExtra: acc.horasExtra + item.horasExtra,
                totalHaberes: acc.totalHaberes + item.totalHaberes,
                sueldoBase: acc.sueldoBase + item.sueldoBase,
                gratificacion: acc.gratificacion + item.gratificacion,
                horasExtraMonto: acc.horasExtraMonto + item.horasExtraMonto,
                bonos: acc.bonos + item.bonos,
                afp: acc.afp + item.afp,
                salud: acc.salud + item.salud,
                cesantia: acc.cesantia + item.cesantia,
                impuesto: acc.impuesto + item.impuesto,
                totalDescuentos: acc.totalDescuentos + item.totalDescuentos,
                liquidoPagar: acc.liquidoPagar + item.liquidoPagar,
            }),
            {
                diasTrabajados: 0,
                horasExtra: 0,
                totalHaberes: 0,
                sueldoBase: 0,
                gratificacion: 0,
                horasExtraMonto: 0,
                bonos: 0,
                afp: 0,
                salud: 0,
                cesantia: 0,
                impuesto: 0,
                totalDescuentos: 0,
                liquidoPagar: 0,
            }
        );

        const pdfData = {
            period: {
                yearMonth: period.yearMonth,
                fechaInicio: period.fechaInicio.toISOString(),
                fechaFin: period.fechaFin.toISOString(),
                status: period.status,
            },
            company: {
                razonSocial: period.company.razonSocial,
                rut: period.company.rut,
            },
            items,
            totals,
        };

        const pdfBuffer = await renderToBuffer(LibroRemuneracionesPDF({ data: pdfData }));

        const months = [
            "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
            "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
        ];
        const filename = `Libro_Remuneraciones_${period.yearMonth}_${period.company.razonSocial.replace(/\s+/g, "_")}.pdf`;

        return new Response(new Uint8Array(pdfBuffer), {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error("Error generating libro PDF:", error);
        return NextResponse.json(
            { error: "Error al generar PDF del libro de remuneraciones" },
            { status: 500 }
        );
    }
}
