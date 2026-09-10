-- Migration: ImpuestoTramo precision fix (DECIMAL(12,0) -> DECIMAL(12,2))
-- Run in Supabase SQL Editor (this repo does NOT use `prisma migrate`).
--
-- Why: the external contract (Previred API flat contract) supplies 2-decimal
-- values for `desde`, `hasta` and `cantidadRebajar` (e.g. desde 967261.51,
-- cantidadRebajar 38690.46). The original DECIMAL(12,0) columns silently
-- rounded them on write, a latent data-integrity defect. `factor` already had
-- enough precision (DECIMAL(5,4)) and is left untouched.
--
-- Idempotent: `ALTER COLUMN ... TYPE DECIMAL(12,2)` is a no-op if the column
-- is already DECIMAL(12,2), so the script is safe to re-run.

ALTER TABLE "ImpuestoTramo" ALTER COLUMN "desde" TYPE DECIMAL(12, 2);
ALTER TABLE "ImpuestoTramo" ALTER COLUMN "hasta" TYPE DECIMAL(12, 2);
ALTER TABLE "ImpuestoTramo" ALTER COLUMN "cantidadRebajar" TYPE DECIMAL(12, 2);
