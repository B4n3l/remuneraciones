import type { Indicadores } from "../contract.js";
export type ImpuestoTramo = Indicadores["impuestoTramos"][number];
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
export declare function parseSiiCircular(text: string, valorUTM: number): ImpuestoTramo[];
