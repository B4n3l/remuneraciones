import { Hono } from "hono";
import type { Config } from "./config.js";
import { type IndicadoresCache } from "./cache.js";
import type { IndicadoresScraper } from "./scraper.js";
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
export declare function createApp(options: AppOptions): Hono;
