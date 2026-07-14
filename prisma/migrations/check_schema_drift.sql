-- Diagnóstico (solo lectura, no modifica nada): compara las columnas reales en
-- producción contra lo que espera schema.prisma para las tablas que usa la
-- ficha de trabajador (/dashboard/trabajadores/[id]).
-- Correr en el SQL Editor de Supabase y pegar el resultado.

SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('Worker','Contract','DocumentoTrabajador','AFP','Company','WorkerHealthPlan')
ORDER BY table_name, column_name;
