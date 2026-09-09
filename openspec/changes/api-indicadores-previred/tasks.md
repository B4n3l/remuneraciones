# Tasks: Previred Indicators API + Ley 21.735 Rate Split

## Review Workload Forecast

```text
Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High
```

Changed lines: PR1a ~450 · PR1b ~550 · PR2 ~165 · PR3 ~240; total ~1,400 authored.

Repo: lint/tsc/build; micro: `npm test` (vitest). Threat matrix N/A → no RED tests.

### Suggested Work Units

| Unit | Goal | PR | Test cmd | Runtime harness | Rollback |
|------|------|-----------|--------------|-----------------|-------------------|
| A | Microservice core: scaffold, config, contract, auth, cache, routes | PR1a | `npm test` | dev + curl key/no-key → 401/400/404/200 | Delete services/ |
| B | Parsers, scrapers, cron, alert | PR1b | `npm test` | POST /cron/refresh → 200 contract | Same tree |
| C | Schema + SQL + lib rates/guard/sync | PR2 | tsc + build | sync LIQUIDADA aborts, BORRADOR ok | Revert schema/sync.ts |
| D | Admin/config/calculate routes + UI | PR3 | lint + build | PUT sans rates → 400, with → 200 | Revert route/page diffs |

PR1a+PR1b = stacked PR1; PR1a opens chain; strategy pending.

## Phase 1: Microservice core (PR1a)

- [x] 1.1 Create `services/indicadores-api/{package.json,tsconfig.json,Dockerfile,.env.example}` (dev/build/test)
- [x] 1.2 Create `src/config.ts`: API key, source URLs, alert target
- [x] 1.3 Create `src/contract.ts` zod contract: split rates 0.9/0.5/2.0, no seguroSocialRate, impuestoTramos
- [x] 1.4 Create `src/auth.ts`: timingSafeEqual X-API-Key; 401 before any work
- [x] 1.5 Create `src/cache.ts`: Map<"YYYY-MM",{data,fetchedAt}>
- [x] 1.6 Create app/index + `src/routes/{health,indicadores,cron}.ts`; errors `{error}` (400/401/404/500)
- [x] 1.7 Vitest: contract, auth 401, routes 400/404/200-cache
- [x] 1.8 Verify: `npm test`, tsc, curl matrix

## Phase 2: Microservice scrapers & cron (PR1b)

- [x] 2.1 Create `src/parsers/numeric.ts`: es-CL parsing (1.234,56)
- [x] 2.2 Create `src/parsers/previred-v1.ts`: anchored sections; ParseError w/ missing fields
- [x] 2.3 Create `src/scrapers/{previred,sii,fallback}.ts`; fallback mindicador (UF/UTM/UTA)
- [x] 2.4 Create `src/cron.ts` (day 1–3 06:00) + `src/alert.ts`
- [x] 2.5 No-partial-serve: incomplete → alert + error, never serve
- [x] 2.6 Vitest: numeric, drift fixtures, top tramo hasta=null

## Phase 3: Schema, SQL & repo lib (PR2)

- [ ] 3.1 prisma/schema.prisma: add both split rates `Decimal? @db.Decimal(5,3)` to IndicadorMensual
- [ ] 3.2 Create `prisma/migrations/add_ley21735_split_rates.sql`: idempotent ADD COLUMN, backfill `>= 2024-09`, keep seguroSocialRate
- [ ] 3.3 Create `lib/indicadores/rates.ts`: constants + deriveSeguroSocialRate()
- [ ] 3.4 Create `lib/indicadores/period-guard.ts`: checkPeriodoFinalizado blocks LIQUIDADA/PAGADA
- [ ] 3.5 Modify `lib/indicadores/sync.ts`: base/external schemas, guard, derive; break route import cycle
- [ ] 3.6 Verify: tsc, build; record drift SQL

## Phase 4: Repo routes & admin UI (PR3)

- [ ] 4.1 admin/indicadores/route.ts: split rates min(0).max(100); POST derives + writes
- [ ] 4.2 `[id]/route.ts` PUT: parse via indicadorSchema (security fix — raw body today), split fields + derive
- [ ] 4.3 duplicate/route.ts: copy split fields + derive
- [ ] 4.4 config/route.ts: defaults sisRate 2.0, split rates, derive
- [ ] 4.5 calculate/route.ts (~82): guard pre-fallback; finalized → missing-indicators error
- [ ] 4.6 page.tsx: 3 editable rates (0.9/0.5/2.0), seguroSocial read-only
- [ ] 4.7 Verify: lint, build; PUT sans rates → 400, with → 200
