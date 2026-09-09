-- Migration: Ley 21.735 rate split on IndicadorMensual
-- Run in Supabase SQL Editor (this repo does NOT use `prisma migrate`).
--
-- BEFORE applying, run the read-only drift check (P2022/P2021 precedent):
-- the production DB may not match schema.prisma. See the drift query in
-- section 3 below and compare against prisma/schema.prisma.
--
-- What this script does:
--   1. Adds `rentabilidadProtegidaRate` and `expectativaVidaRate` as NULLABLE
--      DECIMAL(5,3) columns (additive migration).
--   2. Backfills the legal Ley 21.735 rates (0.9 / 0.5) only for rows
--      >= 2024-09 (law in force). Earlier rows remain NULL.
--   3. Does NOT touch `seguroSocialRate` (retained for audit/history).
--   4. Idempotent: `ADD COLUMN IF NOT EXISTS` + `UPDATE ... WHERE IS NULL`.

-- 1. Add new columns (NULLABLE by design: derived only for periods in force)
ALTER TABLE "IndicadorMensual"
  ADD COLUMN IF NOT EXISTS "rentabilidadProtegidaRate" DECIMAL(5, 3);

ALTER TABLE "IndicadorMensual"
  ADD COLUMN IF NOT EXISTS "expectativaVidaRate" DECIMAL(5, 3);

-- 2. Backfill legal rates for periods >= 2024-09 (Ley 21.735 in force).
--    Does not overwrite seguroSocialRate. Only fills still-NULL cells so the
--    script is safe to re-run.
UPDATE "IndicadorMensual"
SET
  "rentabilidadProtegidaRate" = 0.9,
  "expectativaVidaRate" = 0.5
WHERE (year > 2024 OR (year = 2024 AND month >= 9))
  AND "rentabilidadProtegidaRate" IS NULL
  AND "expectativaVidaRate" IS NULL;

-- 3. Drift check (read-only) — run BEFORE applying this script and paste the
--    output to confirm the real columns match schema.prisma:
--
-- SELECT table_name, column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
--   AND table_name = 'IndicadorMensual'
-- ORDER BY column_name;
