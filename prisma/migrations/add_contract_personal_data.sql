-- Migración manual: datos personales del trabajador + correo empresa + datos de pago del contrato
-- Aplicar en el SQL Editor de Supabase ANTES de desplegar el código que los requiere.
--
-- Requerido por el nuevo template de contrato (art. 10 Código del Trabajo).
-- Script idempotente (IF NOT EXISTS).

-- Worker: datos personales para contratos/finiquitos
ALTER TABLE "Worker" ADD COLUMN IF NOT EXISTS "fechaNacimiento" TIMESTAMP(3);
ALTER TABLE "Worker" ADD COLUMN IF NOT EXISTS "nacionalidad" TEXT DEFAULT 'Chilena';
ALTER TABLE "Worker" ADD COLUMN IF NOT EXISTS "estadoCivil" TEXT;
ALTER TABLE "Worker" ADD COLUMN IF NOT EXISTS "profesion" TEXT;
ALTER TABLE "Worker" ADD COLUMN IF NOT EXISTS "domicilio" TEXT;
ALTER TABLE "Worker" ADD COLUMN IF NOT EXISTS "comuna" TEXT;
ALTER TABLE "Worker" ADD COLUMN IF NOT EXISTS "ciudad" TEXT;
ALTER TABLE "Worker" ADD COLUMN IF NOT EXISTS "email" TEXT;

-- Company: correo electrónico
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "email" TEXT;

-- Contract: forma de pago, periodicidad, colación y comuna del lugar de trabajo
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "formaPago" TEXT DEFAULT 'Transferencia bancaria';
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "periodicidad" TEXT DEFAULT 'Mensualmente';
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "minutosColacion" INTEGER DEFAULT 30;
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "comunaTrabajo" TEXT;
