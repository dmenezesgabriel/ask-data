---
id: "001"
issue: "tasks/issues/001-map-architecture-boundaries.md"
created: 2026-05-24
updated: 2026-05-24
---

# Implementation Summary: Map architecture boundaries and fitness rules

## Task implemented

Mapped Portable BI architecture boundaries for `core`, `features`, `adapters`, `infra`, `composition`, `app`, and `shared`, then added executable import-boundary fitness coverage.

## Files changed

- `architecture-boundaries.config.cjs`
- `eslint.config.js`
- `docs/architecture-boundaries.md`
- `src/shared/architecture/import-boundaries.spec.ts`
- `tasks/implementation/001-map-architecture-boundaries-summary.md`

## Behavior implemented

- `npm run lint` continues to run architecture checks through ESLint.
- `core` imports from `features`, `adapters`, `infra`, `composition`, or `app` are rejected by the boundary rule.
- `adapters` imports from `core` remain accepted.
- Current legacy allowances are centralized and documented so later tasks can tighten them without rediscovering the boundary map.

## Design notes

- The boundary rules are shared from `architecture-boundaries.config.cjs` so ESLint and tests use the same map.
- `src/components` is classified as `shared` because the existing app and feature UI use it as shared UI.
- Existing boundary debt is documented instead of moved because this task explicitly excludes business-behavior migration.

## Tests added or updated

- `UT-001`: Added classifier coverage in `src/shared/architecture/import-boundaries.spec.ts`.
- `IT-001`: Added ESLint in-memory fixture coverage for forbidden `core` to `features` imports and allowed `adapters` to `core` imports.

## Validations run

- `npm run test:unit -- src/shared/architecture/import-boundaries.spec.ts` passed.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm run test:unit` passed.

## ADRs updated

- None. ADR 001 remains `Proposed` pending human approval as requested by the issue assignability notes.

## Observability added or changed

- None. Not applicable because this task changes documentation and static architecture fitness rules only.

## Skipped or not-applicable test categories

- Component tests: Not applicable because no UI components changed.
- End-to-end tests: Not applicable because no user journey changed.
- Regression tests: Not applicable because no known previous defect is targeted.
- Performance tests: Not applicable because runtime performance is unchanged.
- Security tests: Not applicable because no trust boundary or input handling behavior changed.
- Usability/accessibility tests: Not applicable because no user-facing UI changed.
- Observability tests: Not applicable because runtime telemetry is unchanged.

## Unresolved assumptions or follow-up work

- Human approval is still required before ADR 001 can move from `Proposed` to `Accepted`.
- Later migration tasks should remove the documented broad `shared` and feature-to-feature allowances after the related behavior moves behind core contracts and extension/capability APIs.
