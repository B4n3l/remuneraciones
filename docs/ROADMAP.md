# Roadmap — Sistema de Liquidación de Remuneraciones

Estado del proyecto: qué está hecho y qué falta. Actualizar este archivo al completar o planificar trabajo.

_Última actualización: 2026-07-12_

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
- Next.js 16.2.6 (actualización de seguridad) (`52b6c88`).
- Ficha de trabajador con gestión de documentos y vacaciones (`2e99307`).
- Raíz del sitio migrada a intranet: `/` redirige a login o dashboard (`1f799e8`).
- Landing page para la firma contable (`005ef5f`).
- Indicadores previsionales mensuales con formulario de carga (`9720f4a`).

## 🔜 Pendiente

### Fase 2 (funcionalidades)
- [ ] **Actualización automática UF/UTM**: integrar API mindicador.cl.
- [ ] **Libro de Remuneraciones**: reporte mensual consolidado.
- [ ] **Notificaciones por email**: envío automático de liquidaciones.
- [ ] **CRUD de AFP**: administración de AFPs y sus tasas.
- [ ] **Configuración de valores del sistema**: gestión de UF/UTM/Sueldo Mínimo desde la UI.
- [ ] **Template PDF completo**: implementación final del diseño.

### Deuda técnica detectada
- [ ] **Validación Zod en las API routes de payroll** (`calculate`, `save`, PUT de períodos): hoy no validan el body; Zod solo se usa en auth, contratos e indicadores.
- [ ] **Tope de gratificación (4.75 SM/12) en el recálculo del editor**: `recalculatePayroll` en `app/dashboard/liquidaciones/[id]/editar/page.tsx` calcula la gratificación sin tope; el motor (`calcularGratificacion`) sí lo aplica. Con sueldos altos el editor puede mostrar una gratificación mayor a la legal.
- [ ] **Impuesto único con tramos reales desde BD**: `calcularImpuesto` en `simple-engine.ts` usa tramos simplificados hardcodeados.
- [ ] **Split 50%/100% de horas extra en BD**: hoy la BD guarda solo la suma en `horasExtra`; el detalle vive en el texto del concepto y se reconstruye con regex al editar. Considerar columnas dedicadas si se necesita reporting por tipo.

## 📌 Notas operativas

- **Migraciones**: este repo no usa migraciones formato Prisma; los SQL en `prisma/migrations/*.sql` se ejecutan manualmente en el Supabase SQL Editor, **antes** de desplegar el código que los requiere.
- **Deploy**: push a `main` → autodeploy en Vercel (intranet.centrocontable.cl). Variables de entorno en Vercel.
