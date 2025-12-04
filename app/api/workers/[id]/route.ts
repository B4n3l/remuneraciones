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

        const worker = await prisma.worker.findUnique({
            where: { id },
            include: {
                company: true,
                afp: true,
                healthPlan: true,
            },
        });

        if (!worker) {
            return NextResponse.json({ error: "Trabajador no encontrado" }, { status: 404 });
        }

        // Check access
        if (session.user.role !== "SUPER_ADMIN") {
            const hasAccess = await prisma.userCompany.findFirst({
                where: {
                    userId: session.user.id,
                    companyId: worker.companyId,
                },
            });

            if (!hasAccess) {
                return NextResponse.json({ error: "Sin acceso" }, { status: 403 });
            }
        }

        return NextResponse.json(worker);
    } catch (error) {
        console.error("Error fetching worker:", error);
        return NextResponse.json({ error: "Error al obtener trabajador" }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();

        // Check if worker exists
        const existingWorker = await prisma.worker.findUnique({
            where: { id },
        });

        if (!existingWorker) {
            return NextResponse.json({ error: "Trabajador no encontrado" }, { status: 404 });
        }

        // Check access
        if (session.user.role !== "SUPER_ADMIN") {
            const hasAccess = await prisma.userCompany.findFirst({
                where: {
                    userId: session.user.id,
                    companyId: existingWorker.companyId,
                },
            });

            if (!hasAccess) {
                return NextResponse.json({ error: "Sin acceso" }, { status: 403 });
            }
        }

        // Update worker
        const updateData: any = {
            nombres: body.nombres,
            apellidoPaterno: body.apellidoPaterno,
            apellidoMaterno: body.apellidoMaterno,
            cargo: body.cargo,
            fechaIngreso: new Date(body.fechaIngreso),
            tipoContrato: body.tipoContrato,
            sueldoBase: body.sueldoBase,
            tipoGratificacion: body.tipoGratificacion,
            bonoColacion: body.bonoColacion || 0,
            bonoMovilizacion: body.bonoMovilizacion || 0,
            bonoViatico: body.bonoViatico || 0,
            afpId: body.afpId,
            tipoSalud: body.tipoSalud,
        };


        if (body.gratificacionPactada) {
            updateData.gratificacionPactada = body.gratificacionPactada;
        } else {
            updateData.gratificacionPactada = null;
        }

        const worker = await prisma.worker.update({
            where: { id },
            data: updateData,
        });

        // Update or create health plan if Isapre
        if (body.tipoSalud === "ISAPRE" && body.healthPlan) {
            await prisma.workerHealthPlan.upsert({
                where: { workerId: id },
                create: {
                    workerId: id,
                    isapre: body.healthPlan.isapre,
                    planUF: body.healthPlan.planUF,
                },
                update: {
                    isapre: body.healthPlan.isapre,
                    planUF: body.healthPlan.planUF,
                },
            });
        } else {
            // Delete health plan if changed to Fonasa
            await prisma.workerHealthPlan.deleteMany({
                where: { workerId: id },
            });
        }

        return NextResponse.json(worker);
    } catch (error) {
        console.error("Error updating worker:", error);
        return NextResponse.json({ error: "Error al actualizar trabajador" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { id } = await params;

        const worker = await prisma.worker.findUnique({
            where: { id },
        });

        if (!worker) {
            return NextResponse.json({ error: "Trabajador no encontrado" }, { status: 404 });
        }

        // Check access
        if (session.user.role !== "SUPER_ADMIN") {
            const hasAccess = await prisma.userCompany.findFirst({
                where: {
                    userId: session.user.id,
                    companyId: worker.companyId,
                },
            });

            if (!hasAccess) {
                return NextResponse.json({ error: "Sin acceso" }, { status: 403 });
            }
        }

        // Soft delete - just mark as inactive
        await prisma.worker.update({
            where: { id },
            data: { isActive: false },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting worker:", error);
        return NextResponse.json({ error: "Error al eliminar trabajador" }, { status: 500 });
    }
}
