import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { baseIndicadorSchema } from "@/lib/indicadores/schema";
import { deriveSeguroSocialRate } from "@/lib/indicadores/rates";

// GET: Get single indicador by ID
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

        const indicador = await prisma.indicadorMensual.findUnique({
            where: { id },
            include: {
                afpRates: true,
                cesantiaRates: true,
                asignacionFamiliar: true,
            },
        });

        if (!indicador) {
            return NextResponse.json(
                { error: "Indicador no encontrado" },
                { status: 404 }
            );
        }

        return NextResponse.json(indicador);
    } catch (error) {
        console.error("Error fetching indicador:", error);
        return NextResponse.json(
            { error: "Error al obtener indicador" },
            { status: 500 }
        );
    }
}

// PUT: Update indicador
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        if (session.user.role !== "SUPER_ADMIN") {
            return NextResponse.json(
                { error: "Solo administradores pueden editar indicadores" },
                { status: 403 }
            );
        }

        const { id } = await params;
        const body = await request.json();

        // Security fix: validate the payload instead of writing raw body.
        const validatedData = baseIndicadorSchema.parse(body);

        // Update main indicador
        await prisma.indicadorMensual.update({
            where: { id },
            data: {
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
            },
        });

        // Update AFP rates if provided
        if (validatedData.afpRates) {
            // Delete existing and recreate
            await prisma.aFPHistorico.deleteMany({ where: { indicadorId: id } });
            await prisma.aFPHistorico.createMany({
                data: validatedData.afpRates.map((afp) => ({
                    indicadorId: id,
                    ...afp,
                })),
            });
        }

        // Update cesantia rates if provided
        if (validatedData.cesantiaRates) {
            await prisma.cesantiaHistorico.deleteMany({ where: { indicadorId: id } });
            await prisma.cesantiaHistorico.createMany({
                data: validatedData.cesantiaRates.map((c) => ({
                    indicadorId: id,
                    ...c,
                })),
            });
        }

        // Update asignacion familiar if provided
        if (validatedData.asignacionFamiliar) {
            await prisma.asignacionFamiliarHistorico.deleteMany({ where: { indicadorId: id } });
            await prisma.asignacionFamiliarHistorico.createMany({
                data: validatedData.asignacionFamiliar.map((a) => ({
                    indicadorId: id,
                    ...a,
                })),
            });
        }

        // Fetch updated indicador
        const updated = await prisma.indicadorMensual.findUnique({
            where: { id },
            include: {
                afpRates: true,
                cesantiaRates: true,
                asignacionFamiliar: true,
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error("Error updating indicador:", error);
        return NextResponse.json(
            { error: "Error al actualizar indicador" },
            { status: 500 }
        );
    }
}

// DELETE: Delete indicador
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        if (session.user.role !== "SUPER_ADMIN") {
            return NextResponse.json(
                { error: "Solo administradores pueden eliminar indicadores" },
                { status: 403 }
            );
        }

        const { id } = await params;

        await prisma.indicadorMensual.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting indicador:", error);
        return NextResponse.json(
            { error: "Error al eliminar indicador" },
            { status: 500 }
        );
    }
}
