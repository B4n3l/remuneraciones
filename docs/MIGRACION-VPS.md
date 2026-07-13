# Migración: Vercel + Supabase → VPS con Dokploy

Runbook para mover **todo** (app Next.js + PostgreSQL + archivos) a un VPS administrado con [Dokploy](https://dokploy.com). Estado: **planificado, no ejecutado**. Ver pendientes inmediatos en [ROADMAP.md](ROADMAP.md).

_Última actualización: 2026-07-12_

## Decisiones tomadas

- **Todo al VPS**: app + PostgreSQL en el mismo VPS, administrado con Dokploy (Docker + Traefik + Let's Encrypt).
- **Storage = filesystem del VPS** (volumen Docker montado en la app), reemplaza Supabase Storage.
- **No adoptar `prisma migrate`** por ahora: la BD nueva nace de un `pg_restore` completo; seguimos con `prisma db push` + SQL crudos versionados (renombrar `prisma/migrations/` → `prisma/sql/` al implementar).

## Hallazgos clave (exploración 2026-07-12 — no re-explorar)

- **La autenticación NO usa Supabase Auth.** Es NextAuth v5 Credentials (JWT + bcrypt + Prisma) en `auth.ts`/`middleware.ts`. 100% portable sin cambios de código.
- Supabase se usa **solo en 2 capas**: PostgreSQL (vía `DATABASE_URL`) y Storage (`@supabase/supabase-js` en solo 4 archivos: `lib/supabase.ts`, `lib/storage.ts`, `app/api/documentos/route.ts`, `app/api/documentos/[id]/route.ts`).
- Buckets: `worker-documents` (público, PDFs generados de contratos/vacaciones) y `documentos-clientes` (privado, signed URLs 60s, portal de clientes).
- La BD guarda solo **paths relativos** (`storagePath`/`comprobantePath`), nunca URLs → los archivos se migran 1:1 sin tocar datos.
- Sin Realtime, Edge Functions, RPC ni RLS. Sin `vercel.json`. La autorización es a nivel de aplicación (filtros Prisma por rol/`UserCompany`).

## ¿Se cae el login al migrar? NO

- Usuarios y contraseñas (hashes bcrypt) viven en la tabla `User` — viajan dentro del dump.
- Las sesiones son JWT firmados con `NEXTAUTH_SECRET`, no se guardan en BD:
  - Mismo `NEXTAUTH_SECRET` en el destino → sesiones activas siguen válidas.
  - Secret nuevo → único efecto: re-login de todos. Nada más.
- `NEXTAUTH_URL` debe apuntar al dominio donde corre la app (local: `http://localhost:3000`; VPS: `https://intranet.centrocontable.cl`), si no fallan cookies/redirects.

## Migración de la base de datos (se puede hacer independiente del resto)

**Convivencia válida**: la app puede apuntar al PG nuevo y seguir usando Supabase Storage hasta completar la Fase A. Migrar solo la BD es un paso seguro e intermedio.

### 0. Prerequisito
Aplicar `prisma/migrations/horas_extra_decimal.sql` en el Supabase SQL Editor **antes** del dump (así el dump sale alineado con `schema.prisma` y con el commit `e6f76d0` pendiente de push):

```sql
ALTER TABLE "PayrollItem"
  ALTER COLUMN "horasExtra" TYPE DECIMAL(5,2) USING "horasExtra"::DECIMAL(5,2),
  ALTER COLUMN "horasExtra" SET DEFAULT 0;
```

### 1. Cliente PostgreSQL en la Mac
```bash
brew install libpq && brew link --force libpq
```

### 2. Dump desde Supabase
⚠️ Usar **puerto 5432 (session mode)**, NUNCA el pooler 6543 (`pg_dump` necesita sesión real):

```bash
pg_dump "postgresql://postgres.<PROJECT_REF>:<PASSWORD>@aws-1-us-east-1.pooler.supabase.com:5432/postgres" \
  -Fc --no-owner --no-privileges --schema=public \
  -f remuneraciones-$(date +%Y%m%d).dump
```
- `--schema=public`: excluye schemas internos de Supabase (`auth`, `storage`, …).
- `--no-owner --no-privileges`: evita errores por roles de Supabase inexistentes en destino.

### 3. Restore

**PG local (ensayo):**
```bash
createdb remuneraciones
pg_restore --no-owner --no-privileges -d remuneraciones remuneraciones-*.dump
```

**PG del VPS (contenedor Dokploy, sin puerto expuesto):**
```bash
scp remuneraciones-*.dump root@<IP_VPS>:/root/
ssh root@<IP_VPS>
docker ps --format '{{.Names}}' | grep -i post          # identificar contenedor
docker cp /root/remuneraciones-*.dump <CONTENEDOR>:/tmp/db.dump
docker exec -it <CONTENEDOR> pg_restore -U remuneraciones -d remuneraciones \
  --no-owner --no-privileges --clean --if-exists /tmp/db.dump
docker exec <CONTENEDOR> rm /tmp/db.dump
```

### 4. Apuntar la app y verificar
```bash
# DATABASE_URL nueva — SIN ?pgbouncer=true (PG directo)
DATABASE_URL="postgresql://usuario:password@host:5432/remuneraciones"
```
- `npx prisma migrate diff --from-url "<nueva URL>" --to-schema-datamodel prisma/schema.prisma` → "No difference detected".
- Counts iguales en ambos lados: `SELECT count(*) FROM "User"` / `"Worker"` / `"PayrollItem"` / `"IndicadorMensual"`.
- Levantar la app contra la nueva BD y **loguearse con el usuario de siempre** (valida que la auth viajó intacta).

## Fase A — Cambios de código (local, antes del VPS)

1. **`lib/storage.ts` nuevo** basado en `fs/promises`, raíz `STORAGE_PATH` (default `./storage`). Layout: `STORAGE_PATH/<bucket>/<storagePath>` (preserva los paths de la BD). Funciones: `saveFile` (flag `wx`), `readFile`, `deleteFile` (idempotente), `sanitizeFileName`, anti path-traversal. Mantener firma de `uploadWorkerDocument()` → `{ path }`. Eliminar `lib/supabase.ts` y `getDownloadUrl()`.
2. **Rutas de descarga autenticadas** (reemplazan URLs públicas/firmadas):
   - Nueva `app/api/documentos/[id]/download/route.ts` (mismos checks de empresa/rol que el GET actual; responde Buffer con Content-Type/Disposition).
   - GET `app/api/documentos/[id]` pasa a devolver `{ url: "/api/documentos/<id>/download", ... }` → el portal no se toca.
   - Nueva `app/api/workers/[id]/documents/[docId]/download/route.ts` (rechaza rol CLIENTE, `inline`).
   - Conectar botón Ver/Descargar de `DocumentosExtras.tsx` (hoy placeholder sin onClick).
3. **Eliminar supabase-js**: `npm uninstall @supabase/supabase-js`, borrar las 4 env vars `*SUPABASE*`.
4. **Docker**: `output: "standalone"` en `next.config.ts` + `Dockerfile` multi-stage `node:22-alpine` (con `openssl` para Prisma, usuario no-root uid 1001, `/app/storage`) + `.dockerignore`. Agregar `storage/` a `.gitignore`.
5. Renombrar `prisma/migrations/` → `prisma/sql/`.

## Fase B — VPS con Dokploy

1. VPS Ubuntu 22.04/24.04, ≥2 vCPU/4 GB (o swap 2 GB). `curl -sSL https://dokploy.com/install.sh | sh`. Firewall 80/443/22; restringir la UI :3000.
2. **PostgreSQL**: servicio Database, `postgres:17-alpine`, db/user `remuneraciones`, volumen automático, **sin External Port** (red interna Docker).
3. **App**: Application desde GitHub `B4n3l/remuneraciones` main, autodeploy ON, build Dockerfile. Volume Mount `remuneraciones-files` → `/app/storage`. Env: `DATABASE_URL` interna, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `STORAGE_PATH=/app/storage`.
4. **Dominio**: bajar TTL de `intranet.centrocontable.cl` a 300s con 24-48h de antelación. Dokploy → Domains con HTTPS/Let's Encrypt. Probar antes con dominio temporal (`*.sslip.io` o staging).

## Fase C — Migración de archivos

Script `scripts/migrate-storage.mjs` (correr con `npx --package @supabase/supabase-js@2` y las keys de Supabase): lista recursivamente los 2 buckets (`storage.list()` por carpeta; carpeta = `item.id === null`), descarga a `./storage-export/<bucket>/<path>`. Luego `rsync` al VPS → mountpoint del volumen (`docker volume inspect -f '{{.Mountpoint}}'`) → `chown -R 1001:1001`.

Verificación: `find | wc -l` + `du -sh` local vs VPS; cross-check con counts de `DocumentoCliente`/`DocumentoTrabajador`; descargar 2-3 documentos por la UI.

## Fase D — Cutover y post

1. **Corte** (~1h, un usuario interno): freeze → SQL pendientes en Supabase → dump final + restore `--clean` → re-sync rsync → confirmar `NEXTAUTH_URL` prod + redeploy → DNS A record al VPS → verificación → quitar dominio de Vercel (sin borrar proyecto).
2. **Rollback** (colchón 7-14 días): re-apuntar DNS a Vercel (~5 min). Supabase/Vercel intactos hasta confirmar.
3. **Backups**: Dokploy → Database → Backups cron diario (S3-compatible o local, retención 14) + crontab del host con `tar czf` del volumen de archivos. **Probar una restauración** antes de cerrar.
4. Reescribir `DEPLOYMENT.md` (flujo Dokploy) y actualizar `ROADMAP.md`.
5. **Día +14**: borrar proyecto Vercel; pausar → borrar Supabase (con dump + export final de respaldo); rotar/descartar keys.

## Checklist de verificación post-cutover

1. HTTPS válido en intranet.centrocontable.cl.
2. Login CONTADOR/SUPER_ADMIN y CLIENTE (portal lista solo sus documentos).
3. Descargar documento migrado desde el portal.
4. Subir documento nuevo → descargable (volumen escribible uid 1001).
5. Generar Contrato/Vacaciones → botón Ver/Descargar funciona.
6. Eliminar documento → desaparece de BD y disco.
7. CLIENTE → documento de otra empresa = 403; API sin cookie = 401.
8. Rebuild Dokploy → archivos persisten. Reboot VPS → todo levanta solo.
9. Backup nocturno de PG + tar de archivos generados; probar restaurar uno.

**Orden**: Fase A completa en local → B → C (ensayo) → D (cutover).
