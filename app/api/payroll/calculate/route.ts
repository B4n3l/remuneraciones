import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { calculatePayroll } from "@/lib/payroll/simple-engine";
import { syncIndicadoresFromAPI } from "@/lib/indicadores/sync";

const calculateSchema = z.object({
    companyId: z.string().min(1, "companyId es requerido"),
    year: z.coerce.number().int().min(2020).max(2100),
    month: z.coerce.number().int().min(1).max(12),
    workerInputs: z.record(
        z.string(),
        z.object({
            diasTrabajados: z.coerce.number().int().min(0).max(31).optional(),
            horasExtras50: z.coerce.number().nonnegative().optional(),
            horasExtras100: z.coerce.number().nonnegative().optional(),
            bonos: z.coerce.number().nonnegative().optional(),
            bonosVariables: z.coerce.number().nonnegative().optional(),
        })
    ).optional(),
});

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const body = await request.json();
        const { companyId, year, month, workerInputs } = calculateSchema.parse(body);

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

    // Get monthly indicators (IndicadorMensual) with AFP and Cesantía rates
    let indicadorMensual = await prisma.indicadorMensual.findUnique({
      where: {
        year_month: {
          year,
          month,
        },
      },
      include: {
        afpRates: true,
        cesantiaRates: true,
      },
    });

    if (!indicadorMensual) {
      // Fallback: try syncing from external API on-the-fly
      try {
        const syncResult = await syncIndicadoresFromAPI(year, month);
        if (syncResult.success) {
          indicadorMensual = await prisma.indicadorMensual.findUnique({
            where: {
              year_month: {
                year,
                month,
              },
            },
            include: {
              afpRates: true,
              cesantiaRates: true,
            },
          });
        }
      } catch (syncError) {
        console.error("Error syncing indicators on-the-fly:", syncError);
      }
    }

    if (!indicadorMensual) {
      return NextResponse.json(
        { error: `No hay indicadores previsionales para ${month}/${year}. Configúralos en Administración > Indicadores.` },
        { status: 400 }
      );
    }

    // Create lookup maps for AFP and Cesantía rates
    const afpRatesMap = new Map(
      indicadorMensual.afpRates.map((rate) => [
        rate.afpNombre.toLowerCase(),
        Number(rate.cargoTrabajador),
      ])
    );

    const cesantiaRatesMap = new Map(
      indicadorMensual.cesantiaRates.map((rate) => [
        rate.tipoContrato,
        {
          trabajador: Number(rate.trabajador),
          empleador: Number(rate.empleador),
        },
      ])
    );

    // Default cesantía rate for indefinido contract (most common)
    const defaultCesantia = cesantiaRatesMap.get("INDEFINIDO") || { trabajador: 0.6, empleador: 2.4 };

    // Calculate payroll for each worker
    const payrollResults = workers.map((worker) => {
      const workerInput = workerInputs?.[worker.id] || {};

      // Get AFP rate from monthly indicators
      const afpNombre = worker.afp.nombre.toLowerCase();
      const afpPorcentaje = afpRatesMap.get(afpNombre) || Number(worker.afp.porcentaje) + Number(worker.afp.comision);

      // Get cesantía rate based on contract type (use indefinido as default)
      const tipoContrato = (worker as any).tipoContrato || "INDEFINIDO";
      const cesantiaRate = cesantiaRatesMap.get(tipoContrato) || defaultCesantia;

      const baseData = {
        sueldoBase: Number(worker.sueldoBase),
        tipoGratificacion: worker.tipoGratificacion as "PACTADA" | "LEGAL_25",
        gratificacionPactada: worker.gratificacionPactada ? Number(worker.gratificacionPactada) : undefined,
        afpPorcentaje,
        afpNombre: worker.afp.nombre,
        cesantiaPorcentaje: cesantiaRate.trabajador,
        tipoSalud: worker.tipoSalud as "FONASA" | "ISAPRE",
        isapre: worker.healthPlan?.isapre,
        isapreUF: worker.healthPlan?.planUF ? Number(worker.healthPlan.planUF) : undefined,
        valorUF: Number(indicadorMensual.valorUF),
        sueldoMinimo: Number(indicadorMensual.sueldoMinimo),
        diasTrabajados: Number(workerInput.diasTrabajados) || 30,
        horasExtras50: Number(workerInput.horasExtras50) || 0,
        horasExtras100: Number(workerInput.horasExtras100) || 0,
        // Bonos fijos del trabajador (no imponibles)
        bonoColacion: Number(worker.bonoColacion) || 0,
        bonoMovilizacion: Number(worker.bonoMovilizacion) || 0,
        bonoViatico: Number(worker.bonoViatico) || 0,
        // Bonos variables ingresados para este período
        bonosVariables: Number(workerInput?.bonosVariables ?? workerInput?.bonos ?? 0),
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
        valorUF: Number(indicadorMensual.valorUF),
        valorUTM: Number(indicadorMensual.valorUTM),
        sueldoMinimo: Number(indicadorMensual.sueldoMinimo),
      },
      indicadores: {
        afpRates: Object.fromEntries(afpRatesMap),
        cesantiaRates: Object.fromEntries(cesantiaRatesMap),
      },
      payrolls: payrollResults,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos de entrada inválidos", issues: error.issues },
        { status: 400 }
      );
    }
    console.error("Error calculating payroll:", error);
    return NextResponse.json(
      { error: "Error al calcular liquidaciones" },
      { status: 500 }
    );
  }
}
