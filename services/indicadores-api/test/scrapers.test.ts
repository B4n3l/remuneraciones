import { beforeEach, describe, expect, it } from "vitest";
import type { AlertPayload, AlertSink } from "../src/alert.js";
import type { Config } from "../src/config.js";
import { parseMindicador } from "../src/parsers/fallback.js";
import {
  ParseError,
  parsePreviredV1,
  type PreviredData,
} from "../src/parsers/previred-v1.js";
import { parseSiiCircular } from "../src/parsers/sii.js";
import { createIndicadoresScraper } from "../src/scrapers/index.js";
import { SourceNotFoundError } from "../src/scrapers/http.js";
import type { PreviredSource } from "../src/scrapers/previred.js";
import type { SiiSource } from "../src/scrapers/sii.js";
import type { FallbackSource } from "../src/scrapers/fallback.js";
import { MINDICADOR_JSON, PREVIRED_TEXT, SII_TEXT } from "./fixtures-text.js";

const VALOR_UTM = 68034;

const config: Config = {
  apiKey: "test-secret",
  previredUrl: "https://previred.example/{year}/{month}.pdf",
  siiUrl: "https://sii.example/impuesto_{year}.htm",
  mindicadorUrl: "https://mindicador.cl/api",
  alertTarget: "",
  port: 3000,
};

function samplePreviredData(): PreviredData {
  return parsePreviredV1(PREVIRED_TEXT, { year: 2026, month: 3 });
}

const emissions: AlertPayload[] = [];
const alert: AlertSink = { emit: async (p) => void emissions.push(p) };

const previredOk: PreviredSource = {
  fetch: async () => samplePreviredData(),
};
const siiOk: SiiSource = {
  fetch: async () => parseSiiCircular(SII_TEXT, VALOR_UTM),
};
const fallbackOk: FallbackSource = {
  fetch: async () => parseMindicador(MINDICADOR_JSON),
};

beforeEach(() => {
  emissions.length = 0;
});

describe("createIndicadoresScraper", () => {
  it("composes a full valid payload (Previred + SII + legal constants)", async () => {
    const scraper = createIndicadoresScraper(config, {
      previred: previredOk,
      sii: siiOk,
      fallback: fallbackOk,
      alert,
    });

    const result = await scraper.fetch(2026, 3);
    expect(result).not.toBeNull();
    expect(result!.valorUF).toBe(38129.63);
    expect(result!.sisRate).toBe(2.0);
    expect(result!.rentabilidadProtegidaRate).toBe(0.9);
    expect(result!.expectativaVidaRate).toBe(0.5);
    expect(result!.impuestoTramos).toHaveLength(8);
    expect(result!.impuestoTramos[7]!.hasta).toBeNull();
    expect(emissions).toHaveLength(0);
  });

  it("returns null (404) when Previred has no data published yet", async () => {
    const previred: PreviredSource = {
      fetch: async () => {
        throw new SourceNotFoundError("previred");
      },
    };
    const scraper = createIndicadoresScraper(config, {
      previred,
      sii: siiOk,
      fallback: fallbackOk,
      alert,
    });

    await expect(scraper.fetch(2026, 3)).resolves.toBeNull();
    expect(emissions).toHaveLength(0);
  });

  it("alerts and throws when SII tramos are unavailable (no partial serve)", async () => {
    const sii: SiiSource = {
      fetch: async () => {
        throw new ParseError(["impuestoTramos"], "sii");
      },
    };
    const scraper = createIndicadoresScraper(config, {
      previred: previredOk,
      sii,
      fallback: fallbackOk,
      alert,
    });

    await expect(scraper.fetch(2026, 3)).rejects.toThrow(ParseError);
    expect(emissions).toHaveLength(1);
    expect(emissions[0]!.source).toBe("sii");
  });

  it("fills UF/UTM/UTA from mindicador when the top section drifts", async () => {
    const previred: PreviredSource = {
      fetch: async (_year, _month, fallback) => {
        if (!fallback) {
          throw new ParseError(
            ["valorUF", "valorUTM", "valorUTA"],
            "previred",
          );
        }
        return samplePreviredData();
      },
    };
    const scraper = createIndicadoresScraper(config, {
      previred,
      sii: siiOk,
      fallback: fallbackOk,
      alert,
    });

    const result = await scraper.fetch(2026, 3);
    expect(result).not.toBeNull();
    expect(result!.valorUF).toBe(38129.63);
    expect(emissions).toHaveLength(0);
  });

  it("alerts and throws when missing fields are not fallback-covered", async () => {
    const previred: PreviredSource = {
      fetch: async () => {
        throw new ParseError(["sueldoMinimo"], "previred");
      },
    };
    const scraper = createIndicadoresScraper(config, {
      previred,
      sii: siiOk,
      fallback: fallbackOk,
      alert,
    });

    await expect(scraper.fetch(2026, 3)).rejects.toThrow(ParseError);
    expect(emissions.some((e) => e.source === "previred")).toBe(true);
  });

  it("alerts and throws when the fallback itself fails", async () => {
    const previred: PreviredSource = {
      fetch: async () => {
        throw new ParseError(
          ["valorUF", "valorUTM", "valorUTA"],
          "previred",
        );
      },
    };
    const fallback: FallbackSource = {
      fetch: async () => {
        throw new Error("mindicador down");
      },
    };
    const scraper = createIndicadoresScraper(config, {
      previred,
      sii: siiOk,
      fallback,
      alert,
    });

    await expect(scraper.fetch(2026, 3)).rejects.toThrow("mindicador down");
    expect(emissions.some((e) => e.source === "previred")).toBe(true);
  });
});
