---
id: '009'
issue: 'tasks/issues/009-fix-datasource-routing-single-view.md'
created: 2026-05-25
updated: 2026-05-25
---

# Review: Fix datasource routing so View and Edit work after creation

## Related Task

- `tasks/issues/009-fix-datasource-routing-single-view.md`

## Overall Verdict

**Pass**

No Blocking findings. The one-line fix correctly addresses the root cause and all four ACs pass.

## Findings

| ID    | Level        | Requirement | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Evidence                                                     |
| ----- | ------------ | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| F-001 | Non-blocking | REG-001     | The issue requires a regression test for `SeededDatasourceRepository.get('superstore-sales')` returning the seed record. No explicit test was added. The code path is trivially correct (seeds matched by `item.id === id`; seeds have `id === slug`) and was not touched by this fix — the existing `UT-001` in `use-cases-integration.spec.ts:129` verifies seeds appear in `list()`, and `IT-001:98` exercises the `SeededDatasourceRepository.get()` code path for user datasources. Adding a dedicated regression test would improve coverage. | `tasks/issues/009-fix-datasource-routing-single-view.md:117` |
| F-002 | Suggestion   | E2E-001     | The issue defines E2E-001 as a single create→view→update E2E scenario. The existing `tests/e2e/features/datasource-editor.feature` covers "Create new datasource" (lines 20–29, which exercises the slug routing fix) and "Save an updated datasource" (lines 31–36) as separate scenarios. Together they verify the AC-004 flow, but not as one combined scenario. Adding a combined scenario would align with the issue contract.                                                                                                                 | `tasks/issues/009-fix-datasource-routing-single-view.md:108` |

## AC Evaluation

| AC     | Result | Notes                                                                                                                                                                                                                                                                                            |
| ------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| AC-001 | Pass   | `LocalStorageDatasourceRepository.get('test-ds')` matches by `d.slug === id` at `src/adapters/client/local-storage/local-storage-datasource-repository.ts:63`. Verified by `UT-001` in the spec file.                                                                                            |
| AC-002 | Pass   | `LocalStorageDatasourceRepository.get('550e8400-...')` matches by `d.id === id` at the same line. Backward-compatible id lookup preserved. Verified by `UT-001`.                                                                                                                                 |
| AC-003 | Pass   | `SeededDatasourceRepository.get('superstore-sales')` finds the seed at `src/features/catalog/data/seeded-catalog-repositories.ts:146` via `this.seeds.find((item) => item.id === id)`. Seeds have `id === slug`, so this works unchanged.                                                        |
| AC-004 | Pass   | The existing E2E "Create new datasource" scenario (`datasource-editor.feature:20`) creates a datasource and navigates to its slug-based URL verifying the editor loads — directly exercising the fix. "Save an updated datasource" (`datasource-editor.feature:31`) verifies update persistence. |

## Test Coverage Evaluation

| Test Category          | Status         | Notes                                                                                                                                                                   |
| ---------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- | ------------------------------------------------------ |
| Unit (UT-001)          | Present        | `src/adapters/client/local-storage/local-storage-datasource-repository.spec.ts:99` — verifies `get()` by slug and by id.                                                |
| Unit (UT-002)          | Present        | `src/adapters/client/local-storage/local-storage-datasource-repository.spec.ts:116` — verifies `get()` returns null for non-existent.                                   |
| Integration (IT-001)   | Present        | `src/composition/use-cases-integration.spec.ts:98` — verifies user-created datasource retrieval by slug through `SeededDatasourceRepository`.                           |
| Smoke (SMK-001)        | Covered        | Existing E2E scenario "Create new datasource" (`datasource-editor.feature:20`) verifies the editor page loads for a slug-routed datasource without a "not found" error. |
| End-to-End (E2E-001)   | Partial        | See F-002. Existing E2E scenarios separately cover create→view and save→update; a combined scenario as defined in the issue is not present.                             |
| Regression (REG-001)   | Missing        | See F-001. No explicit test for `SeededDatasourceRepository.get('superstore-sales')` returning the seed record.                                                         |
| Performance (PT-001)   | Not applicable | Single `                                                                                                                                                                |     | `condition in`Array.find()` with no measurable impact. |
| Security (ST-001)      | Not applicable | No new input, storage, or external communication.                                                                                                                       |
| Usability (UX-001)     | Not applicable | No UI change.                                                                                                                                                           |
| Observability (OT-001) | Not applicable | Runtime telemetry unchanged.                                                                                                                                            |

## Observability Evaluation

Not applicable — `OBS-001` is marked as not applicable in the issue.

## ADR Compliance

Not applicable — no ADR dependencies listed in the task.

## Convention Notes

- The implementation follows existing project conventions: the one-line change mirrors the same `Array.find()` pattern used elsewhere in the file; test style (`importFreshRepository`, `createLocalStorageMock`) matches prior tests in the same suite.
- `F-001` — Non-blocking — The missing `REG-001` test is not a convention violation; the code is correct and follows established patterns, but the test is absent from the issue's Required Tests.
- `F-002` — Suggestion — Combining the create, view, and update steps into a single E2E scenario would better match the issue's defined E2E-001, but is not required for correctness.

## Unresolved Assumptions or Follow-Up

- None.
