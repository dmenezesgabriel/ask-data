---
id: '019'
created: 2026-05-28
updated: 2026-05-28
status: active
---

# Task: Add dependency-cruiser for circular dependency detection

## Priority

P2 — Independent of ESLint and TypeScript tasks; can start any time. Must complete before the unified quality gate (Task 020).

## Dependencies

- No task dependency; dependency-cruiser operates independently of ESLint and TypeScript changes.
- No ADR dependency; the architecture layer definitions already exist in `architecture-boundaries.config.cjs` and are owned by `eslint-plugin-boundaries`. This task adds circular dependency detection only — it does not replace or duplicate boundary enforcement.

## Assignability

**HITL** — the initial `depcruise` run may reveal existing circular dependencies in the codebase. A human must decide whether to fix them immediately or to document them as known debt and configure `depcruise` to report (not block) them during the stabilization period. The decision point is: _fail CI on all circulars now_ vs _report and defer_.

## Context

The project enforces architecture layer boundaries using `eslint-plugin-boundaries` (configured via `architecture-boundaries.config.cjs` and `eslint.config.js`). This correctly prevents cross-layer imports at the ESLint level.

However, `eslint-plugin-boundaries` does not detect **circular dependencies** — situations where module A imports B, B imports C, and C imports A, all within the same allowed layer. Circular dependencies cause:

- Unpredictable module initialization order (especially in Vite/ESM bundles).
- Subtle runtime bugs where a module's exports are `undefined` at import time.
- Build-time warnings from Vite's circular dependency detector.

`dependency-cruiser` is the right tool for this:

- It reads the actual module graph from source files.
- It can enforce `no-circular` rules independent of ESLint.
- Its config file (`.dependency-cruiser.cjs`) is separate from `eslint.config.js` and from `architecture-boundaries.config.cjs`.

**Scope boundary**: the dependency-cruiser config in this task enforces **only circular dependencies**. Architecture layer boundary enforcement remains in `eslint-plugin-boundaries`. Do not duplicate layer boundary rules in depcruise.

The existing layer structure (from `architecture-boundaries.config.cjs`):

```
core          — domain types, ports, use-case contracts
adapters      — concrete implementations of core ports
infra         — infrastructure wrappers (DuckDB, localStorage, HTTP)
features      — vertical slices (Ask Data, Dashboard, Question, Datasource)
shared        — reusable UI components and utilities
composition   — dependency wiring and registry
app           — application entrypoints
```

## Use Cases

- **Feature**: Circular dependency detection
- **Scenario**: Developer introduces a circular import within the features layer
- **Given** `features/ask/AskUseCase.ts` imports from `features/dashboard/DashboardState.ts` which imports back from `features/ask/`
- **When** `pnpm architecture:check` runs
- **Then** `depcruise` reports the circular dependency with the full import chain

---

- **Feature**: CI gate on new circulars
- **Scenario**: A PR introduces a circular import that did not exist before
- **Given** the CI workflow runs `pnpm check` (which includes `architecture:check`)
- **When** the new circular is introduced
- **Then** CI fails and the PR author sees the circular import chain in the log

## Definition of Ready

- `pnpm` is the active package manager.
- `architecture-boundaries.config.cjs` exists and documents the current layer definitions.
- The implementer has run `pnpm build` (or `pnpm typecheck`) once to confirm the project compiles before adding depcruise.
- The human reviewer is available to decide the circular-debt policy after the first depcruise run.

## Functional Requirements

- `FR-001`: `dependency-cruiser` is added to `devDependencies` via `pnpm add -D dependency-cruiser`.
- `FR-002`: `.dependency-cruiser.cjs` is created at the project root with a rule set that:
  - Forbids circular dependencies (`no-circular`) across all modules in `src/`.
  - Reports orphan modules (`no-orphans`) as warnings (not errors), with `src/env.d.ts` and story entry files excluded.
  - Does **not** re-implement layer boundary rules (those live in `eslint-plugin-boundaries`).
  - Excludes `node_modules`, `dist`, `coverage`, `storybook-static`, and `*.d.ts` from analysis.
- `FR-003`: The `"architecture:check"` script is added to `package.json`: `"architecture:check": "depcruise src --config .dependency-cruiser.cjs"`.
- `FR-004`: After the first `pnpm architecture:check` run, if circular dependencies are found, they are listed in a `// TODO(circular-debt):` comment in `.dependency-cruiser.cjs` with the import chain and the reason they are known/safe to defer.
- `FR-005`: The human reviewer approves the circular-debt policy before the task is closed:
  - Option A: Fix all circulars now. `no-circular` is set to `severity: "error"`.
  - Option B: Defer known circulars. Known ones are listed in `depcruise` `ignore` patterns; new ones are still errors.
- `FR-006`: The chosen policy is documented in `.dependency-cruiser.cjs` as a comment.

## Non-Functional Requirements

- `NFR-001`: `pnpm architecture:check` completes in under 30 seconds on `src/`.
- `NFR-002`: The depcruise config does not conflict with or duplicate `eslint-plugin-boundaries` rules.
- `NFR-003`: `src/env.d.ts` (Vite client types declaration) is excluded from orphan detection — it is referenced by TypeScript but not by import graph analysis.

## Observability Requirements

- `OBS-001`: If circular dependencies exist, the `depcruise` output includes the full import chain for each circular, giving developers a clear remediation path.

## Acceptance Criteria

- `AC-001`: **Given** `dependency-cruiser` is installed and `.dependency-cruiser.cjs` exists, **When** `pnpm architecture:check` runs, **Then** it exits without a `config not found` error and produces a module graph report.
- `AC-002`: **Given** a circular import is introduced in `src/` (e.g., A → B → A), **When** `pnpm architecture:check` runs, **Then** `no-circular` reports the cycle with the full import chain.
- `AC-003`: **Given** the final `.dependency-cruiser.cjs`, **When** `pnpm architecture:check` runs on the unmodified codebase, **Then** it exits 0 (all known issues accounted for by the approved policy).
- `AC-004`: **Given** `src/env.d.ts`, **When** `pnpm architecture:check` runs, **Then** no orphan warning is raised for that file.

## Required Tests

### Unit Tests

Not applicable — depcruise configuration is verified by running the tool against the real source tree.

### Integration Tests

- `IT-001`: **Scenario**: Circular dependency is detected  
  **Given** two temporary source files with a circular import (`A` imports `B`, `B` imports `A`)  
  **When** `pnpm architecture:check` runs  
  **Then** `depcruise` reports the `no-circular` violation with the chain `A → B → A`  
  Covers `FR-002`, `AC-002`.

- `IT-002`: **Scenario**: Clean source tree exits 0  
  **Given** the unmodified `src/` with the approved circular-debt policy in place  
  **When** `pnpm architecture:check` runs  
  **Then** the command exits 0  
  Covers `FR-005`, `AC-003`.

### Smoke Tests

Not applicable — no application startup path changes.

### End-to-End Tests

Not applicable — no user journey changes.

### Regression Tests

Not applicable — no known previous defect.

### Performance Tests

Not applicable — runtime is bounded by `NFR-001` and verified manually.

### Security Tests

Not applicable — no trust boundary changes.

### Usability Tests

Not applicable — no user-facing behavior changes.

### Observability Tests

Not applicable — circular dependency reporting is the tool's output itself, not operational telemetry.

## Definition of Done

- `dependency-cruiser` is in `devDependencies` and installed.
- `.dependency-cruiser.cjs` exists with `no-circular` and `no-orphans` rules.
- `"architecture:check": "depcruise src --config .dependency-cruiser.cjs"` is in `package.json` scripts.
- Human reviewer has approved the circular-debt policy.
- `IT-001` and `IT-002` pass.
- `pnpm architecture:check` exits 0 on the unmodified codebase.
