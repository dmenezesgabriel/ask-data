# Task: Remove unused npm dependencies

## Priority

P1 — Three production dependencies are declared but never imported; they add unnecessary install weight and noise to the dependency graph.

## Dependencies

- No task dependency; can start independently.
- No ADR dependency; this task removes packages with no architectural impact.

## Context

Knip identified three entries in `package.json` `dependencies` that are never imported anywhere in `src/`:

- `@codemirror/search` — no import in any `.ts` file under `src/`
- `@codemirror/theme-one-dark` — no import in any `.ts` file under `src/`
- `@lezer/highlight` — no import in any `.ts` file under `src/`

All three are CodeMirror ecosystem packages. The project uses other CodeMirror packages (`@codemirror/state`, `@codemirror/view`, `@codemirror/lang-sql`, etc.) so a CodeMirror editor is present; these specific three sub-packages are simply not wired up. They should be removed from `package.json` and `package-lock.json` via `npm uninstall`.

## Use Cases

- **Feature**: Dependency hygiene
- **Scenario**: Developer audits installed packages
- **Given** unused packages are removed
- **When** the developer runs `npm run knip`
- **Then** knip reports no unused dependencies for these three packages

## Definition of Ready

- Confirmed: no `import` of `@codemirror/search`, `@codemirror/theme-one-dark`, or `@lezer/highlight` exists in `src/`.
- Confirmed: the packages are listed under `dependencies` (not `devDependencies`) in `package.json`.

## Functional Requirements

- `FR-001`: `@codemirror/search`, `@codemirror/theme-one-dark`, and `@lezer/highlight` are removed from `package.json` and `package-lock.json`.
- `FR-002`: No import statement referencing these packages exists after removal.

## Non-Functional Requirements

- `NFR-001`: All existing tests pass after the packages are removed.
- `NFR-002`: The production build (`npm run build`) succeeds after removal.

## Observability Requirements

- `OBS-001`: Not applicable — dependency removal has no runtime observability impact.

## Acceptance Criteria

- `AC-001`: **Given** the packages are uninstalled, **When** `npm run build` is run, **Then** it succeeds without missing-module errors.
- `AC-002`: **Given** the packages are uninstalled, **When** `npm run test` is run, **Then** all tests pass.
- `AC-003`: **Given** the packages are uninstalled, **When** `npm run knip` is run, **Then** it no longer reports `@codemirror/search`, `@codemirror/theme-one-dark`, or `@lezer/highlight` as unused dependencies.

## Required Tests

### Unit Tests

- `UT-001`: Not applicable — no production logic changes.

### Integration Tests

- `IT-001`: Not applicable — no boundary behavior changes.

### Smoke Tests

- `SMK-001`: Not applicable — dependency removal does not affect deploy availability.

### End-to-End Tests

- `E2E-001`: Not applicable — no user-facing behavior changes.

### Regression Tests

- `REG-001`: Not applicable — no known previous defect related to these packages.

### Performance Tests

- `PT-001`: Not applicable — removing unused packages does not change runtime performance.

### Security Tests

- `ST-001`: Not applicable — no auth, input, or trust boundary changes.

### Usability Tests

- `UX-001`: Not applicable — no user-facing changes.

### Observability Tests

- `OT-001`: Not applicable — no operational behavior changes.

## Definition of Done

- `npm uninstall @codemirror/search @codemirror/theme-one-dark @lezer/highlight` is run and `package.json` / `package-lock.json` are updated.
- `npm run build` passes.
- `npm run test` passes with all tests green.
- `npm run knip` no longer reports these three packages as unused.
