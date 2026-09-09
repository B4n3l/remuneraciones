import type { Indicadores } from "./contract.js";

/**
 * Scraper seam. `fetch` returns a validated `Indicadores` payload, `null` when
 * no data is published yet for the month, or throws on scrape/parse failure
 * (the route maps `null` → 404 and a throw → 500).
 *
 * PR1b replaces this stub with the real scrapers under `src/scrapers/`
 * (Previred PDF + SII circular + mindicador fallback).
 */
export interface IndicadoresScraper {
  fetch(year: number, month: number): Promise<Indicadores | null>;
}

/**
 * PR1a stub: no real sources yet. Always reports "no data" so a cache miss
 * yields the documented `404` rather than pretending to have indicators.
 */
export const stubScraper: IndicadoresScraper = {
  async fetch(): Promise<Indicadores | null> {
    return null;
  },
};
