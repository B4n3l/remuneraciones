# Design: Previred Indicators API + Ley 21.735 Rate Split

## Technical Approach

Two coordinated deliverables. (1) A new self-contained Node+TS microservice (`services/indicadores-api/`, Docker-ready, candidate to split into its own git repo at deploy time) that owns Previred PDF + SII circular scraping, monthly cron, in-memory cache, and serves the contract via `GET /indicadores` guarded by `X-API-Key`. (2) In-repo changes: Ley 21.735 split rates, derived `seguroSocialRate`, finalized-period guard, zod schemas, manual SQL migration, admin UI. Both specs (`previred-api`, `indicadores-sync`) are satisfied; the engine is untouched (verified: `simple-engine.ts` consumes no rate).

## Architecture Decisions

### Decision: Microservice stack

| Option | Tradeoff | Decision |
|---|---|---|
| Hono (node adapter) | ~10KB, TS-first, trivially Dockerized | **Chosen** |
| Fastify | Rich plugins/validation, heavier footprint | Rejected — single endpoint, no plugin need |
| Express | Mature but untyped core | Rejected |

pino structured logging; zod contract validation (mirrors repo style); node-cron in-process (day 1–3, 06:00 America/Santiago) plus authed `POST /cron/refresh` for ops/external schedulers. Cache: in-memory `Map<"YYYY-MM", {data, fetchedAt}>` — single-instance service; the repo DB is the durable store. Redis only if multi-instance later (VPS). API key: `INDICADORES_SERVICE_API_KEY` env, constant-time compare (`crypto.timingSafeEqual`), `X-API-Key` header, `401` before any scrape/cache read.

### Decision: Parser versioning and no-partial-serve

`parsePreviredV1(text, year, month)` extracts by anchored section headings with tolerant es-CL numeric parsing (`1.234,56`). Missing required field → `ParseError` listing the missing fields → alert + error response, never partial data (spec). SII tramos: top bracket `hasta=null`. Fallback: mindicador.cl for UF/UTM/UTA only; if still incomplete after fallback → alert, no serve. SII/Previred source URLs are env-configurable for drift recovery.

### Decision: seguroSocialRate population (pending decision — resolved: option a)

| Option | Tradeoff | Decision |
|---|---|---|
| (a) Derive server-side at every write | Column always = rentaProtegida + expectativaVida + sis (0.9+0.5+2.0=3.4); keeps NOT NULL; audit-consistent | **Chosen** |
| (b) Nullable, legacy-only | Requires ALTER DROP NOT NULL; column meaningless for new rows | Rejected |
| (c) Drop from writes | NOT NULL fails on create; no consistency guarantee | Rejected |

Shared helper `deriveSeguroSocialRate()` in `lib/indicadores/rates.ts` (sum, round 3 decimals), called from sync.ts, admin POST/PUT, duplicate, config create. Microservice contract excludes the field (decision #5), so `externalIndicadorSchema` omits it and sync derives before write. Existing rows: migration does NOT touch `seguroSocialRate` (spec: no overwrite). New columns are NULLABLE; backfilled only for rows `>= 2024-09` (Ley 21.735 in force) with the legal 0.9/0.5; earlier rows stay NULL — harmless, engine doesn't read them. UI: three split rates editable, `seguroSocialRate` read-only audit display.

### Decision: Finalized-period guard

`checkPeriodoFinalizado(year, month)` in new `lib/indicadores/period-guard.ts`: `PayrollPeriod.findMany({ where: { yearMonth: `${year}-${String(month).padStart(2,"0")}`, status: { in: [LIQUIDADA, PAGADA] } } })` — non-empty aborts. Called inside `syncIndicadoresFromAPI` (covers manual sync and calculate fallback) and explicitly in the calculate route before the fallback fetch (avoids a wasted network call). BORRADOR/none → overwrite allowed (current delete+create).

## Data Flow

```
Previred PDF ─┐
SII circular ─┼─► parseV1 ─► zod contract ─► cache Map ─► GET /indicadores?year&month (X-API-Key)
mindicador ───┘      │                                  ▲
                     └─ ParseError ─► alert ── 404/500 ──┘

Repo: sync.ts ─► guard? ─► fetch microservice ─► zod external ─► derive seguroSocial ─► tx delete+create
      calculate/route ─► guard? ─► (skip sync, return missing-indicators 400)
```

## File Changes

| File | Action | Description |
|---|---|---|
| `services/indicadores-api/{src/{index,app,auth,cache,cron,contract,alert,config}.ts, src/routes/{health,indicadores,cron}.ts, src/scrapers/{previred,sii,fallback}.ts, src/parsers/{previred-v1,numeric}.ts, Dockerfile, .env.example, package.json, tsconfig.json}` | Create | Standalone microservice (own package.json; split-ready) |
| `prisma/schema.prisma` | Modify | `rentabilidadProtegidaRate`, `expectativaVidaRate` — `Decimal? @db.Decimal(5,3)` on IndicadorMensual |
| `prisma/migrations/add_ley21735_split_rates.sql` | Create | Idempotent `ADD COLUMN IF NOT EXISTS` + conditional backfill; no overwrite |
| `lib/indicadores/rates.ts` | Create | Rate constants (0.9 / 0.5 / 2.0) + `deriveSeguroSocialRate` |
| `lib/indicadores/period-guard.ts` | Create | `checkPeriodoFinalizado` |
| `lib/indicadores/sync.ts` | Modify | `baseIndicadorSchema`/`externalIndicadorSchema`, guard, derive, new fields |
| `app/api/admin/indicadores/route.ts` | Modify | `indicadorSchema` split rates; POST derives + writes new fields |
| `app/api/admin/indicadores/[id]/route.ts` | Modify | PUT new fields + derive (+ zod validation — currently writes raw body) |
| `app/api/admin/indicadores/duplicate/route.ts` | Modify | Copy new fields + derive |
| `app/api/admin/config/route.ts` | Modify | Defaults sisRate 2.0 + split fields + derive |
| `app/api/payroll/calculate/route.ts` | Modify | Guard before fallback sync (line ~82) |
| `app/dashboard/admin/indicadores/page.tsx` | Modify | 3 editable rates (default 0.9/0.5/2.0), seguroSocial read-only, interface |
| `lib/payroll/simple-engine.ts` | None | Verified — no rate consumption |

## Interfaces / Contracts

`200` contract (no `seguroSocialRate`): `{ year, month, valorUF, valorUTM, valorUTA, sueldoMinimo, sueldoMinimoCasaPart, sueldoMinimoMenores, sueldoMinimoNoRem, topeImponibleAFP, topeImponibleINP, topeSeguroCesantia, sisRate, rentabilidadProtegidaRate, expectativaVidaRate, apvTopeMensualUF, apvTopeAnualUF, afpRates[], cesantiaRates[], asignacionFamiliar[], impuestoTramos[] }`. Errors: `{ error: string }` (401/400/404/500).

Zod (repo): `baseIndicadorSchema` = current minus `seguroSocialRate`, split rates `number().min(0).max(100)`; `indicadorSchema = baseIndicadorSchema` (admin); `externalIndicadorSchema = baseIndicadorSchema.extend({ impuestoTramos })` (microservice). `seguroSocialRate` never in inputs — only derived.

## Testing Strategy

| Layer | What | Approach |
|---|---|---|
| Unit (microservice) | parsers, es-CL numeric, tramos, contract | vitest (new dep in microservice only) |
| Route (microservice) | 401 (no work), 400, 404, 200-cached | Hono `app.request` |
| Repo | build, lint, guard behavior | `npm run build` + `npm run lint` + manual API checks + drift SQL query |

## Threat Matrix

N/A — no shell/subprocess/VCS/PR-automation/executable-classification boundary in this change; the HTTP auth boundary is covered by spec scenarios (401 no-work, 400 params, 404 no-data).

## Migration / Rollout

1. Drift check first: user runs read-only `information_schema.columns` query on `IndicadorMensual` in Supabase SQL Editor and shares output (P2022/P2021 precedent). 2. Apply `add_ley21735_split_rates.sql` before deploying code. 3. Deploy microservice (local/Railway/Fly now, Docker for VPS later); set `INDICADORES_SERVICE_API_KEY` + URLs. 4. Deploy repo code. Rollback: `git revert` code; revoke microservice API key / disable cron; SQL is additive — no revert needed.

## Open Questions

None — pending decision resolved (option a: derive server-side).