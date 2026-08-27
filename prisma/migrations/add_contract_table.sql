-- Migración manual: modelo Contract + enum ContractType
-- Aplicar en el SQL Editor de Supabase ANTES de usar la feature de contratos.
--
-- Contexto: el modelo se agregó a schema.prisma en el commit 09e1e1e (2026-01-09)
-- pero nunca se creó el SQL asociado. Producción lanza:
--   type "public.ContractType" does not exist (Postgres 42704)
--
-- Script idempotente: se puede correr aunque la tabla ya exista (no borra nada).

-- 1) Enum del tipo de contrato (coincide con `enum ContractType` del schema)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ContractType') THEN
    CREATE TYPE "ContractType" AS ENUM ('INDEFINIDO', 'PLAZO_FIJO', 'OBRA_FAENA');
  END IF;
END $$;

-- 2) Tabla Contract (coincide con `model Contract` del schema)
CREATE TABLE IF NOT EXISTS "Contract" (
  "id"            TEXT          NOT NULL,
  "companyId"     TEXT          NOT NULL,
  "workerId"      TEXT          NOT NULL,
  "type"          "ContractType" NOT NULL,
  "startDate"     TIMESTAMP(3)  NOT NULL,
  "endDate"       TIMESTAMP(3),
  "cargo"         TEXT          NOT NULL,
  "jornada"       TEXT          NOT NULL,
  "schedule"      TEXT          NOT NULL,
  "workplace"     TEXT          NOT NULL,
  "baseSalary"    DECIMAL(10,2) NOT NULL,
  "benefits"      TEXT,
  "obraDetails"   TEXT,
  "legalRep"      TEXT          NOT NULL,
  "legalRepRut"   TEXT          NOT NULL,
  "createdAt"     TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3)  NOT NULL,

  CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- 3) Índices (coinciden con los @@index del schema)
CREATE INDEX IF NOT EXISTS "Contract_companyId_idx" ON "Contract"("companyId");
CREATE INDEX IF NOT EXISTS "Contract_workerId_idx" ON "Contract"("workerId");
CREATE INDEX IF NOT EXISTS "Contract_type_idx" ON "Contract"("type");

-- 4) Foreign keys (coinciden con las relaciones del schema; solo se agregan si faltan)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Contract_companyId_fkey') THEN
    ALTER TABLE "Contract" ADD CONSTRAINT "Contract_companyId_fkey"
      FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Contract_workerId_fkey') THEN
    ALTER TABLE "Contract" ADD CONSTRAINT "Contract_workerId_fkey"
      FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
