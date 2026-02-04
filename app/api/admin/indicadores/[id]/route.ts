import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

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

        // Update main indicador
        const indicador = await prisma.indicadorMensual.update({
            where: { id },
            data: {
                valorUF: body.valorUF,
                valorUTM: body.valorUTM,
                valorUTA: body.valorUTA,
                sueldoMinimo: body.sueldoMinimo,
                sueldoMinimoCasaPart: body.sueldoMinimoCasaPart,
                sueldoMinimoMenores: body.sueldoMinimoMenores,
                sueldoMinimoNoRem: body.sueldoMinimoNoRem,
                topeImponibleAFP: body.topeImponibleAFP,
                topeImponibleINP: body.topeImponibleINP,
                topeSeguroCesantia: body.topeSeguroCesantia,
                sisRate: body.sisRate,
                seguroSocialRate: body.seguroSocialRate,
                apvTopeMensualUF: body.apvTopeMensualUF,
                apvTopeAnualUF: body.apvTopeAnualUF,
            },
            include: {
                afpRates: true,
                cesantiaRates: true,
                asignacionFamiliar: true,
            },
        });

        // Update AFP rates if provided
        if (body.afpRates) {
            // Delete existing and recreate
            await prisma.aFPHistorico.deleteMany({ where: { indicadorId: id } });
            await prisma.aFPHistorico.createMany({
                data: body.afpRates.map((afp: { afpNombre: string; cargoTrabajador: number; cargoEmpleador: number; totalAPagar: number; independiente: number }) => ({
                    indicadorId: id,
                    ...afp,
                })),
            });
        }

        // Update cesantia rates if provided
        if (body.cesantiaRates) {
            await prisma.cesantiaHistorico.deleteMany({ where: { indicadorId: id } });
            await prisma.cesantiaHistorico.createMany({
                data: body.cesantiaRates.map((c: { tipoContrato: string; empleador: number; trabajador: number }) => ({
                    indicadorId: id,
                    ...c,
                })),
            });
        }

        // Update asignacion familiar if provided
        if (body.asignacionFamiliar) {
            await prisma.asignacionFamiliarHistorico.deleteMany({ where: { indicadorId: id } });
            await prisma.asignacionFamiliarHistorico.createMany({
                data: body.asignacionFamiliar.map((a: { tramo: string; monto: number; rentaDesde: number; rentaHasta: number | null }) => ({
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
