import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const duplicateSchema = z.object({
    sourceYear: z.number(),
    sourceMonth: z.number(),
    targetYear: z.number(),
    targetMonth: z.number(),
});

// POST: Duplicate indicador from one period to another
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        if (session.user.role !== "SUPER_ADMIN") {
            return NextResponse.json(
                { error: "Solo administradores pueden duplicar indicadores" },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { sourceYear, sourceMonth, targetYear, targetMonth } = duplicateSchema.parse(body);

        // Get source indicador
        const source = await prisma.indicadorMensual.findUnique({
            where: {
                year_month: {
                    year: sourceYear,
                    month: sourceMonth,
                },
            },
            include: {
                afpRates: true,
                cesantiaRates: true,
                asignacionFamiliar: true,
            },
        });

        if (!source) {
            return NextResponse.json(
                { error: `No existe indicador para ${sourceMonth}/${sourceYear}` },
                { status: 404 }
            );
        }

        // Check if target already exists
        const existing = await prisma.indicadorMensual.findUnique({
            where: {
                year_month: {
                    year: targetYear,
                    month: targetMonth,
                },
            },
        });

        if (existing) {
            return NextResponse.json(
                { error: `Ya existe un indicador para ${targetMonth}/${targetYear}` },
                { status: 400 }
            );
        }

        // Create new indicador with duplicated data
        const newIndicador = await prisma.indicadorMensual.create({
            data: {
                year: targetYear,
                month: targetMonth,
                valorUF: source.valorUF,
                valorUTM: source.valorUTM,
                valorUTA: source.valorUTA,
                sueldoMinimo: source.sueldoMinimo,
                sueldoMinimoCasaPart: source.sueldoMinimoCasaPart,
                sueldoMinimoMenores: source.sueldoMinimoMenores,
                sueldoMinimoNoRem: source.sueldoMinimoNoRem,
                topeImponibleAFP: source.topeImponibleAFP,
                topeImponibleINP: source.topeImponibleINP,
                topeSeguroCesantia: source.topeSeguroCesantia,
                sisRate: source.sisRate,
                seguroSocialRate: source.seguroSocialRate,
                apvTopeMensualUF: source.apvTopeMensualUF,
                apvTopeAnualUF: source.apvTopeAnualUF,
                afpRates: {
                    create: source.afpRates.map(afp => ({
                        afpNombre: afp.afpNombre,
                        cargoTrabajador: afp.cargoTrabajador,
                        cargoEmpleador: afp.cargoEmpleador,
                        totalAPagar: afp.totalAPagar,
                        independiente: afp.independiente,
                    })),
                },
                cesantiaRates: {
                    create: source.cesantiaRates.map(c => ({
                        tipoContrato: c.tipoContrato,
                        empleador: c.empleador,
                        trabajador: c.trabajador,
                    })),
                },
                asignacionFamiliar: {
                    create: source.asignacionFamiliar.map(a => ({
                        tramo: a.tramo,
                        monto: a.monto,
                        rentaDesde: a.rentaDesde,
                        rentaHasta: a.rentaHasta,
                    })),
                },
            },
            include: {
                afpRates: true,
                cesantiaRates: true,
                asignacionFamiliar: true,
            },
        });

        return NextResponse.json(newIndicador, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error("Error duplicating indicador:", error);
        return NextResponse.json(
            { error: "Error al duplicar indicador" },
            { status: 500 }
        );
    }
}
