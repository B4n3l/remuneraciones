# CentroContable — Remuneraciones

Sistema de liquidación de remuneraciones (Next.js + Prisma + PostgreSQL/Supabase).

## Registro de trabajo: `docs/`

Este repo lleva el estado del proyecto en `docs/`, no en la memoria de la conversación:

- **`docs/ROADMAP.md`** — qué está completado y qué falta. Es la fuente de verdad entre sesiones.
  - Al empezar una sesión de trabajo: leer este archivo primero para recuperar contexto (qué se dejó pendiente, decisiones tomadas, drift de BD conocido, etc.).
  - Al terminar una tarea no trivial (fix, feature, migración): agregar una entrada en "✅ Completado" con fecha y, si aplica, el hash del commit. Si queda algo pendiente derivado del trabajo, agregarlo en "🔜 Pendiente".
  - No borrar contexto histórico útil (el "por qué" de una decisión) solo por prolijidad.
- **`docs/MIGRACION-VPS.md`** — plan y hallazgos de la migración de Vercel+Supabase a un VPS con Dokploy. Consultar antes de asumir cómo se despliega o dónde vive la BD.

## Convenciones de base de datos

- **Este repo NO usa `prisma migrate`**. Los cambios de esquema se aplican manualmente en el SQL Editor de Supabase, **antes** de desplegar el código que los requiere (ver nota en `ROADMAP.md`).
- Los SQL versionados viven en `prisma/migrations/*.sql` (nombre libre, no numerado — no es el formato estándar de Prisma). Son scripts de referencia/diagnóstico, no se ejecutan automáticamente.
- **Antes de asumir que `schema.prisma` coincide con producción**, especialmente si aparece un error `P2022` (columna no existe) o `P2021` (tabla no existe): la producción ha tenido drift real varias veces (columnas que existen en la BD y no en el schema, o viceversa). Verificar con una consulta de solo lectura a `information_schema.columns`/`information_schema.tables` antes de escribir una migración a ciegas.
- Nunca pedir ni manejar credenciales de producción (`DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, etc.) directamente en la conversación — pedir al usuario que corra las consultas/SQL él mismo en el SQL Editor de Supabase y comparta el resultado.
- **Deploy**: push a `main` → autodeploy en Vercel (`intranet.centrocontable.cl`). Las variables `NEXT_PUBLIC_*` se incrustan en build time — si se agregan/cambian en Vercel, hace falta un redeploy (idealmente sin build cache) para que tomen efecto.

## Seguimiento de tareas dentro de una sesión

Usar la herramienta de TodoWrite para trabajo multi-paso dentro de la conversación activa. Eso cubre la continuidad *dentro* de una sesión; `docs/ROADMAP.md` cubre la continuidad *entre* sesiones.
