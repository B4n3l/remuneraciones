import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateTaskSchema = z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
    priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
    dueDate: z.string().optional(), // ISO date string
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

        const task = await prisma.task.findUnique({
            where: { id },
            include: {
                company: true,
            },
        });

        if (!task) {
            return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 });
        }

        // Check access
        if (session.user.role !== "SUPER_ADMIN") {
            const hasAccess = await prisma.userCompany.findFirst({
                where: {
                    userId: session.user.id,
                    companyId: task.companyId,
                },
            });

            if (!hasAccess) {
                return NextResponse.json({ error: "Sin acceso" }, { status: 403 });
            }
        }

        return NextResponse.json(task);
    } catch (error) {
        console.error("Error fetching task:", error);
        return NextResponse.json({ error: "Error al obtener tarea" }, { status: 500 });
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
        const validated = updateTaskSchema.parse(body);

        // Get task and check access
        const existingTask = await prisma.task.findUnique({
            where: { id },
        });

        if (!existingTask) {
            return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 });
        }

        if (session.user.role !== "SUPER_ADMIN") {
            const hasAccess = await prisma.userCompany.findFirst({
                where: {
                    userId: session.user.id,
                    companyId: existingTask.companyId,
                },
            });

            if (!hasAccess) {
                return NextResponse.json({ error: "Sin acceso" }, { status: 403 });
            }
        }

        // Prepare update data
        const updateData: any = {};
        if (validated.title) updateData.title = validated.title;
        if (validated.description !== undefined) updateData.description = validated.description;
        if (validated.priority) updateData.priority = validated.priority;
        if (validated.dueDate) updateData.dueDate = new Date(validated.dueDate);

        if (validated.status) {
            updateData.status = validated.status;
            // Set completedAt when status changes to COMPLETED
            if (validated.status === "COMPLETED" && existingTask.status !== "COMPLETED") {
                updateData.completedAt = new Date();
            }
            // Clear completedAt when status changes from COMPLETED to something else
            if (validated.status !== "COMPLETED" && existingTask.status === "COMPLETED") {
                updateData.completedAt = null;
            }
        }

        const task = await prisma.task.update({
            where: { id },
            data: updateData,
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

        return NextResponse.json(task);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        console.error("Error updating task:", error);
        return NextResponse.json({ error: "Error al actualizar tarea" }, { status: 500 });
    }
}

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

        const task = await prisma.task.findUnique({
            where: { id },
        });

        if (!task) {
            return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 });
        }

        // Check access
        if (session.user.role !== "SUPER_ADMIN") {
            const hasAccess = await prisma.userCompany.findFirst({
                where: {
                    userId: session.user.id,
                    companyId: task.companyId,
                },
            });

            if (!hasAccess) {
                return NextResponse.json({ error: "Sin acceso" }, { status: 403 });
            }
        }

        await prisma.task.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Tarea eliminada" });
    } catch (error) {
        console.error("Error deleting task:", error);
        return NextResponse.json({ error: "Error al eliminar tarea" }, { status: 500 });
    }
}
