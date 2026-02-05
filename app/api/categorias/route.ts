import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

// GET /api/categorias - Listar categorías
export async function GET() {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const categorias = await prisma.categoriaDocumento.findMany({
            orderBy: { orden: "asc" },
        });

        return NextResponse.json(categorias);
    } catch (error) {
        console.error("Error fetching categorias:", error);
        return NextResponse.json(
            { error: "Error al obtener categorías" },
            { status: 500 }
        );
    }
}

// POST /api/categorias - Crear categoría (solo SUPER_ADMIN)
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        if (session.user.role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "No tiene permisos" }, { status: 403 });
        }

        const body = await request.json();
        const { nombre, descripcion, orden } = body;

        if (!nombre) {
            return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
        }

        const categoria = await prisma.categoriaDocumento.create({
            data: {
                nombre,
                descripcion,
                orden: orden || 0,
            },
        });

        return NextResponse.json(categoria, { status: 201 });
    } catch (error) {
        console.error("Error creating categoria:", error);
        return NextResponse.json(
            { error: "Error al crear categoría" },
            { status: 500 }
        );
    }
}
