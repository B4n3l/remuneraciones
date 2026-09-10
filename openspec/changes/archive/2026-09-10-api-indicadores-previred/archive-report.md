# Archive Report: api-indicadores-previred

**Change**: api-indicadores-previred
**Archived to**: `openspec/changes/archive/2026-09-10-api-indicadores-previred/`
**Archive date**: 2026-09-10
**Artifact store**: both (OpenSpec files + Engram)
**Engram topic**: `sdd/api-indicadores-previred/archive-report`
**Engram observation**: #1093 (project `remuneraciones`)
**Final verdict**: PASS WITH WARNINGS — 18/18 requirements, 28/28 scenarios, 0 CRITICAL (per `verify-report.md`)

## Status

The SDD cycle is complete. All planning artifacts were present, the implementation tasks
artifact (`tasks.md`) is 45/45 complete, and the change was verified with 0 CRITICAL
findings. Archive proceeded under ordinary repository policy: `reviewGate` was structurally
absent (no receipt-driven review was ever started for this change). The remaining items are
non-critical WARNINGs, accepted by the orchestrator (see "Residual Warnings").

## Specs Synced

| Domain | Action | Details |
|--------|--------|---------|
| `previred-api` | Created (merged from delta) | 12 requirements (6 ADDED + 6 MODIFIED), delta scaffolding removed. Main spec had no prior version (`openspec/specs/` was empty), so the delta's Purpose + ADDED + MODIFIED requirements became the full main spec. REMOVED section was empty ("None") and was dropped; "Decisions / Tradeoffs" stayed in `design.md`, not the spec. |
| `indicadores-sync` | Created (full spec copied) | 6 requirements. Source was already a full spec (no ADDED/MODIFIED sections); copied mechanically. |

Both specs are new files; no existing requirement was modified or removed in place.

## Archive Contents

- `proposal.md` — present
- `specs/previred-api/spec.md` — present (delta, as authored)
- `specs/indicadores-sync/spec.md` — present (full spec)
- `design.md` — present
- `tasks.md` — present, 45/45 tasks complete (no unchecked implementation tasks)
- `verify-report.md` — present (PASS WITH WARNINGS)
- `archive-report.md` — this file (additive)

## Verification Summary (as reported)

From `verify-report.md` (intermediate snapshot; see Final-State Facts for later state):

- `npx tsc --noEmit` — exit 0
- pytest — 46 passed / 0 failed
- Runtime contract checks against the deployed API confirmed 200 flat contract, 401 (missing/invalid key), 400 (out-of-range), 404 (missing period), and `{error}` body format.

## Final-State Facts (post-verify; authoritative)

These facts were supplied by the orchestrator and are more recent than `apply-progress` /
`verify-report`. Where they supersede an intermediate snapshot claim, the final state is
recorded here.

- **Python API**: adapted (SII scraping + flat English contract + scraped Ley 21.735 rates)
  and deployed on Dokploy — project `IndicadoresPrevisionales`,
  `https://indicadores-previsionales.systemlabs.cl`. The alert webhook channel was added
  (PR #4) and the service redeployed. Test suite: 46 pytest passing.
- **Repo**: schema + `lib/` + routes + admin UI merged to `main`.
  `AFPHistorico.independiente` is nullable (PR #8); `ImpuestoTramo` is `DECIMAL(12,2)` in the
  Prisma schema (PR #9).
- **SQL applied in Supabase**: `add_ley21735_split_rates.sql` and
  `allow_null_afp_independiente.sql`. **Pending**: `impuesto_tramos_decimal_precision.sql`
  (user must apply it in the Supabase SQL Editor).
- **E2E**: the in-app sync for 2026-08 succeeded ("Indicadores para 8/2026 sincronizados
  correctamente"); the contract validates against `externalIndicadorSchema`.
- **False positive discarded**: the `AFPHistorico.independiente` nullable fix WAS already on
  `main`; the earlier verify observation of "not merged" was a stale local ref, not a real gap.

## Residual Warnings (live at close)

1. **`ImpuestoTramo` precision migration not yet applied** — `schema.prisma` is
   `DECIMAL(12,2)` and `impuesto_tramos_decimal_precision.sql` is authored, but the repo DB
   still runs the original `DECIMAL(12,0)` columns until the SQL is applied in Supabase and
   the Prisma client regenerated. Until then `desde/hasta/cantidadRebajar` round to integers
   on write. Latent data-integrity risk, not user-facing (`impuestoTramos` is not consumed by
   the payroll engine yet). Accepted for archive by the orchestrator; **pending user action**.
2. **Historical backfill uses approximate `expectativaVidaRate` 0.5** —
   `add_ley21735_split_rates.sql` backfills `0.9 / 0.5` for periods `>= 2024-09`, but Ley
   21.735 (in force Aug 2026) publishes `0.72`. Backfilled pre-Reforma periods therefore carry
   an approximate split rate. Documented in `tasks.md` (Phase 5 note). New periods carry the
   real scraped values; historical data is not rewritten.
3. **Alert-channel redeploy not independently attestable** — `app/alert.py` wiring plus 5
   tests confirm the implementation, and the redeploy (PR #4) is reported, but the running
   container exposes no version/build identity, so the deployed alert code could not be
   attested from outside.
4. **2026-09 sync not yet exercised** — the monthly sync for September 2026 must be tested on
   Oct 1 (the day-1 cron path). Only 2026-08 has been validated end-to-end so far.

## Open Pendings (carried forward)

- Apply `impuesto_tramos_decimal_precision.sql` in Supabase + `npx prisma generate`.
- Validate the 2026-09 sync on Oct 1.
- (Optional, from verify SUGGESTIONs) Align the `add_ley21735_split_rates.sql` comment wording
  with the "vigente agosto 2026" framing, and consider updating the base
  `add_impuesto_tramo.sql` to `DECIMAL(12,2)` to avoid a two-step fresh-DB bootstrap.

## Notes on Audit Trail

- The change `proposal.md` contains a "Success Criteria" checklist whose boxes are authored as
  unchecked planning criteria (not the execution task artifact). All four criteria are
  satisfied per `verify-report.md` and the Final-State Facts above: full contract served for a
  real month (2026-08), sync guard verified, split rates in the admin UI with build+lint
  passing, and no P2022/P2021. The proposal file was left as authored; completion visibility
  comes from `tasks.md` (45/45).
- Artifacts were read from the OpenSpec filesystem store. No prior Engram artifact
  observations were read for this change (Engram holds only this archive report).

## Source of Truth Updated

The following specs now reflect the shipped behavior:

- `openspec/specs/previred-api/spec.md`
- `openspec/specs/indicadores-sync/spec.md`

## SDD Cycle Complete

The change has been planned, implemented, verified, and archived. Ready for the next change.
