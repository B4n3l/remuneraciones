# Roadmap — Sistema de Liquidación de Remuneraciones

Estado del proyecto: qué está hecho y qué falta. Actualizar este archivo al completar o planificar trabajo.

_Última actualización: 2026-08-10_

## ✅ Completado

### Módulo de liquidaciones
- **Horas extra con decimales (end-to-end)** — 2026-07-12
  - Inputs de HE 50%/100% aceptan decimales (ej. 8.5) en editar y nueva liquidación (`step="0.5"`, `parseFloat`).
  - Columna `PayrollItem.horasExtra` migrada de `Int` a `Decimal(5,2)` (`prisma/migrations/horas_extra_decimal.sql`).
  - La página de edición ahora **crea** la línea "Horas Extras" si la liquidación original no la tenía (y la elimina si las horas vuelven a 0) — antes solo actualizaba líneas existentes, por lo que las HE agregadas al editar no se guardaban ni aparecían en el PDF.
  - El payload de edición envía `horasExtra`/`valorHoraExtra` (antes llegaban `undefined` y se persistía 0).
  - Formato es-CL en conceptos y PDF: "Horas Extras (8,5 hrs al 50%)" vía helper `formatHorasCL` compartido.
  - Corregido enum `HORAS_EXTRAS` → `HORAS_EXTRA` en los chequeos de la página de edición.
- **Cálculo de horas extra corregido** (`1272087`) — jornada legal 42 hrs (Ley 21.561), fórmula DT centralizada en `lib/payroll/simple-engine.ts`, HE sobre sueldo contractual (no proporcional).
- Edición de liquidaciones con recálculo automático: días trabajados, sueldo proporcional, gratificación, descuentos (`a870f7d`, `74457c2`, `bf03ce6`).
- Eliminar y re-liquidar períodos con confirmación (`48ddf7f`).
- Tasas AFP y cesantía desde indicadores mensuales `IndicadorMensual` (`33addba`, `ead0fd6`).
- Generación de PDF de liquidación protegida por sesión (`52b6c88`, `13c1033`).

### Plataforma
- **Autocálculo de días hábiles en vacaciones** — 2026-08-03 (commiteado y pusheado 2026-08-10): el formulario calcula automáticamente los Días Hábiles entre inicio y fin (L-V excluyendo feriados legales chilenos); el campo queda editable como override del contador. Módulo nuevo `lib/feriados.ts` (reglas Ley 19.668 solo para San Pedro/Encuentro; Ley 20.983 fija para Virgen del Carmen/Asunción/Todos los Santos/Inmaculada + puentes 2/1 y 17/9; Ley 20.299 evangélico; excluye 31/12 bancario y regionales) + `lib/vacaciones.ts` (`calcularDiasHabiles`). Validado contra calendarios oficiales 2026 y 2027 (51 checks). Limitación conocida: no incluye feriados regionales (Arica/Chillán) ni días de elecciones.
- **IDOR en rutas de descarga corregido** — 2026-08-10: las rutas `/api/workers/[id]/vacations/[vacationId]/download` y `/api/workers/[id]/documents/[docId]/download` ahora validan acceso a empresa (`userCompany.findFirst`) además de auth + workerId match, alineándose con el patrón del resto de las API (`contracts/route.ts`).
- **Bug Decimal en la lista de trabajadores corregido** — 2026-08-03: `WorkersClientList` recibía objetos Prisma crudos con `sueldoBase` (Decimal); serializado con `JSON.parse(JSON.stringify(workers))` antes de pasar la prop (mismo patrón que el fix de la ficha del 2026-07-14).
- **Vacaciones: días disponibles + drift `fechaRegreso` alineado** — 2026-07-15
  - Pestaña Vacaciones muestra Días Devengados (1,25 días hábiles por mes completo desde `fechaIngreso`), Tomados y Disponibles. Solo cuenta vacaciones registradas en el sistema; las históricas se registran retroactivamente con el mismo formulario.
  - `Vacacion.fechaRegreso` (NOT NULL en producción) y `observacion` agregados a `schema.prisma` y `fechaRegreso` se persiste al generar el comprobante — corrige el null constraint violation al registrar vacaciones. Sin SQL: las columnas ya existían en producción.
- Next.js 16.2.6 (actualización de seguridad) (`52b6c88`).
- Ficha de trabajador con gestión de documentos y vacaciones (`2e99307`).
- Raíz del sitio migrada a intranet: `/` redirige a login o dashboard (`1f799e8`).
- Landing page para la firma contable (`005ef5f`).
- Indicadores previsionales mensuales con formulario de carga (`9720f4a`).

## 🔜 Pendiente

### Inmediato (retomar próxima sesión)
- [ ] **Confirmar en producción que "Registrar Vacaciones" genera el comprobante end-to-end** tras el fix de `fechaRegreso` (commit `1deabd0`, pusheado 2026-07-15, sin confirmar todavía por el usuario). Si falla, revisar log de Vercel para el mensaje exacto de Prisma. (Nota: los commits de la sesión 2026-08-03 fueron pusheados hoy 2026-08-10; ya se puede probar en producción.)
- [ ] **fechaRegreso debería ser siguiente día hábil, no endDate + 1 calendario** — si la vacación termina viernes, el comprobante dice que regresa sábado; legalmente debería ser lunes. Requiere usar `calcularDiasHabiles`/`esFeriadoChile` para encontrar el siguiente día hábil.
- [x] **Bug Decimal en `/dashboard/trabajadores`** (la lista, no la ficha) — **resuelto y pusheado 2026-08-10**.
- [x] Drift de schema `Vacacion`/`DocumentoTrabajador` en producción — **resuelto 2026-07-14/15**.
- [x] Bug Decimal en la ficha de trabajador — **resuelto 2026-07-14**.
- [x] Bucket de Storage `worker-documents` creado en Supabase.
- [x] Formato legal del comprobante de vacaciones restaurado — **resuelto 2026-07-15**.
- [x] **IDOR en rutas de descarga** — **resuelto 2026-08-10** (`eea7363`).

### Migración a VPS (Dokploy)
- [ ] Migrar app + PostgreSQL + archivos desde Vercel/Supabase a un VPS con Dokploy. **Plan y runbook completo en [MIGRACION-VPS.md](MIGRACION-VPS.md)**. La auth (NextAuth JWT) es portable sin cambios; la migración de BD puede hacerse como paso intermedio independiente.

### Fase 2 (funcionalidades)
- [x] **Indicadores previsionales + tramos impuesto único desde API propia** — parcialmente implementado 2026-08-10.
  - Schema Prisma: modelo `ImpuestoTramo` + relación + SQL de migración (`prisma/migrations/add_impuesto_tramo.sql`).
  - `lib/indicadores/sync.ts`: fetch a la API externa (`INDICADORES_API_URL` + `INDICADORES_API_KEY`), validación Zod extendida, upsert transaccional (delete + create) con hijos incluyendo `impuestoTramos`.
  - Botón "Sincronizar desde API" en `/dashboard/admin/indicadores` con prompt de año/mes.
  - Fallback on-the-fly en `payroll/calculate`: si no hay indicadores, intenta `syncIndicadoresFromAPI` antes de devolver 400.
  - Alerta por email vía Resend (`lib/email.ts`) a `ALERT_EMAIL` o al primer `SUPER_ADMIN` si falla la sincronización.
  - [ ] **Pendiente**: Cron mensual (post-migración VPS), política de no pisar meses con liquidaciones finalizadas, y consumo real de `ImpuestoTramo` en el motor de cálculo.
- [x] **Checkbox "Usar sueldo mínimo legal" en edición de trabajador** — implementado 2026-08-10. Columna `Worker.sueldoMinimoAuto` (BOOLEAN, default false). En el formulario de edición, al marcar el checkbox se deshabilita el input de sueldo base y se usa el último `sueldoMinimo` de `IndicadorMensual`. Tras cada sincronización exitosa de indicadores, `sync.ts` actualiza automáticamente todos los trabajadores con `sueldoMinimoAuto=true` al nuevo mínimo.
- [x] **Libro de Remuneraciones**: reporte mensual consolidado — implementado 2026-08-10. API `GET /api/payroll/libro/[companyId]?year=&month=`, PDF legal landscape, UI en `/dashboard/libro`.
- [ ] **Notificaciones por email**: envío automático de liquidaciones.
- [ ] **CRUD de AFP**: administración de AFPs y sus tasas.
- [ ] **Configuración de valores del sistema**: gestión de UF/UTM/Sueldo Mínimo desde la UI.
- [ ] **Template PDF completo**: implementación final del diseño.
- [ ] **Anexos de contrato en ficha del trabajador**: junto a "Generar Contrato" y "Registrar Vacaciones", agregar "Generar Anexo de Contrato" (modificación de cláusulas, cambio de cargo, aumento de sueldo, etc.) con PDF firmado y almacenado en `DocumentoTrabajador`.

### Deuda técnica detectada
- [x] **Validación Zod en las API routes de payroll** (`calculate`, `save`, PUT de períodos) — **resuelto 2026-08-10** (`6331fb8`).
- [x] **Tope de gratificación (4.75 SM/12) en el recálculo del editor** — **resuelto 2026-08-10** (`bb303ba`).
- [ ] **Split 50%/100% de horas extra en BD**: hoy la BD guarda solo la suma en `horasExtra`; el detalle vive en el texto del concepto y se reconstruye con regex al editar. Considerar columnas dedicadas si se necesita reporting por tipo.
- [ ] **Impuesto único con tramos reales desde BD** — **movido a Fase 2** (se consolida con la API de indicadores previsionales).

## 📌 Notas operativas

- **Migraciones**: este repo no usa migraciones formato Prisma; los SQL en `prisma/migrations/*.sql` se ejecutan manualmente en el Supabase SQL Editor, **antes** de desplegar el código que los requiere.
- **Deploy**: push a `main` → autodeploy en Vercel (intranet.centrocontable.cl). Variables de entorno en Vercel.
- **Variables de entorno pendientes** (bloqueadas hasta que el usuario desarrolle la API y renueve dominio):
  - `INDICADORES_API_URL` — la API de indicadores previsionales + tramos impuesto único está en desarrollo.
  - `INDICADORES_API_KEY` — auth de la API externa.
  - `RESEND_API_KEY` + `RESEND_FROM_EMAIL` — requiere renovar dominio para envío de emails.
