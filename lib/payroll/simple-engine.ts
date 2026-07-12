/**
 * Simplified payroll calculation for Chilean workers
 * Calculates earnings and deductions based on worker data
 */

interface PayrollInput {
    // Base worker data
    sueldoBase: number;
    tipoGratificacion: "PACTADA" | "LEGAL_25";
    gratificacionPactada?: number;

    // Previsión (from monthly indicators)
    afpPorcentaje: number;
    afpNombre?: string;
    cesantiaPorcentaje?: number; // From monthly indicators, default 0.6%
    tipoSalud: "FONASA" | "ISAPRE";
    isapre?: string;
    isapreUF?: number;

    // System values
    valorUF: number;
    sueldoMinimo: number;

    // Additional inputs (monthly variables)
    diasTrabajados?: number; // Días trabajados en el mes (default 30)
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
    valorHoraExtra50: number; // Tarifa unitaria de la hora extra al 50%
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
 * Sueldo diario redondeado a peso entero (sueldo mensual / 30)
 */
export function calcularSueldoDiario(sueldoBase: number): number {
    return Math.round(sueldoBase / 30);
}

/**
 * Valor de la hora extra según jornada semanal.
 * Jornada legal máxima: 42 hrs desde el 26-04-2026 (Ley 21.561).
 * Fórmula DT: (sueldo diario × 28) / (jornada × 4) × factor, redondeo único al final.
 * Se calcula sobre el sueldo mensual contractual, no el proporcional por inasistencias.
 */
export function calcularValorHoraExtra(
    sueldoBase: number,
    factor: 1.5 | 2.0,
    jornadaSemanal: number = 42
): number {
    const diario = calcularSueldoDiario(sueldoBase);
    return Math.round((diario * 28 / (jornadaSemanal * 4)) * factor);
}

/**
 * Formatea horas con separador decimal es-CL (8.5 → "8,5") para conceptos y PDF.
 * El regex de la página de edición debe aceptar coma y punto al reconstruir las horas.
 */
export function formatHorasCL(horas: number): string {
    return new Intl.NumberFormat("es-CL", { maximumFractionDigits: 2 }).format(horas);
}

/**
 * Calculate gratificación based on type
 * For LEGAL_25: (sueldoBase + horasExtras) * 25% with cap of 4.75 minimum wages
 */
function calcularGratificacion(
    tipo: "PACTADA" | "LEGAL_25",
    sueldoBase: number,
    horasExtras: number,
    sueldoMinimo: number,
    montoPactado?: number
): number {
    if (tipo === "PACTADA" && montoPactado) {
        return Math.round(montoPactado);
    }
    // Legal 25%: (sueldo + horas extras) * 25%, tope 4.75 sueldos mínimos
    const baseCalculo = sueldoBase + horasExtras;
    const gratificacion25 = Math.round(baseCalculo * 0.25);
    const tope = Math.round(sueldoMinimo * 4.75 / 12); // Tope mensual
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
 * Calculate unemployment insurance (worker contribution from monthly indicators)
 */
function calcularCesantia(imponible: number, porcentaje: number = 0.6): number {
    return Math.round(imponible * (porcentaje / 100));
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
        afpNombre = "AFP",
        cesantiaPorcentaje = 0.6, // Default 0.6% if not provided
        tipoSalud,
        isapreUF,
        valorUF,
        sueldoMinimo,
        diasTrabajados = 30, // Default to full month
        horasExtras50 = 0,
        horasExtras100 = 0,
        bonoColacion = 0,
        bonoMovilizacion = 0,
        bonoViatico = 0,
        bonosVariables = 0,
    } = input;

    // Mes completo paga el sueldo contractual exacto; días parciales usan el diario redondeado
    const sueldoBaseProporcional = diasTrabajados >= 30
        ? sueldoBase
        : calcularSueldoDiario(sueldoBase) * diasTrabajados;

    // Horas extras sobre el sueldo contractual completo (las inasistencias no reducen el valor hora)
    const valorHE50 = calcularValorHoraExtra(sueldoBase, 1.5);
    const valorHE100 = calcularValorHoraExtra(sueldoBase, 2.0);
    // Las horas pueden traer decimales (ej. 8.5), el monto se redondea a peso entero
    const horasExtras = Math.round((horasExtras50 * valorHE50) + (horasExtras100 * valorHE100));

    // Luego calcular gratificación (necesita horas extras, usando sueldo proporcional)
    const gratificacion = calcularGratificacion(tipoGratificacion, sueldoBaseProporcional, horasExtras, sueldoMinimo, gratificacionPactada);

    // Total bonos (fijos + variables, NO imponibles)
    const totalBonos = bonoColacion + bonoMovilizacion + bonoViatico + bonosVariables;

    const totalHaberes = sueldoBaseProporcional + horasExtras + gratificacion + totalBonos;

    // Base imponible (sueldo proporcional + horas extras + gratificación, NO bonos)
    const imponible = sueldoBaseProporcional + horasExtras + gratificacion;

    // Calculate descuentos using rates from monthly indicators
    const afp = calcularAFP(imponible, afpPorcentaje);
    const salud = calcularSalud(imponible, tipoSalud, valorUF, isapreUF);
    const cesantia = calcularCesantia(imponible, cesantiaPorcentaje);
    const impuesto = calcularImpuesto(imponible, afp, salud, cesantia);

    const totalDescuentos = afp + salud + cesantia + impuesto;

    // Líquido a pagar
    const liquido = totalHaberes - totalDescuentos;

    // Detalles para mostrar
    const detalleHaberes = [];

    if (diasTrabajados < 30) {
        detalleHaberes.push({
            concepto: `Sueldo Base (${diasTrabajados}/30 días)`,
            monto: sueldoBaseProporcional
        });
    } else {
        detalleHaberes.push({ concepto: "Sueldo Base", monto: sueldoBaseProporcional });
    }

    if (horasExtras > 0) {
        const detalle = [];
        if (horasExtras50 > 0) {
            detalle.push(`${formatHorasCL(horasExtras50)} hrs al 50%`);
        }
        if (horasExtras100 > 0) {
            detalle.push(`${formatHorasCL(horasExtras100)} hrs al 100%`);
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
        { concepto: `AFP ${afpNombre} (${afpPorcentaje}%)`, monto: afp },
        { concepto: tipoSalud === "FONASA" ? "Fonasa 7%" : "Isapre", monto: salud },
        { concepto: `Seguro Cesantía ${cesantiaPorcentaje}%`, monto: cesantia },
    ];

    if (impuesto > 0) {
        detalleDescuentos.push({ concepto: "Impuesto Único", monto: impuesto });
    }

    return {
        sueldoBase: sueldoBaseProporcional,
        horasExtras,
        valorHoraExtra50: valorHE50,
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
