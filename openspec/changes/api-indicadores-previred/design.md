# Design: Previred Indicators API + Ley 21.735 Rate Split

## Technical Approach

Reuse and adapt the existing Python FastAPI service (`cgomezadolfo/API-Indicadores-Previsionales`) as the `previred-api` microservice, deploy it on Dokploy, and make it emit the flat English contract already required by `indicadores-sync`. The repo side keeps the previously designed schema/SQL/lib/routes/UI changes; only the upstream URL/key references are updated to point to the Python service.

## Architecture Decisions

### Decision: Legacy endpoint shape

| Option | Tradeoff | Decision |
|---|---|---|
| Replace `GET /api/v1/indicadores/{year}/{month}` with flat contract | Breaking change, but the only consumer is the remuneraciones sync which has not switched on yet | **Chosen** |
| Keep old Spanish nested shape under a new path | Extra maintenance; no known consumer | Rejected |
| Version the path (`/v2/...`) | Requires repo sync URL change and leaves stale `/v1` | Rejected — spec mandates `/v1` flat |

The old `build_period_response` is replaced by `build_flat_contract` on the public endpoint. Admin `PUT /api/v1/admin/indicadores/{year}/{month}` keeps the internal parser shape for manual backfill.

### Decision: SII impuestoTramos source

| Option | Tradeoff | Decision |
|---|---|---|
| Hard-code `https://www.sii.cl/valores_y_fechas/impuesto_2da_categoria/impuesto{year}.htm` | Works today for 2026, but URL pattern may drift | Rejected as only source |
| Env-configurable `SII_CIRCULAR_URL` with optional `{year}` placeholder, parser anchored on "MENSUAL" and month heading | Robust to URL drift; manual discovery documented | **Chosen** |

If the SII page is unreachable or the monthly table cannot be anchored, the scrape records `status=partial` and the read guard refuses to serve the period.

### Decision: impuestoTramos storage

| Option | Tradeoff | Decision |
|---|---|---|
| Dedicated `impuesto_tramos` table (FK to `periods`) | Mirrors repo schema, queryable, easy to validate completeness | **Chosen** |
| JSONB column on `periods` | Simpler schema, but harder to query/validate | Rejected |

### Decision: Scraped Ley 21.735 rates (changed during apply)

| Option | Tradeoff | Decision |
|---|---|---|
| Scrape `rentabilidadProtegidaRate`, `expectativaVidaRate` and `sisRate` from Previred's "Seguro Social" table | Reflects the current legal values Previred publishes (can change by calendar); adds a scraper dependency for these fields | **Chosen** |
| Constants in `app/config.py` | Single source of truth, easy to test, but hardcodes a value that drifts (e.g. 0.5 vs the 0.72 Previred publishes) | Rejected |

The three rates are scraped from the "Seguro Social" table (rows "Rentabilidad Protegida", "Expectativa de Vida", "Seguro de Invalidez y Sobrevivencia (SIS)"). With the Reforma de Pensiones (Ley 21.735, vigente agosto 2026) Previred publishes `0.90` / `0.72` / `1.78`. The flat builder reads the scraped values, not constants.

### Decision: Previred layout drift (Reforma de Pensiones)

The August 2026 page changed two tables and broke the parser (`status=partial`, 0 AFPs, missing SIS):

- **AFP table** (`TASA COTIZACIÓN AFP`) now has **4 columns** per row — `AFP`, `Cargo del Trabajador`, `Cargo del Empleador`, `Total a Pagar` — the old "independiente (incl. SIS)" column is gone. The parser accepts 4-column rows and maps `tasa_independiente=None`; it keeps accepting the legacy 5-column shape for robustness.
- **Seguro Social** now lives in the `SEGURO SOCIAL` table (3 rows: Rentabilidad Protegida, Expectativa de Vida, SIS) instead of the removed "SEGURO DE INVALIDEZ Y SOBREVIVENCIA" / "Tasa SIS" table.

The parser fixture (`tests/fixtures/previred.html`) is refreshed with the real current page (august 2026) so these values are verified by the test suite.

### Decision: No-partial-serve guard

| Option | Tradeoff | Decision |
|---|---|---|
| Read guard rejects `status != "complete"` or missing SII tramos with `500 {error}` | Meets spec; safe failure | **Chosen** |
| Serve partial data with a warning | Violates spec | Rejected |

The guard lives in `app/services/indicators.py` and is called by the public GET endpoint before building the contract.

### Decision: Error format

| Option | Tradeoff | Decision |
|---|---|---|
| Global FastAPI exception handler returning `{ "error": string }` | Consistent 400/401/404/500 | **Chosen** |
| Per-route wrappers | Easy to miss paths | Rejected |

## Data Flow

```
SII circular ──┐
Previred page ─┼─► scraper/parsers ─► normalized DB ─► flat builder ─► GET /api/v1/indicadores/{y}/{m}
               │                                          │
               └─ parse/validation failure ─► fetch_log + alert ◄┘

Repo: sync.ts ─► period guard ─► fetch API ─► externalIndicadorSchema ─► derive seguroSocialRate ─► Prisma tx
```

## File Changes

### API-Indicadores-Previsionales (Python)

| File | Action | Description |
|---|---|---|
| `app/config.py` | Modify | Add `sii_circular_url`; remove hardcoded Ley 21.735 rate constants |
| `app/models.py` | Modify | Add `ImpuestoTramo` model; relationship on `Period` |
| `alembic/versions/...add_impuesto_tramos.py` | Create | New table `impuesto_tramos` |
| `app/scraper/sii.py` | Create | Fetch SII circular and parse monthly brackets |
| `app/scraper/previred.py` | Modify | Add `impuesto_tramos` to required sections; parse 4-column AFP table and Seguro Social rates |
| `app/services/indicators.py` | Modify | Persist tramos; add `assert_complete_period`; add `build_flat_contract`; read scraped Ley 21.735 rates |
| `app/services/fetcher.py` | Modify | Call SII scraper, merge tramos into parsed data, log failures |
| `app/routers/indicators.py` | Modify | Public endpoint returns flat contract; category endpoint kept for admin |
| `app/main.py` | Modify | Global `{error}` exception handler |
| `app/auth.py` | None | Already uses `X-API-Key` and constant-time hash compare |
| `Dockerfile` / `docker-compose.yml` | Modify | Expose `SII_CIRCULAR_URL`, env-gated scheduler, healthcheck |
| `tests/test_sii_parser.py` | Create | Fixtures + parser tests |
| `tests/test_flat_contract.py` | Create | Builder completeness and scraped-rate tests |
| `tests/test_api.py` | Modify | Assert flat contract shape on public GET |

### remuneraciones (repo side)

| File | Action | Description |
|---|---|---|
| `prisma/schema.prisma` | Modify | Add `rentabilidadProtegidaRate`, `expectativaVidaRate` to `IndicadorMensual` |
| `prisma/migrations/add_ley21735_split_rates.sql` | Create | Idempotent additive columns; no overwrite of `seguroSocialRate` |
| `lib/indicadores/rates.ts` | Create | Constants + `deriveSeguroSocialRate` |
| `lib/indicadores/period-guard.ts` | Create | `checkPeriodoFinalizado` |
| `lib/indicadores/sync.ts` | Modify | Use path-params URL, zod split rates, guard, derive |
| `app/api/admin/indicadores/route.ts` | Modify | Split rates in schema/POST; derive |
| `app/api/admin/indicadores/[id]/route.ts` | Modify | PUT split rates + zod validation + derive |
| `app/api/admin/indicadores/duplicate/route.ts` | Modify | Copy split rates + derive |
| `app/api/admin/config/route.ts` | Modify | Default `sisRate` 2.0 + split fields |
| `app/api/payroll/calculate/route.ts` | Modify | Guard before fallback sync |
| `app/dashboard/admin/indicadores/page.tsx` | Modify | Editable split rates, `seguroSocialRate` read-only |

## Interfaces / Contracts

Public `200` response body:

```json
{
  "year": 2026, "month": 6,
  "valorUF": 40820.31, "valorUTM": 71506, "valorUTA": 858072,
  "sueldoMinimo": 553553, "sueldoMinimoCasaPart": 553553,
  "sueldoMinimoMenores": 412938, "sueldoMinimoNoRem": 356815,
  "topeImponibleAFP": 90, "topeImponibleINP": 60,
  "topeSeguroCesantia": 135.2,
  "sisRate": 1.78,
  "rentabilidadProtegidaRate": 0.90,
  "expectativaVidaRate": 0.72,
  "apvTopeMensualUF": 50, "apvTopeAnualUF": 600,
  "afpRates": [...], "cesantiaRates": [...],
  "asignacionFamiliar": [...],
  "impuestoTramos": [{"desde", "hasta": null, "factor", "cantidadRebajar"}]
}
```

Topes/APV are raw UF values. Errors: `{ "error": "..." }`.

## Testing Strategy

| Layer | What | Approach |
|---|---|---|
| Unit (Python) | SII parser fixtures, flat builder, no-partial guard, scraped rates | pytest |
| Route (Python) | 401 no-work, 400 params, 404 missing, 200 flat, 500 partial | `httpx` ASGI transport |
| Repo | Build, lint, drift check, guard behavior | `npm run build` + `npm run lint` + manual API checks |

## Threat Matrix

N/A — no shell/subprocess/VCS/PR-automation/executable-classification boundary; HTTP auth and no-partial-serve are covered by spec scenarios.

## Migration / Rollout

1. **Repo DB**: run drift query, apply `add_ley21735_split_rates.sql`, regenerate Prisma client.
2. **Python service**: add Alembic migration, merge to main, build Dokploy image in project `IndicadoresPrevisionales`, set `DATABASE_URL`, `ADMIN_API_KEY`, `SII_CIRCULAR_URL`, `SCHEDULER_ENABLED=true`.
3. **Repo deploy**: update env `INDICADORES_API_URL` to `https://<dokploy-host>/api/v1/indicadores` and `INDICADORES_API_KEY`.
4. **Validation**: hit health endpoint, trigger manual fetch, sync one period from repo, verify flat contract and DB rows.

Rollback: disable Dokploy deployment / scheduler; repo code revert; DB migration is additive.

## Open Questions

- None — architecture decision (reuse Python service) is already taken.
