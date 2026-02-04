-- Migración: Indicadores Previsionales Históricos
-- Ejecutar en Supabase SQL Editor

-- 1. Tabla principal de indicadores mensuales
CREATE TABLE IF NOT EXISTS "IndicadorMensual" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    
    -- Valores UF/UTM/UTA
    "valorUF" DECIMAL(12, 4) NOT NULL,
    "valorUTM" DECIMAL(12, 2) NOT NULL,
    "valorUTA" DECIMAL(12, 2) NOT NULL,
    
    -- Sueldos Mínimos
    "sueldoMinimo" DECIMAL(12, 2) NOT NULL,
    "sueldoMinimoCasaPart" DECIMAL(12, 2) NOT NULL,
    "sueldoMinimoMenores" DECIMAL(12, 2) NOT NULL,
    "sueldoMinimoNoRem" DECIMAL(12, 2) NOT NULL,
    
    -- Topes Imponibles (en UF)
    "topeImponibleAFP" DECIMAL(10, 2) NOT NULL,
    "topeImponibleINP" DECIMAL(10, 2) NOT NULL,
    "topeSeguroCesantia" DECIMAL(10, 2) NOT NULL,
    
    -- Tasas generales
    "sisRate" DECIMAL(5, 3) NOT NULL,
    "seguroSocialRate" DECIMAL(5, 3) NOT NULL,
    
    -- APV Topes (en UF)
    "apvTopeMensualUF" DECIMAL(10, 2) NOT NULL,
    "apvTopeAnualUF" DECIMAL(10, 2) NOT NULL,
    
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "IndicadorMensual_year_month_key" UNIQUE ("year", "month")
);

-- 2. Tasas AFP por período
CREATE TABLE IF NOT EXISTS "AFPHistorico" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "indicadorId" TEXT NOT NULL,
    "afpNombre" TEXT NOT NULL,
    "cargoTrabajador" DECIMAL(5, 3) NOT NULL,
    "cargoEmpleador" DECIMAL(5, 3) NOT NULL,
    "totalAPagar" DECIMAL(5, 3) NOT NULL,
    "independiente" DECIMAL(5, 3) NOT NULL,
    
    CONSTRAINT "AFPHistorico_indicadorId_fkey" FOREIGN KEY ("indicadorId") 
        REFERENCES "IndicadorMensual"("id") ON DELETE CASCADE,
    CONSTRAINT "AFPHistorico_indicadorId_afpNombre_key" UNIQUE ("indicadorId", "afpNombre")
);

-- 3. Seguro Cesantía por tipo de contrato
CREATE TABLE IF NOT EXISTS "CesantiaHistorico" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "indicadorId" TEXT NOT NULL,
    "tipoContrato" TEXT NOT NULL,
    "empleador" DECIMAL(5, 3) NOT NULL,
    "trabajador" DECIMAL(5, 3) NOT NULL,
    
    CONSTRAINT "CesantiaHistorico_indicadorId_fkey" FOREIGN KEY ("indicadorId") 
        REFERENCES "IndicadorMensual"("id") ON DELETE CASCADE,
    CONSTRAINT "CesantiaHistorico_indicadorId_tipoContrato_key" UNIQUE ("indicadorId", "tipoContrato")
);

-- 4. Asignación Familiar por tramos
CREATE TABLE IF NOT EXISTS "AsignacionFamiliarHistorico" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "indicadorId" TEXT NOT NULL,
    "tramo" TEXT NOT NULL,
    "monto" DECIMAL(12, 2) NOT NULL,
    "rentaDesde" DECIMAL(12, 2) NOT NULL,
    "rentaHasta" DECIMAL(12, 2),
    
    CONSTRAINT "AsignacionFamiliarHistorico_indicadorId_fkey" FOREIGN KEY ("indicadorId") 
        REFERENCES "IndicadorMensual"("id") ON DELETE CASCADE,
    CONSTRAINT "AsignacionFamiliarHistorico_indicadorId_tramo_key" UNIQUE ("indicadorId", "tramo")
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS "IndicadorMensual_year_month_idx" ON "IndicadorMensual"("year", "month");
CREATE INDEX IF NOT EXISTS "AFPHistorico_indicadorId_idx" ON "AFPHistorico"("indicadorId");
CREATE INDEX IF NOT EXISTS "CesantiaHistorico_indicadorId_idx" ON "CesantiaHistorico"("indicadorId");
CREATE INDEX IF NOT EXISTS "AsignacionFamiliarHistorico_indicadorId_idx" ON "AsignacionFamiliarHistorico"("indicadorId");
