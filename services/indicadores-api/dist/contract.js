import { z } from "zod";
/**
 * Ley 21.735 split rates (legal constants, percent values).
 *
 * `rentabilidadProtegidaRate` (0.9%) + `expectativaVidaRate` (0.5%) +
 * `sisRate` (2.0%) replace the legacy single `seguroSocialRate`. The contract
 * deliberately omits `seguroSocialRate` (design decision #5): it is derived
 * server-side in the repo, never published by this service.
 */
export const LEY_21735_RATES = {
    rentabilidadProtegidaRate: 0.9,
    expectativaVidaRate: 0.5,
    sisRate: 2.0,
};
export const afpRateSchema = z.object({
    afpNombre: z.string(),
    cargoTrabajador: z.number(),
    cargoEmpleador: z.number(),
    totalAPagar: z.number(),
    independiente: z.number(),
});
export const cesantiaRateSchema = z.object({
    tipoContrato: z.string(),
    empleador: z.number(),
    trabajador: z.number(),
});
export const asignacionFamiliarSchema = z.object({
    tramo: z.string(),
    monto: z.number(),
    rentaDesde: z.number(),
    rentaHasta: z.number().nullable(),
});
export const impuestoTramoSchema = z.object({
    desde: z.number(),
    hasta: z.number().nullable(), // null marks the top bracket
    factor: z.number(),
    cantidadRebajar: z.number(),
});
/**
 * Full `200` output contract for GET /indicadores.
 *
 * Mirrors the repo's `indicadorSchema` minus `seguroSocialRate`, plus the two
 * Ley 21.735 split rates and a required `impuestoTramos` array. Related arrays
 * are required: the service never serves partial data.
 */
export const indicadoresSchema = z.object({
    year: z.number().int().min(2000).max(2100),
    month: z.number().int().min(1).max(12),
    valorUF: z.number().positive(),
    valorUTM: z.number().positive(),
    valorUTA: z.number().positive(),
    sueldoMinimo: z.number().positive(),
    sueldoMinimoCasaPart: z.number().positive(),
    sueldoMinimoMenores: z.number().positive(),
    sueldoMinimoNoRem: z.number().positive(),
    topeImponibleAFP: z.number().positive(),
    topeImponibleINP: z.number().positive(),
    topeSeguroCesantia: z.number().positive(),
    sisRate: z.number().min(0).max(100),
    rentabilidadProtegidaRate: z.number().min(0).max(100),
    expectativaVidaRate: z.number().min(0).max(100),
    apvTopeMensualUF: z.number().positive(),
    apvTopeAnualUF: z.number().positive(),
    afpRates: z.array(afpRateSchema),
    cesantiaRates: z.array(cesantiaRateSchema),
    asignacionFamiliar: z.array(asignacionFamiliarSchema),
    impuestoTramos: z.array(impuestoTramoSchema),
});
//# sourceMappingURL=contract.js.map