import type { PreviredFallback } from "../parsers/previred-v1.js";
import { type TextFetcher } from "./http.js";
export interface FallbackSource {
    fetch(): Promise<PreviredFallback>;
}
/**
 * mindicador.cl fallback source. Supplies only UF/UTM/UTA — used when the
 * Previred PDF's top section drifts but the rest is still extractable. Throws
 * `SourceNotFoundError` when mindicador has no data and `ParseError` when the
 * response is missing a required value.
 */
export declare function createFallbackSource(url: string, fetcher?: TextFetcher): FallbackSource;
