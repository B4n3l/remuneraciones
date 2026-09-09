import { Hono } from "hono";
import type { Config } from "./config.js";
import { createCache } from "./cache.js";
import type { IndicadoresScraper } from "./scraper.js";
import { stubScraper } from "./scraper.js";
import { healthRoutes } from "./routes/health.js";
import { indicadoresRoutes } from "./routes/indicadores.js";
import { cronRoutes } from "./routes/cron.js";

export interface AppOptions {
  config: Config;
  scraper?: IndicadoresScraper;
}

/**
 * Builds the Hono app. The scraper is injectable so tests can supply a fake
 * without touching real sources; it defaults to the PR1a stub.
 */
export function createApp(options: AppOptions): Hono {
  const config = options.config;
  const scraper = options.scraper ?? stubScraper;
  const cache = createCache();

  const app = new Hono();

  app.route("/health", healthRoutes());
  app.route("/indicadores", indicadoresRoutes(config, cache, scraper));
  app.route("/cron", cronRoutes(config, cache, scraper));

  return app;
}
