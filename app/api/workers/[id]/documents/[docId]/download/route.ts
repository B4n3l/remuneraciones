import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getWorkerDocumentSignedUrl } from "@/lib/storage";

interface RouteParams {
    params: Promise<{ id: string; docId: string }>;
}

// GET /api/workers/[id]/documents/[docId]/download - URL firmada del documento
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { id, docId } = await params;

        const documento = await prisma.documentoTrabajador.findUnique({
            where: { id: docId },
            include: { worker: { select: { companyId: true } } },
        });

        if (!documento || documento.workerId !== id) {
            return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });
        }

        // IDOR fix: validate company access (same pattern as other worker routes)
        if (session.user.role !== "SUPER_ADMIN") {
            const hasAccess = await prisma.userCompany.findFirst({
                where: {
                    userId: session.user.id,
                    companyId: documento.worker.companyId,
                },
            });
            if (!hasAccess) {
                return NextResponse.json({ error: "Sin acceso a esta empresa" }, { status: 403 });
            }
        }

        const url = await getWorkerDocumentSignedUrl(documento.storagePath);

        return NextResponse.json({
            url,
            nombre: documento.nombre,
            mimeType: documento.mimeType,
        });
    } catch (error) {
        console.error("Error downloading documento de trabajador:", error);
        return NextResponse.json(
            { error: "Error al descargar documento" },
            { status: 500 }
        );
    }
}
