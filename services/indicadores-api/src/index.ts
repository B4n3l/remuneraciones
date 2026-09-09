import { serve } from "@hono/node-server";
import { createApp } from "./app.js";
import { createAlertSink } from "./alert.js";
import { createCache } from "./cache.js";
import { loadConfig } from "./config.js";
import { scheduleMonthlyRefresh } from "./cron.js";
import { createIndicadoresScraper } from "./scrapers/index.js";

const config = loadConfig();
const cache = createCache();
const scraper = createIndicadoresScraper(config);

const app = createApp({ config, scraper, cache });

// In-process monthly scheduler shares the same scraper + cache as the routes so
// a cron refresh is immediately visible to GET /indicadores.
const task = scheduleMonthlyRefresh({
  scraper,
  cache,
  alert: createAlertSink(config),
});

serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.log(`indicadores-api listening on http://localhost:${info.port}`);
  console.log(
    task
      ? `[cron] monthly refresh scheduled (${task.getPattern()})`
      : "[cron] monthly refresh NOT scheduled (check CRON config)",
  );
});
