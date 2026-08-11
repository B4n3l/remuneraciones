-- Migración: Tabla ImpuestoTramo para indicadores previsionales
-- Ejecutar en Supabase SQL Editor

CREATE TABLE IF NOT EXISTS "ImpuestoTramo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "indicadorId" TEXT NOT NULL,
    "desde" DECIMAL(12, 0) NOT NULL,
    "hasta" DECIMAL(12, 0),
    "factor" DECIMAL(5, 4) NOT NULL,
    "cantidadRebajar" DECIMAL(12, 0) NOT NULL,

    CONSTRAINT "ImpuestoTramo_indicadorId_fkey" FOREIGN KEY ("indicadorId")
        REFERENCES "IndicadorMensual"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "ImpuestoTramo_indicadorId_idx" ON "ImpuestoTramo"("indicadorId");
