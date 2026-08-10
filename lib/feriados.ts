// Chilean legal holidays (feriados legales).
//
// References:
// - Ley 19.668: movable-to-Monday regime, applies ONLY to San Pedro y San
//   Pablo (Jun 29) and Encuentro de Dos Mundos (Oct 12).
// - Ley 20.983: Virgen del Carmen, Asunción, Todos los Santos and Inmaculada
//   are observed ON THEIR CALENDAR DATE, never moved; also creates the
//   "bridge" holidays Mon Jan 2 and Fri Sep 17.
// - Ley 20.299: Día Nacional de las Iglesias Evangélicas (Oct 31, special rule).
// - Ley 21.357: Día Nacional de los Pueblos Indígenas (winter solstice, Jun 21).
//
// Rules verified against the official calendars for 2026 and 2027
// (feriadoschilenos.cl): e.g. Oct 12 2027 falls on Tuesday and is observed on
// Mon Oct 11, while Dec 8 2026 falls on Tuesday and is observed on that
// Tuesday (no move).
//
// Limitations:
// - Election days (Ley 18.700) are also legal holidays, but they cannot be
//   predicted ahead of time, so they are NOT handled here.
// - Regional and local holidays (e.g. Jun 7 in Arica y Parinacota, Aug 20 in
//   Chillán) are NOT included because the worker's region is not tracked.
// - Dec 31 bank holiday is restricted to financial institutions and is NOT a
//   general holiday, so it is excluded.
//
// This module is shared between client and server code, so it only uses native
// Date APIs and has no npm dependencies.

// Meeus/Jones/Butcher algorithm: Gregorian date of Easter Sunday for a year.
function easterSunday(year: number): Date {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month - 1, day);
}

// Movable-to-Monday rule (Ley 19.668): a holiday falling on Tuesday, Wednesday
// or Thursday moves to the PREVIOUS Monday (the Monday of the same week); on
// Friday it moves to the NEXT Monday; on Saturday, Sunday or Monday it stays on
// its calendar date. Applies ONLY to San Pedro y San Pablo and Encuentro de
// Dos Mundos (see esFeriadoChile below).
function movableToMonday(year: number, month: number, day: number): Date {
    const dow = new Date(year, month - 1, day).getDay(); // 0=Sun ... 6=Sat
    if (dow >= 2 && dow <= 4) {
        // Tuesday, Wednesday or Thursday: previous Monday of the same week.
        return new Date(year, month - 1, day - (dow - 1));
    }
    if (dow === 5) {
        // Friday: next Monday.
        return new Date(year, month - 1, day + 3);
    }
    // Monday, Saturday or Sunday: keep the calendar date.
    return new Date(year, month - 1, day);
}

// Día Nacional de las Iglesias Evangélicas (Ley 20.299): observed on Oct 31,
// except when Oct 31 falls on a Tuesday (moves to the previous Friday) or on a
// Wednesday (moves to the following Friday).
function evangelicalHoliday(year: number): Date {
    const dow = new Date(year, 9, 31).getDay(); // 0=Sun ... 6=Sat
    if (dow === 2) return new Date(year, 9, 27);  // Tuesday -> previous Friday.
    if (dow === 3) return new Date(year, 10, 2);  // Wednesday -> following Friday.
    return new Date(year, 9, 31);                 // Otherwise keep Oct 31.
}

// Returns true when `date` is a Chilean legal holiday.
export function esFeriadoChile(date: Date): boolean {
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 1-based
    const day = date.getDate();

    // Fixed holidays that are never moved.
    if (
        (month === 1 && day === 1) ||  // Año Nuevo
        (month === 5 && day === 1) ||  // Día del Trabajo
        (month === 5 && day === 21) || // Día de las Glorias Navales
        (month === 6 && day === 21) || // Día Nacional de los Pueblos Indígenas (Ley 21.357)
        (month === 7 && day === 16) || // Virgen del Carmen (Ley 20.983: never moved)
        (month === 8 && day === 15) || // Asunción de la Virgen (Ley 20.983: never moved)
        (month === 9 && day === 18) || // Fiestas Patrias
        (month === 9 && day === 19) || // Fiestas Patrias
        (month === 11 && day === 1) || // Todos los Santos (Ley 20.983: never moved)
        (month === 12 && day === 8) || // Inmaculada Concepción (Ley 20.983: never moved)
        (month === 12 && day === 25)   // Navidad
    ) {
        return true;
    }

    // Bridge holidays (Ley 20.983): Mon Jan 2 (only when Jan 1 falls on
    // Sunday) and Fri Sep 17 (only when it falls on Friday).
    if ((month === 1 && day === 2 && new Date(year, 0, 2).getDay() === 1) ||
        (month === 9 && day === 17 && new Date(year, 8, 17).getDay() === 5)) {
        return true;
    }

    // Easter-based holidays: Viernes Santo (Easter - 2) and Sábado Santo (Easter - 1).
    const easter = easterSunday(year);
    if (
        (month === easter.getMonth() + 1 && day === easter.getDate() - 2) ||
        (month === easter.getMonth() + 1 && day === easter.getDate() - 1)
    ) {
        return true;
    }

    // Movable-to-Monday holidays (Ley 19.668). NOTE: this rule applies ONLY to
    // these two; the religious holidays above are observed on their date.
    const movable: ReadonlyArray<readonly [number, number]> = [
        [6, 29],  // San Pedro y San Pablo
        [10, 12], // Día del Encuentro de Dos Mundos
    ];
    for (const [m, d] of movable) {
        const holiday = movableToMonday(year, m, d);
        if (holiday.getMonth() + 1 === month && holiday.getDate() === day) {
            return true;
        }
    }

    // Special rule for Oct 31 (Ley 20.299).
    const evangelical = evangelicalHoliday(year);
    if (month === evangelical.getMonth() + 1 && day === evangelical.getDate()) {
        return true;
    }

    return false;
}
