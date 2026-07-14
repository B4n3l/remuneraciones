-- Migración: agrega columnas faltantes en Vacacion (drift detectado 2026-07-14)
-- La tabla Vacacion en producción no coincidía con schema.prisma: faltaban
-- comprobantePath (P2022 original) y updatedAt (detectado al revisar
-- information_schema.columns tras el primer fix).
-- Ejecutar en Supabase SQL Editor ANTES de volver a probar la ficha de trabajador en producción.
--
-- Nota: la tabla real también tiene columnas extra que no están en schema.prisma
-- (anioServicio, fechaRegreso, observacion) — no se tocan aquí, podrían tener datos.

ALTER TABLE "Vacacion"
  ADD COLUMN IF NOT EXISTS "comprobantePath" TEXT;

ALTER TABLE "Vacacion"
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
