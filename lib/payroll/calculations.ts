import { Decimal } from '@prisma/client/runtime/library';

/**
 * Calculate AFP contribution
 * @param imponibleBase - Base amount subject to AFP contribution
 * @param afpPercentage - AFP percentage (including commission)
 * @returns AFP deduction amount
 */
export function calculateAFP(imponibleBase: number, afpPercentage: number): number {
    return Math.round(imponibleBase * (afpPercentage / 100));
}

/**
 * Calculate health insurance deduction
 * @param imponibleBase - Base amount subject to health contribution
 * @param tipoSalud - Type of health insurance (FONASA or ISAPRE)
 * @param ufValue - Current UF value
 * @param planUF - Additional UF amount for ISAPRE (if applicable)
 * @returns Health deduction amount
 */
export function calculateHealth(
    imponibleBase: number,
    tipoSalud: 'FONASA' | 'ISAPRE',
    ufValue: number,
    planUF?: number
): number {
    const baseSalud = Math.round(imponibleBase * 0.07); // 7% base

    if (tipoSalud === 'ISAPRE' && planUF) {
        const additionalAmount = Math.round(planUF * ufValue);
        return baseSalud + additionalAmount;
    }

    return baseSalud;
}

/**
 * Calculate unemployment insurance (seguro de cesantía)
 * @param imponibleBase - Base amount subject to unemployment insurance
 * @param tipoContrato - Type of employment contract
 * @returns Object with worker and employer contributions
 */
export function calculateUnemployment(
    imponibleBase: number,
    tipoContrato: 'INDEFINIDO' | 'PLAZO_FIJO' | 'OBRA'
): { worker: number; employer: number } {
    if (tipoContrato === 'INDEFINIDO') {
        return {
            worker: Math.round(imponibleBase * 0.006), // 0.6%
            employer: Math.round(imponibleBase * 0.024), // 2.4%
        };
    } else {
        // PLAZO_FIJO or OBRA
        return {
            worker: Math.round(imponibleBase * 0.03), // 3.0%
            employer: 0,
        };
    }
}

/**
 * Calculate gratificación (bonus)
 * @param tipoGratificacion - Type of gratification
 * @param imponibleBase - Base amount for calculation
 * @param gratificacionPactada - Fixed amount (if PACTADA)
 * @param sueldoMinimo - Current minimum wage
 * @returns Gratification amount
 */
export function calculateGratificacion(
    tipoGratificacion: 'PACTADA' | 'LEGAL_25',
    imponibleBase: number,
    gratificacionPactada?: number,
    sueldoMinimo?: number
): number {
    if (tipoGratificacion === 'PACTADA' && gratificacionPactada) {
        return gratificacionPactada;
    }

    // LEGAL_25: 25% of imponible base, capped at 4.75 minimum wages
    const calculated25 = imponibleBase * 0.25;
    const tope = sueldoMinimo ? sueldoMinimo * 4.75 : Infinity;

    return Math.round(Math.min(calculated25, tope));
}

/**
 * Calculate income tax (impuesto único)
 * @param taxableIncome - Income after AFP, health, and unemployment deductions
 * @param utmValue - Current UTM value
 * @param taxBrackets - Tax bracket table for the year
 * @returns Tax amount
 */
export function calculateIncomeTax(
    taxableIncome: number,
    utmValue: number,
    taxBrackets: Array<{
        fromUTM: number;
        toUTM: number | null;
        factor: number;
        deduction: number;
    }>
): number {
    const incomeInUTM = taxableIncome / utmValue;

    // Find the applicable tax bracket
    const bracket = taxBrackets.find((b) => {
        if (b.toUTM === null) {
            return incomeInUTM >= b.fromUTM;
        }
        return incomeInUTM >= b.fromUTM && incomeInUTM < b.toUTM;
    });

    if (!bracket) {
        return 0; // No tax if income is below minimum bracket
    }

    // Calculate tax: (Income in UTM × Factor - Deduction) × UTM Value
    const taxInUTM = incomeInUTM * bracket.factor - bracket.deduction;
    const tax = Math.round(Math.max(0, taxInUTM * utmValue));

    return tax;
}

/**
 * Calculate total earnings (haberes)
 */
export function calculateTotalHaberes(earnings: {
    sueldoBase: number;
    horasExtra: number;
    valorHoraExtra: number;
    gratificacion: number;
    bonoColacion?: number;
    bonoMovilizacion?: number;
    bonoViatico?: number;
}): number {
    const {
        sueldoBase,
        horasExtra,
        valorHoraExtra,
        gratificacion,
        bonoColacion = 0,
        bonoMovilizacion = 0,
        bonoViatico = 0,
    } = earnings;

    const totalHorasExtra = horasExtra * valorHoraExtra;

    return Math.round(
        sueldoBase +
        totalHorasExtra +
        gratificacion +
        bonoColacion +
        bonoMovilizacion +
        bonoViatico
    );
}

/**
 * Calculate imponible base (taxable base for social security)
 * Only includes sueldo base, horas extra, and gratificación
 */
export function calculateImponibleBase(
    sueldoBase: number,
    horasExtra: number,
    valorHoraExtra: number,
    gratificacion: number
): number {
    const totalHorasExtra = horasExtra * valorHoraExtra;
    return Math.round(sueldoBase + totalHorasExtra + gratificacion);
}
