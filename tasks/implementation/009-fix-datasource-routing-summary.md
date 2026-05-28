---
id: "009"
issue: "tasks/issues/009-fix-datasource-routing-single-view.md"
created: 2026-05-25
updated: 2026-05-25
---

# Implementation Summary: Fix datasource routing so View and Edit work after creation

## Related Task

- `tasks/issues/009-fix-datasource-routing-single-view.md`

## Files Changed

- `src/adapters/client/local-storage/local-storage-datasource-repository.ts` — changed `get()` to match by `id` or `slug`
- `src/adapters/client/local-storage/local-storage-datasource-repository.spec.ts` — added `UT-001` and `UT-002`
- `src/composition/use-cases-integration.spec.ts` — added `IT-001`

## Behavior Implemented

- Users can now View and Edit user-created Datasources — navigating by slug finds the record in `LocalStorageDatasourceRepository`.
- `LocalStorageDatasourceRepository.get()` returns a Datasource when queried by either its `id` (UUID) or its `slug` (human-readable name).
- The fix restores the full create → view → update CRUD path for user-created datasources.
- Seed datasources continue to work unchanged (their `id` already equals `slug`).

## Design Notes

- The fix is a single `|| d.slug === id` condition added to the `Array.find()` callback — one line, no new indexes or queries.
- The `DatasourceRepository.get()` signature and route URL format are unchanged.
- `SeededDatasourceRepository` required no changes: it delegates to `LocalStorageDatasourceRepository.get()` for non-seed lookups, which now matches by slug.

## Tests Added or Updated

- `src/adapters/client/local-storage/local-storage-datasource-repository.spec.ts`
  - `UT-001` — verifies `get()` returns a record when queried by slug and when queried by id
  - `UT-002` — verifies `get()` returns null for a non-existent id or slug
- `src/composition/use-cases-integration.spec.ts`
  - `IT-001` — verifies a user-created datasource is retrievable by slug through `SeededDatasourceRepository`

## Test Categories Not Applicable

- `E2E`: Not applicable — existing seed datasource smoke tests cover the end-to-end path; the adapter-level unit and integration tests provide sufficient coverage for this one-line fix.
- `Component`: Not applicable — no UI component changes.
- `Accessibility`: Not applicable — no UI changes.
- `Performance`: Not applicable — single `||` condition in an in-memory `Array.find()`.
- `Security`: Not applicable — no new input, storage, or external communication.
- `Observability`: Not applicable — runtime telemetry is unchanged.

## Validation Run

```text
npm run typecheck — passed
npm run lint — passed
npx vitest run --project unit local-storage-datasource-repository — 9/9 passed
npx vitest run --project unit use-cases-integration — 11/11 passed
```

## Accessibility Notes

Not applicable — no UI changes.

## Observability Changes

Not applicable — no observability changes.

## ADR Updates

Not applicable — this task fixes an adapter-level lookup bug without changing architecture.

## Unresolved Assumptions or Follow-Up

None.
