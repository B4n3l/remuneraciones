import { prisma } from '@/lib/db';
import {
    calculateAFP,
    calculateHealth,
    calculateUnemployment,
    calculateGratificacion,
    calculateIncomeTax,
    calculateImponibleBase,
    calculateTotalHaberes,
} from './calculations';
import type { Worker, AFP, SystemValue } from '@prisma/client';

interface PayrollInput {
    workerId: string;
    diasTrabajados: number;
    horasExtra: number;
    valorHoraExtra: number;
    bonoColacion?: number;
    bonoMovilizacion?: number;
    bonoViatico?: number;
    anticipos?: number;
    prestamos?: number;
    otrosDescuentos?: number;
}

interface PayrollResult {
    totalHaberes: number;
    totalDescuentosLegales: number;
    totalDescuentosVoluntarios: number;
    liquidoPagar: number;
    earnings: Array<{
        tipo: string;
        concepto: string;
        monto: number;
    }>;
    deductions: Array<{
        tipo: string;
        concepto: string;
        monto: number;
    }>;
}

export async function calculatePayroll(input: PayrollInput): Promise<PayrollResult> {
    // Get worker data with relations
    const worker = await prisma.worker.findUnique({
        where: { id: input.workerId },
        include: {
            afp: true,
            healthPlan: true,
        },
    });

    if (!worker) {
        throw new Error('Worker not found');
    }

    // Get current system values
    const today = new Date();
    const [ufValue, utmValue, sueldoMinimo] = await Promise.all([
        prisma.systemValue.findFirst({
            where: { tipo: 'UF' },
            orderBy: { fecha: 'desc' },
        }),
        prisma.systemValue.findFirst({
            where: { tipo: 'UTM' },
            orderBy: { fecha: 'desc' },
        }),
        prisma.systemValue.findFirst({
            where: { tipo: 'SUELDO_MINIMO' },
            orderBy: { fecha: 'desc' },
        }),
    ]);

    if (!ufValue || !utmValue || !sueldoMinimo) {
        throw new Error('System values (UF, UTM, Sueldo Mínimo) not configured');
    }

    const uf = Number(ufValue.valor);
    const utm = Number(utmValue.valor);
    const minWage = Number(sueldoMinimo.valor);

    // Get tax brackets for current year
    const currentYear = new Date().getFullYear();
    const taxBrackets = await prisma.taxBracket.findMany({
        where: { year: currentYear },
        orderBy: { fromUTM: 'asc' },
    });

    if (taxBrackets.length === 0) {
        throw new Error(`Tax brackets not configured for year ${currentYear}`);
    }

    // Calculate sueldo base proportional to days worked
    const sueldoBaseProporcional =
        input.diasTrabajados === 30
            ? Number(worker.sueldoBase)
            : Math.round((Number(worker.sueldoBase) / 30) * input.diasTrabajados);

    // Calculate gratificación
    const gratificacion = calculateGratificacion(
        worker.tipoGratificacion,
        sueldoBaseProporcional,
        worker.gratificacionPactada ? Number(worker.gratificacionPactada) : undefined,
        minWage
    );

    // Calculate imponible base
    const imponibleBase = calculateImponibleBase(
        sueldoBaseProporcional,
        input.horasExtra,
        input.valorHoraExtra,
        gratificacion
    );

    // Calculate haberes (earnings)
    const earnings = [];
    earnings.push({
        tipo: 'SUELDO_BASE',
        concepto: 'Sueldo Base',
        monto: sueldoBaseProporcional,
    });

    if (input.horasExtra > 0) {
        earnings.push({
            tipo: 'HORAS_EXTRA',
            concepto: `Horas Extra (${input.horasExtra} hrs)`,
            monto: input.horasExtra * input.valorHoraExtra,
        });
    }

    earnings.push({
        tipo: 'GRATIFICACION',
        concepto:
            worker.tipoGratificacion === 'PACTADA'
                ? 'Gratificación Pactada'
                : 'Gratificación Legal 25%',
        monto: gratificacion,
    });

    if (input.bonoColacion) {
        earnings.push({
            tipo: 'BONO_COLACION',
            concepto: 'Bono Colación',
            monto: input.bonoColacion,
        });
    }

    if (input.bonoMovilizacion) {
        earnings.push({
            tipo: 'BONO_MOVILIZACION',
            concepto: 'Bono Movilización',
            monto: input.bonoMovilizacion,
        });
    }

    if (input.bonoViatico) {
        earnings.push({
            tipo: 'BONO_VIATICO',
            concepto: 'Bono Viático',
            monto: input.bonoViatico,
        });
    }

    const totalHaberes = calculateTotalHaberes({
        sueldoBase: sueldoBaseProporcional,
        horasExtra: input.horasExtra,
        valorHoraExtra: input.valorHoraExtra,
        gratificacion,
        bonoColacion: input.bonoColacion,
        bonoMovilizacion: input.bonoMovilizacion,
        bonoViatico: input.bonoViatico,
    });

    // Calculate descuentos legales (legal deductions)
    const deductions = [];

    // AFP
    const afpDeduction = calculateAFP(imponibleBase, Number(worker.afp.porcentaje));
    deductions.push({
        tipo: 'AFP',
        concepto: `AFP ${worker.afp.nombre}`,
        monto: afpDeduction,
    });

    // Health
    const healthDeduction = calculateHealth(
        imponibleBase,
        worker.tipoSalud,
        uf,
        worker.healthPlan ? Number(worker.healthPlan.planUF) : undefined
    );
    deductions.push({
        tipo: 'SALUD',
        concepto:
            worker.tipoSalud === 'ISAPRE'
                ? `Isapre ${worker.healthPlan?.isapre || ''}`
                : 'Fonasa 7%',
        monto: healthDeduction,
    });

    // Unemployment insurance
    const cesantia = calculateUnemployment(imponibleBase, worker.tipoContrato);
    deductions.push({
        tipo: 'CESANTIA',
        concepto: 'Seguro de Cesantía',
        monto: cesantia.worker,
    });

    // Calculate taxable income (after AFP, health, and unemployment)
    const taxableIncome = imponibleBase - afpDeduction - healthDeduction - cesantia.worker;

    // Income tax
    const incomeTax = calculateIncomeTax(
        taxableIncome,
        utm,
        taxBrackets.map((b) => ({
            fromUTM: Number(b.fromUTM),
            toUTM: b.toUTM ? Number(b.toUTM) : null,
            factor: Number(b.factor),
            deduction: Number(b.deduction),
        }))
    );

    if (incomeTax > 0) {
        deductions.push({
            tipo: 'IMPUESTO_UNICO',
            concepto: 'Impuesto Único',
            monto: incomeTax,
        });
    }

    const totalDescuentosLegales =
        afpDeduction + healthDeduction + cesantia.worker + incomeTax;

    // Voluntary deductions
    let totalDescuentosVoluntarios = 0;

    if (input.anticipos) {
        deductions.push({
            tipo: 'ANTICIPO',
            concepto: 'Anticipos',
            monto: input.anticipos,
        });
        totalDescuentosVoluntarios += input.anticipos;
    }

    if (input.prestamos) {
        deductions.push({
            tipo: 'PRESTAMO',
            concepto: 'Préstamos',
            monto: input.prestamos,
        });
        totalDescuentosVoluntarios += input.prestamos;
    }

    if (input.otrosDescuentos) {
        deductions.push({
            tipo: 'OTRO',
            concepto: 'Otros Descuentos',
            monto: input.otrosDescuentos,
        });
        totalDescuentosVoluntarios += input.otrosDescuentos;
    }

    // Calculate líquido a pagar
    const liquidoPagar =
        totalHaberes - totalDescuentosLegales - totalDescuentosVoluntarios;

    return {
        totalHaberes,
        totalDescuentosLegales,
        totalDescuentosVoluntarios,
        liquidoPagar,
        earnings,
        deductions,
    };
}
