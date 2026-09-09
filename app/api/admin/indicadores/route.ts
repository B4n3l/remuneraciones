import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { baseIndicadorSchema } from "@/lib/indicadores/schema";
import { deriveSeguroSocialRate } from "@/lib/indicadores/rates";

// Admin schema: base fields only. `seguroSocialRate` is derived server-side
// (never accepted as input). `impuestoTramos` is excluded from admin input.
export const indicadorSchema = baseIndicadorSchema;

// GET: List all indicadores or filter by year
export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const year = searchParams.get("year");

        const indicadores = await prisma.indicadorMensual.findMany({
            where: year ? { year: parseInt(year) } : undefined,
            include: {
                afpRates: true,
                cesantiaRates: true,
                asignacionFamiliar: true,
            },
            orderBy: [
                { year: "desc" },
                { month: "desc" },
            ],
        });

        return NextResponse.json(indicadores);
    } catch (error) {
        console.error("Error fetching indicadores:", error);
        return NextResponse.json(
            { error: "Error al obtener indicadores" },
            { status: 500 }
        );
    }
}

// POST: Create new indicador
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        // Only SUPER_ADMIN can create indicadores
        if (session.user.role !== "SUPER_ADMIN") {
            return NextResponse.json(
                { error: "Solo administradores pueden crear indicadores" },
                { status: 403 }
            );
        }

        const body = await request.json();
        const validatedData = indicadorSchema.parse(body);

        // Check if indicador already exists for this period
        const existing = await prisma.indicadorMensual.findUnique({
            where: {
                year_month: {
                    year: validatedData.year,
                    month: validatedData.month,
                },
            },
        });

        if (existing) {
            return NextResponse.json(
                { error: `Ya existe un indicador para ${validatedData.month}/${validatedData.year}` },
                { status: 400 }
            );
        }

        // Create indicador with related data
        const indicador = await prisma.indicadorMensual.create({
            data: {
                year: validatedData.year,
                month: validatedData.month,
                valorUF: validatedData.valorUF,
                valorUTM: validatedData.valorUTM,
                valorUTA: validatedData.valorUTA,
                sueldoMinimo: validatedData.sueldoMinimo,
                sueldoMinimoCasaPart: validatedData.sueldoMinimoCasaPart,
                sueldoMinimoMenores: validatedData.sueldoMinimoMenores,
                sueldoMinimoNoRem: validatedData.sueldoMinimoNoRem,
                topeImponibleAFP: validatedData.topeImponibleAFP,
                topeImponibleINP: validatedData.topeImponibleINP,
                topeSeguroCesantia: validatedData.topeSeguroCesantia,
                sisRate: validatedData.sisRate,
                rentabilidadProtegidaRate: validatedData.rentabilidadProtegidaRate,
                expectativaVidaRate: validatedData.expectativaVidaRate,
                seguroSocialRate: deriveSeguroSocialRate(
                    validatedData.rentabilidadProtegidaRate,
                    validatedData.expectativaVidaRate,
                    validatedData.sisRate,
                ),
                apvTopeMensualUF: validatedData.apvTopeMensualUF,
                apvTopeAnualUF: validatedData.apvTopeAnualUF,
                afpRates: validatedData.afpRates ? {
                    create: validatedData.afpRates,
                } : undefined,
                cesantiaRates: validatedData.cesantiaRates ? {
                    create: validatedData.cesantiaRates,
                } : undefined,
                asignacionFamiliar: validatedData.asignacionFamiliar ? {
                    create: validatedData.asignacionFamiliar,
                } : undefined,
            },
            include: {
                afpRates: true,
                cesantiaRates: true,
                asignacionFamiliar: true,
            },
        });

        return NextResponse.json(indicador, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error("Error creating indicador:", error);
        return NextResponse.json(
            { error: "Error al crear indicador" },
            { status: 500 }
        );
    }
}
