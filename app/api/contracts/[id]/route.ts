import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { renderToBuffer } from "@react-pdf/renderer";
import { IndefinidoContract, PlazoFijoContract, ObraFaenaContract } from "@/lib/pdf/contract-templates";

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

        const contract = await prisma.contract.findUnique({
            where: { id },
            include: {
                company: true,
                worker: true,
            },
        });

        if (!contract) {
            return NextResponse.json({ error: "Contrato no encontrado" }, { status: 404 });
        }

        // Check access
        if (session.user.role !== "SUPER_ADMIN") {
            const hasAccess = await prisma.userCompany.findFirst({
                where: {
                    userId: session.user.id,
                    companyId: contract.companyId,
                },
            });

            if (!hasAccess) {
                return NextResponse.json({ error: "Sin acceso" }, { status: 403 });
            }
        }

        // Check if this is a PDF request
        const { searchParams } = new URL(request.url);
        const format = searchParams.get("format");

        if (format === "pdf") {
            // Generate PDF
            const contractData = {
                companyName: contract.company.razonSocial,
                companyRut: contract.company.rut,
                companyAddress: `${contract.company.direccion}, ${contract.company.comuna}`,
                legalRep: contract.legalRep,
                legalRepRut: contract.legalRepRut,
                workerName: `${contract.worker.nombres} ${contract.worker.apellidoPaterno} ${contract.worker.apellidoMaterno}`,
                workerRut: contract.worker.rut,
                workerAddress: "Dirección del trabajador", // TODO: Add to worker model
                workerNationality: "Chilena", // TODO: Add to worker model
                type: contract.type,
                startDate: contract.startDate.toLocaleDateString("es-CL", { year: "numeric", month: "long", day: "numeric" }),
                endDate: contract.endDate?.toLocaleDateString("es-CL", { year: "numeric", month: "long", day: "numeric" }),
                cargo: contract.cargo,
                jornada: contract.jornada,
                schedule: contract.schedule,
                workplace: contract.workplace,
                baseSalary: Number(contract.baseSalary),
                benefits: contract.benefits || undefined,
                obraDetails: contract.obraDetails || undefined,
            };

            let pdfDocument;
            switch (contract.type) {
                case "INDEFINIDO":
                    pdfDocument = IndefinidoContract({ data: contractData });
                    break;
                case "PLAZO_FIJO":
                    pdfDocument = PlazoFijoContract({ data: contractData });
                    break;
                case "OBRA_FAENA":
                    pdfDocument = ObraFaenaContract({ data: contractData });
                    break;
                default:
                    return NextResponse.json({ error: "Tipo de contrato inválido" }, { status: 400 });
            }

            const pdfBuffer = await renderToBuffer(pdfDocument);

            const workerName = `${contract.worker.apellidoPaterno}_${contract.worker.nombres}`.replace(/\s+/g, "_");
            const filename = `Contrato_${contract.type}_${workerName}.pdf`;

            return new Response(new Uint8Array(pdfBuffer), {
                headers: {
                    "Content-Type": "application/pdf",
                    "Content-Disposition": `attachment; filename="${filename}"`,
                },
            });
        }

        // Return JSON data
        return NextResponse.json(contract);
    } catch (error) {
        console.error("Error fetching contract:", error);
        return NextResponse.json({ error: "Error al obtener contrato" }, { status: 500 });
    }
}
