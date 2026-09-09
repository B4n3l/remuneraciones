import { extractText } from "unpdf";
import { parsePreviredV1, } from "../parsers/previred-v1.js";
import { SourceNotFoundError, applyTemplate, } from "./http.js";
/** Fetch a Previred PDF and return its extracted text, or `null` on 404. */
export async function fetchPdfText(url) {
    if (!url) {
        throw new Error("Previred source URL is not configured");
    }
    const res = await fetch(url);
    if (res.status === 404)
        return null;
    if (!res.ok)
        throw new Error(`HTTP ${res.status} for ${url}`);
    const buffer = await res.arrayBuffer();
    const { text } = await extractText(buffer, { mergePages: true });
    return text;
}
/**
 * Previred PDF source. Fetches the PDF for a year/month and parses it with
 * `parsePreviredV1`. Throws `SourceNotFoundError` when the PDF is not published
 * yet and `ParseError` on drift/incompleteness.
 */
export function createPreviredSource(url, fetcher = fetchPdfText) {
    return {
        async fetch(year, month, fallback) {
            const resolvedUrl = applyTemplate(url, year, month);
            const text = await fetcher(resolvedUrl);
            if (text === null) {
                throw new SourceNotFoundError("previred");
            }
            return parsePreviredV1(text, { year, month, fallback });
        },
    };
}
//# sourceMappingURL=previred.js.map