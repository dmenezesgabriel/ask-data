---
id: '007'
issue: 'tasks/issues/007-add-deployment-composition-contracts.md'
created: 2026-05-25
updated: 2026-05-25
---

# Implementation Summary: Deployment Composition Contracts

## Task Implemented

Implemented Task 007: Add deployment composition contracts.

## Files Changed

- Added `src/composition/application-composition.ts` and `src/composition/application-composition.spec.ts`.
- Added `src/composition/runtime-mode.ts`.
- Added `src/composition/serverless-composition.ts` and `src/composition/serverless-handler.ts`.
- Updated `src/composition/client-only-container.ts`, `src/composition/client-server-container.ts`, and `src/composition/app-container.ts`.
- Updated `src/composition/composition.spec.ts`.
- Updated read-only catalog UI guards in `src/shared/ui/collection-list/collection-list.ts`, `src/shared/styles/collection.css`, `src/features/datasource/ui/datasource-list/datasource-list.ts`, `src/features/question/ui/question-list/question-list.ts`, `src/features/dashboard/ui/dashboard-list/dashboard-list.ts`, and `src/app/shell/app-shell.ts`.
- Updated `src/features/datasource/ui/datasource-list/datasource-list.spec.ts`.
- Added `src/app/shell/app-shell.smoke.spec.ts` and routed app-shell specs through the component test project in `vitest.config.ts`.
- Added `docs/deployment-composition.md`.
- Updated ADR `docs/adrs/003-keep-deployment-mode-as-composition-detail.md` to `Accepted`.

## Behavior Implemented

- Defined `ApplicationComposition` as the shared deployment boundary for catalog use cases, query execution, Ask Data creation, capability snapshots, and composition observability.
- Added explicit operation capabilities for supported and unsupported catalog writes instead of relying only on optional write methods.
- Updated client-only composition to advertise catalog reads, catalog writes, DuckDB-backed query execution, and Ask Data execution.
- Updated client-server composition to advertise read/query support and explicitly report unsupported catalog writes.
- Added deterministic runtime mode parsing with documented fallback to `client-only` for unknown values.
- Added a serverless-style composition and handler that invoke catalog use cases through the same contract without browser APIs.
- Added read-only UI guards so unsupported create/update/delete catalog actions are not rendered as clickable actions.

## Design Notes

- Core use cases remain independent of runtime mode and deployment environment variables.
- Legacy top-level write methods remain available for existing UI integration, while the new contract uses explicit operation capability support.
- Monolith and microservice deployment mappings are documented without implementing production extraction.

## Tests Added Or Updated

- `UT-001`: operation capability helpers distinguish supported and unsupported operations.
- `UT-002`: runtime mode parsing handles known and unknown values deterministically.
- `IT-001`: client-only composition satisfies the application contract with write and DuckDB query support.
- `IT-002`: client-server composition satisfies the contract with HTTP reads/query and unsupported write capabilities.
- `IT-003`: serverless handler invokes a core use case through `ApplicationComposition` without browser APIs.
- `ST-001` and `OT-001`: startup logs include deployment mode and capability IDs without configuration objects or secrets.
- `SMK-001`: app shell renders in default client-only composition without catalog composition errors.
- `UX-001`: datasource list hides create/edit/delete actions when write support is unavailable.

## Validations Run

- `npm run test:unit -- --run src/composition/application-composition.spec.ts src/composition/composition.spec.ts`
- `npm run test:components -- --run src/features/datasource/ui/datasource-list/datasource-list.spec.ts`
- `npm run test:components -- --run src/app/shell/app-shell.smoke.spec.ts src/features/datasource/ui/datasource-list/datasource-list.spec.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

## ADRs Updated

- `docs/adrs/003-keep-deployment-mode-as-composition-detail.md` moved from `Proposed` to `Accepted` and now records `ApplicationComposition` as the shared boundary.

## Observability Added Or Changed

- Composition startup logs selected deployment mode, enabled platform capability IDs, and supported operation capability IDs only.
- Serverless handler failures log operation name and correlation ID when available.

## Skipped Or Not-Applicable Test Categories

- End-to-end tests: Not applicable because this task changes composition boundaries and read-only action rendering, not a new complete user journey.
- Performance tests: Not applicable because composition startup is not performance-sensitive for this task.
- Full production serverless/network integration: Not applicable because the required serverless harness must not depend on external services.

## Unresolved Assumptions Or Follow-Up Work

- First-class CI coverage for monolith and microservice deployment modes remains a human approval decision from the task assignability notes.
- The production HTTP write API remains out of scope; client-server catalog writes stay unsupported until explicit HTTP write adapters are composed.
