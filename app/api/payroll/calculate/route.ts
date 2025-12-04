import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { calculatePayroll } from "@/lib/payroll/engine";

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const body = await request.json();
        const { companyId, year, month, workerInputs } = body;

        // Check access to company
        if (session.user.role !== "SUPER_ADMIN") {
            const hasAccess = await prisma.userCompany.findFirst({
                where: {
                    userId: session.user.id,
                    companyId,
                },
            });

            if (!hasAccess) {
                return NextResponse.json({ error: "Sin acceso" }, { status: 403 });
            }
        }

        // Get all active workers from company
        const workers = await prisma.worker.findMany({
            where: {
                companyId,
                isActive: true,
            },
            include: {
                afp: true,
                healthPlan: true,
            },
        });

        if (workers.length === 0) {
            return NextResponse.json(
                { error: "No hay trabajadores activos en esta empresa" },
                { status: 400 }
            );
        }

        // Get system values for the month
        const systemValue = await prisma.systemValue.findFirst({
            where: {
                year,
                month,
            },
        });

        if (!systemValue) {
            return NextResponse.json(
                { error: `No hay valores del sistema para ${month}/${year}` },
                { status: 400 }
            );
        }

        // Calculate payroll for each worker
        const payrollResults = workers.map((worker) => {
            const workerInput = workerInputs?.[worker.id] || {};

            const baseData = {
                sueldoBase: worker.sueldoBase,
                tipoGratificacion: worker.tipoGratificacion,
                gratificacionPactada: worker.gratificacionPactada || 0,
                afpPorcentaje: worker.afp.porcentaje,
                tipoSalud: worker.tipoSalud,
                isapre: worker.healthPlan?.isapre,
                isapreUF: worker.healthPlan?.planUF || 0,
                valorUF: systemValue.valorUF,
                horasExtras50: workerInput.horasExtras50 || 0,
                horasExtras100: workerInput.horasExtras100 || 0,
                bonos: workerInput.bonos || 0,
            };

            const calculation = calculatePayroll(baseData);

            return {
                workerId: worker.id,
                workerName: `${worker.nombres} ${worker.apellidoPaterno} ${worker.apellidoMaterno}`,
                workerRut: worker.rut,
                ...calculation,
                inputs: workerInput,
            };
        });

        return NextResponse.json({
            companyId,
            year,
            month,
            systemValue: {
                valorUF: systemValue.valorUF,
                valorUTM: systemValue.valorUTM,
                sueldoMinimo: systemValue.sueldoMinimo,
            },
            payrolls: payrollResults,
        });
    } catch (error) {
        console.error("Error calculating payroll:", error);
        return NextResponse.json(
            { error: "Error al calcular liquidaciones" },
            { status: 500 }
        );
    }
}
