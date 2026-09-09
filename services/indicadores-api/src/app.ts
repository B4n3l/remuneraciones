import { Hono } from "hono";
import type { Config } from "./config.js";
import { createCache, type IndicadoresCache } from "./cache.js";
import type { IndicadoresScraper } from "./scraper.js";
import { createIndicadoresScraper } from "./scrapers/index.js";
import { healthRoutes } from "./routes/health.js";
import { indicadoresRoutes } from "./routes/indicadores.js";
import { cronRoutes } from "./routes/cron.js";

export interface AppOptions {
  config: Config;
  scraper?: IndicadoresScraper;
  cache?: IndicadoresCache;
}

/**
 * Builds the Hono app. The scraper and cache are injectable so tests can supply
 * fakes; both default to the real pipeline (Previred + SII + mindicador fallback)
 * and a fresh in-memory cache.
 */
export function createApp(options: AppOptions): Hono {
  const config = options.config;
  const scraper = options.scraper ?? createIndicadoresScraper(config);
  const cache = options.cache ?? createCache();

  const app = new Hono();

  app.route("/health", healthRoutes());
  app.route("/indicadores", indicadoresRoutes(config, cache, scraper));
  app.route("/cron", cronRoutes(config, cache, scraper));

  return app;
}
