import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const createAfpSchema = z.object({
    nombre: z.string().min(1, "El nombre es obligatorio"),
    porcentaje: z.coerce.number().min(0).max(100),
    comision: z.coerce.number().min(0).max(100),
});

// GET /api/admin/afp - Listar todas las AFPs (incluyendo inactivas)
export async function GET() {
    try {
        const session = await auth();
        if (!session || session.user.role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const afps = await prisma.aFP.findMany({
            orderBy: { nombre: "asc" },
        });

        return NextResponse.json(afps);
    } catch (error) {
        console.error("Error fetching AFPs:", error);
        return NextResponse.json({ error: "Error al obtener AFPs" }, { status: 500 });
    }
}

// POST /api/admin/afp - Crear AFP
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session || session.user.role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const body = await request.json();
        const validatedData = createAfpSchema.parse(body);

        const afp = await prisma.aFP.create({
            data: {
                nombre: validatedData.nombre,
                porcentaje: validatedData.porcentaje,
                comision: validatedData.comision,
            },
        });

        return NextResponse.json(afp, { status: 201 });
    } catch (error) {
        console.error("Error creating AFP:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Datos inválidos", details: error.issues },
                { status: 400 }
            );
        }
        // Prisma unique constraint violation (nombre)
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
        return NextResponse.json({ error: "Error al crear AFP" }, { status: 500 });
    }
}
