-- Migración: agrega columna faltante Vacacion.comprobantePath (drift detectado 2026-07-14)
-- La tabla Vacacion se creó sin esta columna aunque ya estaba en schema.prisma desde el commit 2e99307.
-- Ejecutar en Supabase SQL Editor ANTES de volver a probar la ficha de trabajador en producción.

ALTER TABLE "Vacacion"
  ADD COLUMN IF NOT EXISTS "comprobantePath" TEXT;
