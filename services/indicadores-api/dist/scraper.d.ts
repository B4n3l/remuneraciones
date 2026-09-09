import type { Indicadores } from "./contract.js";
/**
 * Scraper seam. `fetch` returns a validated `Indicadores` payload, `null` when
 * no data is published yet for the month (→ 404), or throws on scrape/parse
 * failure (→ 500, alerted upstream).
 *
 * The real implementation lives in `src/scrapers/` (Previred PDF + SII circular
 * + mindicador fallback); the interface is injected so tests can supply fakes.
 */
export interface IndicadoresScraper {
    fetch(year: number, month: number): Promise<Indicadores | null>;
}
