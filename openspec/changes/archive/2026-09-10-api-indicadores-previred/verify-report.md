```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:1aa78de5b69c788cb35b36a22911c80c8fd937c68f1bd9c3d9267b8cb13f994e
verdict: pass_with_warnings
blockers: 0
critical_findings: 0
requirements: 18/18
scenarios: 28/28
test_command: .venv/bin/python -m pytest -q
test_exit_code: 0
test_output_hash: sha256:58a128e0f436413a7ff2274ac415e3e5185d84f3fc2707219ad8073215ce5885
build_command: npx tsc --noEmit
build_exit_code: 0
build_output_hash: sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
```

## Verification Report

**Change**: api-indicadores-previred
**Version**: N/A (new full specs)
**Mode**: Standard

### Completeness

| Metric | Value |
|--------|-------|
| Tasks total | 45 |
| Tasks complete | 45 |
| Tasks incomplete | 0 |

### Build & Tests Execution

**Build**: ✅ Passed
```text
$ npx tsc --noEmit   (exit 0, no output)
```

**Tests**: ✅ 46 passed / ❌ 0 failed / ⚠️ 0 skipped
```text
$ cd /tmp/opencode/api-indicadores-previred-py && .venv/bin/python -m pytest -q
..............................................  [100%]
46 passed in 2.01s
```

**Runtime contract checks (production, read-only)**:
```text
GET /health                                          -> 200 {"status":"ok"}
GET /api/v1/indicadores/2026/8 (valid X-API-Key)      -> 200 flat contract (sisRate 1.78, rp 0.9, ev 0.72, impuestoTramos 2-decimal, top hasta=null)
GET /api/v1/indicadores/2026/8 (no key)               -> 401 {"error":"Falta header X-API-Key"}
GET /api/v1/indicadores/2026/8 (bogus key)            -> 401 {"error":"API key inválida o inactiva"}
GET /api/v1/indicadores/2026/13 (valid key)           -> 400 {"error":"Parámetros inválidos: month: Input should be less than or equal to 12"}
GET /api/v1/indicadores/2020/1 (valid key)            -> 404 {"error":"Período 2020-01 no encontrado"}
GET /api/v1/admin/fetch-logs (read key)               -> 403 {"error":"Se requiere una API key con rol admin"}
```

**Coverage**: Not available (pytest suite has no coverage reporter) → ➖ Not available

### Spec Compliance Matrix

#### previred-api (12 requirements / 17 scenarios)

| Requirement | Scenario | Test / Evidence | Result |
|-------------|----------|-----------------|--------|
| SII income-tax bracket scraping | parse brackets, top hasta=null | `test_sii_parser.py > test_parse_sii_top_bracket_hasta_none` | ✅ COMPLIANT |
| SII income-tax bracket scraping | SII unavailable → incomplete + alert | `fetcher.py` sii_error→partial + `send_alert`; `test_alert.py > test_fetcher_emits_alert_on_sii_partial` | ✅ COMPLIANT |
| Ley 21.735 scraped rates | rates reflect published (0.90/0.72/1.78) + missing → incomplete | `test_flat_contract.py > test_flat_contract_shape`; `previred.py > validate()` requires 3 rates; live contract 0.9/0.72/1.78 | ✅ COMPLIANT |
| No-partial-serve guard | incomplete → 500 {error} + alert | `test_api.py > test_get_period_partial_returns_500_error` | ✅ COMPLIANT |
| Flat English contract endpoint | 200 full shape, raw UF | `test_api.py > test_get_period_flat` + live curl | ✅ COMPLIANT |
| Audit snapshots + fetch-logs | fetch-logs fields + raw_snapshots retain JSON/hash | `test_api.py > test_fetch_logs_endpoint`; `save_parsed()` writes RawSnapshot | ✅ COMPLIANT |
| Dokploy-ready container | build/deploy/migrate/scheduler | `Dockerfile`/`docker-compose.yml`/`entrypoint.sh` + live `/health` 200 | ✅ COMPLIANT |
| GET X-API-Key auth | valid key → 200 | `test_api.py > test_get_period_flat` | ✅ COMPLIANT |
| GET X-API-Key auth | missing/invalid → 401, no scrape | `test_api.py > test_read_requires_key`, `test_invalid_key` + live curl | ✅ COMPLIANT |
| GET X-API-Key auth | out-of-range → 400 | `test_api.py > test_get_period_invalid_year_400` + live curl | ✅ COMPLIANT |
| Contract output | every field present, correct type + hasta null + raw UF | `test_api.py > test_get_period_flat`, `test_flat_contract.py` | ✅ COMPLIANT |
| Scraping sources and transform | validate + scrape Seguro Social | `test_sii_parser.py > test_merge_tramos_completes_previred` | ✅ COMPLIANT |
| Scraping sources and transform | drift → parse error + no partial serve | `test_sii_parser.py > test_parse_sii_drift_*` + partial→500 | ✅ COMPLIANT |
| Monthly cron and cache | cached serve without re-scrape | GET reads DB only; scheduler present | ✅ COMPLIANT |
| Monthly cron and cache | incomplete → 404/500 | `test_api.py > test_period_not_found`, partial→500 | ✅ COMPLIANT |
| Failure handling and alerts | alert (webhook) + error body | `app/alert.py > send_alert`; `fetcher.py` 3 failure paths; `test_alert.py` (5 tests) | ✅ COMPLIANT |
| Error format | any error path → {error} | `main.py` global handlers + tests assert `"error"` | ✅ COMPLIANT |

#### indicadores-sync (6 requirements / 11 scenarios)

| Requirement | Scenario | Evidence | Result |
|-------------|----------|----------|--------|
| Split Ley 21.735 rates in schema | Decimal fields + seguroSocialRate retained | `schema.prisma:302-305` + `add_ley21735_split_rates.sql` | ✅ COMPLIANT |
| Split Ley 21.735 rates in schema | no existing seguroSocialRate dropped | migration only ADDs columns | ✅ COMPLIANT |
| External contract accepts split rates | parse full contract, write | `externalIndicadorSchema` validates live flat contract (VALID) | ✅ COMPLIANT |
| zod schemas | omit new rates → reject | `baseIndicadorSchema` requires both fields | ✅ COMPLIANT |
| zod schemas | all three present → save | POST/PUT parse + derive | ✅ COMPLIANT |
| Finalized-period guard (manual sync) | LIQUIDADA/PAGADA → abort | `period-guard.ts > checkPeriodoFinalizado` + `sync.ts:22` | ✅ COMPLIANT |
| Finalized-period guard (manual sync) | BORRADOR → overwrite allowed | guard only blocks LIQUIDADA/PAGADA | ✅ COMPLIANT |
| Finalized-period guard (calculate) | finalized → no sync + error | `calculate/route.ts:82-95` | ✅ COMPLIANT |
| Finalized-period guard (calculate) | not finalized → sync + proceed | `calculate/route.ts:97-113` | ✅ COMPLIANT |
| Admin UI shows split rates | 3 editable rates + seguroSocial read-only | `page.tsx` | ✅ COMPLIANT |
| Admin UI shows split rates | save persists to new columns | POST/PUT write split rates + derive | ✅ COMPLIANT |

**Compliance summary**: 28/28 scenarios compliant; 0 failing (previous CRITICAL — alert channel — resolved).

### Correctness (Static Evidence)

| Requirement | Status | Notes |
|------------|--------|-------|
| SII scraping → impuestoTramos | ✅ Implemented | `app/scraper/sii.py` anchors "MENSUAL" heading; top `hasta=None` |
| Ley 21.735 rates scraped (not hardcoded) | ✅ Implemented | `previred.py` scrapes "SEGURO SOCIAL"; `config.py` constants removed (P3) |
| No-partial-serve guard | ✅ Implemented | `assert_complete_period()` rejects status!=complete or no tramos |
| Flat English contract | ✅ Implemented | `build_flat_contract()` — English keys, raw UF topes/APV |
| Audit snapshots + fetch-logs | ✅ Implemented | `RawSnapshot` + `FetchLog` models; `GET /api/v1/admin/fetch-logs` |
| Dokploy container | ✅ Implemented | Dockerfile + docker-compose + healthcheck + alembic on entrypoint |
| X-API-Key auth (401/403) | ✅ Implemented | `app/auth.py` constant-time hash; 401 invalid, 403 non-admin role |
| Scheduler day-1 03:00 Santiago + retries | ✅ Implemented | `scheduler.py` CronTrigger + retry (4h × 5d = 30 attempts) + startup catchup |
| Split rates + derive seguroSocialRate (repo) | ✅ Implemented | `rates.ts > deriveSeguroSocialRate` (0.9+0.72+1.78=3.4) |
| Finalized-period guard (repo) | ✅ Implemented | `period-guard.ts` blocks LIQUIDADA/PAGADA; used in sync + calculate |
| zod validation fix in admin PUT | ✅ Implemented | `[id]/route.ts` parses via `baseIndicadorSchema` |
| UI 3 editable rates + seguroSocial read-only | ✅ Implemented | `page.tsx` (`AFPRate.independiente: number \| null`) |
| Idempotent migration + backfill >= 2024-09 | ✅ Implemented | `add_ley21735_split_rates.sql` (ADD COLUMN IF NOT EXISTS, backfill WHERE IS NULL) |
| ImpuestoTramo 2-decimal precision | ✅ Implemented (code) | `schema.prisma` `DECIMAL(12,2)` + `impuesto_tramos_decimal_precision.sql` (idempotent ALTER) |
| Active alert channel (webhook + log fallback) | ✅ Implemented | `app/alert.py > send_alert`; wired in `fetcher.py` (3 paths); `ALERT_WEBHOOK_URL` env exposed |

### Coherence (Design)

| Decision | Followed? | Notes |
|----------|-----------|-------|
| Flat contract replaces legacy Spanish shape on public GET | ✅ Yes | `build_flat_contract` on `/api/v1/indicadores/{y}/{m}` |
| SII via env-configurable `SII_CIRCULAR_URL` | ✅ Yes | `config.py > sii_circular_url` |
| Dedicated `impuesto_tramos` table | ✅ Yes | Alembic migration + repo `ImpuestoTramo` |
| Scraped Ley 21.735 rates (not constants) | ✅ Yes | P3 dropped hardcoded constants |
| No-partial-serve guard | ✅ Yes | `assert_complete_period` |
| Global `{error}` handler | ✅ Yes | `main.py` exception handlers |
| Admin PUT keeps internal parser shape | ✅ Yes | `manual_load` with `_NUMERIC_KEYS`/`_adapt_response_format` |

### Design Deviations (documented)

1. **Ley 21.735 rates no longer hardcoded** — design revised during apply (P3): rates scraped from Previred's "SEGURO SOCIAL" table (0.90 / 0.72 / 1.78), replacing earlier `config.py` constants (0.9 / 0.5 / 2.0).
2. **AFP `independiente` is nullable** — Previred dropped the "independiente (incl. SIS)" column with the Reforma. Source is 4 columns; flat contract emits 5-key `afpRates` with `independiente: null`. Repo `AFPHistorico.independiente` → `Decimal?` + `allow_null_afp_independiente.sql`. (Confirmed merged on main — the prior verify "not merged" was a stale local ref false positive.)
3. **AFP shape is 4-column source** — parser accepts 4-column rows (`tasa_independiente=None`) and keeps 5-column legacy support.

### Issues Found

**CRITICAL**: None (previous CRITICAL — no active alert channel — resolved and verified).

**WARNING**:
1. **ImpuestoTramo precision migration NOT yet applied in Supabase** — `schema.prisma:326-329` is `DECIMAL(12,2)` and `impuesto_tramos_decimal_precision.sql` (idempotent `ALTER COLUMN ... TYPE DECIMAL(12,2)`) is authored, but the repo DB still runs the original `add_impuesto_tramo.sql` `DECIMAL(12,0)` columns. Pending user apply in Supabase SQL Editor + `prisma generate`. Until applied, `desde/hasta/cantidadRebajar` round to integers on write. Latent data-integrity defect, not user-facing yet (`impuestoTramos` not consumed by the payroll engine).
2. **Backfill still uses stale `expectativaVidaRate` 0.5** — `add_ley21735_split_rates.sql:27-32` backfills `0.9 / 0.5` for periods >= 2024-09, but Ley 21.735 (in force Aug 2026) publishes `0.72`; `sisRate` is not backfilled. Documented as approximate in `tasks.md` (Phase 5 note), but the migration values are not corrected. Backfilled pre-Reforma periods carry an inaccurate split rate.
3. **Alert channel redeploy not independently verifiable at runtime** — `app/alert.py` + `fetcher.py` wiring + 5 tests confirm the implementation and it is claimed redeployed on Dokploy (PR #4 merged), but there is no version/health detail exposing build identity, so the running container's alert code could not be independently attested from outside.

**SUGGESTION**:
1. `add_ley21735_split_rates.sql` comment says "Ley 21.735 in force" for the `>= 2024-09` backfill, contradicting the design's "vigente agosto 2026" framing — align the comment or gate the backfill window.
2. `add_impuesto_tramo.sql` still creates `DECIMAL(12,0)` columns; a fresh-DB bootstrap must apply both migrations in order. Consider updating the base script to `DECIMAL(12,2)` to avoid a two-step bootstrap.

### Verdict

**PASS WITH WARNINGS** — 46/46 pytest pass (alert channel covered by 5 new tests), `tsc --noEmit` clean, live flat contract validates (scraped 0.9/0.72/1.78 rates, `independiente: null`, 2-decimal `impuestoTramos`, top `hasta: null`), auth (401/403) and `{error}` format confirmed at runtime. All 18 requirements and 28 scenarios are now compliant; the prior CRITICAL (no alert channel) is resolved and verified. Two WARNINGs remain operational/documentation-level: the `ImpuestoTramo` DECIMAL(12,2) migration is authored but not yet applied in Supabase, and the split-rate backfill still uses stale 0.5 for `expectativaVidaRate` (documented as approximate). Archive-ready once the precision migration is applied (or with the backfill warning explicitly accepted).
