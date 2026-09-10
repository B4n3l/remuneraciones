/**
 * Ley 21.735 rate constants (percent values) and server-side derivation of
 * the legacy `seguroSocialRate`.
 *
 * These are **UI/default fallback values only**: the real rates are scraped
 * from Previred's "SEGURO SOCIAL" table (0.9 / 0.72 / 1.78 as published by
 * the Reforma de Pensiones) and flow through the flat contract. The constants
 * below are used for manual-load defaults and duplicate fallbacks, not as the
 * source of truth.
 *
 * `rentabilidadProtegidaRate` (0.9%) + `expectativaVidaRate` (0.72%) +
 * `sisRate` (1.78%) replace the single `seguroSocialRate`. `seguroSocialRate`
 * is kept for audit/history and is always derived from the split rates, never
 * accepted as input (design decision: derive server-side).
 */

export const LEY_21735_RATES = {
  rentabilidadProtegidaRate: 0.9,
  expectativaVidaRate: 0.72,
  sisRate: 1.78,
} as const;

/**
 * Derives the legacy `seguroSocialRate` as the sum of the three Ley 21.735
 * rates (0.9 + 0.72 + 1.78 = 3.4), rounded to 3 decimals to match the
 * `@db.Decimal(5,3)` column.
 */
export function deriveSeguroSocialRate(
  rentabilidadProtegidaRate: number,
  expectativaVidaRate: number,
  sisRate: number,
): number {
  const sum = rentabilidadProtegidaRate + expectativaVidaRate + sisRate;
  return Math.round(sum * 1000) / 1000;
}
