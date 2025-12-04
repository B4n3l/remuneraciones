/**
 * Simplified payroll calculation for Chilean workers
 * Calculates earnings and deductions based on worker data
 */

interface PayrollInput {
    // Base worker data
    sueldoBase: number;
    tipoGratificacion: "PACTADA" | "LEGAL_25";
    gratificacionPactada?: number;

    // Previsión
    afpPorcentaje: number;
    tipoSalud: "FONASA" | "ISAPRE";
    isapre?: string;
    isapreUF?: number;

    // System values
    valorUF: number;

    // Additional inputs (monthly variables)
    horasExtras50?: number;  // Cantidad de horas extras al 50%
    horasExtras100?: number; // Cantidad de horas extras al 100%

    // Bonos fijos (from worker data, non-taxable)
    bonoColacion?: number;
    bonoMovilizacion?: number;
    bonoViatico?: number;

    // Bonos variables (manual entry for this period)
    bonosVariables?: number;
}

interface PayrollResult {
    // Haberes (Earnings)
    sueldoBase: number;
    horasExtras: number;
    gratificacion: number;
    bonos: number;
    totalHaberes: number;

    // Base imponible
    imponible: number;

    // Descuentos Legales
    afp: number;
    salud: number;
    cesantia: number;
    impuesto: number;
    totalDescuentos: number;

    // Líquido
    liquido: number;

    // Breakdown for display
    detalleHaberes: Array<{ concepto: string; monto: number }>;
    detalleDescuentos: Array<{ concepto: string; monto: number }>;
}

/**
 * Calculate overtime value per hour for 44-hour weekly workers
 * Formula: (SueldoBase / 30 * 28 / 176) * factor
 */
function calcularValorHoraExtra(sueldoBase: number, factor: 1.5 | 2.0): number {
    return Math.round((sueldoBase / 30 * 28 / 176) * factor);
}

/**
 * Calculate gratificación based on type
 */
function calcularGratificacion(
    tipo: "PACTADA" | "LEGAL_25",
    sueldoBase: number,
    montoPactado?: number
): number {
    if (tipo === "PACTADA" && montoPactado) {
        return Math.round(montoPactado);
    }
    // Legal 25% (tope 4.75 sueldos mínimos - approx 2.2M)
    const gratificacion25 = Math.round(sueldoBase * 0.25);
    const tope = 2200000; // Aproximado, debería venir de SystemValue
    return Math.min(gratificacion25, tope);
}

/**
 * Calculate AFP deduction
 */
function calcularAFP(imponible: number, porcentaje: number): number {
    return Math.round(imponible * (porcentaje / 100));
}

/**
 * Calculate health deduction (Fonasa or Isapre)
 */
function calcularSalud(
    imponible: number,
    tipo: "FONASA" | "ISAPRE",
    valorUF: number,
    isapreUF?: number
): number {
    const fonasa7 = Math.round(imponible * 0.07);

    if (tipo === "FONASA") {
        return fonasa7;
    }

    // Isapre: 7% + adicional en UF
    const adicional = isapreUF ? Math.round(isapreUF * valorUF) : 0;
    return fonasa7 + adicional;
}

/**
 * Calculate unemployment insurance (0.6% worker contribution)
 */
function calcularCesantia(imponible: number): number {
    return Math.round(imponible * 0.006);
}

/**
 * Simplified income tax calculation
 * For now, basic progressive calculation without full tax brackets
 */
function calcularImpuesto(imponible: number, afp: number, salud: number, cesantia: number): number {
    const baseImponible = imponible - afp - salud - cesantia;

    // Simplified: no tax if base < ~800k
    if (baseImponible < 800000) return 0;

    // Basic progressive tax (simplified)
    // This should use actual tax brackets from DB
    let impuesto = 0;

    if (baseImponible > 2500000) {
        impuesto = Math.round((baseImponible - 2500000) * 0.135 + 180000);
    } else if (baseImponible > 1500000) {
        impuesto = Math.round((baseImponible - 1500000) * 0.08 + 100000);
    } else if (baseImponible > 800000) {
        impuesto = Math.round((baseImponible - 800000) * 0.04);
    }

    return impuesto;
}

/**
 * Main payroll calculation function
 */
export function calculatePayroll(input: PayrollInput): PayrollResult {
    const {
        sueldoBase,
        tipoGratificacion,
        gratificacionPactada,
        afpPorcentaje,
        tipoSalud,
        isapreUF,
        valorUF,
        horasExtras50 = 0,
        horasExtras100 = 0,
        bonoColacion = 0,
        bonoMovilizacion = 0,
        bonoViatico = 0,
        bonosVariables = 0,
    } = input;

    // Calculate haberes
    const gratificacion = calcularGratificacion(tipoGratificacion, sueldoBase, gratificacionPactada);

    const valorHE50 = calcularValorHoraExtra(sueldoBase, 1.5);
    const valorHE100 = calcularValorHoraExtra(sueldoBase, 2.0);
    const horasExtras = (horasExtras50 * valorHE50) + (horasExtras100 * valorHE100);

    // Total bonos (fijos + variables, NO imponibles)
    const totalBonos = bonoColacion + bonoMovilizacion + bonoViatico + bonosVariables;

    const totalHaberes = sueldoBase + horasExtras + gratificacion + totalBonos;

    // Base imponible (sueldo + horas extras + gratificación, NO bonos)
    const imponible = sueldoBase + horasExtras + gratificacion;

    // Calculate descuentos
    const afp = calcularAFP(imponible, afpPorcentaje);
    const salud = calcularSalud(imponible, tipoSalud, valorUF, isapreUF);
    const cesantia = calcularCesantia(imponible);
    const impuesto = calcularImpuesto(imponible, afp, salud, cesantia);

    const totalDescuentos = afp + salud + cesantia + impuesto;

    // Líquido a pagar
    const liquido = totalHaberes - totalDescuentos;

    // Detalles para mostrar
    const detalleHaberes = [
        { concepto: "Sueldo Base", monto: sueldoBase },
    ];

    if (horasExtras > 0) {
        const detalle = [];
        if (horasExtras50 > 0) {
            detalle.push(`${horasExtras50} hrs al 50%`);
        }
        if (horasExtras100 > 0) {
            detalle.push(`${horasExtras100} hrs al 100%`);
        }
        detalleHaberes.push({
            concepto: `Horas Extras (${detalle.join(", ")})`,
            monto: horasExtras
        });
    }

    detalleHaberes.push({
        concepto: tipoGratificacion === "PACTADA" ? "Gratificación Pactada" : "Gratificación Legal 25%",
        monto: gratificacion
    });

    if (bonoColacion > 0) {
        detalleHaberes.push({ concepto: "Bono Colación", monto: bonoColacion });
    }

    if (bonoMovilizacion > 0) {
        detalleHaberes.push({ concepto: "Bono Movilización", monto: bonoMovilizacion });
    }

    if (bonoViatico > 0) {
        detalleHaberes.push({ concepto: "Bono Viático", monto: bonoViatico });
    }

    if (bonosVariables > 0) {
        detalleHaberes.push({ concepto: "Bonos Variables", monto: bonosVariables });
    }

    const detalleDescuentos = [
        { concepto: `AFP ${afpPorcentaje}%`, monto: afp },
        { concepto: tipoSalud === "FONASA" ? "Fonasa 7%" : "Isapre", monto: salud },
        { concepto: "Seguro Cesantía 0.6%", monto: cesantia },
    ];

    if (impuesto > 0) {
        detalleDescuentos.push({ concepto: "Impuesto Único", monto: impuesto });
    }

    return {
        sueldoBase,
        horasExtras,
        gratificacion,
        bonos: totalBonos,
        totalHaberes,
        imponible,
        afp,
        salud,
        cesantia,
        impuesto,
        totalDescuentos,
        liquido,
        detalleHaberes,
        detalleDescuentos,
    };
}
