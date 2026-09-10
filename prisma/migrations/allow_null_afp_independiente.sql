-- Migration: allow NULL on AFPHistorico.independiente
-- Run in Supabase SQL Editor (this repo does NOT use `prisma migrate`).
--
-- Context: Previred removed the "independiente (incl. SIS)" column from its AFP
-- table with the Pension Reform (Ley 21.735, in force Aug 2026). The external
-- indicators API now returns `independiente: null`, so the sync must be able to
-- persist that absence instead of a fake 0.
--
-- Idempotent: DROP NOT NULL is a no-op if the column is already nullable.

ALTER TABLE "AFPHistorico"
  ALTER COLUMN "independiente" DROP NOT NULL;
