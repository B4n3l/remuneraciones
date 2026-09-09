import { describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app.js";
import type { Config } from "../src/config.js";
import type { Indicadores } from "../src/contract.js";
import type { IndicadoresScraper } from "../src/scraper.js";
import { makeSampleIndicadores } from "./fixtures.js";

const config: Config = {
  apiKey: "test-secret",
  previredUrl: "",
  siiUrl: "",
  mindicadorUrl: "",
  alertTarget: "",
  port: 3000,
};

const AUTH = { "X-API-Key": "test-secret" };

function makeApp(scraper?: IndicadoresScraper) {
  return createApp({ config, scraper });
}

type ErrorBody = { error: string };

describe("GET /health", () => {
  it("returns 200 without auth", async () => {
    const res = await makeApp().request("/health");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok" });
  });
});

describe("GET /indicadores auth", () => {
  it("returns 401 with no API key", async () => {
    const res = await makeApp().request("/indicadores?year=2026&month=3");
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
  });

  it("returns 401 with an invalid API key", async () => {
    const res = await makeApp().request("/indicadores?year=2026&month=3", {
      headers: { "X-API-Key": "wrong-key" },
    });
    expect(res.status).toBe(401);
  });
});

describe("GET /indicadores validation", () => {
  it("returns 400 when year/month are missing", async () => {
    const res = await makeApp().request("/indicadores", { headers: AUTH });
    expect(res.status).toBe(400);
    const body = (await res.json()) as ErrorBody;
    expect(typeof body.error).toBe("string");
  });

  it("returns 400 when month is non-numeric", async () => {
    const res = await makeApp().request("/indicadores?year=2026&month=abc", {
      headers: AUTH,
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 when month is out of range", async () => {
    const res = await makeApp().request("/indicadores?year=2026&month=13", {
      headers: AUTH,
    });
    expect(res.status).toBe(400);
  });
});

describe("GET /indicadores cache & fetch", () => {
  it("returns 404 when no data is available for the month", async () => {
    const res = await makeApp().request("/indicadores?year=2026&month=3", {
      headers: AUTH,
    });
    expect(res.status).toBe(404);
    const body = (await res.json()) as ErrorBody;
    expect(typeof body.error).toBe("string");
  });

  it("returns 200 and serves the cache without re-scraping", async () => {
    const fetch = vi.fn(async () => makeSampleIndicadores());
    const app = makeApp({ fetch });

    const first = await app.request("/indicadores?year=2026&month=3", {
      headers: AUTH,
    });
    expect(first.status).toBe(200);
    const firstBody = (await first.json()) as Indicadores;
    expect(firstBody.year).toBe(2026);
    expect(firstBody.month).toBe(3);
    expect(firstBody.rentabilidadProtegidaRate).toBe(0.9);
    expect(firstBody.expectativaVidaRate).toBe(0.5);
    expect(firstBody.sisRate).toBe(2.0);
    expect(firstBody.impuestoTramos).toHaveLength(2);
    expect(firstBody.impuestoTramos[1]?.hasta).toBeNull();

    const second = await app.request("/indicadores?year=2026&month=3", {
      headers: AUTH,
    });
    expect(second.status).toBe(200);

    // Cache hit: the scraper must be called exactly once across two requests.
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("returns 500 when the scraper throws", async () => {
    const scraper: IndicadoresScraper = {
      fetch: vi.fn(async () => {
        throw new Error("boom");
      }),
    };
    const res = await makeApp(scraper).request(
      "/indicadores?year=2026&month=3",
      { headers: AUTH },
    );
    expect(res.status).toBe(500);
    const body = (await res.json()) as ErrorBody;
    expect(typeof body.error).toBe("string");
  });
});
