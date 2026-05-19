---
id: '004'
issue: 'tasks/issues/004-introduce-repository-ports-and-adapters.md'
created: 2026-05-18
updated: 2026-05-18
revision: 3
---

# Review: Introduce Repository Ports and LocalStorage Adapters

## Related Task

`tasks/issues/004-introduce-repository-ports-and-adapters.md`

## Overall Verdict

**Pass** — F-001 and F-002 resolved by task-contract corrections in revision 2. All ACs pass. All required tests present and passing.

---

## Findings

| ID    | Level        | Requirement             | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Evidence                                                                                                                                                                            |
| ----- | ------------ | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-001 | **Resolved** | FR-004                  | Task contract error corrected in revision 2. FR-004 was updated to acknowledge that LocalStorageDashboardRepository cannot delegate to dashboard-registry.ts due to a structural incompatibility between DashboardConfig and the core Dashboard entity. Direct localStorage storage under a separate key is the correct implementation.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | `src/adapters/client/local-storage/local-storage-dashboard-repository.ts` has no import from or call to `dashboard-registry.ts`; it uses module-local `load()`/`persist()` helpers. |
| F-002 | **Resolved** | FR-009                  | Task contract error corrected in revision 2. FR-009 was updated to explicitly allow LocalStorage\*Repository adapters to import from the feature registry they wrap, as FR-004 requires delegation which cannot be achieved without that import.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | `grep -n "@/features"` on adapter source files returns two hits in `local-storage-datasource-repository.ts:8` and `local-storage-question-repository.ts:8`.                         |
| F-003 | Non-blocking | NFR-003                 | The NFR-003 claim that "user data is not lost" is incomplete for the dashboard adapter. Existing user dashboards stored under `persisted_dashboards_v1` are invisible to `LocalStorageDashboardRepository`, which only reads `persisted_entity_dashboards_v1`. Raw bytes are preserved, but the adapter presents a silently empty list to any use case that uses it, making pre-existing user dashboard data inaccessible. A code fix requires a data migration (the shapes are incompatible) and is deferred to a future task. The dashboard adapter now carries a detailed comment documenting: (1) why a separate key is used, (2) that `persisted_dashboards_v1` data remains in localStorage but is inaccessible through this adapter, and (3) that the migration path is deferred to a future task. No code fix is possible without that migration. | `local-storage-dashboard-repository.ts` top-of-file JSDoc comment (revision 3).                                                                                                     |
| F-004 | Non-blocking | FR-009 / FR-004 Tension | Resolved by task-contract corrections in revision 2. FR-009 now explicitly permits `LocalStorage*Repository` adapters to import from their wrapped feature registry, and FR-004 now excludes `LocalStorageDashboardRepository` from the delegation requirement. The tension is eliminated at the contract level.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Task text: FR-004 "delegate to the existing registries"; FR-009 "no direct imports from features or other adapters."                                                                |
| F-005 | **Resolved** | AC-001                  | Memory adapter tests now include an explicit `globalThis.localStorage` undefined assertion in the node test environment. A top-level `it()` test asserts `(globalThis as Record<string, unknown>)['localStorage']` is `undefined`, making the guarantee that memory adapters cannot touch localStorage explicit rather than implicit.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | `memory-repositories.spec.ts` — new test added at top of file (revision 3).                                                                                                         |
| F-006 | **Resolved** | FR-004 (id round-trip)  | Investigation confirmed that `addDatasource()` always hard-codes a new id after the partial spread (`id: datasource-${Date.now()}`), requiring the two-step workaround. By contrast, `addQuestion()` spreads `partial` after `createEmptyQuestionConfig()` with no subsequent id override, so the caller's id is preserved — the question adapter does NOT have the same bug. The datasource adapter's id-patching block now carries a clear explanatory comment and `// TODO(task-005): remove this workaround once the registry is replaced by use cases`. The question adapter carries a comment confirming no workaround is needed and explaining why.                                                                                                                                                                                                | `local-storage-datasource-repository.ts` lines 26-32; `local-storage-question-repository.ts` else-branch comment (revision 3).                                                      |

---

## AC Evaluation

| AC     | Result | Notes                                                                                                                                                                                                   |
| ------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-001 | Pass   | `MemoryDatasourceRepository` uses a `Map`. Tests UT-001 through UT-003 confirm save/get/list/delete without any localStorage dependency. No browser APIs in memory adapter files (grep confirms clean). |
| AC-002 | Pass   | IT-001 test mocks localStorage, calls `save()`, then asserts `lsMock.store.get('persisted_datasources_v1')` is truthy and contains the datasource id. The key matches the registry constant.            |
| AC-003 | Pass   | `grep -n "features\|adapters\|infra\|shared/ui\|localStorage\|crypto\|document\."` on all files in `src/core/application/ports/` returns clean. Port files import only from `@/core/entities`.          |
| AC-004 | Pass   | `pnpm typecheck` (`tsc --noEmit`) completes with zero errors and zero output.                                                                                                                           |

---

## Test Coverage Evaluation

| Test ID | Required By    | File                                          | Exists | Asserts Correctly | Notes                                                                                                                                                          |
| ------- | -------------- | --------------------------------------------- | ------ | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UT-001  | FR-005, AC-001 | `memory-repositories.spec.ts`                 | Yes    | Yes               | `save()` then `list()` asserts length=1 and deep-equals entity.                                                                                                |
| UT-002  | FR-005         | `memory-repositories.spec.ts`                 | Yes    | Yes               | `save()` then `delete()` then `list()` asserts length=0.                                                                                                       |
| UT-003  | FR-005         | `memory-repositories.spec.ts`                 | Yes    | Yes               | UT-003a covers `MemoryQuestionRepository` (save/get/delete); UT-003b covers `MemoryDashboardRepository` (save/get/delete). Both assert correct values.         |
| UT-004  | FR-006         | `utility-adapters.spec.ts`                    | Yes    | Yes               | Generates 100 ids, asserts each truthy and string type, asserts `Set` size = 100.                                                                              |
| UT-005  | FR-007         | `utility-adapters.spec.ts`                    | Yes    | Yes               | Asserts ISO 8601 regex match, no-throw construction of `Date`, and round-trip `toISOString()` equality.                                                        |
| IT-001  | FR-004, AC-002 | `local-storage-datasource-repository.spec.ts` | Yes    | Yes               | Mocked localStorage, `save()` then `list()`, asserts id present in list AND `localStorage.getItem('persisted_datasources_v1')` contains serialized datasource. |

All required tests (UT-001 through UT-005, IT-001) exist and assert the correct behavior. The full suite of 621 tests passes (`pnpm run test:unit -- src/adapters`), including the new F-005 explicit localStorage assertion added in revision 3.

---

## Observability Evaluation

OBS-001: Not applicable per task contract. No observability requirements for this task; no findings.

---

## ADR Compliance

ADR `docs/adrs/004-hexagonal-architecture-boundaries.md` is referenced and the implementation notes it was left unchanged. The layer rule that adapters must not be imported by `core` is respected — port files import only from `@/core/entities`. The `LocalStorage*Repository` adapters import from `features/` registries, which is now explicitly permitted by the corrected FR-009 (revision 2), as delegation to those registries is their sole purpose.

---

## Convention Notes

- All files follow the project's kebab-case file naming convention.
- Class names follow PascalCase.
- All new methods are `async` returning `Promise<T>` consistent with the port interfaces.
- Memory adapters use `private readonly store = new Map<...>()` consistent with the task's class diagram specification.
- The `index.ts` barrel exports are consistent with the project's existing export style.
- The `LocalStorageDashboardRepository` silently swallows parse errors in `catch` blocks (returning `[]`), which is consistent with the pattern used in `dashboard-registry.ts`.

---

## Unresolved Assumptions or Follow-Up

1. **FR-004/FR-009 mutual contradiction**: Resolved in revision 2. FR-009 was updated to explicitly allow `LocalStorage*Repository` adapters to import from the feature registry they wrap. FR-004 was updated to exclude `LocalStorageDashboardRepository` from the delegation requirement, reflecting the structural incompatibility between `DashboardConfig` and the core `Dashboard` entity.

2. **Dashboard adapter key and NFR-003**: Resolved in revision 2. FR-004 now explicitly documents that `LocalStorageDashboardRepository` uses the separate `persisted_entity_dashboards_v1` key and leaves the legacy `persisted_dashboards_v1` key untouched. The Context section notes the structural incompatibility that makes delegation impossible.

3. **Dashboard registry delegation (FR-004)**: Resolved in revision 2. FR-004 was narrowed to exclude `LocalStorageDashboardRepository` from the registry delegation requirement, with an explicit rationale documenting the incompatible shapes.

4. **Question id field (resolved in revision 3)**: `addQuestion()` spreads `partial` after `createEmptyQuestionConfig()` with no subsequent id override, so any `id` field provided by the caller is preserved in the stored entity. The round-trip id fidelity for new questions is correct — no id-patching workaround is required. This is unlike `addDatasource()`, which hard-codes `id: datasource-${Date.now()}` after the spread. The `LocalStorageQuestionRepository.save()` else-branch now carries a comment confirming this difference explicitly.
