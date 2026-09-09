/**
 * Raw source-text fixtures for the parsers/scrapers. These mimic the structure
 * of the real sources (Previred PDF, SII circular, mindicador.cl) so parsers can
 * be tested offline and drift cases can be reproduced by editing the text.
 */

/** A well-formed Previred "Indicadores Previsionales" PDF text extraction. */
export const PREVIRED_TEXT = [
  "PREVIRED",
  "Indicadores Previsionales — Marzo 2026",
  "",
  "VALORES DE LA UF, UTM Y UTA",
  "Valor UF: 38.129,63",
  "Valor UTM: 68.034",
  "Valor UTA: 816.408",
  "",
  "SUELDO MÍNIMO",
  "Sueldo mínimo mensual (18 a 65 años): 500.000",
  "Sueldo mínimo trabajador de casa particular: 410.000",
  "Sueldo mínimo menores de 18 y mayores de 65 años: 372.000",
  "Sueldo mínimo con fines no remuneracionales: 322.295",
  "",
  "TOPES IMPONIBLES",
  "Tope imponible AFP (en UF): 89,9",
  "Tope imponible IPS (en UF): 84,3",
  "Tope imponible Seguro de Cesantía (en UF): 135,1",
  "",
  "AHORRO PREVISIONAL VOLUNTARIO",
  "Tope mensual APV (en UF): 50",
  "Tope anual APV (en UF): 600",
  "",
  "COTIZACIONES OBLIGATORIAS AFP",
  "AFP Capital: 11,44 1,44 12,88",
  "AFP Cuprum: 10,00 1,44 11,44",
  "AFP Habitat: 11,44 1,44 12,88",
  "AFP Modelo: 11,44 1,44 12,88",
  "AFP PlanVital: 11,16 1,44 12,60",
  "AFP Provida: 11,45 1,44 12,89",
  "AFP Uno: 10,80 1,44 12,24",
  "",
  "SEGURO DE CESANTÍA",
  "Contrato indefinido: 2,4 0,6",
  "Contrato a plazo fijo: 3,0 0,0",
  "",
  "ASIGNACIÓN FAMILIAR",
  "Tramo A: 21.365 desde 0 hasta 586.678",
  "Tramo B: 13.109 desde 586.679 hasta 854.569",
  "Tramo C: 4.141 desde 854.570 hasta 1.332.040",
  "Tramo D: 0 desde 1.332.041 sin tope",
].join("\n");

/** The SII "Impuesto Único de Segunda Categoría" bracket table (values in UTM). */
export const SII_TEXT = [
  "IMPUESTO ÚNICO DE SEGUNDA CATEGORÍA",
  "TABLA DE IMPUESTO A LA RENTA — MARZO 2026",
  "",
  "Tramo  Desde (UTM)  Hasta (UTM)  Factor  Cantidad a rebajar (UTM)",
  "1  0,00  13,50  Exento  0,00",
  "2  13,50  30,00  4,00  0,54",
  "3  30,00  50,00  8,00  1,74",
  "4  50,00  70,00  13,50  4,49",
  "5  70,00  90,00  23,00  11,14",
  "6  90,00  120,00  30,40  17,80",
  "7  120,00  310,00  35,00  23,32",
  "8  310,00  —  40,00  38,82",
].join("\n");

/** mindicador.cl JSON response (subset with the fields the fallback reads). */
export const MINDICADOR_JSON = JSON.stringify({
  version: "1.7.0",
  uf: { codigo: "uf", nombre: "Unidad de fomento (UF)", valor: 38129.63 },
  utm: { codigo: "utm", nombre: "Unidad tributaria mensual (UTM)", valor: 68034 },
  uta: { codigo: "uta", nombre: "Unidad tributaria anual (UTA)", valor: 816408 },
});
