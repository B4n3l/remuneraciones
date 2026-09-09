/**
 * Shared HTTP helpers for the scraper sources.
 *
 * Every source is built around an injectable `TextFetcher` seam so tests can
 * supply fixtures without touching the network. The production fetchers use the
 * global `fetch` (Node 18+); the Previred PDF fetcher additionally extracts text
 * from the PDF bytes.
 */
/** Fetch a URL and return its text, or `null` when the source reports 404. */
export type TextFetcher = (url: string) => Promise<string | null>;
/**
 * Raised when a source explicitly has no data for the requested period (HTTP
 * 404). The scraper maps this to a `404` (no data yet) rather than a scrape
 * failure.
 */
export declare class SourceNotFoundError extends Error {
    readonly source: string;
    constructor(source: string);
}
/** Substitute `{year}` and `{month}` placeholders in a source URL template. */
export declare function applyTemplate(url: string, year: number, month: number): string;
/** Fetch a text/HTML/JSON URL via global fetch. `null` on 404. */
export declare function fetchText(url: string): Promise<string | null>;
/** Format any thrown value as a stable string for alerts/logs. */
export declare function errorMessage(err: unknown): string;
