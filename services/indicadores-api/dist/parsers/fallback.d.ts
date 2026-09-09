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
export declare function parseMindicador(jsonText: string): MindicadorValues;
