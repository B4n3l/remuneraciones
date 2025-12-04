import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { id } = await params;

        const period = await prisma.payrollPeriod.findUnique({
            where: { id },
            include: {
                company: true,
                payrollItems: {
                    include: {
                        worker: true,
                        earnings: true,
                        deductions: true,
                    },
                    orderBy: {
                        worker: {
                            apellidoPaterno: "asc",
                        },
                    },
                },
            },
        });

        if (!period) {
            return NextResponse.json({ error: "Período no encontrado" }, { status: 404 });
        }

        // Check access
        if (session.user.role !== "SUPER_ADMIN") {
            const hasAccess = await prisma.userCompany.findFirst({
                where: {
                    userId: session.user.id,
                    companyId: period.companyId,
                },
            });

            if (!hasAccess) {
                return NextResponse.json({ error: "Sin acceso" }, { status: 403 });
            }
        }

        return NextResponse.json(period);
    } catch (error) {
        console.error("Error fetching period:", error);
        return NextResponse.json({ error: "Error al obtener período" }, { status: 500 });
    }
}
