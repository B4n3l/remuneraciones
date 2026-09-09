import type { Config } from "../config.js";
import { type AlertSink } from "../alert.js";
import type { IndicadoresScraper } from "../scraper.js";
import { type PreviredSource } from "./previred.js";
import { type SiiSource } from "./sii.js";
import { type FallbackSource } from "./fallback.js";
export interface ScraperDeps {
    previred?: PreviredSource;
    sii?: SiiSource;
    fallback?: FallbackSource;
    alert?: AlertSink;
}
/**
 * Real scraping pipeline (replaces the PR1a stub):
 *
 * 1. Previred PDF → all non-impuesto fields. If the top section drifts and only
 *    UF/UTM/UTA are missing, mindicador.cl fills them (fallback).
 * 2. SII circular → `impuestoTramos` (UTM → pesos), top bracket `hasta: null`.
 * 3. Legal split rates are constant (LEY_21735_RATES) — never scraped.
 *
 * No-partial-serve: any missing required field after fallback → alert + throw
 * (the route maps throws to 500). `SourceNotFoundError` from Previred → `null`
 * (the route maps to 404, "no data published yet").
 */
export declare function createIndicadoresScraper(config: Config, deps?: ScraperDeps): IndicadoresScraper;
