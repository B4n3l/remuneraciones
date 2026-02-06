import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { calculatePayroll } from "@/lib/payroll/simple-engine";

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
        { error: `No hay valores del sistema para ${month}/${year}. Verifica que existan UF/UTM para ese período.` },
        { status: 400 }
      );
    }

    // Get monthly indicators (IndicadorMensual) with AFP and Cesantía rates
    const indicadorMensual = await prisma.indicadorMensual.findUnique({
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
        valorUF: Number(systemValue.valorUF),
        sueldoMinimo: Number(systemValue.sueldoMinimo),
        diasTrabajados: Number(workerInput.diasTrabajados) || 30,
        horasExtras50: Number(workerInput.horasExtras50) || 0,
        horasExtras100: Number(workerInput.horasExtras100) || 0,
        // Bonos fijos del trabajador (no imponibles)
        bonoColacion: Number(worker.bonoColacion) || 0,
        bonoMovilizacion: Number(worker.bonoMovilizacion) || 0,
        bonoViatico: Number(worker.bonoViatico) || 0,
        // Bonos variables ingresados para este período
        bonosVariables: Number(workerInput.bonos) || 0,
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
        valorUF: Number(systemValue.valorUF),
        valorUTM: Number(systemValue.valorUTM),
        sueldoMinimo: Number(systemValue.sueldoMinimo),
      },
      indicadores: {
        afpRates: Object.fromEntries(afpRatesMap),
        cesantiaRates: Object.fromEntries(cesantiaRatesMap),
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
