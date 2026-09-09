import { parseMindicador } from "../parsers/fallback.js";
import { SourceNotFoundError, fetchText, } from "./http.js";
/**
 * mindicador.cl fallback source. Supplies only UF/UTM/UTA — used when the
 * Previred PDF's top section drifts but the rest is still extractable. Throws
 * `SourceNotFoundError` when mindicador has no data and `ParseError` when the
 * response is missing a required value.
 */
export function createFallbackSource(url, fetcher = fetchText) {
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
//# sourceMappingURL=fallback.js.map