import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createAlertSink, type AlertPayload } from "../src/alert.js";
import { createCache, type IndicadoresCache } from "../src/cache.js";
import type { Config } from "../src/config.js";
import {
  DEFAULT_CRON_EXPRESSION,
  refreshMonth,
  scheduleMonthlyRefresh,
} from "../src/cron.js";
import type { IndicadoresScraper } from "../src/scraper.js";
import { makeSampleIndicadores } from "./fixtures.js";
import type { ScheduledTask } from "node-cron";

const config: Config = {
  apiKey: "test-secret",
  previredUrl: "",
  siiUrl: "",
  mindicadorUrl: "",
  alertTarget: "",
  port: 3000,
};

const emissions: AlertPayload[] = [];
const alert = { emit: async (p: AlertPayload) => void emissions.push(p) };
let cache: IndicadoresCache;

beforeEach(() => {
  emissions.length = 0;
  cache = createCache();
});

describe("refreshMonth", () => {
  it("caches a successful scrape and returns true", async () => {
    const scraper: IndicadoresScraper = {
      fetch: vi.fn(async () => makeSampleIndicadores()),
    };
    const ok = await refreshMonth(scraper, cache, alert, 2026, 3);
    expect(ok).toBe(true);
    expect(cache.get("2026-03")).toBeDefined();
    expect(emissions).toHaveLength(0);
  });

  it("alerts and returns false when the scrape throws", async () => {
    const scraper: IndicadoresScraper = {
      fetch: vi.fn(async () => {
        throw new Error("boom");
      }),
    };
    const ok = await refreshMonth(scraper, cache, alert, 2026, 3);
    expect(ok).toBe(false);
    expect(cache.get("2026-03")).toBeUndefined();
    expect(emissions).toHaveLength(1);
    expect(emissions[0]!.source).toBe("cron");
  });

  it("returns false without alerting when no data is published", async () => {
    const scraper: IndicadoresScraper = {
      fetch: vi.fn(async () => null),
    };
    const ok = await refreshMonth(scraper, cache, alert, 2026, 3);
    expect(ok).toBe(false);
    expect(cache.get("2026-03")).toBeUndefined();
    expect(emissions).toHaveLength(0);
  });
});

describe("scheduleMonthlyRefresh", () => {
  const tasks: ScheduledTask[] = [];

  afterEach(() => {
    for (const task of tasks) task.destroy();
    tasks.length = 0;
  });

  it("registers the default monthly schedule", () => {
    const scraper: IndicadoresScraper = {
      fetch: async () => makeSampleIndicadores(),
    };
    const task = scheduleMonthlyRefresh({ scraper, cache, alert });
    expect(task).not.toBeNull();
    expect(task!.getPattern()).toBe(DEFAULT_CRON_EXPRESSION);
    tasks.push(task!);
  });

  it("returns null for an invalid cron expression (does not crash)", () => {
    const scraper: IndicadoresScraper = {
      fetch: async () => makeSampleIndicadores(),
    };
    const task = scheduleMonthlyRefresh({
      scraper,
      cache,
      alert,
      cronExpression: "not-a-cron",
    });
    expect(task).toBeNull();
  });
});

describe("createAlertSink", () => {
  it("emits a webhook POST when a target is configured", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const sink = createAlertSink({ ...config, alertTarget: "https://alerts" });
    await sink.emit({ year: 2026, month: 3, source: "sii", error: "drift" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });

  it("does nothing over the network when no target is set", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const sink = createAlertSink(config);
    await sink.emit({ year: 2026, month: 3, source: "sii", error: "drift" });
    expect(fetchMock).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
