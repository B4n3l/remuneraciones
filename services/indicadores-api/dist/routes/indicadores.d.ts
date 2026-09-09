import { Hono } from "hono";
import type { Config } from "../config.js";
import type { IndicadoresCache } from "../cache.js";
import type { IndicadoresScraper } from "../scraper.js";
export declare function indicadoresRoutes(config: Config, cache: IndicadoresCache, scraper: IndicadoresScraper): Hono;
