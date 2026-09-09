import type { Indicadores } from "../contract.js";
export type AfpRate = Indicadores["afpRates"][number];
export type CesantiaRate = Indicadores["cesantiaRates"][number];
export type AsignacionFamiliarTramo = Indicadores["asignacionFamiliar"][number];
/**
 * All fields the Previred PDF supplies. `impuestoTramos` comes from the SII
 * circular, and `sisRate`/`rentabilidadProtegidaRate`/`expectativaVidaRate` are
 * legal constants (see LEY_21735_RATES), so neither is part of this type.
 */
export interface PreviredData {
    valorUF: number;
    valorUTM: number;
    valorUTA: number;
    sueldoMinimo: number;
    sueldoMinimoCasaPart: number;
    sueldoMinimoMenores: number;
    sueldoMinimoNoRem: number;
    topeImponibleAFP: number;
    topeImponibleINP: number;
    topeSeguroCesantia: number;
    apvTopeMensualUF: number;
    apvTopeAnualUF: number;
    afpRates: AfpRate[];
    cesantiaRates: CesantiaRate[];
    asignacionFamiliar: AsignacionFamiliarTramo[];
}
export type FallbackField = "valorUF" | "valorUTM" | "valorUTA";
export type PreviredFallback = Partial<Pick<PreviredData, FallbackField>>;
export interface ParsePreviredOptions {
    year: number;
    month: number;
    /** Optional fallback values (mindicador) for UF/UTM/UTA only. */
    fallback?: PreviredFallback;
}
/**
 * Raised when a source cannot produce every required field. `missingFields` are
 * the contract field names that could not be extracted so the scraper can decide
 * whether a fallback source covers them. The parser NEVER returns partial data:
 * any incompleteness surfaces as this error.
 */
export declare class ParseError extends Error {
    readonly missingFields: string[];
    readonly source: string;
    constructor(missingFields: string[], source: string);
}
/**
 * Extracts every Previred field from the PDF text via anchored section headings.
 *
 * Missing required fields are collected and reported via `ParseError` — the
 * parser never returns a partial payload. When `fallback` (UF/UTM/UTA from
 * mindicador) is supplied, those three fields are filled before the completeness
 * check, so the scraper can recover a drifted top section.
 */
export declare function parsePreviredV1(text: string, options: ParsePreviredOptions): PreviredData;
