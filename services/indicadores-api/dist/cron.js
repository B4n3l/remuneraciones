import cron from "node-cron";
import { monthKey } from "./cache.js";
import { errorMessage } from "./scrapers/http.js";
/**
 * Default schedule: at 06:00 on days 1–3 of each month, America/Santiago.
 * The window (days 1–3) tolerates a late source publication without running the
 * scrape for the whole month.
 */
export const DEFAULT_CRON_EXPRESSION = "0 6 1-3 * *";
export const DEFAULT_TIMEZONE = "America/Santiago";
/**
 * Fetches the current month's indicators and caches them. Returns `true` when a
 * payload was cached. A scrape/parse failure is alerted and returns `false`
 * (the service keeps serving cached months and 404s the rest).
 */
export async function refreshMonth(scraper, cache, alert, year, month) {
    try {
        const data = await scraper.fetch(year, month);
        if (data) {
            cache.set(monthKey(year, month), { data, fetchedAt: new Date() });
            return true;
        }
        return false;
    }
    catch (err) {
        await alert.emit({ year, month, source: "cron", error: errorMessage(err) });
        return false;
    }
}
/**
 * Registers the in-process monthly cron job. Returns the `ScheduledTask` for
 * lifecycle control, or `null` when scheduling fails (invalid expression/timezone)
 * — a cron misconfiguration must not prevent the HTTP server from booting.
 */
export function scheduleMonthlyRefresh(options) {
    const expression = options.cronExpression ?? DEFAULT_CRON_EXPRESSION;
    const timezone = options.timezone ?? DEFAULT_TIMEZONE;
    try {
        return cron.schedule(expression, async () => {
            const now = new Date();
            await refreshMonth(options.scraper, options.cache, options.alert, now.getFullYear(), now.getMonth() + 1);
        }, { timezone });
    }
    catch (err) {
        console.error("[cron] failed to schedule monthly refresh:", err);
        return null;
    }
}
//# sourceMappingURL=cron.js.map