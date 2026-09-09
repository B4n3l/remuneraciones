# previred-api Specification

## Purpose

Dedicated microservice (own repo/deploy, Node+TS, Fastify/Hono) that owns scraping, monthly cron, and caching of Chilean monthly payroll indicators. It scrapes the Previred PDF and the SII monthly circular (income-tax brackets), transforms them into a strict JSON contract, and serves them via an authenticated GET endpoint. Short term it may run locally/Railway/Fly; it is Docker-ready for the future VPS (Dokploy).

## Requirements

### Requirement: GET /indicadores with X-API-Key auth

The microservice MUST expose `GET /indicadores?year={yyyy}&month={mm}` and MUST require a valid `X-API-Key` header.

- GIVEN a caller presents a valid `X-API-Key`
- WHEN they request `GET /indicadores?year=2026&month=3`
- THEN the service returns `200` with the full indicator JSON contract for that month

- GIVEN a caller presents a missing or invalid `X-API-Key`
- WHEN they request `GET /indicadores`
- THEN the service returns `401` with an error body and does NOT execute any scrape or cache read

- GIVEN a caller omits `year` or `month`, or sends non-numeric values
- WHEN they request `GET /indicadores`
- THEN the service returns `400` with a structured error body

### Requirement: Contract output

The `200` response body MUST be exactly the contract fields in `indicadores-sync`: `year`, `month`, `valorUF`, `valorUTM`, `valorUTA`, `sueldoMinimo`, `sueldoMinimoCasaPart`, `sueldoMinimoMenores`, `sueldoMinimoNoRem`, `topeImponibleAFP`, `topeImponibleINP`, `topeSeguroCesantia`, `sisRate`, `rentabilidadProtegidaRate`, `expectativaVidaRate`, `apvTopeMensualUF`, `apvTopeAnualUF`, `afpRates[]`, `cesantiaRates[]`, `asignacionFamiliar[]`, `impuestoTramos[]`.

- GIVEN a month is cached and valid
- WHEN the service returns `200`
- THEN every field in the contract above is present with the correct type and `impuestoTramos` is populated from the SII circular
- AND `impuestoTramos` includes `desde`, `hasta` (nullable for the top bracket), `factor`, and `cantidadRebajar`

### Requirement: Scraping sources and transform

The service MUST scrape the Previred PDF for UF/UTM/minimum-wage/top/AFP/cesantia values and the SII monthly circular for `impuestoTramos`. It MUST validate scraped data with zod before serving.

- GIVEN the Previred PDF and SII circular are available for the requested month
- WHEN the cron or on-demand scrape runs
- THEN the parsed values are zod-validated and cached under the month key
- AND rates are split per Ley 21.735: `rentabilidadProtegidaRate=0.9`, `expectativaVidaRate=0.5`, `sisRate=2.0`

- GIVEN the Previred PDF changes layout (format drift)
- WHEN the parser cannot extract required values
- THEN the service returns a parse error and raises an alert; it MUST NOT serve partially-validated data

### Requirement: Monthly cron and cache

The service MUST run a scheduled job in the first days of each month to fetch the current month and MUST cache results so repeated reads do not re-scrape.

- GIVEN a month is already cached
- WHEN `GET /indicadores` is called for it
- THEN the service serves from cache without re-scraping
- AND the response is served even if the source sites are temporarily unreachable

- GIVEN the cron has not yet run for the current month
- WHEN `GET /indicadores` is called for a month with no data
- THEN the service returns `404` with a structured error body

### Requirement: Failure handling and alerts

The service MUST alert on scrape/parse failures and MUST fail safely (no partial data, no stale-data-as-current).

- GIVEN a scrape or parse fails for a month
- WHEN the failure is detected
- THEN an alert is emitted (email/webhook) naming month, source, and error
- AND the endpoint returns an error body for that month rather than stale cached data unless staleness is explicitly allowed

### Requirement: Error format

All non-`200` responses MUST use a structured JSON error body `{ "error": string }`.

- GIVEN any error path (`401`, `400`, `404`, `500`)
- WHEN a response is returned
- THEN the body is `{ "error": "<message>" }` with a stable HTTP status

## Edge Cases Covered

- Month with no data yet (cron not run / source not published): `404`.
- Previred PDF format drift: parse failure, alert, no partial serve.
- SII circular unavailable but Previred OK: `impuestoTramos` missing → treated as incomplete, alert; never served as complete.
- Invalid/missing API key: `401`, no work performed.
- Invalid year/month params: `400`.
- Top income-tax bracket: `hasta` null.
- Topes expressed in UF (topeImponibleAFP/INP/cesantia): served as raw UF values.