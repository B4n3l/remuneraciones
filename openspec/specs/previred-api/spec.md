# previred-api Specification

## Purpose

`previred-api` is the existing Python FastAPI service (`cgomezadolfo/API-Indicadores-Previsionales`) adapted, containerized, and deployed on Dokploy. It scrapes Previred and the SII monthly circular, persists versioned indicators with audit snapshots, and serves them through an authenticated flat JSON contract consumed by the remuneraciones system.

## Requirements

### Requirement: SII income-tax bracket scraping

The service MUST scrape the SII monthly circular for `impuestoTramos` and store it as part of the period data.

- GIVEN the SII circular for the target month is available and parseable
- WHEN the scraper runs
- THEN the service extracts each bracket as `{desde, hasta, factor, cantidadRebajar}`
- AND the top bracket has `hasta: null`

- GIVEN the SII circular is unavailable or unparseable for the target month
- WHEN the scraper runs
- THEN the period MUST be treated as incomplete, MUST NOT be served, and MUST raise an alert

### Requirement: Ley 21.735 scraped rates

The service MUST scrape the three Ley 21.735 rates (`rentabilidadProtegidaRate`, `expectativaVidaRate`, `sisRate`) from Previred's "Seguro Social" table and MUST NOT hardcode them, because Previred publishes the current legal values and can change them by calendar.

- GIVEN a period is successfully scraped from Previred
- WHEN the flat contract is built
- THEN `rentabilidadProtegidaRate`, `expectativaVidaRate` and `sisRate` reflect the values published by Previred for that month (e.g. `0.90`, `0.72` and `1.78` for the Reforma de Pensiones, Ley 21.735, vigente agosto 2026)
- AND a period missing any of these scraped rates MUST be treated as incomplete

### Requirement: No-partial-serve guard

The service MUST NOT serve a period that is missing any required section (Previred or SII); incomplete periods MUST fail with an alert and return an error for that month.

- GIVEN a scrape completes but `impuestoTramos`, any required Previred section, or any scraped Ley 21.735 rate is missing
- WHEN `GET /api/v1/indicadores/{year}/{month}` is called
- THEN the endpoint returns `500` with `{error: string}` and does not return partial indicator data
- AND an alert is emitted naming the period and the missing sections

### Requirement: Flat English contract endpoint

The service MUST expose `GET /api/v1/indicadores/{year}/{month}` returning the exact flat English contract required by `indicadores-sync`.

- GIVEN a complete period exists for `2026-06`
- WHEN a caller with a valid `X-API-Key` requests `GET /api/v1/indicadores/2026/6`
- THEN the response is `200` with `year`, `month`, `valorUF`, `valorUTM`, `valorUTA`, `sueldoMinimo`, `sueldoMinimoCasaPart`, `sueldoMinimoMenores`, `sueldoMinimoNoRem`, `topeImponibleAFP`, `topeImponibleINP`, `topeSeguroCesantia`, `sisRate`, `rentabilidadProtegidaRate`, `expectativaVidaRate`, `apvTopeMensualUF`, `apvTopeAnualUF`, `afpRates[]`, `cesantiaRates[]`, `asignacionFamiliar[]`, `impuestoTramos[]`
- AND topes and APV limits are raw UF values, not `{uf, clp}` objects

### Requirement: Audit snapshots and fetch logs

The service MUST keep `raw_snapshots` of every scrape and MUST expose `GET /api/v1/admin/fetch-logs` for admins.

- GIVEN a successful or failed scrape runs
- WHEN the admin calls `GET /api/v1/admin/fetch-logs`
- THEN the response includes timestamp, trigger, status, period, and error for each run
- AND `raw_snapshots` retain the parsed JSON and HTML hash per period

### Requirement: Dokploy-ready container

The service MUST ship a Dockerfile and `docker-compose.yml` that run the adapted service on Dokploy using the configured environment variables.

- GIVEN the image is built and deployed
- WHEN the container starts
- THEN it connects to the configured `DATABASE_URL`, seeds the admin key from `ADMIN_API_KEY`, runs migrations, and starts the scheduler if enabled

### Requirement: GET indicators endpoint with X-API-Key auth

The service MUST expose `GET /api/v1/indicadores/{year}/{month}` and MUST require a valid `X-API-Key` header. Invalid or missing keys return `401`; invalid path parameters return `400` with `{error: string}`.

- GIVEN a caller presents a valid `X-API-Key`
- WHEN they request `GET /api/v1/indicadores/2026/3`
- THEN the service returns `200` with the full flat indicator contract for that month

- GIVEN a caller presents a missing or invalid `X-API-Key`
- WHEN they request `GET /api/v1/indicadores/2026/3`
- THEN the service returns `401` with `{error: string}` and does NOT execute any scrape or cache read

- GIVEN a caller sends an out-of-range `year` or `month`
- WHEN they request `GET /api/v1/indicadores/{year}/{month}`
- THEN the service returns `400` with `{error: string}`

### Requirement: Contract output

The `200` response body MUST match the flat English contract consumed by `indicadores-sync`: `year`, `month`, `valorUF`, `valorUTM`, `valorUTA`, `sueldoMinimo`, `sueldoMinimoCasaPart`, `sueldoMinimoMenores`, `sueldoMinimoNoRem`, `topeImponibleAFP`, `topeImponibleINP`, `topeSeguroCesantia`, `sisRate`, `rentabilidadProtegidaRate`, `expectativaVidaRate`, `apvTopeMensualUF`, `apvTopeAnualUF`, `afpRates[]`, `cesantiaRates[]`, `asignacionFamiliar[]`, `impuestoTramos[]`.

- GIVEN a month is cached and complete
- WHEN the service returns `200`
- THEN every field in the contract above is present with the correct type
- AND `impuestoTramos` includes `desde`, `hasta` (nullable for the top bracket), `factor`, and `cantidadRebajar`
- AND topes/APV are raw UF values

### Requirement: Scraping sources and transform

The service MUST scrape Previred for UF/UTM/minimum-wage/top/AFP/cesantia values and the SII monthly circular for `impuestoTramos`. It MUST validate scraped data before persisting and MUST scrape (not hardcode) the Ley 21.735 rates.

- GIVEN the Previred page and SII circular are available for the requested month
- WHEN the cron or on-demand scrape runs
- THEN the parsed values are validated and cached under the month key
- AND `rentabilidadProtegidaRate`, `expectativaVidaRate`, and `sisRate` are scraped from Previred's "Seguro Social" table

- GIVEN Previred or SII changes layout (format drift)
- WHEN the parser cannot extract required values
- THEN the service returns a parse error, raises an alert, and MUST NOT serve partially-validated data

### Requirement: Monthly cron and cache

The service MUST run a scheduled job on day 1 of each month at `03:00 America/Santiago` to fetch the previous month, with retries every 4 hours for up to 5 days, and a startup catchup for the expected period. Results MUST be cached so repeated reads do not re-scrape.

- GIVEN a month is already cached and complete
- WHEN `GET /api/v1/indicadores/{year}/{month}` is called for it
- THEN the service serves from cache without re-scraping
- AND the response is served even if the source sites are temporarily unreachable

- GIVEN the cron has not yet run for the current period or the period is incomplete
- WHEN `GET /api/v1/indicadores/{year}/{month}` is called
- THEN the service returns `404` or `500` with `{error: string}` and does not serve partial data

### Requirement: Failure handling and alerts

The service MUST alert on scrape/parse failures and MUST fail safely without serving partial or stale data as current.

- GIVEN a scrape or parse fails for a month
- WHEN the failure is detected
- THEN an alert is emitted (email/webhook) naming month, source, and error
- AND the endpoint returns an error body for that month rather than partial or stale cached data

### Requirement: Error format

All non-`200` responses MUST use a structured JSON error body `{ "error": string }`.

- GIVEN any error path (`401`, `400`, `404`, `500`)
- WHEN a response is returned
- THEN the body is `{ "error": "<message>" }` with a stable HTTP status
