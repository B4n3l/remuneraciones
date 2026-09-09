import { parseSiiCircular } from "../parsers/sii.js";
import { SourceNotFoundError, applyTemplate, fetchText, } from "./http.js";
/**
 * SII monthly circular source. Fetches the circular for a year/month and parses
 * the income-tax brackets, converting UTM → whole pesos with `valorUTM`.
 * Throws `SourceNotFoundError` when the circular is not published yet and
 * `ParseError` when no bracket can be extracted.
 */
export function createSiiSource(url, fetcher = fetchText) {
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
//# sourceMappingURL=sii.js.map