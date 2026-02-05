import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/documentos/[id] - Descargar documento
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { id } = await params;

        const documento = await prisma.documentoCliente.findUnique({
            where: { id },
            include: { empresa: true },
        });

        if (!documento) {
            return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });
        }

        // Verificar acceso para CLIENTE
        if (session.user.role === "CLIENTE") {
            const hasAccess = await prisma.userCompany.findFirst({
                where: {
                    userId: session.user.id,
                    companyId: documento.empresaId,
                },
            });

            if (!hasAccess) {
                return NextResponse.json({ error: "No tiene acceso a este documento" }, { status: 403 });
            }
        }

        // Obtener URL firmada de Supabase Storage
        const { createClient } = await import("@supabase/supabase-js");
        const supabase = createClient(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data, error } = await supabase.storage
            .from("documentos-clientes")
            .createSignedUrl(documento.storagePath, 60); // URL válida por 60 segundos

        if (error) {
            console.error("Error getting signed URL:", error);
            return NextResponse.json(
                { error: "Error al obtener URL del documento" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            url: data.signedUrl,
            nombre: documento.nombre,
            mimeType: documento.mimeType,
        });
    } catch (error) {
        console.error("Error downloading documento:", error);
        return NextResponse.json(
            { error: "Error al descargar documento" },
            { status: 500 }
        );
    }
}

// DELETE /api/documentos/[id] - Eliminar documento (CONTADOR o SUPER_ADMIN)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        if (session.user.role === "CLIENTE") {
            return NextResponse.json({ error: "No tiene permisos" }, { status: 403 });
        }

        const { id } = await params;

        const documento = await prisma.documentoCliente.findUnique({
            where: { id },
        });

        if (!documento) {
            return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });
        }

        // Eliminar de Supabase Storage
        const { createClient } = await import("@supabase/supabase-js");
        const supabase = createClient(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        await supabase.storage
            .from("documentos-clientes")
            .remove([documento.storagePath]);

        // Eliminar registro de la base de datos
        await prisma.documentoCliente.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting documento:", error);
        return NextResponse.json(
            { error: "Error al eliminar documento" },
            { status: 500 }
        );
    }
}
