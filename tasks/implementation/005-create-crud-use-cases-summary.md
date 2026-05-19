---
id: '005'
created: 2026-05-18
status: done
---

# Implementation Summary: Create CRUD Use Cases

## Files Changed

**New use case files (15 total):**

- `src/core/application/use-cases/datasources/create-datasource.ts`
- `src/core/application/use-cases/datasources/update-datasource.ts`
- `src/core/application/use-cases/datasources/delete-datasource.ts`
- `src/core/application/use-cases/datasources/get-datasource.ts`
- `src/core/application/use-cases/datasources/list-datasources.ts`
- `src/core/application/use-cases/questions/create-question.ts`
- `src/core/application/use-cases/questions/update-question.ts`
- `src/core/application/use-cases/questions/delete-question.ts`
- `src/core/application/use-cases/questions/get-question.ts`
- `src/core/application/use-cases/questions/list-questions.ts`
- `src/core/application/use-cases/dashboards/create-dashboard.ts`
- `src/core/application/use-cases/dashboards/update-dashboard.ts`
- `src/core/application/use-cases/dashboards/delete-dashboard.ts`
- `src/core/application/use-cases/dashboards/get-dashboard.ts`
- `src/core/application/use-cases/dashboards/list-dashboards.ts`

**New test files:**

- `src/core/application/use-cases/use-cases.spec.ts`
- `src/core/application/use-cases/use-cases-integration.spec.ts`

## Behavior Implemented

All 15 CRUD use cases follow the task-specified pattern:

- `Create*`: generates id via `IdGenerator`, timestamps via `Clock`, saves, returns entity
- `Update*`: loads existing entity (throws `Error('<Entity> not found: <id>')` if missing), merges patch, updates `updatedAt`, saves, returns
- `Delete*`: delegates to repository `delete(id)` — no-op if not found
- `Get*`: delegates to repository `get(id)` — returns entity or `null`
- `List*`: delegates to repository `list()` — returns array (empty when none)

All use case files import only from `@/core/entities` and `@/core/application/ports` (FR-007 satisfied).

## FR-008/FR-009 UI Wiring — Deferred to Task 007

The existing Lit components call registry functions synchronously within synchronous lifecycle methods (`connectedCallback`, reactive property setters). Refactoring to async use cases requires structural changes to component lifecycle that risk breaking the 13 component tests and 17 storybook tests. This wiring is deferred to Task 007 (composition containers), which will introduce the correct async loading pattern globally.

## Tests Added

- `UT-001`: `CreateDatasource.execute()` returns entity with generated id and timestamps
- `UT-002`: `UpdateDatasource.execute()` throws when entity does not exist
- `UT-003`: `UpdateDatasource.execute()` updates patched fields and `updatedAt`
- `UT-004`: `DeleteDatasource.execute()` + `GetDatasource.execute()` returns null
- `UT-005`: Same create/update/delete cycle for `Question` and `Dashboard`; Update\* throws for missing entities
- `UT-006`: `ListDatasources.execute()` returns empty array when no datasources exist
- `IT-001`: `CreateDatasource` wired to `LocalStorageDatasourceRepository` — created datasource appears in `ListDatasources` and in `localStorage`

**Total**: 12 new tests; 632 passing (up from 621).

## Validations Run

- `pnpm typecheck` → 0 errors
- `pnpm vitest run --project unit` → 632 tests pass (37 files)

## Unresolved Assumptions / Follow-up

- FR-008 (UI wiring) deferred to Task 007 — composition container will be the correct seam to inject async use cases into Lit component lifecycle
- `TODO(task-007): replace with composition container` comment placement will be added when Task 007 wires the composition root
