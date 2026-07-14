-- Migración: crea la tabla DocumentoTrabajador completa (no existía en producción).
-- Detectado 2026-07-14 al comparar information_schema.columns contra schema.prisma:
-- la ficha de trabajador incluye worker.documentos (DocumentoTrabajador[]), pero la
-- tabla nunca se creó en la BD de producción.
-- Ejecutar en Supabase SQL Editor DESPUÉS de vacacion_comprobante_path.sql.

DO $$ BEGIN
    CREATE TYPE "TipoDoc" AS ENUM ('CONTRATO', 'ANEXO', 'VACACIONES', 'FINIQUITO', 'OTRO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "DocumentoTrabajador" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoDoc" NOT NULL,
    "storagePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL DEFAULT 'application/pdf',
    "tamanioBytes" INTEGER NOT NULL,
    "periodo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentoTrabajador_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "DocumentoTrabajador_workerId_idx" ON "DocumentoTrabajador"("workerId");
CREATE INDEX IF NOT EXISTS "DocumentoTrabajador_tipo_idx" ON "DocumentoTrabajador"("tipo");

DO $$ BEGIN
    ALTER TABLE "DocumentoTrabajador"
      ADD CONSTRAINT "DocumentoTrabajador_workerId_fkey"
      FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
