import { esFeriadoChile } from "@/lib/feriados";

// Parses a "YYYY-MM-DD" string into a Date built from LOCAL components.
// Do NOT use `new Date("YYYY-MM-DD")`: it parses as UTC and shifts the day by
// one in Chile's UTC-4 timezone, producing off-by-one results.
function parseLocalDate(iso: string): Date | null {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    return new Date(year, month - 1, day);
}

// Counts business days between fechaInicio and fechaFin, both INCLUSIVE.
// Weekends (Saturday and Sunday) and Chilean legal holidays are excluded.
// Returns 0 when the end date is before the start date.
export function calcularDiasHabiles(fechaInicio: string, fechaFin: string): number {
    const start = parseLocalDate(fechaInicio);
    const end = parseLocalDate(fechaFin);
    if (!start || !end || end < start) return 0;

    let count = 0;
    for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
        const dow = d.getDay();
        if (dow === 0 || dow === 6) continue; // Saturday or Sunday.
        if (esFeriadoChile(d)) continue;      // Legal holiday.
        count++;
    }
    return count;
}
