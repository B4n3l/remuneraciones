import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const taskSchema = z.object({
    companyId: z.string(),
    title: z.string().min(1, "Título requerido"),
    description: z.string().optional(),
    priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
    dueDate: z.string().optional(), // ISO date string
});

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const companyId = searchParams.get("companyId");
        const status = searchParams.get("status");
        const priority = searchParams.get("priority");

        let where: any = {};

        // Filter by company
        if (companyId) {
            where.companyId = companyId;
        } else if (session.user.role !== "SUPER_ADMIN") {
            // Regular users only see tasks from their companies
            where.company = {
                users: {
                    some: {
                        userId: session.user.id,
                    },
                },
            };
        }

        // Filter by status
        if (status) {
            where.status = status;
        }

        // Filter by priority
        if (priority) {
            where.priority = priority;
        }

        const tasks = await prisma.task.findMany({
            where,
            include: {
                company: {
                    select: {
                        id: true,
                        razonSocial: true,
                        rut: true,
                    },
                },
            },
            orderBy: [
                { status: "asc" }, // Pending first
                { priority: "desc" }, // Urgent first
                { dueDate: "asc" }, // Earliest first
            ],
        });

        return NextResponse.json(tasks);
    } catch (error) {
        console.error("Error fetching tasks:", error);
        return NextResponse.json({ error: "Error al obtener tareas" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const body = await request.json();
        const validated = taskSchema.parse(body);

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

        const task = await prisma.task.create({
            data: {
                companyId: validated.companyId,
                title: validated.title,
                description: validated.description,
                priority: validated.priority,
                dueDate: validated.dueDate ? new Date(validated.dueDate) : null,
            },
            include: {
                company: {
                    select: {
                        id: true,
                        razonSocial: true,
                        rut: true,
                    },
                },
            },
        });

        return NextResponse.json(task, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        console.error("Error creating task:", error);
        return NextResponse.json({ error: "Error al crear tarea" }, { status: 500 });
    }
}
