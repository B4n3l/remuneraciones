/**
 * Tolerant Chilean (es-CL) numeric parsing helpers.
 *
 * Chilean numbers use `.` as the thousands separator and `,` as the decimal
 * separator (e.g. `1.234,56` = 1234.56). These helpers are shared by the
 * Previred and SII parsers to turn PDF/circular text into `number`s.
 *
 * All functions are pure and side-effect free so they can be unit-tested
 * against drift fixtures without touching the network.
 */
/**
 * Parses the first es-CL number found in `input`.
 *
 * Rules:
 * - both `.` and `,` present → `.` is thousands, `,` is decimal (`1.234,56` → 1234.56)
 * - only `,` present → `,` is decimal (`0,9` → 0.9)
 * - only `.` present → `.` is thousands (`500.000` → 500000)
 *
 * Returns `null` when no number can be extracted.
 */
export declare function parseEsClNumber(input: string): number | null;
/**
 * Parses a tax/rate factor expressed as a percentage into a decimal fraction.
 *
 * The SII circular publishes the factor column as a percentage (`4` = 4%, `30,4`
 * = 30.4%) plus `Exento` for the first tramo. This returns the decimal fraction
 * (`4` → 0.04, `30,4` → 0.304, `Exento` → 0).
 *
 * Drift tolerance: a value already expressed as a fraction (`0,04`) is kept as
 * is. Heuristic: magnitudes `> 1` are treated as percentages (÷100), magnitudes
 * `<= 1` are treated as fractions.
 */
export declare function parsePercent(input: string): number | null;
/** Rounds to a whole number (SII brackets/reductions are whole pesos). */
export declare function roundPesos(value: number): number;
