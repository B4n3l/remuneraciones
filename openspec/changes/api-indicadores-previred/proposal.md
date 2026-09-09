# Proposal: Previred Indicators API + Ley 21.735 Rate Split

## Intent
Payroll depends on monthly Previred indicators, synced today from inside Vercel (timeout risk, fragile PDF parsing, delete+create can overwrite finalized periods). Add a dedicated microservice owning scraping/cron/cache and split `seguroSocialRate` per Ley 21.735.

## Scope

### In Scope
- Microservice (own repo/deploy): GET /indicadores?year=&month= with X-API-Key; monthly cron; cache; scrape Previred PDF + SII circular -> impuestoTramos[].
- Split rates: rentabilidadProtegidaRate (0.9%), expectativaVidaRate (0.5%), sisRate 2.0%; seguroSocialRate deprecated.
- Guard: sync aborts if any PayrollPeriod(yearMonth) is LIQUIDADA/PAGADA (manual + calculate-fallback paths).
- Manual SQL migration + schema/zod/UI updates.

### Out of Scope
- Employer-cost module (future change 2).
- In-Vercel scraper.
- Retroactive rate application to existing liquidaciones.

## Capabilities

### New Capabilities
- `previred-api`: microservice contract — endpoints, auth, cron, cache, parse sources, alerts.
- `indicadores-sync`: in-repo contract — split rates, finalized-period protection, zod schemas.

### Modified Capabilities
- None — `openspec/specs/` is empty; both above become new full specs.

## Approach
- Microservice: Node+TS (Fastify/Hono), deployed on VPS/Railway/Fly; cron day 1-3 scrapes Previred PDF (pdf-parse) + SII circular; zod-validated; cached; GET guarded by X-API-Key; alerts on failure.
- Repo: sync.ts consumes same contract; before delete+create checks PayrollPeriod status; same guard in calculate fallback (app/api/payroll/calculate/route.ts:82). Verified: simple-engine.ts doesn't use these rates -> no engine change.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| prisma/schema.prisma | Modified | IndicadorMensual rate fields (rentabilidadProtegidaRate, expectativaVidaRate) |
| prisma/migrations/*.sql | New | Manual SQL for Supabase (repo does not use prisma migrate) |
| lib/indicadores/sync.ts | Modified | New contract + finalized-period guard |
| app/api/admin/indicadores/route.ts | Modified | indicadorSchema split rates |
| app/api/admin/indicadores/[id]/route.ts | Modified | PATCH fields |
| app/api/admin/indicadores/duplicate/route.ts | Modified | copy fields |
| app/api/admin/config/route.ts | Modified | default rates |
| app/dashboard/admin/indicadores/page.tsx | Modified | form/display |
| app/api/payroll/calculate/route.ts | Modified | guard fallback sync |
| lib/payroll/simple-engine.ts | None | verified unused |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Previred PDF format drift | Med | versioned parser, alerts, manual fallback |
| Overwrite finalized month | Med | guard + idempotent upsert |
| DB drift (P2022/P2021) | Med | verify information_schema before writing SQL |
| Scrape legal/rate limits | Low | monthly cron, public data, respect robots |

## Rollback Plan
Additive SQL (add new columns, keep `seguroSocialRate` until verified). git revert code. Disable microservice cron/API key to stop it. No prisma migrate involved.

## Dependencies
- Previred/SII source availability.
- INDICADORES_API_URL/KEY env vars (already consumed by sync.ts).

## Success Criteria
- [ ] Microservice serves full contract (incl. impuestoTramos) for a real month.
- [ ] Sync blocked for LIQUIDADA/PAGADA periods; allowed for BORRADOR.
- [ ] Split rates visible in admin UI; build + lint pass.
- [ ] No P2022/P2021 on deploy; prod data verified.

## Proposal question round (resolved)
Assumptions locked: sisRate becomes 2.0% globally (affects config defaults); microservice deployed outside Vercel, designed for the future VPS (Docker), can run locally/Railway/Fly meanwhile. Decisions:
1. **Keep `seguroSocialRate` column** (additive migration; retain for audit/history, verify before removal).
2. **Guard blocks only LIQUIDADA/PAGADA** periods; BORRADOR periods may be overwritten (current behavior).
3. **Deploy target: VPS future (Docker-ready)** — the microservice is designed to live on the VPS with Dokploy; short-term can run anywhere.