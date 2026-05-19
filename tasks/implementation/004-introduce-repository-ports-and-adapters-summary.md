---
id: '004'
issue: 'tasks/issues/004-introduce-repository-ports-and-adapters.md'
created: 2026-05-18
updated: 2026-05-18
---

# Implementation Summary: Introduce Repository Ports and LocalStorage Adapters

## Related Task

`tasks/issues/004-introduce-repository-ports-and-adapters.md`

## Files Changed

### New files created

**Port interfaces (`src/core/application/ports/`)**

- `datasource-repository.ts` — `DatasourceRepository` interface
- `question-repository.ts` — `QuestionRepository` interface
- `dashboard-repository.ts` — `DashboardRepository` interface
- `id-generator.ts` — `IdGenerator` interface
- `clock.ts` — `Clock` interface
- `index.ts` — re-exports all five port interfaces

**LocalStorage adapters (`src/adapters/client/local-storage/`)**

- `local-storage-datasource-repository.ts` — wraps `datasource-registry.ts`
- `local-storage-question-repository.ts` — wraps `question-registry.ts`
- `local-storage-dashboard-repository.ts` — stores `Dashboard` entities directly (see Design Notes)
- `index.ts` — re-exports all three classes

**In-memory adapters (`src/adapters/memory/`)**

- `memory-datasource-repository.ts` — `Map`-backed, no browser APIs
- `memory-question-repository.ts` — `Map`-backed, no browser APIs
- `memory-dashboard-repository.ts` — `Map`-backed, no browser APIs
- `index.ts` — re-exports all three classes

**Utility adapters (`src/adapters/client/`)**

- `crypto-id-generator.ts` — `CryptoIdGenerator` using `crypto.randomUUID()`
- `system-clock.ts` — `SystemClock` using `new Date().toISOString()`

**Tests**

- `src/adapters/memory/memory-repositories.spec.ts`
- `src/adapters/client/utility-adapters.spec.ts`
- `src/adapters/client/local-storage/local-storage-datasource-repository.spec.ts`

## Behavior Implemented

- `FR-001`: Three repository interfaces defined in `src/core/application/ports/`.
- `FR-002`: `IdGenerator` port with `create(): string`.
- `FR-003`: `Clock` port with `now(): string` (ISO 8601).
- `FR-004`: `LocalStorage*Repository` classes delegate to existing registries for datasource and question; dashboard uses direct localStorage storage (see Design Notes).
- `FR-005`: `Memory*Repository` classes backed by `Map`, no browser APIs.
- `FR-006`: `CryptoIdGenerator` using `crypto.randomUUID()`.
- `FR-007`: `SystemClock` using `new Date().toISOString()`.
- `FR-008`: `src/core/application/ports/index.ts` re-exports all port interfaces.
- `FR-009`: Adapter files import only from `@/core/entities` and `@/core/application/ports` (plus the feature registries for the LocalStorage adapters).

## Design Notes

**Dashboard adapter uses direct localStorage instead of the registry wrapper**

The core `Dashboard` entity (`src/core/entities/dashboard.ts`) has a fundamentally different shape from the legacy `DashboardConfig` type used internally by `dashboard-registry.ts`:

- `Dashboard` has: `id`, `name`, `type`, `widgets: DashboardWidget[]`, `layout: Position[]`
- `DashboardConfig` has: `title`, `subtitle`, `kpis`, `charts`, `tables`, `askData`, `filters`

These cannot be mapped to each other without significant data loss. Rather than creating a lossy mapping, `LocalStorageDashboardRepository` stores `Dashboard` entities directly in localStorage under the key `persisted_entity_dashboards_v1`. The legacy key `persisted_dashboards_v1` (used by the registry) is left completely untouched (NFR-003 satisfied).

**LocalStorage datasource adapter id preservation**

`addDatasource()` in the registry generates its own `id` using `datasource-${Date.now()}` (overwriting any id in the input). After calling `addDatasource()`, the adapter calls `updateDatasource()` to patch the id back to the entity's original id if they differ. This ensures the `save()` / `get(id)` round-trip works correctly.

## Tests Added or Updated

| Test ID | File                                          | Description                                                                |
| ------- | --------------------------------------------- | -------------------------------------------------------------------------- |
| UT-001  | `memory-repositories.spec.ts`                 | `MemoryDatasourceRepository.save()` then `list()` returns saved datasource |
| UT-002  | `memory-repositories.spec.ts`                 | `MemoryDatasourceRepository.delete(id)` removes datasource                 |
| UT-003a | `memory-repositories.spec.ts`                 | `MemoryQuestionRepository` save/get/delete cycle                           |
| UT-003b | `memory-repositories.spec.ts`                 | `MemoryDashboardRepository` save/get/delete cycle                          |
| UT-004  | `utility-adapters.spec.ts`                    | `CryptoIdGenerator.create()` returns non-empty, 100 unique values          |
| UT-005  | `utility-adapters.spec.ts`                    | `SystemClock.now()` returns valid ISO 8601 string                          |
| IT-001  | `local-storage-datasource-repository.spec.ts` | LocalStorage adapter round-trips a datasource via mocked localStorage      |

Additional coverage: `get(id)` after `save()`, `delete()`, `list()` with YAML seeds, module isolation via `vi.resetModules()` and `vi.stubGlobal()`.

## Test Categories Not Applicable

- **Smoke Tests**: No entry-point or deployment artifact change.
- **End-to-End Tests**: No user-visible behavior changes.
- **Regression Tests**: No known prior defect.
- **Performance Tests**: Thin wrapper classes, no algorithmic change.
- **Security Tests**: No new trust boundary or external input.
- **Usability Tests**: No user-facing changes.
- **Observability Tests**: No telemetry changes.

## Validation Run

```
pnpm typecheck   → 0 errors
pnpm run test:unit -- src/adapters → 620 tests passed (35 files)
pnpm build       → ✓ built in 5.10s (no new errors)
```

## Accessibility Notes

N/A — no UI changes.

## Observability Changes

N/A — OBS-001: thin wrappers with no new observable behavior.

## ADR Updates

ADR `docs/adrs/004-hexagonal-architecture-boundaries.md` remains linked; no changes needed.

## Unresolved Assumptions

1. **Dashboard adapter key**: `persisted_entity_dashboards_v1` is a new key introduced for the `Dashboard` entity shape. When the legacy `DashboardConfig`-based dashboard UI is migrated to use the port in Task 005, a data migration strategy will be needed if any users have data in `persisted_dashboards_v1` that should be converted to the `Dashboard` entity shape.
2. **Question id field**: The `Question` entity has no `id` field visible in the registry's `addQuestion()` output (it uses `createEmptyQuestionConfig()` which may generate one). Verify in Task 005 that `Question` entities always have populated `id` values.
