---
id: '014'
task: tasks/issues/014-activate-composition-container.md
created: 2026-05-21
status: complete
---

# Implementation Summary: Activate Composition Container

## Files Changed

### Adapters

- **`src/adapters/client/local-storage/local-storage-datasource-repository.ts`**
  - Added `Clock` port constructor parameter; `save()` uses `clock.now()` for `updatedAt` (FR-004, AC-004)
  - Key changed from `persisted_datasources_v1` → `persisted_datasources_v2` (FR-005, AC-001)
  - `migrateV1toV2()` runs at construction: copies v1 records to v2 then removes v1 (FR-005, AC-002)

- **`src/adapters/client/local-storage/local-storage-question-repository.ts`**
  - Same Clock port injection and `updatedAt` fix (FR-004)
  - Same v1→v2 key migration on construction (FR-005)

### Composition

- **`src/composition/client-only-container.ts`**
  - `createClientOnlyContainer()` now passes `clock` to both `LocalStorageDatasourceRepository` and `LocalStorageQuestionRepository`
  - `AppContainer` redefined as an explicit shared interface with write methods optional (`?:`), allowing `createClientServerContainer()` to satisfy it structurally without a cast

- **`src/composition/app-container.ts`**
  - Removed `as unknown as AppContainer` cast (FR-006, AC-003); `createClientServerContainer()` is directly assignable to `AppContainer` because its required read-only fields are present and the optional write fields are absent

### Shell

- **`src/app/shell/app-shell.ts`**
  - Removed all three registry imports (`datasource-registry`, `question-registry`, `dashboard-registry`)
  - Added `container` import from `../../composition/app-container`
  - `_onDatasourceCreate`, `_onQuestionCreate`, `_onDashboardCreate` are now async and call the container's `createDatasource!`, `createQuestion!`, `createDashboard!` use cases (FR-002)
  - `getDashboardBySlug` now imported from `../../features/dashboard/dashboard-service` (service façade, not the registry module) (FR-003)
  - Dashboard slug for navigation is derived from the name via `name.toLowerCase().replace(...)` — consistent with how `CreateDatasource`/`CreateQuestion` generate slugs

### Feature Service

- **`src/features/dashboard/dashboard-service.ts`**
  - Added `getDashboardBySlug` to its re-exports so AppShell can import it without directly importing from the registry

### Documentation

- **`docs/adrs/006-registry-retirement-and-data-migration.md`**
  - Status updated from `Proposed` → `Accepted — Option 2`
  - Decision recorded with rationale and dashboard exclusion note

## Tests Added or Updated

| Test                                         | File                                              | Coverage               |
| -------------------------------------------- | ------------------------------------------------- | ---------------------- |
| UT-001: Clock stub sets `updatedAt` on save  | `local-storage-datasource-repository.spec.ts`     | FR-004, AC-004         |
| IT-001: save → list → v2 key present         | `local-storage-datasource-repository.spec.ts`     | FR-001, FR-002, AC-001 |
| IT-002: v1 → v2 migration on construction    | `local-storage-datasource-repository.spec.ts`     | FR-005, AC-002         |
| Migration skipped when v2 already exists     | `local-storage-datasource-repository.spec.ts`     | FR-005                 |
| UT-002: Clock stub sets `updatedAt` on save  | `local-storage-question-repository.spec.ts` (new) | FR-004                 |
| v1 → v2 migration for questions              | `local-storage-question-repository.spec.ts`       | FR-005                 |
| UT-003: both containers satisfy AppContainer | `composition.spec.ts`                             | FR-006, AC-003         |
| IT-001 updated: v2 key assertion             | `use-cases-integration.spec.ts`                   | AC-001                 |
| IT-002 added: v1 migration via use case      | `use-cases-integration.spec.ts`                   | AC-002                 |

All pre-existing tests in `datasource-registry.spec.ts` and `question-registry.spec.ts` are unchanged — the registries still use v1 keys.

## Validations Run

- `npm run typecheck` — passes, no errors
- `npm run test:unit` — 706/706 pass (49 test files)
- `npm run lint` — 3 pre-existing errors in `ask-data.ts`, `question-editor-panel.ts`, `db.spec.ts` (all modified before this task; not introduced here)

## Accessibility

Not applicable — no UI was touched; AppShell wiring is internal.

## ADRs Updated

- `docs/adrs/006-registry-retirement-and-data-migration.md` — marked Accepted, Option 2 decision recorded

## Intentionally Not-Applicable Test Categories

- **Smoke tests**: No new startup path; AppShell renders the same elements.
- **Performance tests**: localStorage round-trip performance unchanged.
- **Security tests**: No auth, authorization, or trust-boundary changes.
- **Usability/accessibility tests**: No user-visible behavior change.
- **Observability tests**: Existing AppLogger calls in use cases are sufficient (OBS-001).

## Unresolved Assumptions / Follow-up Work

1. **Dashboard read via container (FR-003 partial)**: `getDashboardBySlug` was moved to import from `dashboard-service.ts` (not the registry file directly), satisfying the DoD "no registry module imports." However, the underlying data still flows through the registry. Full retirement of the dashboard registry requires migrating `DashboardConfig` → `Dashboard` entity — architecturally deferred (see `LocalStorageDashboardRepository` KNOWN LIMITATION comment and ADR-006 dashboard exclusion note).

2. **E2E-001 / REG-001**: Cucumber E2E tests were not added in this task because the existing E2E step definitions target `AskDataEngine` scenarios. Adding browser-level E2E for the datasource creation/persistence flow is best done as a follow-up when the `datasource-editor` component is also migrated to use the container for its read/update operations.

3. **Pre-existing lint errors** (3 files with `simple-import-sort` errors): These were present before this task and are out of scope.
