import { LEY_21735_RATES, indicadoresSchema, type Indicadores } from "../contract.js";
import { ParseError, type PreviredData } from "../parsers/previred-v1.js";
import type { Config } from "../config.js";
import { createAlertSink, type AlertSink } from "../alert.js";
import type { IndicadoresScraper } from "../scraper.js";
import { createPreviredSource, type PreviredSource } from "./previred.js";
import { createSiiSource, type SiiSource } from "./sii.js";
import { createFallbackSource, type FallbackSource } from "./fallback.js";
import { SourceNotFoundError, errorMessage } from "./http.js";

/** Fields mindicador.cl can supply as a fallback (UF/UTM/UTA only). */
const FALLBACK_FIELDS = ["valorUF", "valorUTM", "valorUTA"] as const;

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
export function createIndicadoresScraper(
  config: Config,
  deps: ScraperDeps = {},
): IndicadoresScraper {
  const previred = deps.previred ?? createPreviredSource(config.previredUrl);
  const sii = deps.sii ?? createSiiSource(config.siiUrl);
  const fallback = deps.fallback ?? createFallbackSource(config.mindicadorUrl);
  const alert = deps.alert ?? createAlertSink(config);

  const fetchPrevired = async (
    year: number,
    month: number,
  ): Promise<PreviredData> => {
    try {
      return await previred.fetch(year, month);
    } catch (err) {
      if (err instanceof SourceNotFoundError) throw err; // no data → 404

      if (err instanceof ParseError) {
        const allFallbackCovered =
          err.missingFields.length > 0 &&
          err.missingFields.every((f) =>
            (FALLBACK_FIELDS as readonly string[]).includes(f),
          );
        if (allFallbackCovered) {
          try {
            const fb = await fallback.fetch();
            return await previred.fetch(year, month, fb);
          } catch (fbErr) {
            await alert.emit({
              year,
              month,
              source: "previred",
              error: errorMessage(fbErr),
            });
            throw fbErr;
          }
        }
        await alert.emit({ year, month, source: "previred", error: err.message });
        throw err;
      }

      await alert.emit({ year, month, source: "previred", error: errorMessage(err) });
      throw err;
    }
  };

  const fetchTramos = async (
    valorUTM: number,
    year: number,
    month: number,
  ): Promise<Indicadores["impuestoTramos"]> => {
    try {
      return await sii.fetch(valorUTM, year, month);
    } catch (err) {
      // SII has no fallback: any failure (not-found, drift) means incomplete.
      await alert.emit({ year, month, source: "sii", error: errorMessage(err) });
      throw err instanceof ParseError
        ? err
        : new ParseError(["impuestoTramos"], "sii");
    }
  };

  return {
    async fetch(year, month): Promise<Indicadores | null> {
      try {
        const previredData = await fetchPrevired(year, month);
        const impuestoTramos = await fetchTramos(
          previredData.valorUTM,
          year,
          month,
        );

        return indicadoresSchema.parse({
          year,
          month,
          ...previredData,
          sisRate: LEY_21735_RATES.sisRate,
          rentabilidadProtegidaRate: LEY_21735_RATES.rentabilidadProtegidaRate,
          expectativaVidaRate: LEY_21735_RATES.expectativaVidaRate,
          impuestoTramos,
        });
      } catch (err) {
        if (err instanceof SourceNotFoundError) return null;
        throw err;
      }
    },
  };
}
