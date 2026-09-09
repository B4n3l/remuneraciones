import { parseSiiCircular, type ImpuestoTramo } from "../parsers/sii.js";
import {
  SourceNotFoundError,
  applyTemplate,
  fetchText,
  type TextFetcher,
} from "./http.js";

export interface SiiSource {
  fetch(valorUTM: number, year: number, month: number): Promise<ImpuestoTramo[]>;
}

/**
 * SII monthly circular source. Fetches the circular for a year/month and parses
 * the income-tax brackets, converting UTM → whole pesos with `valorUTM`.
 * Throws `SourceNotFoundError` when the circular is not published yet and
 * `ParseError` when no bracket can be extracted.
 */
export function createSiiSource(
  url: string,
  fetcher: TextFetcher = fetchText,
): SiiSource {
  return {
    async fetch(valorUTM, year, month) {
      const resolvedUrl = applyTemplate(url, year, month);
      const text = await fetcher(resolvedUrl);
      if (text === null) {
        throw new SourceNotFoundError("sii");
      }
      return parseSiiCircular(text, valorUTM);
    },
  };
}
