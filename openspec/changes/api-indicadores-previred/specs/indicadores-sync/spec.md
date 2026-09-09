# indicadores-sync Specification

## Purpose

The in-repo side of the Previred indicators change: split the single `seguroSocialRate` into three Ley 21.735 rates, keep `seguroSocialRate` for audit/history, add a finalized-period protection guard on all sync paths, and extend the zod schemas and admin UI to the new fields.

## Requirements

### Requirement: Split Ley 21.735 rates in schema

`IndicadorMensual` MUST add `rentabilidadProtegidaRate` and `expectativaVidaRate` columns and MUST keep `seguroSocialRate` (additive migration, verified against production before any removal). `sisRate` default becomes `2.0`.

- GIVEN the manual SQL migration is applied to Supabase
- WHEN the Prisma schema is regenerated
- THEN `rentabilidadProtegidaRate` and `expectativaVidaRate` exist as Decimal fields and `seguroSocialRate` is retained

- GIVEN production has existing `seguroSocialRate` data
- WHEN the migration runs
- THEN no existing `seguroSocialRate` value is dropped or overwritten

### Requirement: External contract accepts split rates

The external sync contract (microservice output) MUST provide `rentabilidadProtegidaRate` and `expectativaVidaRate` alongside `sisRate`. The repo's `externalIndicadorSchema` MUST extend `indicadorSchema` with `impuestoTramos` and validate the split-rate fields.

- GIVEN the microservice returns the full contract with `impuestoTramos`
- WHEN `externalIndicadorSchema.parse` runs
- THEN the split rates and `impuestoTramos` (desde/hasta/factor/cantidadRebajar) validate and the transaction writes them

### Requirement: zod schemas

`indicadorSchema` MUST add `rentabilidadProtegidaRate` and `expectativaVidaRate` as `number().min(0).max(100)`, mirroring `sisRate`/`seguroSocialRate`.

- GIVEN an admin creates/edits an indicador
- WHEN the payload omits the new rate fields
- THEN validation rejects with a zod error
- AND when all three split rates are present the save succeeds

### Requirement: Finalized-period guard on manual sync

The manual sync path (`syncIndicadoresFromAPI`) MUST abort if any `PayrollPeriod` with matching `yearMonth` is `LIQUIDADA` or `PAGADA`. `BORRADOR` periods MAY be overwritten (delete+create, current behavior).

- GIVEN a `PayrollPeriod` for the target `yearMonth` exists with status `LIQUIDADA` or `PAGADA`
- WHEN `syncIndicadoresFromAPI(year, month)` runs
- THEN the sync aborts with an error and the existing `IndicadorMensual` is NOT deleted or replaced

- GIVEN a `PayrollPeriod` for the target `yearMonth` is `BORRADOR` (or does not exist)
- WHEN the sync runs for an existing `IndicadorMensual`
- THEN the delete+create overwrite is permitted and completes

### Requirement: Finalized-period guard on calculate fallback

The on-the-fly fallback in `app/api/payroll/calculate/route.ts` (line ~82) MUST apply the same guard before calling `syncIndicadoresFromAPI`.

- GIVEN `IndicadorMensual` is missing and a `PayrollPeriod` for that `yearMonth` is `LIQUIDADA` or `PAGADA`
- WHEN `POST /api/payroll/calculate` reaches the fallback
- THEN it does NOT sync and returns the missing-indicators error

- GIVEN `IndicadorMensual` is missing and no finalized `PayrollPeriod` exists
- WHEN the fallback runs
- THEN it syncs and proceeds with the fetched indicators

### Requirement: Admin UI shows split rates

The admin form/table (`app/dashboard/admin/indicadores/page.tsx`) MUST display and edit `rentabilidadProtegidaRate` and `expectativaVidaRate`, and MUST show `sisRate` (default `2.0`). `seguroSocialRate` MAY remain visible read-only for audit.

- GIVEN an admin opens the Indicadores page
- WHEN editing an existing indicador
- THEN the form shows editable fields for all three split rates
- AND saving persists them to the new columns

## Edge Cases Covered

- Period `LIQUIDADA`/`PAGADA` targeted by sync: blocked (manual + fallback).
- Period `BORRADOR` with previous items: overwrite allowed.
- Month with no `IndicadorMensual` and no finalized period: fallback sync runs.
- Microservice returns missing split-rate fields: zod rejects; no partial write.
- New rate fields absent on legacy create payloads: validation error.
- `impuestoTramos` present vs absent from external payload: both validated.