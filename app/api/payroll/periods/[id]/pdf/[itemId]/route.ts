import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { renderToBuffer } from "@react-pdf/renderer";
import { PayslipPDF } from "@/lib/pdf/payslip-template";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string; itemId: string }> }
) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { id, itemId } = await params;

        // Get the payroll item with all related data
        const payrollItem = await prisma.payrollItem.findUnique({
            where: { id: itemId },
            include: {
                worker: true,
                earnings: true,
                deductions: true,
                period: {
                    include: {
                        company: true,
                    },
                },
            },
        });

        if (!payrollItem) {
            return NextResponse.json({ error: "Liquidación no encontrada" }, { status: 404 });
        }

        // Verify period ID matches
        if (payrollItem.periodId !== id) {
            return NextResponse.json({ error: "Período inválido" }, { status: 400 });
        }

        // Check access
        if (session.user.role !== "SUPER_ADMIN") {
            const hasAccess = await prisma.userCompany.findFirst({
                where: {
                    userId: session.user.id,
                    companyId: payrollItem.period.companyId,
                },
            });

            if (!hasAccess) {
                return NextResponse.json({ error: "Sin acceso" }, { status: 403 });
            }
        }

        // Format period
        const [year, month] = payrollItem.period.yearMonth.split("-");
        const months = [
            "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
            "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
        ];
        const periodStr = `${months[parseInt(month) - 1]} ${year}`;

        // Prepare PDF data
        const pdfData = {
            company: {
                razonSocial: payrollItem.period.company.razonSocial,
                rut: payrollItem.period.company.rut,
                direccion: payrollItem.period.company.direccion || undefined,
            },
            worker: {
                nombres: payrollItem.worker.nombres,
                apellidoPaterno: payrollItem.worker.apellidoPaterno,
                apellidoMaterno: payrollItem.worker.apellidoMaterno,
                rut: payrollItem.worker.rut,
                cargo: payrollItem.worker.cargo,
            },
            period: periodStr,
            earnings: payrollItem.earnings.map((e) => ({
                concepto: e.concepto,
                monto: Number(e.monto),
            })),
            deductions: payrollItem.deductions.map((d) => ({
                concepto: d.concepto,
                monto: Number(d.monto),
            })),
            totalHaberes: Number(payrollItem.totalHaberes),
            totalDescuentos: Number(payrollItem.totalDescuentosLegales),
            liquido: Number(payrollItem.liquidoPagar),
        };

        // Generate PDF
        const pdfBuffer = await renderToBuffer(PayslipPDF({ data: pdfData }));

        // Create filename
        const workerName = `${payrollItem.worker.apellidoPaterno}_${payrollItem.worker.nombres}`.replace(/\s+/g, "_");
        const filename = `Liquidacion_${periodStr.replace(" ", "_")}_${workerName}.pdf`;

        return new Response(new Uint8Array(pdfBuffer), {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error("Error generating PDF:", error);
        return NextResponse.json(
            { error: "Error al generar PDF" },
            { status: 500 }
        );
    }
}
