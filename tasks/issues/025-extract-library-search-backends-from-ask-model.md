---
id: '025'
created: 2026-05-29
updated: 2026-05-29
status: active
---

# Task: Extract library-specific search backends from features/ask/model/

## Priority

P1 — Prerequisite for task 026 (reorganize ask/model/ into domain/ and engine/). Must run first so that the domain/ directory created in task 026 is free of external library imports from the moment it is named.

## Dependencies

- No task dependency; can start immediately.
- No ADR dependency; CONTEXT.md already constrains that the Semantic Model must not depend on Fuse, MiniSearch, Transformers.js, DuckDB, or UI types.

## Assignability

**AFK** — the target boundary (no library imports in domain logic) is specified in CONTEXT.md; the library modules to extract are identified; constructor injection is the established DI pattern in this codebase.

## Context

`features/ask/model/field-search.ts` wraps Fuse.js and MiniSearch to build a field-name search index. `features/ask/model/semantic-field-matcher.ts` wraps Transformers.js for embedding-based semantic field matching. Both files are library-specific adapters embedded in a directory that otherwise contains pure domain logic (SQL planning, question parsing, result analysis).

The consequence: it is impossible to unit-test `AskDataEngine` or `QuestionParser` without pulling in ML model weights and search index constructors. Extracting these into `features/ask/search/` lets the domain files receive search results as plain data arrays — no library imports cross into domain logic.

The `AskDataEngine` constructor already accepts injected collaborators; wiring the search backends through constructor parameters is consistent with the existing pattern.

## Use Cases

- **Feature**: Ask Data field matching
- **Scenario**: A domain test verifies field matching logic without importing search libraries
- **Given** a `QuestionParser` constructed with a plain-array field list stub
- **When** it parses "total sales by region"
- **Then** it returns an `AskIntent` with the correct matched fields — without loading Fuse or Transformers

## Definition of Ready

- `field-search.ts` and `semantic-field-matcher.ts` are read in full; their exported interfaces are known.
- `AskDataEngine` constructor signature is read; injection points for search backends are identified.
- All callers of `field-search.ts` and `semantic-field-matcher.ts` inside `model/` are known.

## Functional Requirements

- `FR-001`: `features/ask/search/field-search.ts` exists and contains the Fuse.js and MiniSearch logic (moved from `model/field-search.ts`).
- `FR-002`: `features/ask/search/semantic-matcher.ts` exists and contains the Transformers.js embedding logic (moved from `model/semantic-field-matcher.ts`).
- `FR-003`: No file remaining in `features/ask/model/` imports `fuse.js`, `minisearch`, or `@xenova/transformers`.
- `FR-004`: `AskDataEngine` receives the search backends through constructor injection; it does not import them at module level.
- `FR-005`: `features/ask/model/field-search.ts` and `features/ask/model/semantic-field-matcher.ts` are deleted.

## Non-Functional Requirements

- `NFR-001`: Ask Data pipeline behavior is unchanged — field matching and semantic matching produce identical results before and after this task.
- `NFR-002`: Existing unit tests for `QuestionParser`, `SqlPlanner`, and `ResultShapeAnalyzer` pass after the move with no logic changes.

## Observability Requirements

- `OBS-001`: Not applicable — no telemetry behavior changes; search backend initialization logging (if any) is preserved at the new path.

## Acceptance Criteria

- `AC-001`: **Given** the refactored codebase, **When** `grep -rn 'fuse\|minisearch\|@xenova' src/features/ask/model/` runs, **Then** no results are found.
- `AC-002`: **Given** the refactored codebase, **When** `ls src/features/ask/search/` runs, **Then** `field-search.ts` and `semantic-matcher.ts` are present.
- `AC-003`: **Given** a user question "show me sales by product", **When** `AskDataEngine.ask()` processes it end-to-end in the client-only deployment, **Then** the field matching result is identical to the pre-refactor behavior.
- `AC-004`: **Given** a unit test for `QuestionParser` using a plain-data field stub, **When** it runs, **Then** it passes without importing `fuse.js`, `minisearch`, or `@xenova/transformers`.

## Required Tests

### Unit Tests

- `UT-001`: Verify that a `QuestionParser` constructed with a stub field-search backend parses "total revenue by region" into an `AskIntent` with the expected dimension and metric fields. Covers `FR-003`, `AC-004`.
- `UT-002`: Verify that the extracted `FieldSearch` in `features/ask/search/field-search.ts` returns the top-ranked field match for an exact field name. Covers `FR-001`.
- `UT-003`: Verify that `AskDataEngine` constructed with stubbed search backends produces a valid `AskDataResponse` for a simple question. Covers `FR-004`, `AC-003`.

### Integration Tests

- `IT-001`: **Scenario**: Ask Data pipeline produces correct field matches after extraction  
  **Given** an `AskDataEngine` wired with real search backends from `features/ask/search/`  
  **When** `.ask("total sales by region")` is called against a catalog with `region` and `sales` fields  
  **Then** the response identifies `region` as the dimension and `sales` as the metric  
  Covers `FR-001`, `FR-002`, `AC-003`, `NFR-001`.

### Smoke Tests

- `SMK-001`: Not applicable — no deployment-time startup changes; behavior is verified by the integration test.

### End-to-End Tests

- `E2E-001`: Not applicable — no user journey changes; only internal wiring paths change.

### Regression Tests

- `REG-001`: Not applicable — no known previous defect related to search backend placement.

### Performance Tests

- `PT-001`: Not applicable — search backend initialization characteristics are identical before and after the move.

### Security Tests

- `ST-001`: Not applicable — this task does not touch authentication, authorization, input handling, or secrets.

### Usability Tests

- `UX-001`: Not applicable — no user-visible behavior changes.

### Observability Tests

- `OT-001`: Not applicable — this task does not introduce or modify operationally relevant behavior.

## Definition of Done

- Code is implemented; `features/ask/search/` contains `field-search.ts` and `semantic-matcher.ts`.
- `features/ask/model/field-search.ts` and `semantic-field-matcher.ts` do not exist.
- No file in `features/ask/model/` imports Fuse, MiniSearch, or Transformers.
- Required tests pass (`UT-001–003`, `IT-001`).
- `tsc --noEmit` passes.
- Existing test suite passes with no failures.
