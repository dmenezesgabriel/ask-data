---
id: '008'
issue: 'tasks/issues/008-tighten-boundaries-and-remove-legacy-registry-debt.md'
created: 2026-05-25
updated: 2026-05-25
---

# Implementation Summary: Tighten boundaries and remove legacy registry debt

## Related Task

- `tasks/issues/008-tighten-boundaries-and-remove-legacy-registry-debt.md`

## Files Changed

- `architecture-boundaries.config.cjs` — made `core` imports strict by allowing only `core` dependencies.
- `src/core/application/use-cases/slug.ts` — moved slug helpers used by core catalog use cases inside the core boundary.
- `src/core/application/use-cases/catalog-mutation-logger.ts` — removed the shared logger dependency while preserving redacted catalog mutation logs.
- `src/core/application/use-cases/dashboards/create-dashboard.ts` — imports core-local slug helpers.
- `src/core/application/use-cases/datasources/create-datasource.ts` — imports core-local slug helpers.
- `src/core/application/use-cases/questions/create-question.ts` — imports core-local slug helpers.
- `src/core/entities/dashboard.ts` — moved Dashboard filter, KPI, and layout value types into the core Dashboard entity contract.
- `src/shared/architecture/import-boundaries.spec.ts` — added lint fixtures and import scans for the tightened boundary rules.
- `tests/e2e/steps/steps.ts` — pre-warms DuckDB through the composed dashboard query port instead of a browser-side infra import.
- `tests/e2e/steps/world.ts` — aligns E2E chart initialization logging with the scoped logger and DuckDB initialization timeout.
- `docs/architecture-boundaries.md` — documented final boundaries plus remaining intentional exceptions with owner, reason, and removal condition.
- `tasks/implementation/008-tighten-boundaries-and-remove-legacy-registry-debt-summary.md` — records this implementation.

## Behavior Implemented

- `core` no longer imports broad `shared/types` modules.
- Core catalog use cases no longer import shared slug or observability helpers.
- ESLint boundary fixtures now fail prohibited `core` to `shared/types` imports and feature UI to `infra` or `adapters` imports.
- Import scans verify UI modules do not import feature data registries directly through static, side-effect, or dynamic import forms.
- Dashboard workspace E2E setup no longer imports `/src/infra/db/db.ts` directly from the browser and waits for the current chart initialization log event.
- Existing seeded Datasource, Question, and Dashboard repository behavior remains unchanged.

## Design Notes

- The change is intentionally narrow: Dashboard value types were copied into the core contract instead of rewriting legacy shared compatibility types used by feature and app callers.
- The catalog mutation logger keeps the existing redaction behavior locally to avoid introducing a new observability port for this static-boundary cleanup.
- Remaining registry debt is documented rather than removed because non-UI model/orchestration paths still preserve client-only seed lookup and persisted legacy dashboard migration behavior.
- The E2E harness now exercises the composed query port exposed to the dashboard workspace, preserving the same client-only behavior without adding a UI-to-infra dependency.
- No ADR was updated because this implements ADR 001's accepted dependency direction without changing the architectural decision.

## Tests Added or Updated

- `src/shared/architecture/import-boundaries.spec.ts` — verifies prohibited and allowed dependencies, lint fixtures, no global DB service imports outside composition/adapters, no UI-to-registry imports across import forms, and strict core dependencies.
- `tests/e2e/steps/steps.ts` and `tests/e2e/steps/world.ts` — updated the E2E harness so `dashboard-workspace` scenarios pass without direct infra imports.
- `src/composition/use-cases-integration.spec.ts` — existing seed repository coverage was rerun to verify seed Datasource, Question, and Dashboard availability remains intact.

## Test Categories Not Applicable

- Component: Not applicable — no component behavior or rendering changed.
- Performance: Not applicable — this changes static boundary checks and type ownership only.
- Security: Not applicable — no new input, authorization, storage, or external communication behavior was introduced.
- Usability: Not applicable — no intentional UI behavior changes.
- Observability: Not applicable — runtime telemetry is unchanged.

## Validation Run

```text
npm run test:unit -- src/shared/architecture/import-boundaries.spec.ts — passed
npm run test:unit -- src/shared/architecture/import-boundaries.spec.ts src/composition/use-cases-integration.spec.ts — passed
npm run lint — passed
npm run typecheck — passed
npm run test:integration — passed
node --import tsx/esm --loader ./tests/helpers/yaml-loader.mjs node_modules/@cucumber/cucumber/bin/cucumber.js tests/e2e/features/dashboard-workspace.feature --import 'tests/e2e/steps/**/*.ts' --format progress --force-exit — passed
npm run test:e2e — passed
```

## Accessibility Notes

- Not applicable — this task does not change frontend UI, markup, keyboard behavior, focus behavior, labels, or error states.

## Observability Changes

- Not applicable — this task removes architectural debt and tightens static checks, not runtime behavior.

## ADR Updates

- Not applicable — no architectural decision changed; ADR 001 remains the governing decision.

## Unresolved Assumptions or Follow-Up

- Remaining documented registry and shared compatibility exceptions should be removed when their listed removal conditions are met.
