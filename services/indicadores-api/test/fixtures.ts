import type { Indicadores } from "../src/contract.js";

/** A valid, realistic sample payload for tests. */
export function makeSampleIndicadores(
  overrides: Partial<Indicadores> = {},
): Indicadores {
  return {
    year: 2026,
    month: 3,
    valorUF: 38129.63,
    valorUTM: 68034,
    valorUTA: 816408,
    sueldoMinimo: 500000,
    sueldoMinimoCasaPart: 410000,
    sueldoMinimoMenores: 372000,
    sueldoMinimoNoRem: 322295,
    topeImponibleAFP: 89.9,
    topeImponibleINP: 84.3,
    topeSeguroCesantia: 135.1,
    sisRate: 2.0,
    rentabilidadProtegidaRate: 0.9,
    expectativaVidaRate: 0.5,
    apvTopeMensualUF: 50,
    apvTopeAnualUF: 600,
    afpRates: [
      {
        afpNombre: "Capital",
        cargoTrabajador: 11.44,
        cargoEmpleador: 1.44,
        totalAPagar: 12.88,
        independiente: 12.88,
      },
    ],
    cesantiaRates: [
      { tipoContrato: "INDEFINIDO", empleador: 2.4, trabajador: 0.6 },
    ],
    asignacionFamiliar: [
      { tramo: "A", monto: 21365, rentaDesde: 0, rentaHasta: 586678 },
    ],
    impuestoTramos: [
      { desde: 0, hasta: 870000, factor: 0, cantidadRebajar: 0 },
      { desde: 870000.01, hasta: null, factor: 0.04, cantidadRebajar: 34800 },
    ],
    ...overrides,
  };
}
