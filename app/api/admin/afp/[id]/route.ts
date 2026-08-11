import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateAfpSchema = z.object({
    nombre: z.string().min(1).optional(),
    porcentaje: z.coerce.number().min(0).max(100).optional(),
    comision: z.coerce.number().min(0).max(100).optional(),
    isActive: z.boolean().optional(),
});

interface RouteParams {
    params: Promise<{ id: string }>;
}

// PUT /api/admin/afp/[id] - Actualizar AFP
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();
        if (!session || session.user.role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const { id } = await params;
        const body = await request.json();
        const validatedData = updateAfpSchema.parse(body);

        const afp = await prisma.aFP.update({
            where: { id },
            data: {
                ...(validatedData.nombre !== undefined && { nombre: validatedData.nombre }),
                ...(validatedData.porcentaje !== undefined && { porcentaje: validatedData.porcentaje }),
                ...(validatedData.comision !== undefined && { comision: validatedData.comision }),
                ...(validatedData.isActive !== undefined && { isActive: validatedData.isActive }),
            },
        });

        return NextResponse.json(afp);
    } catch (error) {
        console.error("Error updating AFP:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Datos inválidos", details: error.issues },
                { status: 400 }
            );
        }
        if (
            typeof error === "object" &&
            error !== null &&
            "code" in error &&
            error.code === "P2002"
        ) {
            return NextResponse.json(
                { error: "Ya existe una AFP con ese nombre" },
                { status: 409 }
            );
        }
        return NextResponse.json({ error: "Error al actualizar AFP" }, { status: 500 });
    }
}

// DELETE /api/admin/afp/[id] - Soft delete (desactivar)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();
        if (!session || session.user.role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const { id } = await params;

        const afp = await prisma.aFP.update({
            where: { id },
            data: { isActive: false },
        });

        return NextResponse.json(afp);
    } catch (error) {
        console.error("Error deactivating AFP:", error);
        return NextResponse.json({ error: "Error al desactivar AFP" }, { status: 500 });
    }
}
