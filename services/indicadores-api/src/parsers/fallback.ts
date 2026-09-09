import { ParseError } from "./previred-v1.js";

/** UF/UTM/UTA values supplied by the mindicador.cl fallback source. */
export interface MindicadorValues {
  valorUF: number;
  valorUTM: number;
  valorUTA: number;
}

/**
 * Parses the mindicador.cl JSON response (`{ uf: { valor }, utm: { valor },
 * uta: { valor } }`). UTA is derived from UTM (`UTA = 12 × UTM`) when the API
 * omits it. Throws `ParseError` listing any missing value (never partial).
 */
export function parseMindicador(jsonText: string): MindicadorValues {
  let root: unknown;
  try {
    root = JSON.parse(jsonText);
  } catch {
    throw new ParseError(["valorUF", "valorUTM", "valorUTA"], "mindicador");
  }

  const record =
    typeof root === "object" && root !== null
      ? (root as Record<string, unknown>)
      : {};

  const readValor = (key: string): number | null => {
    const entry = record[key];
    if (typeof entry !== "object" || entry === null) return null;
    const valor = (entry as Record<string, unknown>).valor;
    const n = typeof valor === "number" ? valor : Number(valor);
    return Number.isFinite(n) && n > 0 ? n : null;
  };

  const valorUF = readValor("uf");
  const valorUTM = readValor("utm");
  const valorUTA = readValor("uta") ?? (valorUTM !== null ? valorUTM * 12 : null);

  const missing: string[] = [];
  if (valorUF === null) missing.push("valorUF");
  if (valorUTM === null) missing.push("valorUTM");
  if (valorUTA === null) missing.push("valorUTA");
  if (missing.length > 0) {
    throw new ParseError(missing, "mindicador");
  }

  return { valorUF: valorUF!, valorUTM: valorUTM!, valorUTA: valorUTA! };
}
