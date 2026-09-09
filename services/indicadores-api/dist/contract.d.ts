import { z } from "zod";
/**
 * Ley 21.735 split rates (legal constants, percent values).
 *
 * `rentabilidadProtegidaRate` (0.9%) + `expectativaVidaRate` (0.5%) +
 * `sisRate` (2.0%) replace the legacy single `seguroSocialRate`. The contract
 * deliberately omits `seguroSocialRate` (design decision #5): it is derived
 * server-side in the repo, never published by this service.
 */
export declare const LEY_21735_RATES: {
    readonly rentabilidadProtegidaRate: 0.9;
    readonly expectativaVidaRate: 0.5;
    readonly sisRate: 2;
};
export declare const afpRateSchema: z.ZodObject<{
    afpNombre: z.ZodString;
    cargoTrabajador: z.ZodNumber;
    cargoEmpleador: z.ZodNumber;
    totalAPagar: z.ZodNumber;
    independiente: z.ZodNumber;
}, z.core.$strip>;
export declare const cesantiaRateSchema: z.ZodObject<{
    tipoContrato: z.ZodString;
    empleador: z.ZodNumber;
    trabajador: z.ZodNumber;
}, z.core.$strip>;
export declare const asignacionFamiliarSchema: z.ZodObject<{
    tramo: z.ZodString;
    monto: z.ZodNumber;
    rentaDesde: z.ZodNumber;
    rentaHasta: z.ZodNullable<z.ZodNumber>;
}, z.core.$strip>;
export declare const impuestoTramoSchema: z.ZodObject<{
    desde: z.ZodNumber;
    hasta: z.ZodNullable<z.ZodNumber>;
    factor: z.ZodNumber;
    cantidadRebajar: z.ZodNumber;
}, z.core.$strip>;
/**
 * Full `200` output contract for GET /indicadores.
 *
 * Mirrors the repo's `indicadorSchema` minus `seguroSocialRate`, plus the two
 * Ley 21.735 split rates and a required `impuestoTramos` array. Related arrays
 * are required: the service never serves partial data.
 */
export declare const indicadoresSchema: z.ZodObject<{
    year: z.ZodNumber;
    month: z.ZodNumber;
    valorUF: z.ZodNumber;
    valorUTM: z.ZodNumber;
    valorUTA: z.ZodNumber;
    sueldoMinimo: z.ZodNumber;
    sueldoMinimoCasaPart: z.ZodNumber;
    sueldoMinimoMenores: z.ZodNumber;
    sueldoMinimoNoRem: z.ZodNumber;
    topeImponibleAFP: z.ZodNumber;
    topeImponibleINP: z.ZodNumber;
    topeSeguroCesantia: z.ZodNumber;
    sisRate: z.ZodNumber;
    rentabilidadProtegidaRate: z.ZodNumber;
    expectativaVidaRate: z.ZodNumber;
    apvTopeMensualUF: z.ZodNumber;
    apvTopeAnualUF: z.ZodNumber;
    afpRates: z.ZodArray<z.ZodObject<{
        afpNombre: z.ZodString;
        cargoTrabajador: z.ZodNumber;
        cargoEmpleador: z.ZodNumber;
        totalAPagar: z.ZodNumber;
        independiente: z.ZodNumber;
    }, z.core.$strip>>;
    cesantiaRates: z.ZodArray<z.ZodObject<{
        tipoContrato: z.ZodString;
        empleador: z.ZodNumber;
        trabajador: z.ZodNumber;
    }, z.core.$strip>>;
    asignacionFamiliar: z.ZodArray<z.ZodObject<{
        tramo: z.ZodString;
        monto: z.ZodNumber;
        rentaDesde: z.ZodNumber;
        rentaHasta: z.ZodNullable<z.ZodNumber>;
    }, z.core.$strip>>;
    impuestoTramos: z.ZodArray<z.ZodObject<{
        desde: z.ZodNumber;
        hasta: z.ZodNullable<z.ZodNumber>;
        factor: z.ZodNumber;
        cantidadRebajar: z.ZodNumber;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type Indicadores = z.infer<typeof indicadoresSchema>;
export type ImpuestoTramo = z.infer<typeof impuestoTramoSchema>;
