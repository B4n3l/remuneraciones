import type { Indicadores } from "../contract.js";
import { parseEsClNumber, parsePercent, roundPesos } from "./numeric.js";
import { ParseError } from "./previred-v1.js";

export type ImpuestoTramo = Indicadores["impuestoTramos"][number];

interface SiiRow {
  desdeUtm: number;
  hastaUtm: number | null;
  factor: number;
  rebajaUtm: number;
}

/** An "open-ended" upper bound marker: no `hasta` for the top bracket. */
const OPEN_END = /^(—|–|-|s\.?i\.?|s\.?l\.?|sin\s+(tope|l[ií]mite)|infinito)$/i;

function isOpenEnd(token: string): boolean {
  return OPEN_END.test(token.trim());
}

/**
 * Parses the SII monthly circular (income-tax brackets, "Impuesto Único de
 * Segunda Categoría"). The circular publishes brackets in UTM with a percentage
 * factor and a UTM reduction ("cantidad a rebajar"); these are converted to whole
 * pesos using `valorUTM` so the top bracket ends with `hasta: null`.
 *
 * Expects each bracket row as whitespace-delimited tokens ending in
 * `desde hasta factor rebaja` (an optional leading tramo index is tolerated),
 * where `hasta` may be the open-end marker and `factor` may be `Exento`. Throws
 * `ParseError` when no bracket can be extracted (never partial).
 */
export function parseSiiCircular(
  text: string,
  valorUTM: number,
): ImpuestoTramo[] {
  const rows: SiiRow[] = [];

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const tokens = line.split(/\s+/).filter(Boolean);
    if (tokens.length < 4) continue;

    // The last 4 tokens carry the bracket data (index column is optional).
    const data = tokens.slice(-4);
    const desdeTok = data[0]!;
    const hastaTok = data[1]!;
    const factorTok = data[2]!;
    const rebajaTok = data[3]!;

    const desdeUtm = parseEsClNumber(desdeTok);
    if (desdeUtm === null) continue;

    const open = isOpenEnd(hastaTok);
    const hastaUtm = open ? null : parseEsClNumber(hastaTok);
    if (!open && hastaUtm === null) continue;

    const factor = parsePercent(factorTok);
    if (factor === null) continue;

    const rebajaUtm = parseEsClNumber(rebajaTok);
    if (rebajaUtm === null) continue;

    rows.push({ desdeUtm, hastaUtm, factor, rebajaUtm });
  }

  if (rows.length === 0) {
    throw new ParseError(["impuestoTramos"], "sii");
  }

  return rows.map((row) => ({
    desde: roundPesos(row.desdeUtm * valorUTM),
    hasta: row.hastaUtm === null ? null : roundPesos(row.hastaUtm * valorUTM),
    factor: row.factor,
    cantidadRebajar: roundPesos(row.rebajaUtm * valorUTM),
  }));
}
