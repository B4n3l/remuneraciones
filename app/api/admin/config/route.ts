import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const configSchema = z.object({
    valorUF: z.coerce.number().positive(),
    valorUTM: z.coerce.number().positive(),
    sueldoMinimo: z.coerce.number().positive(),
});

export async function GET() {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const latest = await prisma.indicadorMensual.findFirst({
            orderBy: [{ year: "desc" }, { month: "desc" }],
            select: { valorUF: true, valorUTM: true, sueldoMinimo: true, year: true, month: true },
        });

        if (!latest) {
            return NextResponse.json(null, { status: 200 });
        }

        return NextResponse.json({
            valorUF: Number(latest.valorUF),
            valorUTM: Number(latest.valorUTM),
            sueldoMinimo: Number(latest.sueldoMinimo),
            year: latest.year,
            month: latest.month,
        });
    } catch (error) {
        console.error("Error fetching config:", error);
        return NextResponse.json({ error: "Error al obtener configuración" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await auth();
        if (!session || session.user.role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const body = await request.json();
        const validatedData = configSchema.parse(body);

        const latest = await prisma.indicadorMensual.findFirst({
            orderBy: [{ year: "desc" }, { month: "desc" }],
        });

        if (latest) {
            const updated = await prisma.indicadorMensual.update({
                where: { id: latest.id },
                data: {
                    valorUF: validatedData.valorUF,
                    valorUTM: validatedData.valorUTM,
                    sueldoMinimo: validatedData.sueldoMinimo,
                },
                select: { valorUF: true, valorUTM: true, sueldoMinimo: true, year: true, month: true },
            });

            return NextResponse.json({
                valorUF: Number(updated.valorUF),
                valorUTM: Number(updated.valorUTM),
                sueldoMinimo: Number(updated.sueldoMinimo),
                year: updated.year,
                month: updated.month,
            });
        }

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;

        const created = await prisma.indicadorMensual.create({
            data: {
                year: currentYear,
                month: currentMonth,
                valorUF: validatedData.valorUF,
                valorUTM: validatedData.valorUTM,
                valorUTA: 0,
                sueldoMinimo: validatedData.sueldoMinimo,
                sueldoMinimoCasaPart: 0,
                sueldoMinimoMenores: 0,
                sueldoMinimoNoRem: 0,
                topeImponibleAFP: 89.9,
                topeImponibleINP: 60,
                topeSeguroCesantia: 135.1,
                sisRate: 1.54,
                seguroSocialRate: 0.93,
                apvTopeMensualUF: 50,
                apvTopeAnualUF: 600,
            },
            select: { valorUF: true, valorUTM: true, sueldoMinimo: true, year: true, month: true },
        });

        return NextResponse.json(
            {
                valorUF: Number(created.valorUF),
                valorUTM: Number(created.valorUTM),
                sueldoMinimo: Number(created.sueldoMinimo),
                year: created.year,
                month: created.month,
            },
            { status: 201 }
        );
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Datos inválidos", details: error.issues },
                { status: 400 }
            );
        }
        console.error("Error updating config:", error);
        return NextResponse.json({ error: "Error al actualizar configuración" }, { status: 500 });
    }
}
