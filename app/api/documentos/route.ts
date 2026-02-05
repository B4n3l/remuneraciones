import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

// GET /api/documentos - Listar documentos
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const empresaId = searchParams.get("empresaId");
        const categoriaId = searchParams.get("categoriaId");
        const periodo = searchParams.get("periodo");

        // Construir filtro
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: any = {};

        // Si es CLIENTE, solo puede ver documentos de SUS empresas
        if (session.user.role === "CLIENTE") {
            const userCompanies = await prisma.userCompany.findMany({
                where: { userId: session.user.id },
                select: { companyId: true },
            });
            const companyIds = userCompanies.map((uc) => uc.companyId);
            where.empresaId = { in: companyIds };
        } else if (empresaId) {
            // CONTADOR o SUPER_ADMIN pueden filtrar por empresa
            where.empresaId = empresaId;
        }

        if (categoriaId) {
            where.categoriaId = categoriaId;
        }

        if (periodo) {
            where.periodo = periodo;
        }

        const documentos = await prisma.documentoCliente.findMany({
            where,
            include: {
                empresa: { select: { id: true, razonSocial: true } },
                categoria: { select: { id: true, nombre: true } },
                subidoPor: { select: { id: true, name: true, email: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(documentos);
    } catch (error) {
        console.error("Error fetching documentos:", error);
        return NextResponse.json(
            { error: "Error al obtener documentos" },
            { status: 500 }
        );
    }
}

// POST /api/documentos - Subir documento (CONTADOR o SUPER_ADMIN)
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        // Solo CONTADOR o SUPER_ADMIN pueden subir
        if (session.user.role === "CLIENTE") {
            return NextResponse.json({ error: "No tiene permisos" }, { status: 403 });
        }

        const formData = await request.formData();
        const file = formData.get("file") as File;
        const empresaId = formData.get("empresaId") as string;
        const categoriaId = formData.get("categoriaId") as string;
        const nombre = formData.get("nombre") as string;
        const descripcion = formData.get("descripcion") as string;
        const periodo = formData.get("periodo") as string;

        if (!file || !empresaId || !categoriaId) {
            return NextResponse.json(
                { error: "Archivo, empresa y categoría son requeridos" },
                { status: 400 }
            );
        }

        // Verificar que la empresa existe
        const empresa = await prisma.company.findUnique({
            where: { id: empresaId },
        });

        if (!empresa) {
            return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 });
        }

        // Generar path único para el archivo
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const storagePath = `${empresaId}/${categoriaId}/${timestamp}_${safeName}`;

        // Subir a Supabase Storage
        const { createClient } = await import("@supabase/supabase-js");
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const { error: uploadError } = await supabase.storage
            .from("documentos-clientes")
            .upload(storagePath, buffer, {
                contentType: file.type,
                upsert: false,
            });

        if (uploadError) {
            console.error("Error uploading to storage:", uploadError);
            return NextResponse.json(
                { error: "Error al subir archivo: " + uploadError.message },
                { status: 500 }
            );
        }

        // Crear registro en la base de datos
        const documento = await prisma.documentoCliente.create({
            data: {
                nombre: nombre || file.name,
                descripcion,
                storagePath,
                mimeType: file.type,
                tamanioBytes: file.size,
                periodo,
                empresaId,
                categoriaId,
                subidoPorId: session.user.id,
            },
            include: {
                empresa: { select: { id: true, razonSocial: true } },
                categoria: { select: { id: true, nombre: true } },
            },
        });

        return NextResponse.json(documento, { status: 201 });
    } catch (error) {
        console.error("Error creating documento:", error);
        return NextResponse.json(
            { error: "Error al subir documento" },
            { status: 500 }
        );
    }
}
