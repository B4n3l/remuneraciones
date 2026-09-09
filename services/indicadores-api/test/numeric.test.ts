import { describe, expect, it } from "vitest";
import { parseEsClNumber, parsePercent, roundPesos } from "../src/parsers/numeric.js";

describe("parseEsClNumber (es-CL tolerant)", () => {
  it("parses thousands + decimal (1.234,56 → 1234.56)", () => {
    expect(parseEsClNumber("1.234,56")).toBe(1234.56);
  });

  it("parses UF value 38.129,63", () => {
    expect(parseEsClNumber("38.129,63")).toBe(38129.63);
  });

  it("parses a millions value (3.400.000 → 3400000)", () => {
    expect(parseEsClNumber("3.400.000")).toBe(3400000);
  });

  it("parses comma-decimal only (0,9 → 0.9)", () => {
    expect(parseEsClNumber("0,9")).toBe(0.9);
  });

  it("parses comma-decimal with two digits (135,1 → 135.1)", () => {
    expect(parseEsClNumber("135,1")).toBe(135.1);
  });

  it("parses a plain integer (500000)", () => {
    expect(parseEsClNumber("500000")).toBe(500000);
  });

  it("parses thousands with no decimal (68.034 → 68034)", () => {
    expect(parseEsClNumber("68.034")).toBe(68034);
  });

  it("extracts the first number from surrounding text", () => {
    expect(parseEsClNumber("Valor UF: 38.129,63")).toBe(38129.63);
  });

  it("ignores non-breaking spaces", () => {
    expect(parseEsClNumber("38.129,63\u00a0")).toBe(38129.63);
  });

  it("returns null for non-numeric input", () => {
    expect(parseEsClNumber("Exento")).toBeNull();
    expect(parseEsClNumber("—")).toBeNull();
    expect(parseEsClNumber("")).toBeNull();
  });
});

describe("parsePercent (SII factor → decimal fraction)", () => {
  it("maps Exento to 0", () => {
    expect(parsePercent("Exento")).toBe(0);
  });

  it("maps a whole percent to a fraction (4 → 0.04)", () => {
    expect(parsePercent("4,00")).toBe(0.04);
  });

  it("maps a decimal percent (30,40 → 0.304)", () => {
    expect(parsePercent("30,40")).toBeCloseTo(0.304);
  });

  it("maps 13,50 → 0.135", () => {
    expect(parsePercent("13,50")).toBeCloseTo(0.135);
  });

  it("keeps an already-fractional value (0,04 → 0.04)", () => {
    expect(parsePercent("0,04")).toBeCloseTo(0.04);
  });

  it("returns null for non-numeric factor", () => {
    expect(parsePercent("xyz")).toBeNull();
  });
});

describe("roundPesos", () => {
  it("rounds to whole pesos", () => {
    expect(roundPesos(13.5 * 68034)).toBe(918459);
    expect(roundPesos(0.54 * 68034)).toBe(36738);
  });
});
