import { describe, expect, it } from "vitest";
import {
  ParseError,
  parsePreviredV1,
  type PreviredData,
} from "../src/parsers/previred-v1.js";
import { parseSiiCircular } from "../src/parsers/sii.js";
import { MINDICADOR_JSON, PREVIRED_TEXT, SII_TEXT } from "./fixtures-text.js";
import { parseMindicador } from "../src/parsers/fallback.js";

const VALOR_UTM = 68034;

const expectedPrevired: PreviredData = {
  valorUF: 38129.63,
  valorUTM: 68034,
  valorUTA: 816408,
  sueldoMinimo: 500000,
  sueldoMinimoCasaPart: 410000,
  sueldoMinimoMenores: 372000,
  sueldoMinimoNoRem: 322295,
  topeImponibleAFP: 89.9,
  topeImponibleINP: 84.3,
  topeSeguroCesantia: 135.1,
  apvTopeMensualUF: 50,
  apvTopeAnualUF: 600,
  afpRates: [
    { afpNombre: "Capital", cargoTrabajador: 11.44, cargoEmpleador: 1.44, totalAPagar: 12.88, independiente: 12.88 },
    { afpNombre: "Cuprum", cargoTrabajador: 10.0, cargoEmpleador: 1.44, totalAPagar: 11.44, independiente: 11.44 },
    { afpNombre: "Habitat", cargoTrabajador: 11.44, cargoEmpleador: 1.44, totalAPagar: 12.88, independiente: 12.88 },
    { afpNombre: "Modelo", cargoTrabajador: 11.44, cargoEmpleador: 1.44, totalAPagar: 12.88, independiente: 12.88 },
    { afpNombre: "PlanVital", cargoTrabajador: 11.16, cargoEmpleador: 1.44, totalAPagar: 12.6, independiente: 12.6 },
    { afpNombre: "Provida", cargoTrabajador: 11.45, cargoEmpleador: 1.44, totalAPagar: 12.89, independiente: 12.89 },
    { afpNombre: "Uno", cargoTrabajador: 10.8, cargoEmpleador: 1.44, totalAPagar: 12.24, independiente: 12.24 },
  ],
  cesantiaRates: [
    { tipoContrato: "INDEFINIDO", empleador: 2.4, trabajador: 0.6 },
    { tipoContrato: "PLAZO_FIJO", empleador: 3.0, trabajador: 0.0 },
  ],
  asignacionFamiliar: [
    { tramo: "A", monto: 21365, rentaDesde: 0, rentaHasta: 586678 },
    { tramo: "B", monto: 13109, rentaDesde: 586679, rentaHasta: 854569 },
    { tramo: "C", monto: 4141, rentaDesde: 854570, rentaHasta: 1332040 },
    { tramo: "D", monto: 0, rentaDesde: 1332041, rentaHasta: null },
  ],
};

describe("parsePreviredV1", () => {
  it("extracts the full payload from a well-formed PDF text", () => {
    const result = parsePreviredV1(PREVIRED_TEXT, { year: 2026, month: 3 });
    expect(result).toEqual(expectedPrevired);
  });

  it("lists missing fields on drift (never partial)", () => {
    // Remove the topes section entirely.
    const drift = PREVIRED_TEXT.replace(
      /Tope imponible AFP[\s\S]*?135,1/,
      "",
    );
    let err: unknown;
    try {
      parsePreviredV1(drift, { year: 2026, month: 3 });
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(ParseError);
    const parseErr = err as ParseError;
    expect(parseErr.missingFields).toEqual(
      expect.arrayContaining([
        "topeImponibleAFP",
        "topeImponibleINP",
        "topeSeguroCesantia",
      ]),
    );
  });

  it("reports a missing top section and recovers via fallback", () => {
    const drift = PREVIRED_TEXT.replace(
      /Valor UF[\s\S]*?816\.408/,
      "",
    );

    let err: unknown;
    try {
      parsePreviredV1(drift, { year: 2026, month: 3 });
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(ParseError);
    expect((err as ParseError).missingFields).toEqual([
      "valorUF",
      "valorUTM",
      "valorUTA",
    ]);

    // With a mindicador fallback the same text parses completely.
    const fallback = parseMindicador(MINDICADOR_JSON);
    const result = parsePreviredV1(drift, {
      year: 2026,
      month: 3,
      fallback,
    });
    expect(result.valorUF).toBe(38129.63);
    expect(result.valorUTM).toBe(68034);
    expect(result.valorUTA).toBe(816408);
  });
});

describe("parseSiiCircular", () => {
  it("parses all brackets and converts UTM → whole pesos", () => {
    const tramos = parseSiiCircular(SII_TEXT, VALOR_UTM);
    expect(tramos).toHaveLength(8);

    // Tramo 1: exempt, starts at 0.
    expect(tramos[0]).toEqual({
      desde: 0,
      hasta: 918459,
      factor: 0,
      cantidadRebajar: 0,
    });

    // Tramo 2: 4% factor, 0.54 UTM reduction.
    expect(tramos[1]).toEqual({
      desde: 918459,
      hasta: 2041020,
      factor: 0.04,
      cantidadRebajar: 36738,
    });

    // Tramo 6: 30.4% factor (float tolerance).
    expect(tramos[5]!.factor).toBeCloseTo(0.304);
    expect(tramos[5]!.cantidadRebajar).toBe(1211005);
  });

  it("leaves the top bracket open (hasta=null)", () => {
    const tramos = parseSiiCircular(SII_TEXT, VALOR_UTM);
    const top = tramos[tramos.length - 1]!;
    expect(top.hasta).toBeNull();
    expect(top.factor).toBeCloseTo(0.4);
  });

  it("throws ParseError when no bracket row is extractable", () => {
    expect(() => parseSiiCircular("no brackets here", VALOR_UTM)).toThrow(
      ParseError,
    );
  });
});

describe("parseMindicador", () => {
  it("reads UF/UTM/UTA from the JSON response", () => {
    expect(parseMindicador(MINDICADOR_JSON)).toEqual({
      valorUF: 38129.63,
      valorUTM: 68034,
      valorUTA: 816408,
    });
  });

  it("derives UTA from UTM when the API omits it", () => {
    const json = JSON.stringify({
      uf: { valor: 38129.63 },
      utm: { valor: 68034 },
    });
    expect(parseMindicador(json)).toEqual({
      valorUF: 38129.63,
      valorUTM: 68034,
      valorUTA: 68034 * 12,
    });
  });

  it("throws ParseError on invalid JSON", () => {
    expect(() => parseMindicador("not json")).toThrow(ParseError);
  });
});
