import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const companyId = searchParams.get("companyId");

        let where: any = {};

        if (companyId) {
            where.companyId = companyId;
        } else if (session.user.role !== "SUPER_ADMIN") {
            where.company = {
                users: {
                    some: {
                        userId: session.user.id,
                    },
                },
            };
        }

        const periods = await prisma.payrollPeriod.findMany({
            where,
            include: {
                company: {
                    select: {
                        razonSocial: true,
                    },
                },
                payrollItems: {
                    select: {
                        id: true,
                        liquidoPagar: true,
                    },
                },
            },
            orderBy: {
                yearMonth: "desc",
            },
        });

        // Calculate totals for each period
        const periodsWithTotals = periods.map((period) => ({
            ...period,
            totalLiquido: period.payrollItems.reduce(
                (sum, item) => sum + Number(item.liquidoPagar),
                0
            ),
            workersCount: period.payrollItems.length,
        }));

        return NextResponse.json(periodsWithTotals);
    } catch (error) {
        console.error("Error fetching periods:", error);
        return NextResponse.json(
            { error: "Error al obtener períodos" },
            { status: 500 }
        );
    }
}
