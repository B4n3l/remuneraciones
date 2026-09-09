import { Hono } from "hono";
import type { Config } from "../config.js";
import type { IndicadoresCache } from "../cache.js";
import type { IndicadoresScraper } from "../scraper.js";
/**
 * Authed `POST /cron/refresh` for ops/external schedulers (the in-process
 * node-cron scheduler lands in PR1b). Defaults to the current month; an
 * optional `{ year, month }` body supports backfills.
 */
export declare function cronRoutes(config: Config, cache: IndicadoresCache, scraper: IndicadoresScraper): Hono;
