import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { renderToBuffer } from "@react-pdf/renderer";
import { IndefinidoContract, PlazoFijoContract, ObraFaenaContract } from "@/lib/pdf/contract-templates";
import { numeroEnPalabras } from "@/lib/numero-en-palabras";

const contractSchema = z.object({
    companyId: z.string(),
    workerId: z.string(),
    type: z.enum(["INDEFINIDO", "PLAZO_FIJO", "OBRA_FAENA"]),
    startDate: z.string(), // ISO date string
    endDate: z.string().optional(), // Required for PLAZO_FIJO
    cargo: z.string().min(1, "Cargo requerido"),
    jornada: z.string().min(1, "Jornada requerida"),
    schedule: z.string().min(1, "Horario requerido"),
    workplace: z.string().min(1, "Lugar de trabajo requerido"),
    baseSalary: z.number().positive("Sueldo debe ser positivo"),
    benefits: z.string().optional(),
    obraDetails: z.string().optional(), // Required for OBRA_FAENA
    // Detalles de pago y colación
    formaPago: z.string().optional(),
    periodicidad: z.string().optional(),
    minutosColacion: z.number().int().positive().optional(),
    comunaTrabajo: z.string().optional(),
    legalRep: z.string().min(1, "Representante legal requerido"),
    legalRepRut: z.string().min(1, "RUT del representante requerido"),
});

// Formatea una fecha al estilo chileno: "28 de agosto de 2026"
const fechaCL = (fecha: Date) =>
    fecha.toLocaleDateString("es-CL", { year: "numeric", month: "long", day: "numeric" });

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
                companyEmail: contract.company.email || undefined,
                companyDomicilio: contract.company.direccion,
                companyComuna: contract.company.comuna,
                legalRep: contract.legalRep,
                legalRepRut: contract.legalRepRut,
                workerName: `${contract.worker.nombres} ${contract.worker.apellidoPaterno} ${contract.worker.apellidoMaterno}`,
                workerRut: contract.worker.rut,
                workerEmail: contract.worker.email || undefined,
                workerNacimiento: contract.worker.fechaNacimiento ? fechaCL(contract.worker.fechaNacimiento) : undefined,
                workerNacionalidad: contract.worker.nacionalidad || "Chilena",
                workerEstadoCivil: contract.worker.estadoCivil || undefined,
                workerProfesion: contract.worker.profesion || undefined,
                workerDomicilio: contract.worker.domicilio || undefined,
                workerComuna: contract.worker.comuna || undefined,
                workerCiudad: contract.worker.ciudad || undefined,
                type: contract.type,
                startDate: fechaCL(contract.startDate),
                endDate: contract.endDate ? fechaCL(contract.endDate) : undefined,
                fechaIngreso: fechaCL(contract.worker.fechaIngreso),
                cargo: contract.cargo,
                jornada: contract.jornada,
                schedule: contract.schedule,
                workplace: contract.workplace,
                comunaTrabajo: contract.comunaTrabajo || undefined,
                baseSalary: Number(contract.baseSalary),
                sueldoEnPalabras: numeroEnPalabras(Number(contract.baseSalary)),
                benefits: contract.benefits || undefined,
                obraDetails: contract.obraDetails || undefined,
                formaPago: contract.formaPago || undefined,
                periodicidad: contract.periodicidad || undefined,
                minutosColacion: contract.minutosColacion ?? 30,
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
        const validated = contractSchema.parse(body);

        // Check access to company
        if (session.user.role !== "SUPER_ADMIN") {
            const hasAccess = await prisma.userCompany.findFirst({
                where: {
                    userId: session.user.id,
                    companyId: validated.companyId,
                },
            });

            if (!hasAccess) {
                return NextResponse.json({ error: "Sin acceso a esta empresa" }, { status: 403 });
            }
        }

        // Validate endDate for PLAZO_FIJO
        if (validated.type === "PLAZO_FIJO" && !validated.endDate) {
            return NextResponse.json({ error: "Fecha de término requerida para contrato a plazo fijo" }, { status: 400 });
        }

        // Validate obraDetails for OBRA_FAENA
        if (validated.type === "OBRA_FAENA" && !validated.obraDetails) {
            return NextResponse.json({ error: "Descripción de obra/faena requerida" }, { status: 400 });
        }

        const contract = await prisma.contract.update({
            where: { id },
            data: {
                companyId: validated.companyId,
                workerId: validated.workerId,
                type: validated.type,
                startDate: new Date(validated.startDate),
                endDate: validated.endDate ? new Date(validated.endDate) : null,
                cargo: validated.cargo,
                jornada: validated.jornada,
                schedule: validated.schedule,
                workplace: validated.workplace,
                baseSalary: validated.baseSalary,
                benefits: validated.benefits,
                obraDetails: validated.obraDetails,
                formaPago: validated.formaPago || null,
                periodicidad: validated.periodicidad || null,
                minutosColacion: validated.minutosColacion ?? null,
                comunaTrabajo: validated.comunaTrabajo || null,
                legalRep: validated.legalRep,
                legalRepRut: validated.legalRepRut,
            },
            include: {
                company: {
                    select: {
                        id: true,
                        razonSocial: true,
                        rut: true,
                    },
                },
                worker: {
                    select: {
                        id: true,
                        nombres: true,
                        apellidoPaterno: true,
                        apellidoMaterno: true,
                        rut: true,
                        cargo: true,
                    },
                },
            },
        });

        return NextResponse.json(contract);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            return NextResponse.json({ error: "Contrato no encontrado" }, { status: 404 });
        }
        console.error("Error updating contract:", error);
        return NextResponse.json({ error: "Error al actualizar contrato" }, { status: 500 });
    }
}
