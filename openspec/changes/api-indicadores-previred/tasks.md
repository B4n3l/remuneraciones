# Tasks: Previred Indicators API + Ley 21.735 Rate Split

## Review Workload Forecast

```text
Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High
```

Remaining authored: API P1 ~330 · P2 ~310 · repo rutas+UI ~240 (repo-lib ~240 DONE, PR open). API → `cgomezadolfo/API-Indicadores-Previsionales` (P1→P2 stacked); repo chain: merge repo-lib PR → rutas+UI PR. Threat matrix N/A → no RED tasks. Verify: `pytest` (API) · `lint`+`tsc`+`build` (repo).

### Suggested Work Units

| Unit | Goal | PR | Test cmd | Runtime | Rollback |
|------|------|----|----------|---------|----------|
| A | SII data layer: config, model+migration, sii.py, persist/merge | API P1 | `pytest tests/test_sii_parser.py tests/test_parser.py` | N/A: live SII flaky; fixtures prove; live check 5.4 | Revert model/migration/sii/fetcher diffs |
| B | Flat contract + no-partial guard + `{error}` + Docker env | API P2 | `pytest tests/test_flat_contract.py tests/test_api.py` | curl 2026/6 flat 200 (X-API-Key); partial → 500 `{error}` | Revert services/routers/main/Docker diffs |
| C | Repo routes + admin UI; calculate guard | Repo PR (post repo-lib) | `npm run lint && npm run build` | PUT sans rates → 400; with → 200 | Revert route/page diffs |

## Phase 1: Python API — SII data layer (API P1)

- [x] 1.1 `app/config.py`: `sii_circular_url` ({year} placeholder); fixed-rate Decimals 0.9 / 0.5
- [x] 1.2 `app/models.py`: `ImpuestoTramo` (FK period cascade, `hasta` nullable); `Period.impuesto_tramos`
- [x] 1.3 Alembic `add_impuesto_tramos`: table `impuesto_tramos` + FK + unique(period_id, desde)
- [x] 1.4 `app/scraper/sii.py` (new): anchor "MENSUAL" + month heading → tramos; SIIParseError on drift
- [x] 1.5 `app/scraper/previred.py`: add `impuesto_tramos` to REQUIRED_SECTIONS
- [x] 1.6 `app/services/indicators.py`: persist tramos in `save_parsed` (delete+insert on replace)
- [x] 1.7 `app/services/fetcher.py`: fetch/parse SII, merge tramos pre-validate; failure → partial + fetch_log
- [x] 1.8 Tests `test_sii_parser.py` + `fixtures/sii.html`: month anchor, top `hasta=None`, drift raises
- [x] 1.9 Verify: `pytest tests/test_sii_parser.py tests/test_parser.py`

## Phase 2: Python API — flat contract & guard (API P2)

- [x] 2.1 `indicators.py`: `assert_complete_period` — refuse status!=complete or no tramos
- [x] 2.2 `indicators.py`: `build_flat_contract` — English keys, raw-UF topes/APV, lists, sisRate, fixed 0.9/0.5
- [x] 2.3 `routers/indicators.py`: public GET → flat; incomplete 500 `{error}`; 400/404 `{error}`; keep admin category endpoints
- [x] 2.4 `main.py`: global handler → `{error}` (400/401/404/500)
- [x] 2.5 Dockerfile/`docker-compose.yml`/`.env.example`: expose `SII_CIRCULAR_URL`; env-gated scheduler + healthcheck present
- [x] 2.6 Tests `test_flat_contract.py`: complete fixture → flat shape, fixed rates, raw UF, top `hasta=None`
- [x] 2.7 `tests/test_api.py`: flat GET body; 500 `{error}` on partial; migrate old asserts
- [x] 2.8 Verify: full `pytest`; curl 401/400/404/200/500

## Phase 3: Repo schema, SQL & lib — DONE (feature/indicadores-api-repo-lib, PR open; merge after 5.1–5.2)

- [x] 3.1 prisma/schema.prisma: split rates `Decimal? @db.Decimal(5,3)` on IndicadorMensual
- [x] 3.2 `prisma/migrations/add_ley21735_split_rates.sql`: idempotent ADD COLUMN, backfill `>= 2024-09`, keep seguroSocialRate
- [x] 3.3 `lib/indicadores/rates.ts`: constants + deriveSeguroSocialRate()
- [x] 3.4 `lib/indicadores/period-guard.ts`: checkPeriodoFinalizado blocks LIQUIDADA/PAGADA
- [x] 3.5 `lib/indicadores/sync.ts` (+ `schema.ts`): base/external schemas, guard, derive
- [x] 3.6 Verified: tsc + build on branch; drift SQL recorded (apply in 5.2)

## Phase 4: Repo routes & admin UI (next repo PR, after repo-lib merge)

- [ ] 4.1 `app/api/admin/indicadores/route.ts`: split rates min(0).max(100); POST derives + writes
- [ ] 4.2 `[id]/route.ts` PUT: parse via indicadorSchema (security fix); split fields + derive
- [ ] 4.3 duplicate/route.ts: copy split fields + derive
- [ ] 4.4 config/route.ts: defaults sisRate 2.0 + split fields + derive
- [ ] 4.5 calculate/route.ts (~82): guard pre-fallback; finalized → missing-indicators error
- [ ] 4.6 page.tsx: 3 editable rates (0.9/0.5/2.0); seguroSocial read-only
- [ ] 4.7 Verify: lint, tsc, build; sync vs Dokploy URL + X-API-Key; PUT sans rates 400, with 200

## Phase 5: Manual rollout & validation (ops — outside apply)

- [ ] 5.1 Drift check: SQL migration vs Supabase `information_schema`
- [ ] 5.2 Apply SQL on Supabase; `npx prisma generate`; no P2022/P2021
- [ ] 5.3 Merge repo-lib PR; (re)base rutas+UI branch
- [ ] 5.4 Merge API P1+P2; deploy Dokploy IndicadoresPrevisionales (DATABASE_URL, ADMIN_API_KEY, SII_CIRCULAR_URL, SCHEDULER_ENABLED=true)
- [ ] 5.5 Repo env: `INDICADORES_API_URL=https://<dokploy>/api/v1/indicadores` + `INDICADORES_API_KEY`
- [ ] 5.6 Validate: /health, manual fetch, sync one period; flat contract + DB rows
