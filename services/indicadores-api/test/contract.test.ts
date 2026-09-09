import { describe, expect, it } from "vitest";
import {
  LEY_21735_RATES,
  impuestoTramoSchema,
  indicadoresSchema,
} from "../src/contract.js";
import { makeSampleIndicadores } from "./fixtures.js";

describe("indicadoresSchema (contract)", () => {
  it("accepts a full valid payload", () => {
    expect(indicadoresSchema.safeParse(makeSampleIndicadores()).success).toBe(
      true,
    );
  });

  it("rejects a payload missing a split rate", () => {
    const { rentabilidadProtegidaRate: _omitted, ...rest } =
      makeSampleIndicadores();
    expect(indicadoresSchema.safeParse(rest).success).toBe(false);
  });

  it("omits seguroSocialRate (design decision #5: excluded from contract)", () => {
    const result = indicadoresSchema.parse({
      ...makeSampleIndicadores(),
      seguroSocialRate: 3.4,
    });
    expect("seguroSocialRate" in result).toBe(false);
  });

  it("rejects split rates outside 0..100", () => {
    expect(
      indicadoresSchema.safeParse(makeSampleIndicadores({ sisRate: 200 }))
        .success,
    ).toBe(false);
  });

  it("rejects a non-numeric impuestoTramo field", () => {
    const payload = {
      ...makeSampleIndicadores(),
      impuestoTramos: [
        { desde: 0, hasta: "100", factor: 0, cantidadRebajar: 0 },
      ],
    };
    expect(indicadoresSchema.safeParse(payload).success).toBe(false);
  });
});

describe("impuestoTramoSchema", () => {
  it("accepts null hasta for the top bracket", () => {
    expect(
      impuestoTramoSchema.safeParse({
        desde: 100,
        hasta: null,
        factor: 0.04,
        cantidadRebajar: 1000,
      }).success,
    ).toBe(true);
  });

  it("accepts a numeric hasta for non-top brackets", () => {
    expect(
      impuestoTramoSchema.safeParse({
        desde: 100,
        hasta: 200,
        factor: 0.04,
        cantidadRebajar: 1000,
      }).success,
    ).toBe(true);
  });
});

describe("LEY_21735_RATES", () => {
  it("exposes the legal split rates", () => {
    expect(LEY_21735_RATES).toEqual({
      rentabilidadProtegidaRate: 0.9,
      expectativaVidaRate: 0.5,
      sisRate: 2.0,
    });
  });
});
