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
const NBSP = "\u00a0";
/** Matches an es-CL number: digits with optional `.` thousands and `,` decimal. */
const ES_CL_NUMBER_RE = /\d+(?:\.\d+)*(?:,\d+)?/;
/** Collapses all whitespace (incl. non-breaking spaces) and trims. */
function stripWhitespace(input) {
    return input.replace(new RegExp(NBSP, "g"), " ").replace(/\s+/g, "").trim();
}
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
export function parseEsClNumber(input) {
    if (typeof input !== "string")
        return null;
    const s = stripWhitespace(input);
    if (!s)
        return null;
    const match = s.match(ES_CL_NUMBER_RE);
    if (!match)
        return null;
    const token = match[0];
    const hasComma = token.includes(",");
    const hasDot = token.includes(".");
    let normalized;
    if (hasComma && hasDot) {
        normalized = token.replace(/\./g, "").replace(/,/g, ".");
    }
    else if (hasComma) {
        normalized = token.replace(/,/g, ".");
    }
    else if (hasDot) {
        normalized = token.replace(/\./g, "");
    }
    else {
        normalized = token;
    }
    const value = Number(normalized);
    return Number.isFinite(value) ? value : null;
}
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
export function parsePercent(input) {
    if (typeof input !== "string")
        return null;
    const s = stripWhitespace(input).toLowerCase();
    if (!s)
        return null;
    if (s.includes("exento") || s.includes("exenta"))
        return 0;
    const n = parseEsClNumber(input);
    if (n === null)
        return null;
    return Math.abs(n) > 1 ? n / 100 : n;
}
/** Rounds to a whole number (SII brackets/reductions are whole pesos). */
export function roundPesos(value) {
    return Math.round(value);
}
//# sourceMappingURL=numeric.js.map