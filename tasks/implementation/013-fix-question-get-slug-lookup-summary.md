---
id: '013'
issue: 'tasks/issues/013-fix-question-get-slug-lookup.md'
created: 2026-05-28
updated: 2026-05-28
---

# Implementation Summary: Fix user-created question "not found" when looked up by slug

## Related Task

- `tasks/issues/013-fix-question-get-slug-lookup.md`

## Files Changed

- `src/adapters/client/local-storage/local-storage-question-repository.ts` — extended `get()` predicate to match on `q.slug` in addition to `q.id`
- `src/adapters/client/local-storage/local-storage-question-repository.spec.ts` — added UT-001 and UT-002 for id- and slug-based lookup

## Behavior Implemented

- `LocalStorageQuestionRepository.get(id)` now returns the question when passed either the question's UUID `id` or its `slug`.
- When neither field matches any persisted question, `get()` still returns `null`.

## Design Notes

- Single predicate change: `q.id === id` → `q.id === id || q.slug === id`, identical to the existing pattern in `LocalStorageDatasourceRepository.get()` (line 63).
- No other method was touched; `save()`, `delete()`, and `list()` are unaffected.

## Tests Added or Updated

- `src/adapters/client/local-storage/local-storage-question-repository.spec.ts` — UT-001: renamed existing `get(id)` test to `UT-001: get(id) returns the question when looked up by q.id`
- `src/adapters/client/local-storage/local-storage-question-repository.spec.ts` — UT-002: new test `UT-002: get(slug) returns the question when looked up by q.slug` (the bug scenario / REG-001)

## Test Categories Not Applicable

- `Integration`: Not applicable — `get()` is a pure in-memory lookup over a localStorage array; the localStorage boundary is already covered by the module-level mock in the spec.
- `E2E`: Not applicable — the fix is a narrow adapter predicate change with no full journey impact.
- `Performance`: Not applicable — single-predicate change with no measurable performance impact.
- `Security`: Not applicable — no trust boundary, authentication, or authorization changed.
- `Smoke`: Not applicable — no deploy-path or startup behavior changed.
- `Accessibility`: Not applicable — no UI state changed.
- `Observability`: Not applicable — no telemetry added or changed.

## Validation Run

```text
npx vitest run src/adapters/client/local-storage/local-storage-question-repository.spec.ts — 6 passed
```

## Accessibility Notes

- Not applicable — this task does not change frontend UI.

## Observability Changes

- Not applicable — fix changes only an in-memory find predicate; no new log, metric, or trace warranted.

## ADR Updates

- Not applicable — this task applies an existing adapter pattern and does not affect architectural decisions.

## Unresolved Assumptions or Follow-Up

- None.
