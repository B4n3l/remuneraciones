import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/admin/users/[id] - Obtener usuario
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();
        if (!session || session.user.role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const { id } = await params;

        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
                companies: {
                    include: {
                        company: {
                            select: { id: true, razonSocial: true, rut: true },
                        },
                    },
                },
            },
        });

        if (!user) {
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error("Error fetching user:", error);
        return NextResponse.json({ error: "Error al obtener usuario" }, { status: 500 });
    }
}

// PUT /api/admin/users/[id] - Actualizar usuario
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();
        if (!session || session.user.role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const { id } = await params;
        const body = await request.json();

        const updateData: { name?: string; role?: "SUPER_ADMIN" | "CONTADOR" | "CLIENTE" } = {};
        if (body.name) updateData.name = body.name;
        if (body.role) updateData.role = body.role as "SUPER_ADMIN" | "CONTADOR" | "CLIENTE";

        const user = await prisma.user.update({
            where: { id },
            data: updateData as { name?: string; role?: "SUPER_ADMIN" | "CONTADOR" | "CLIENTE" },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
            },
        });

        // Actualizar asociaciones de empresa si se proporciona
        if (body.companyId !== undefined) {
            // Primero eliminar asociaciones existentes
            await prisma.userCompany.deleteMany({
                where: { userId: id },
            });

            // Crear nueva asociación si hay companyId
            if (body.companyId) {
                await prisma.userCompany.create({
                    data: {
                        userId: id,
                        companyId: body.companyId,
                    },
                });
            }
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error("Error updating user:", error);
        return NextResponse.json({ error: "Error al actualizar usuario" }, { status: 500 });
    }
}

// DELETE /api/admin/users/[id] - Eliminar usuario
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();
        if (!session || session.user.role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const { id } = await params;

        // No permitir eliminar el propio usuario
        if (id === session.user.id) {
            return NextResponse.json({ error: "No puedes eliminarte a ti mismo" }, { status: 400 });
        }

        await prisma.user.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting user:", error);
        return NextResponse.json({ error: "Error al eliminar usuario" }, { status: 500 });
    }
}
