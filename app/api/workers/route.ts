import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const workerSchema = z.object({
    companyId: z.string().min(1),
    nombres: z.string().min(1),
    apellidoPaterno: z.string().min(1),
    apellidoMaterno: z.string().min(1),
    rut: z.string().min(1),
    cargo: z.string().min(1),
    fechaIngreso: z.string(),
    tipoContrato: z.enum(["INDEFINIDO", "PLAZO_FIJO", "OBRA"]),
    sueldoBase: z.number().positive(),
    tipoGratificacion: z.enum(["PACTADA", "LEGAL_25"]),
    gratificacionPactada: z.number().positive().optional(),
    afpId: z.string().min(1),
    tipoSalud: z.enum(["FONASA", "ISAPRE"]),
    healthPlan: z.object({
        isapre: z.string().min(1),
        planUF: z.number().positive(),
    }).optional(),
});

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const companyId = searchParams.get("companyId");

        let where: any = { isActive: true };

        if (companyId) {
            where.companyId = companyId;
        } else if (session.user.role !== "SUPER_ADMIN") {
            where.company = {
                users: {
                    some: {
                        userId: session.user.id,
                    },
                },
            };
        }

        const workers = await prisma.worker.findMany({
            where,
            include: {
                company: {
                    select: {
                        razonSocial: true,
                    },
                },
                afp: true,
            },
            orderBy: {
                apellidoPaterno: "asc",
            },
        });

        return NextResponse.json(workers);
    } catch (error) {
        console.error("Error fetching workers:", error);
        return NextResponse.json(
            { error: "Error al obtener trabajadores" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const body = await request.json();
        const validatedData = workerSchema.parse(body);

        // Check if user has access to the company
        if (session.user.role !== "SUPER_ADMIN") {
            const hasAccess = await prisma.userCompany.findFirst({
                where: {
                    userId: session.user.id,
                    companyId: validatedData.companyId,
                },
            });

            if (!hasAccess) {
                return NextResponse.json(
                    { error: "No tienes acceso a esta empresa" },
                    { status: 403 }
                );
            }
        }

        // Check if RUT already exists in the company
        const existingWorker = await prisma.worker.findFirst({
            where: {
                companyId: validatedData.companyId,
                rut: validatedData.rut,
            },
        });

        if (existingWorker) {
            return NextResponse.json(
                { error: "Ya existe un trabajador con este RUT en la empresa" },
                { status: 400 }
            );
        }

        // Create worker
        const workerData: any = {
            companyId: validatedData.companyId,
            nombres: validatedData.nombres,
            apellidoPaterno: validatedData.apellidoPaterno,
            apellidoMaterno: validatedData.apellidoMaterno,
            rut: validatedData.rut,
            cargo: validatedData.cargo,
            fechaIngreso: new Date(validatedData.fechaIngreso),
            tipoContrato: validatedData.tipoContrato,
            sueldoBase: validatedData.sueldoBase,
            tipoGratificacion: validatedData.tipoGratificacion,
            afpId: validatedData.afpId,
            tipoSalud: validatedData.tipoSalud,
        };

        if (validatedData.gratificacionPactada) {
            workerData.gratificacionPactada = validatedData.gratificacionPactada;
        }

        const worker = await prisma.worker.create({
            data: workerData,
        });

        // Create health plan if Isapre
        if (validatedData.tipoSalud === "ISAPRE" && validatedData.healthPlan) {
            await prisma.workerHealthPlan.create({
                data: {
                    workerId: worker.id,
                    isapre: validatedData.healthPlan.isapre,
                    planUF: validatedData.healthPlan.planUF,
                },
            });
        }

        return NextResponse.json(worker, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: error.issues[0].message },
                { status: 400 }
            );
        }

        console.error("Error creating worker:", error);
        return NextResponse.json(
            { error: "Error al crear el trabajador" },
            { status: 500 }
        );
    }
}
