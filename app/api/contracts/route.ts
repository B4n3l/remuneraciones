import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

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
    legalRep: z.string().min(1, "Representante legal requerido"),
    legalRepRut: z.string().min(1, "RUT del representante requerido"),
});

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const companyId = searchParams.get("companyId");
        const workerId = searchParams.get("workerId");
        const type = searchParams.get("type");

        let where: any = {};

        // Filter by company
        if (companyId) {
            where.companyId = companyId;
        } else if (session.user.role !== "SUPER_ADMIN") {
            // Regular users only see contracts from their companies
            where.company = {
                users: {
                    some: {
                        userId: session.user.id,
                    },
                },
            };
        }

        // Filter by worker
        if (workerId) {
            where.workerId = workerId;
        }

        // Filter by type
        if (type && ["INDEFINIDO", "PLAZO_FIJO", "OBRA_FAENA"].includes(type)) {
            where.type = type;
        }

        const contracts = await prisma.contract.findMany({
            where,
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
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(contracts);
    } catch (error) {
        console.error("Error fetching contracts:", error);
        return NextResponse.json({ error: "Error al obtener contratos" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

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

        const contract = await prisma.contract.create({
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

        return NextResponse.json(contract, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        console.error("Error creating contract:", error);
        return NextResponse.json({ error: "Error al crear contrato" }, { status: 500 });
    }
}
