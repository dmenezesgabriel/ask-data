---
id: '024'
created: 2026-05-29
updated: 2026-05-29
status: active
---

# Task: Delete deprecated shared/types/ compatibility shims

## Priority

P1 — Can run in parallel with tasks 022 and 023. Eliminating the two-vocabulary problem (shared/types/ vs. core/entities/) prevents new code from using the deprecated path and unblocks a clean import graph for ask/ restructuring in tasks 025–026.

## Dependencies

- No task dependency; can start immediately.
- No ADR dependency; this is an execution of the migration already marked in the code with `@deprecated`.

## Assignability

**AFK** — the migration target (`core/entities/`) is already defined; replacement imports are deterministic; no architectural decision is open.

## Context

`shared/types/ask.ts` and `shared/types/dashboard.ts` re-export types from `core/entities/` under legacy names. Both files are marked `@deprecated` with instructions to import from `core/entities/` directly. Keeping them alive maintains a parallel type vocabulary that:

- Makes grep results ambiguous (two locations for the same type).
- Allows new code to accidentally import the deprecated path.
- Blocks the `shared/` zone from becoming fully stateless and import-safe.

This task replaces every remaining import of `@/shared/types/ask` and `@/shared/types/dashboard` with the canonical `@/core/entities` or `@/features/dashboard/model` equivalents, then deletes both shim files.

## Use Cases

- **Feature**: Canonical type imports
- **Scenario**: Developer adds a new module that needs an Ask Data type
- **Given** `shared/types/ask.ts` does not exist
- **When** the developer searches for `AskDataResponse`
- **Then** there is exactly one result: `core/entities/ask.ts`

## Definition of Ready

- All files importing from `@/shared/types/ask` and `@/shared/types/dashboard` are identified via `grep`.
- Equivalent canonical types in `core/entities/` and `features/dashboard/model/` are confirmed for every re-exported type.

## Functional Requirements

- `FR-001`: Every import of `@/shared/types/ask` is replaced with `@/core/entities` or the specific entity subpath.
- `FR-002`: Every import of `@/shared/types/dashboard` is replaced with `@/core/entities` (for entity types) or `@/features/dashboard/model` (for presentation model types, e.g. `DashboardConfig`).
- `FR-003`: `src/shared/types/` directory is deleted.
- `FR-004`: `src/shared/types/index.ts` is deleted.

## Non-Functional Requirements

- `NFR-001`: `tsc --noEmit` passes after deletion with no type errors.
- `NFR-002`: Knip reports no unused exports in `core/entities/` after the migration (the types were previously re-exported; direct consumers now reference them).
- `NFR-003`: No `@deprecated` re-export pattern remains in `shared/`.

## Observability Requirements

- `OBS-001`: Not applicable — type-only changes have no runtime telemetry impact.

## Acceptance Criteria

- `AC-001`: **Given** the refactored codebase, **When** `find src/shared/types` runs, **Then** no such path exists.
- `AC-002`: **Given** the refactored codebase, **When** `grep -r "shared/types" src/` runs, **Then** no results are found.
- `AC-003`: **Given** the refactored codebase, **When** `tsc --noEmit` runs, **Then** it exits with code 0.
- `AC-004`: **Given** the refactored codebase, **When** `knip` runs, **Then** no unused exports are reported in `core/entities/`.

## Required Tests

### Unit Tests

- `UT-001`: Not applicable — these are type-only files; correctness is enforced by `tsc --noEmit` passing.

### Integration Tests

- `IT-001`: Not applicable — no runtime boundary changes; the deleted files were type re-exports only.

### Smoke Tests

- `SMK-001`: Not applicable — no deploy-time availability changes.

### End-to-End Tests

- `E2E-001`: Not applicable — no user journey changes.

### Regression Tests

- `REG-001`: Not applicable — no known previous defect related to type export paths.

### Performance Tests

- `PT-001`: Not applicable — type-only changes have no runtime performance impact.

### Security Tests

- `ST-001`: Not applicable — this task does not touch authentication, authorization, input handling, or secrets.

### Usability Tests

- `UX-001`: Not applicable — no user-visible behavior changes.

### Observability Tests

- `OT-001`: Not applicable — type-only changes have no telemetry impact.

## Definition of Done

- `src/shared/types/` directory does not exist.
- `tsc --noEmit` passes.
- `knip` passes with no new unused-export findings.
- ESLint passes.
- No import in the codebase references `shared/types`.
