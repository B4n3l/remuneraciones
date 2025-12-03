import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const company = await prisma.company.findUnique({
            where: { id: params.id },
        });

        if (!company) {
            return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 });
        }

        // Check access
        if (session.user.role !== "SUPER_ADMIN") {
            const hasAccess = await prisma.userCompany.findFirst({
                where: {
                    userId: session.user.id,
                    companyId: params.id,
                },
            });

            if (!hasAccess) {
                return NextResponse.json({ error: "Sin acceso" }, { status: 403 });
            }
        }

        return NextResponse.json(company);
    } catch (error) {
        console.error("Error fetching company:", error);
        return NextResponse.json({ error: "Error al obtener empresa" }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        // Check access
        if (session.user.role !== "SUPER_ADMIN") {
            const hasAccess = await prisma.userCompany.findFirst({
                where: {
                    userId: session.user.id,
                    companyId: params.id,
                },
            });

            if (!hasAccess) {
                return NextResponse.json({ error: "Sin acceso" }, { status: 403 });
            }
        }

        const body = await request.json();
        const { razonSocial, rut, direccion, comuna } = body;

        const company = await prisma.company.update({
            where: { id: params.id },
            data: {
                razonSocial,
                rut,
                direccion,
                comuna,
            },
        });

        return NextResponse.json(company);
    } catch (error) {
        console.error("Error updating company:", error);
        return NextResponse.json({ error: "Error al actualizar empresa" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        // Check access
        if (session.user.role !== "SUPER_ADMIN") {
            const hasAccess = await prisma.userCompany.findFirst({
                where: {
                    userId: session.user.id,
                    companyId: params.id,
                },
            });

            if (!hasAccess) {
                return NextResponse.json({ error: "Sin acceso" }, { status: 403 });
            }
        }

        // Check if company has workers
        const workerCount = await prisma.worker.count({
            where: { companyId: params.id },
        });

        if (workerCount > 0) {
            return NextResponse.json(
                { error: "No se puede eliminar una empresa con trabajadores registrados" },
                { status: 400 }
            );
        }

        await prisma.company.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting company:", error);
        return NextResponse.json({ error: "Error al eliminar empresa" }, { status: 500 });
    }
}
