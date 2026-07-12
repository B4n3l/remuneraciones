-- Migración: horasExtra Int → Decimal(5,2) para soportar horas con decimales (ej. 8.5)
-- Ejecutar en Supabase SQL Editor ANTES de desplegar el código

ALTER TABLE "PayrollItem"
  ALTER COLUMN "horasExtra" TYPE DECIMAL(5,2) USING "horasExtra"::DECIMAL(5,2),
  ALTER COLUMN "horasExtra" SET DEFAULT 0;
