import { type PreviredData, type PreviredFallback } from "../parsers/previred-v1.js";
import { type TextFetcher } from "./http.js";
export interface PreviredSource {
    fetch(year: number, month: number, fallback?: PreviredFallback): Promise<PreviredData>;
}
/** Fetch a Previred PDF and return its extracted text, or `null` on 404. */
export declare function fetchPdfText(url: string): Promise<string | null>;
/**
 * Previred PDF source. Fetches the PDF for a year/month and parses it with
 * `parsePreviredV1`. Throws `SourceNotFoundError` when the PDF is not published
 * yet and `ParseError` on drift/incompleteness.
 */
export declare function createPreviredSource(url: string, fetcher?: TextFetcher): PreviredSource;
