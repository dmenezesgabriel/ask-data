---
id: "013"
created: 2026-05-28
updated: 2026-05-28
status: active
---

# Task: Fix user-created question "not found" when looked up by slug

## Priority

P1 — Blocks users from viewing the detail page of any question they created; the fix is a one-line guard identical to the pattern already applied in the datasource repository.

## Dependencies

- No task dependency; this is an isolated adapter fix.
- No ADR dependency; this task applies an existing pattern from `local-storage-datasource-repository.ts:63`.

## Assignability

**AFK** — all requirements and acceptance criteria are resolved; the fix pattern is already established in the sibling repository; no open decisions remain.

## Context

Routing passes the `slug` field when navigating to a question detail view. `LocalStorageQuestionRepository.get(id)` at `src/adapters/client/local-storage/local-storage-question-repository.ts:151` uses only `q.id === id`. User-created questions have a UUID `id` and a separate `slug`, so a slug-based lookup returns `null`, causing the UI to show "Question not found."

`LocalStorageDatasourceRepository.get()` already handles this with `d.id === id || d.slug === id` (line 63). The question repository needs the same guard.

The TODO also calls for two unit tests (`UT-001` and `UT-002`) to cover both lookup paths.

## Use Cases

- **Feature**: Question detail view
- **Scenario**: User navigates to a question they created
- **Given** a user has created a question with a generated slug
- **When** the app routes to `#/question/<slug>`
- **Then** the question editor loads the saved question

## Definition of Ready

- `src/adapters/client/local-storage/local-storage-question-repository.ts` is available.
- `src/adapters/client/local-storage/local-storage-question-repository.spec.ts` is available.
- The `Question` entity has both an `id` (UUID) and a `slug` field.

## Functional Requirements

- `FR-001`: `LocalStorageQuestionRepository.get(id)` returns the question when `id` matches `q.id`.
- `FR-002`: `LocalStorageQuestionRepository.get(slug)` returns the question when `slug` matches `q.slug`.
- `FR-003`: When neither `id` nor `slug` matches, `get()` returns `null`.

## Non-Functional Requirements

- `NFR-001`: The fix is a single expression change inside the `get()` method; no other method is affected.
- `NFR-002`: Behavior is identical to the existing `LocalStorageDatasourceRepository.get()` pattern.

## Observability Requirements

- `OBS-001`: Not applicable — this fix changes only an in-memory find predicate; no new log, metric, or trace is warranted.

## Acceptance Criteria

- `AC-001`: **Given** a persisted question with `id = 'uuid-123'` and `slug = 'my-question'`, **When** `get('uuid-123')` is called, **Then** the question is returned.
- `AC-002`: **Given** a persisted question with `id = 'uuid-123'` and `slug = 'my-question'`, **When** `get('my-question')` is called, **Then** the question is returned.
- `AC-003`: **Given** no persisted question matching, **When** `get('unknown')` is called, **Then** `null` is returned.

## Required Tests

### Unit Tests

- `UT-001`: `get(id)` returns the question when looked up by `q.id`. Covers `FR-001`, `AC-001`.
- `UT-002`: `get(slug)` returns the question when looked up by `q.slug`. Covers `FR-002`, `AC-002` — this is the bug scenario.

### Integration Tests

Not applicable — `get()` is a pure in-memory lookup over a localStorage array; the localStorage boundary is already covered by the module-level mock in the spec.

### Smoke Tests

Not applicable — no deploy-path or startup behavior changed.

### End-to-End Tests

Not applicable — the question detail routing is a narrow adapter fix; no full journey changes.

### Regression Tests

- `REG-001`: **Scenario**: User-created question is accessible via slug route
  **Given** a question with a UUID id and a distinct slug is persisted
  **When** `get(slug)` is called
  **Then** the question is returned (not `null`)
  Covers previous defect `BUG-2`.

### Performance Tests

Not applicable — single-predicate change with no measurable performance impact.

### Security Tests

Not applicable — no trust boundary, authentication, or authorization changed.

### Usability Tests

Not applicable — this is a pure adapter fix; no UI state changed.

### Observability Tests

Not applicable — no telemetry added or changed.

## Definition of Done

- `get()` predicate in `src/adapters/client/local-storage/local-storage-question-repository.ts` uses `q.id === id || q.slug === id`.
- `UT-001`, `UT-002`, and `REG-001` pass in `local-storage-question-repository.spec.ts`.
- No existing tests broken.
