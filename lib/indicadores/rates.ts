/**
 * Ley 21.735 rate constants (percent values) and server-side derivation of
 * the legacy `seguroSocialRate`.
 *
 * `rentabilidadProtegidaRate` (0.9%) + `expectativaVidaRate` (0.5%) +
 * `sisRate` (2.0%) replace the single `seguroSocialRate`. `seguroSocialRate`
 * is kept for audit/history and is always derived from the split rates, never
 * accepted as input (design decision: derive server-side).
 */

export const LEY_21735_RATES = {
  rentabilidadProtegidaRate: 0.9,
  expectativaVidaRate: 0.5,
  sisRate: 2.0,
} as const;

/**
 * Derives the legacy `seguroSocialRate` as the sum of the three Ley 21.735
 * rates (0.9 + 0.5 + 2.0 = 3.4), rounded to 3 decimals to match the
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
