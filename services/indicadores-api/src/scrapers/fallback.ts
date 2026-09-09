import { parseMindicador } from "../parsers/fallback.js";
import type { PreviredFallback } from "../parsers/previred-v1.js";
import {
  SourceNotFoundError,
  fetchText,
  type TextFetcher,
} from "./http.js";

export interface FallbackSource {
  fetch(): Promise<PreviredFallback>;
}

/**
 * mindicador.cl fallback source. Supplies only UF/UTM/UTA — used when the
 * Previred PDF's top section drifts but the rest is still extractable. Throws
 * `SourceNotFoundError` when mindicador has no data and `ParseError` when the
 * response is missing a required value.
 */
export function createFallbackSource(
  url: string,
  fetcher: TextFetcher = fetchText,
): FallbackSource {
  return {
    async fetch() {
      const text = await fetcher(url);
      if (text === null) {
        throw new SourceNotFoundError("mindicador");
      }
      return parseMindicador(text);
    },
  };
}
