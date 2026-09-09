import { Hono } from "hono";
import { z } from "zod";
import type { Config } from "../config.js";
import { apiKeyAuth } from "../auth.js";
import type { IndicadoresCache } from "../cache.js";
import { monthKey } from "../cache.js";
import type { IndicadoresScraper } from "../scraper.js";

const refreshBodySchema = z.object({
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
});

/**
 * Authed `POST /cron/refresh` for ops/external schedulers (the in-process
 * node-cron scheduler lands in PR1b). Defaults to the current month; an
 * optional `{ year, month }` body supports backfills.
 */
export function cronRoutes(
  config: Config,
  cache: IndicadoresCache,
  scraper: IndicadoresScraper,
): Hono {
  const routes = new Hono();

  routes.use("*", apiKeyAuth(config.apiKey));

  routes.post("/refresh", async (c) => {
    const now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth() + 1;

    const rawBody: unknown = await c.req.json().catch(() => undefined);
    if (rawBody) {
      const parsed = refreshBodySchema.safeParse(rawBody);
      if (!parsed.success) {
        return c.json(
          { error: "Invalid body: expected { year, month }." },
          400,
        );
      }
      year = parsed.data.year;
      month = parsed.data.month;
    }

    const key = monthKey(year, month);

    try {
      const data = await scraper.fetch(year, month);
      if (!data) {
        return c.json(
          { error: "Indicadores not available for this month." },
          404,
        );
      }
      cache.set(key, { data, fetchedAt: new Date() });
      return c.json({ ok: true, month: key }, 200);
    } catch (err) {
      console.error(`[cron] refresh failed for ${key}:`, err);
      return c.json({ error: "Refresh failed." }, 500);
    }
  });

  return routes;
}
