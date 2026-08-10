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
            include: { worker: { select: { companyId: true } } },
        });

        if (!vacacion || vacacion.workerId !== id || !vacacion.comprobantePath) {
            return NextResponse.json({ error: "Comprobante no encontrado" }, { status: 404 });
        }

        // IDOR fix: validate company access (same pattern as other worker routes)
        if (session.user.role !== "SUPER_ADMIN") {
            const hasAccess = await prisma.userCompany.findFirst({
                where: {
                    userId: session.user.id,
                    companyId: vacacion.worker.companyId,
                },
            });
            if (!hasAccess) {
                return NextResponse.json({ error: "Sin acceso a esta empresa" }, { status: 403 });
            }
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
