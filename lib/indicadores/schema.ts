import { z } from "zod";

/**
 * Shared indicator schemas (Ley 21.735 rate split).
 *
 * Moved out of `app/api/admin/indicadores/route.ts` so both the admin routes
 * and `lib/indicadores/sync.ts` can import from a lib module without creating
 * a route <-> lib import cycle.
 *
 * `seguroSocialRate` is intentionally absent from every input schema: it is
 * derived server-side (see `lib/indicadores/rates.ts`), never accepted from a
 * client or the external microservice.
 */
export const baseIndicadorSchema = z.object({
  year: z.number().min(2020).max(2100),
  month: z.number().min(1).max(12),

  // Valores monetarios
  valorUF: z.number().positive(),
  valorUTM: z.number().positive(),
  valorUTA: z.number().positive(),

  // Sueldos mínimos
  sueldoMinimo: z.number().positive(),
  sueldoMinimoCasaPart: z.number().positive(),
  sueldoMinimoMenores: z.number().positive(),
  sueldoMinimoNoRem: z.number().positive(),

  // Topes en UF
  topeImponibleAFP: z.number().positive(),
  topeImponibleINP: z.number().positive(),
  topeSeguroCesantia: z.number().positive(),

  // Tasas (Ley 21.735 split — seguroSocialRate is derived, not accepted)
  sisRate: z.number().min(0).max(100),
  rentabilidadProtegidaRate: z.number().min(0).max(100),
  expectativaVidaRate: z.number().min(0).max(100),

  // APV
  apvTopeMensualUF: z.number().positive(),
  apvTopeAnualUF: z.number().positive(),

  // Related data (optional on create, can be added later)
  afpRates: z
    .array(
      z.object({
        afpNombre: z.string(),
        cargoTrabajador: z.number(),
        cargoEmpleador: z.number(),
        totalAPagar: z.number(),
        independiente: z.number().nullable(),
      }),
    )
    .optional(),

  cesantiaRates: z
    .array(
      z.object({
        tipoContrato: z.string(),
        empleador: z.number(),
        trabajador: z.number(),
      }),
    )
    .optional(),

  asignacionFamiliar: z
    .array(
      z.object({
        tramo: z.string(),
        monto: z.number(),
        rentaDesde: z.number(),
        rentaHasta: z.number().nullable(),
      }),
    )
    .optional(),
});

export type BaseIndicador = z.infer<typeof baseIndicadorSchema>;

/**
 * External sync contract (microservice output): base fields plus the optional
 * `impuestoTramos` array. Mirrors the microservice's `indicadoresSchema` minus
 * the split-rate-only fields that the repo derives.
 */
export const externalIndicadorSchema = baseIndicadorSchema.extend({
  impuestoTramos: z
    .array(
      z.object({
        desde: z.coerce.number(),
        hasta: z.coerce.number().nullable(),
        factor: z.coerce.number(),
        cantidadRebajar: z.coerce.number(),
      }),
    )
    .optional(),
});

export type ExternalIndicador = z.infer<typeof externalIndicadorSchema>;
