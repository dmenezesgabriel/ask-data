# Task: Fix Stryker component test environment

## Priority

P0 — Blocks mutation testing entirely; the dry run aborts before any score is computed.

## Dependencies

- No task dependency; can start immediately.
- No ADR dependency; this task adjusts an existing test tool configuration.

## Context

`stryker.config.json` delegates to `vitest.stryker.config.ts` for its test runner. That config sets `environment: 'node'` and includes all `src/**/*.spec.ts` files. Component specs (e.g. `DashboardEditorHeader`) call `document.createElement` and `document.body.appendChild`, which do not exist in a Node.js environment.

In `vitest.config.ts`, the `unit` project already excludes these component specs via an explicit `exclude` list and runs them instead under a real Chromium browser in the `components` project. Stryker's vitest config must mirror the same exclusion so its dry run only collects specs that are safe to run in Node.

The component test files to exclude match the patterns already present in the `unit` project:
- `src/components/**/*.spec.ts`
- `src/features/dashboard/ui/**/*.spec.ts`
- `src/features/question/ui/**/*.spec.ts`
- `src/features/ask/ui/**/*.spec.ts`
- `src/features/datasource/ui/**/*.spec.ts`
- `src/shared/ui/**/*.spec.ts`

## Use Cases

- **Feature**: Mutation testing
- **Scenario**: Developer runs `npm run test:mutation` to get a mutation score
- **Given** all unit tests pass under the `unit` vitest project
- **When** the developer runs Stryker
- **Then** the dry run completes without errors and a mutation score is produced

## Definition of Ready

- `vitest.stryker.config.ts` is the sole vitest config used by Stryker (`vitest.configFile` in `stryker.config.json`).
- The exclude patterns are already validated in the `unit` project of `vitest.config.ts`.

## Functional Requirements

- `FR-001`: `npm run test:mutation` completes its dry run without a `document is not defined` error.
- `FR-002`: Stryker produces a mutation score after a successful run.
- `FR-003`: Component spec files are excluded from Stryker's test run; their source files remain in the `mutate` set.

## Non-Functional Requirements

- `NFR-001`: The change must not remove any currently passing unit test from Stryker's scope.
- `NFR-002`: Mutation score thresholds defined in `stryker.config.json` (`high: 80`, `low: 60`) remain unchanged.

## Observability Requirements

- `OBS-001`: Not applicable — this task changes only test runner configuration with no runtime behavior.

## Acceptance Criteria

- `AC-001`: **Given** the project is clean, **When** `npm run test:mutation` is run, **Then** Stryker completes the dry run without any test failure.
- `AC-002`: **Given** a successful dry run, **When** Stryker finishes mutating, **Then** an HTML mutation report is produced in `reports/`.
- `AC-003`: **Given** `vitest.stryker.config.ts`, **When** it is inspected, **Then** it includes the same `exclude` patterns as the `unit` project in `vitest.config.ts`.

## Required Tests

### Unit Tests

- `UT-001`: Not applicable — this task changes only a test tool configuration file with no production logic.

### Integration Tests

- `IT-001`: Not applicable — no application boundary changes.

### Smoke Tests

- `SMK-001`: Not applicable — mutation testing is a dev-time tool, not a deployment artifact.

### End-to-End Tests

- `E2E-001`: Not applicable — no user-facing behavior changes.

### Regression Tests

- `REG-001`: **Scenario**: `npm run test:mutation` no longer aborts on dry run
  **Given** `vitest.stryker.config.ts` excludes component specs
  **When** Stryker starts
  **Then** the dry run passes with zero failed tests
  Covers previous failure: `DashboardEditorHeader rendering › renders the title — document is not defined`.

### Performance Tests

- `PT-001`: Not applicable — this task changes only test configuration.

### Security Tests

- `ST-001`: Not applicable — no auth, input handling, or trust boundary changes.

### Usability Tests

- `UX-001`: Not applicable — no user-facing behavior changes.

### Observability Tests

- `OT-001`: Not applicable — no operational behavior changes.

## Definition of Done

- `vitest.stryker.config.ts` excludes component spec patterns matching the `unit` project in `vitest.config.ts`.
- `npm run test:mutation` completes without aborting on the dry run.
- A mutation score report is produced in `reports/`.
- `npm run test:unit` still passes (no unit tests removed from regular coverage).
