import { type ScheduledTask } from "node-cron";
import type { AlertSink } from "./alert.js";
import type { IndicadoresCache } from "./cache.js";
import type { IndicadoresScraper } from "./scraper.js";
/**
 * Default schedule: at 06:00 on days 1–3 of each month, America/Santiago.
 * The window (days 1–3) tolerates a late source publication without running the
 * scrape for the whole month.
 */
export declare const DEFAULT_CRON_EXPRESSION = "0 6 1-3 * *";
export declare const DEFAULT_TIMEZONE = "America/Santiago";
export interface ScheduleOptions {
    scraper: IndicadoresScraper;
    cache: IndicadoresCache;
    alert: AlertSink;
    cronExpression?: string;
    timezone?: string;
}
/**
 * Fetches the current month's indicators and caches them. Returns `true` when a
 * payload was cached. A scrape/parse failure is alerted and returns `false`
 * (the service keeps serving cached months and 404s the rest).
 */
export declare function refreshMonth(scraper: IndicadoresScraper, cache: IndicadoresCache, alert: AlertSink, year: number, month: number): Promise<boolean>;
/**
 * Registers the in-process monthly cron job. Returns the `ScheduledTask` for
 * lifecycle control, or `null` when scheduling fails (invalid expression/timezone)
 * — a cron misconfiguration must not prevent the HTTP server from booting.
 */
export declare function scheduleMonthlyRefresh(options: ScheduleOptions): ScheduledTask | null;
