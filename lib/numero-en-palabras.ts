/**
 * Convierte un número entero a palabras en español, en formato legal chileno
 * (el mismo estilo usado en cheques y documentos notariales).
 *
 * Ejemplos:
 *   numeroEnPalabras(0)           -> "cero pesos chilenos"
 *   numeroEnPalabras(1)           -> "un peso chileno"
 *   numeroEnPalabras(21)          -> "veintiún pesos chilenos"
 *   numeroEnPalabras(850000)      -> "ochocientos cincuenta mil pesos chilenos"
 *   numeroEnPalabras(1000000)     -> "un millón de pesos chilenos"
 *   numeroEnPalabras(2500000)     -> "dos millones quinientos mil pesos chilenos"
 *
 * Reglas aplicadas:
 *   - Solo se usa la parte entera del número (los sueldos pueden venir con decimales).
 *   - Apócope: "uno" -> "un" ante la palabra "pesos" ("treinta y un pesos",
 *     "ciento un pesos", "veintiún pesos") y "veintiuno" -> "veintiún".
 *   - El millón lleva "de" solo cuando es la última cifra ("un millón de pesos"),
 *     pero no si le siguen miles o unidades ("dos millones quinientos mil pesos").
 *   - Género masculino para centenas que acompañan a "pesos" (quinientos,
 *     setecientos, ochocientos).
 */

const UNIDADES = [
    "cero",
    "uno",
    "dos",
    "tres",
    "cuatro",
    "cinco",
    "seis",
    "siete",
    "ocho",
    "nueve",
];

// Números del 10 al 19 (irregulares)
const DIEZ_A_DIECINUEVE = [
    "diez",
    "once",
    "doce",
    "trece",
    "catorce",
    "quince",
    "dieciséis",
    "diecisiete",
    "dieciocho",
    "diecinueve",
];

// Compuestos de "veinti-": del 21 al 29 (con sus tildes)
const VEINTI_COMPUESTOS = [
    "veintiuno",
    "veintidós",
    "veintitrés",
    "veinticuatro",
    "veinticinco",
    "veintiséis",
    "veintisiete",
    "veintiocho",
    "veintinueve",
];

const DECENAS = [
    "",
    "",
    "veinte",
    "treinta",
    "cuarenta",
    "cincuenta",
    "sesenta",
    "setenta",
    "ochenta",
    "noventa",
];

const CENTENAS = [
    "",
    "ciento",
    "doscientos",
    "trescientos",
    "cuatrocientos",
    "quinientos",
    "seiscientos",
    "setecientos",
    "ochocientos",
    "novecientos",
];

/** Convierte 0-99. */
function dosCifras(n: number): string {
    if (n < 10) return UNIDADES[n];
    if (n < 20) return DIEZ_A_DIECINUEVE[n - 10];
    if (n < 30) return n === 20 ? "veinte" : VEINTI_COMPUESTOS[n - 21];
    const decena = DECENAS[Math.floor(n / 10)];
    const unidad = n % 10;
    return unidad === 0 ? decena : `${decena} y ${UNIDADES[unidad]}`;
}

/** Convierte 100-999. */
function tresCifras(n: number): string {
    if (n === 100) return "cien";
    const centena = CENTENAS[Math.floor(n / 100)];
    const resto = n % 100;
    return resto === 0 ? centena : `${centena} ${dosCifras(resto)}`;
}

/** Convierte 1-999 (devuelve "" para 0, para poder componer grupos). */
function hastaTresCifras(n: number): string {
    if (n === 0) return "";
    return n < 100 ? dosCifras(n) : tresCifras(n);
}

/**
 * Apócope de la última palabra cuando termina en "uno":
 *   "uno" -> "un", "veintiuno" -> "veintiún", "treinta y uno" -> "treinta y un".
 * Se aplica al grupo que precede inmediatamente a un sustantivo masculino
 * ("pesos", "mil" o "millones").
 */
function apocopar(texto: string): string {
    if (texto === "uno") return "un";
    if (texto.endsWith("veintiuno")) {
        return `${texto.slice(0, -"veintiuno".length)}veintiún`;
    }
    if (texto.endsWith(" uno")) {
        return `${texto.slice(0, -" uno".length)} un`;
    }
    return texto;
}

/**
 * Convierte un número mayor a 999 a texto por grupos de miles/millones
 * (sin apócope final). Ej: 2000 -> "dos mil", 234000 -> "doscientos treinta
 * y cuatro mil". Se usa para el grupo de millones, que puede superar 999
 * (p. ej. 2.000.000.000 -> "dos mil millones").
 */
function numeroGrupos(n: number): string {
    const mill = Math.floor(n / 1_000_000);
    const mil = Math.floor((n % 1_000_000) / 1000);
    const resto = n % 1000;

    const partes: string[] = [];
    if (mill === 1) {
        partes.push("un millón");
    } else if (mill > 1) {
        partes.push(`${numeroGrupos(mill)} millones`);
    }
    if (mil === 1) {
        partes.push("mil");
    } else if (mil > 1) {
        partes.push(`${numeroGrupos(mil)} mil`);
    }
    if (resto > 0) {
        partes.push(hastaTresCifras(resto));
    }
    return partes.join(" ");
}

/**
 * Convierte un número (su parte entera) a palabras en formato legal chileno,
 * seguido de la unidad monetaria: "pesos chilenos" (o "peso chileno" para 1).
 */
export function numeroEnPalabras(num: number): string {
    const entero = Math.floor(num);

    if (!Number.isFinite(entero) || entero === 0) {
        return "cero pesos chilenos";
    }
    if (entero < 0) {
        return `menos ${numeroEnPalabras(-entero)}`;
    }

    const millones = Math.floor(entero / 1_000_000);
    const miles = Math.floor((entero % 1_000_000) / 1000);
    const resto = entero % 1000;

    const partes: string[] = [];

    if (millones === 1) {
        partes.push("un millón");
    } else if (millones > 1) {
        partes.push(`${apocopar(numeroGrupos(millones))} millones`);
    }

    if (miles === 1) {
        partes.push("mil");
    } else if (miles > 1) {
        partes.push(`${apocopar(hastaTresCifras(miles))} mil`);
    }

    if (resto > 0) {
        partes.push(apocopar(hastaTresCifras(resto)));
    }

    // "de" solo cuando el millón es la última cifra: "un millón de pesos",
    // pero "dos millones quinientos mil pesos" (sin "de").
    const conDe = millones > 0 && miles === 0 && resto === 0;

    const sufijo = entero === 1 ? "peso chileno" : "pesos chilenos";

    return conDe
        ? `${partes.join(" ")} de ${sufijo}`
        : `${partes.join(" ")} ${sufijo}`;
}
