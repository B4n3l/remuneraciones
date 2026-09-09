import { Hono } from "hono";
import { z } from "zod";
import { apiKeyAuth } from "../auth.js";
import { monthKey } from "../cache.js";
/**
 * `year` must be a 4-digit number and `month` 1-12. Non-numeric or missing
 * values fail this schema (→ 400).
 */
const querySchema = z.object({
    year: z
        .string()
        .regex(/^\d{4}$/, "year must be a 4-digit number")
        .transform(Number)
        .pipe(z.number().int().min(2000).max(2100)),
    month: z
        .string()
        .regex(/^(0?[1-9]|1[0-2])$/, "month must be 1-12")
        .transform(Number)
        .pipe(z.number().int().min(1).max(12)),
});
export function indicadoresRoutes(config, cache, scraper) {
    const routes = new Hono();
    // Auth first: a missing/invalid key 401s before any scrape or cache read.
    routes.use("*", apiKeyAuth(config.apiKey));
    routes.get("/", async (c) => {
        const parsed = querySchema.safeParse({
            year: c.req.query("year"),
            month: c.req.query("month"),
        });
        if (!parsed.success) {
            return c.json({ error: "Invalid query: year=yyyy and month=mm are required." }, 400);
        }
        const { year, month } = parsed.data;
        const key = monthKey(year, month);
        const cached = cache.get(key);
        if (cached) {
            return c.json(cached.data, 200);
        }
        try {
            const data = await scraper.fetch(year, month);
            if (!data) {
                return c.json({ error: "Indicadores not available for this month." }, 404);
            }
            cache.set(key, { data, fetchedAt: new Date() });
            return c.json(data, 200);
        }
        catch (err) {
            console.error(`[indicadores] scrape failed for ${key}:`, err);
            return c.json({ error: "Failed to fetch indicators." }, 500);
        }
    });
    return routes;
}
//# sourceMappingURL=indicadores.js.map