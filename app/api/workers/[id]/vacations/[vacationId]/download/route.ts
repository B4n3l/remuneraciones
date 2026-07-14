import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getWorkerDocumentSignedUrl } from "@/lib/storage";

interface RouteParams {
    params: Promise<{ id: string; vacationId: string }>;
}

// GET /api/workers/[id]/vacations/[vacationId]/download - URL firmada del comprobante
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { id, vacationId } = await params;

        const vacacion = await prisma.vacacion.findUnique({
            where: { id: vacationId },
        });

        if (!vacacion || vacacion.workerId !== id || !vacacion.comprobantePath) {
            return NextResponse.json({ error: "Comprobante no encontrado" }, { status: 404 });
        }

        const url = await getWorkerDocumentSignedUrl(vacacion.comprobantePath);

        return NextResponse.json({
            url,
            nombre: "Comprobante de vacaciones",
            mimeType: "application/pdf",
        });
    } catch (error) {
        console.error("Error downloading comprobante de vacaciones:", error);
        return NextResponse.json(
            { error: "Error al descargar comprobante" },
            { status: 500 }
        );
    }
}
