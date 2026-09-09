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
export class SourceNotFoundError extends Error {
  constructor(public readonly source: string) {
    super(`${source}: source returned no data for the requested period`);
    this.name = "SourceNotFoundError";
  }
}

/** Substitute `{year}` and `{month}` placeholders in a source URL template. */
export function applyTemplate(
  url: string,
  year: number,
  month: number,
): string {
  return url
    .replaceAll("{year}", String(year))
    .replaceAll("{month}", String(month).padStart(2, "0"));
}

/** Fetch a text/HTML/JSON URL via global fetch. `null` on 404. */
export async function fetchText(url: string): Promise<string | null> {
  if (!url) {
    throw new Error("source URL is not configured");
  }
  const res = await fetch(url);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return await res.text();
}

/** Format any thrown value as a stable string for alerts/logs. */
export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
