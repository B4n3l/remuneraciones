-- Migración: Agregar columna sueldoMinimoAuto a Worker
-- Ejecutar en Supabase SQL Editor

ALTER TABLE "Worker" ADD COLUMN IF NOT EXISTS "sueldoMinimoAuto" BOOLEAN NOT NULL DEFAULT false;
