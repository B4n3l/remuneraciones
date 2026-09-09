import { parseEsClNumber } from "./numeric.js";
/**
 * Raised when a source cannot produce every required field. `missingFields` are
 * the contract field names that could not be extracted so the scraper can decide
 * whether a fallback source covers them. The parser NEVER returns partial data:
 * any incompleteness surfaces as this error.
 */
export class ParseError extends Error {
    missingFields;
    source;
    constructor(missingFields, source) {
        super(`${source}: parse failed — missing fields: ${missingFields.join(", ")}`);
        this.missingFields = missingFields;
        this.source = source;
        this.name = "ParseError";
    }
}
/** Case/accent-insensitive normalization for anchored section matching. */
function norm(input) {
    return input
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}
function splitLines(text) {
    return text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
}
/** The value number: prefers the number after a `:` separator, else first. */
function extractValueNumber(text) {
    const colonIdx = text.indexOf(":");
    const searchIn = colonIdx !== -1 ? text.slice(colonIdx + 1) : text;
    return parseEsClNumber(searchIn);
}
/** Value for the first line containing any of `labels` (label: value layout). */
function extractNumberByLabel(lines, labels) {
    const normalizedLabels = labels.map(norm);
    for (let i = 0; i < lines.length; i++) {
        const nl = norm(lines[i] ?? "");
        for (const nlabel of normalizedLabels) {
            const idx = nl.indexOf(nlabel);
            if (idx === -1)
                continue;
            const after = nl.slice(idx + nlabel.length);
            const nextLine = i + 1 < lines.length ? norm(lines[i + 1] ?? "") : "";
            for (const candidate of [after, nextLine]) {
                const value = extractValueNumber(candidate);
                if (value !== null)
                    return value;
            }
        }
    }
    return null;
}
/** All es-CL numbers in a line, in order (whitespace-delimited tokens). */
function extractNumbers(line) {
    const result = [];
    for (const token of line.split(/\s+/)) {
        const n = parseEsClNumber(token);
        if (n !== null)
            result.push(n);
    }
    return result;
}
const AFP_NAMES = [
    "capital",
    "cuprum",
    "habitat",
    "modelo",
    "planvital",
    "provida",
    "uno",
];
function titleCaseAfp(name) {
    if (name === "planvital")
        return "PlanVital";
    if (name === "uno")
        return "Uno";
    return name.charAt(0).toUpperCase() + name.slice(1);
}
function extractAfpRates(lines) {
    const rates = [];
    for (const line of lines) {
        const nl = norm(line);
        if (!nl.includes("afp"))
            continue;
        for (const name of AFP_NAMES) {
            if (!nl.includes(name))
                continue;
            const numbers = extractNumbers(line);
            // Expect: cargoTrabajador, cargoEmpleador, totalAPagar.
            if (numbers.length < 3)
                continue;
            const cargoTrabajador = numbers[0];
            const cargoEmpleador = numbers[1];
            const totalAPagar = numbers[2];
            rates.push({
                afpNombre: titleCaseAfp(name),
                cargoTrabajador,
                cargoEmpleador,
                totalAPagar,
                // Independent workers pay the full rate (worker + employer).
                independiente: totalAPagar,
            });
        }
    }
    return rates;
}
function extractCesantiaRates(lines) {
    const rates = [];
    for (const line of lines) {
        const nl = norm(line);
        if (nl.includes("tope"))
            continue; // skip the topes section
        let tipoContrato = null;
        if (nl.includes("indefinido")) {
            tipoContrato = "INDEFINIDO";
        }
        else if (nl.includes("plazo fijo") || nl.includes("a plazo")) {
            tipoContrato = "PLAZO_FIJO";
        }
        if (tipoContrato === null)
            continue;
        const numbers = extractNumbers(line);
        if (numbers.length < 2)
            continue;
        rates.push({
            tipoContrato,
            empleador: numbers[0],
            trabajador: numbers[1],
        });
    }
    return rates;
}
const TRAMO_LETTERS = ["a", "b", "c", "d"];
function extractAsignacionFamiliar(lines) {
    const tramos = [];
    for (const line of lines) {
        const nl = norm(line);
        if (!nl.includes("tramo"))
            continue;
        for (const letter of TRAMO_LETTERS) {
            if (!nl.includes(`tramo ${letter}`))
                continue;
            const numbers = extractNumbers(line);
            if (numbers.length < 2)
                continue;
            const monto = numbers[0];
            const rentaDesde = numbers[1];
            const rentaHasta = numbers.length >= 3 ? numbers[2] : null;
            // The open-ended top tramo carries no upper bound.
            const hasUpperBound = !/(sin\s+tope|sin\s+l[ií]mite)/.test(nl);
            tramos.push({
                tramo: letter.toUpperCase(),
                monto,
                rentaDesde,
                rentaHasta: hasUpperBound ? rentaHasta : null,
            });
        }
    }
    return tramos;
}
/**
 * Extracts every Previred field from the PDF text via anchored section headings.
 *
 * Missing required fields are collected and reported via `ParseError` — the
 * parser never returns a partial payload. When `fallback` (UF/UTM/UTA from
 * mindicador) is supplied, those three fields are filled before the completeness
 * check, so the scraper can recover a drifted top section.
 */
export function parsePreviredV1(text, options) {
    const lines = splitLines(text);
    const fallback = options.fallback ?? {};
    const result = {};
    const missing = [];
    const read = (field, labels, source) => {
        const value = source ?? extractNumberByLabel(lines, labels);
        if (value !== null && value !== undefined) {
            result[field] = value;
        }
        else {
            missing.push(field);
        }
    };
    read("valorUF", ["valor uf", "valor de la uf", "uf:"], fallback.valorUF);
    read("valorUTM", ["valor utm", "utm:"], fallback.valorUTM);
    read("valorUTA", ["valor uta", "uta:"], fallback.valorUTA);
    read("sueldoMinimo", ["sueldo mínimo mensual"]);
    read("sueldoMinimoCasaPart", ["casa particular"]);
    read("sueldoMinimoMenores", ["menores de 18", "mayores de 65"]);
    read("sueldoMinimoNoRem", ["no remuneracional", "fines no remuneracionales"]);
    read("topeImponibleAFP", ["tope imponible afp", "tope afp"]);
    read("topeImponibleINP", [
        "tope imponible ips",
        "tope imponible inp",
        "tope ips",
    ]);
    read("topeSeguroCesantia", [
        "tope imponible seguro de cesantía",
        "tope seguro de cesantía",
        "tope cesantía",
    ]);
    read("apvTopeMensualUF", ["tope mensual apv", "apv mensual"]);
    read("apvTopeAnualUF", ["tope anual apv", "apv anual"]);
    const afpRates = extractAfpRates(lines);
    if (afpRates.length === 0)
        missing.push("afpRates");
    else
        result.afpRates = afpRates;
    const cesantiaRates = extractCesantiaRates(lines);
    if (cesantiaRates.length === 0)
        missing.push("cesantiaRates");
    else
        result.cesantiaRates = cesantiaRates;
    const asignacionFamiliar = extractAsignacionFamiliar(lines);
    if (asignacionFamiliar.length === 0)
        missing.push("asignacionFamiliar");
    else
        result.asignacionFamiliar = asignacionFamiliar;
    if (missing.length > 0) {
        throw new ParseError(missing, "previred");
    }
    return result;
}
//# sourceMappingURL=previred-v1.js.map