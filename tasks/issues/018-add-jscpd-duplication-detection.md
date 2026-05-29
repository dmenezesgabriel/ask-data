---
id: "018"
created: 2026-05-28
updated: 2026-05-28
status: active
---

# Task: Add jscpd for copy-paste duplication detection

## Priority

P2 — Independent of ESLint and TypeScript tasks; can start any time. Must complete before the unified quality gate (Task 020).

## Dependencies

- No task dependency; standalone tool installation with no shared config files.
- No ADR dependency; jscpd is an additive tool with no architectural implications.

## Assignability

**AFK** — installation, config, and script addition are fully specified; no judgment calls require a human.

## Context

The project has no duplication detection tool. `jscpd` (JavaScript Copy-Paste Detector) scans source files for repeated code blocks and reports duplication percentages and locations. It complements ESLint's structural rules by catching copy-paste patterns that ESLint cannot see.

The tool must be configured to:
- Ignore generated/build output (`dist/`, `.next/`, `coverage/`, `storybook-static/`).
- Ignore type declaration files (`*.d.ts`).
- Use a threshold and minimum block size that avoids false positives from short repeated patterns (e.g., import boilerplate).
- Report to the console and produce an HTML report in `reports/duplication/` for human review.

The first run will produce a baseline report. The task does not require fixing any detected duplication — that is a follow-up concern. The goal is to make the check runnable and non-blocking in CI (the `duplication:check` script exits 0 even when duplication is found, and the baseline percentage is documented).

**Note**: `jscpd` uses a project-level config file (`.jscpd.json`). The `package.json` `jscpd` key is an alternative location; use `.jscpd.json` to keep `package.json` clean.

## Use Cases

- **Feature**: Duplication baseline
- **Scenario**: Developer adds a script to measure duplication
- **Given** `jscpd` is installed and `.jscpd.json` is configured
- **When** `pnpm duplication:check` runs
- **Then** the console shows a duplication report and exits 0 (below threshold) or 1 (above threshold)

---

- **Feature**: Duplication tracking over time
- **Scenario**: CI surfaces new duplication introduced in a PR
- **Given** a PR adds a duplicated block above the configured minimum line count
- **When** the CI `pnpm check` command runs `duplication:check`
- **Then** the duplicate is reported and the PR author is informed

## Definition of Ready

- `pnpm` is confirmed as the package manager.
- `reports/` directory exists or can be created by jscpd at runtime.
- The project has no existing `.jscpd.json` file.

## Functional Requirements

- `FR-001`: `jscpd` is added to `devDependencies` via `pnpm add -D jscpd`.
- `FR-002`: `.jscpd.json` is created at the project root with:
  ```json
  {
    "threshold": 1,
    "minLines": 6,
    "minTokens": 50,
    "reporters": ["console", "html"],
    "output": "reports/duplication",
    "ignore": [
      "dist/**",
      "build/**",
      "coverage/**",
      ".next/**",
      "storybook-static/**",
      "node_modules/**",
      "*.d.ts",
      ".stryker-tmp/**"
    ]
  }
  ```
- `FR-003`: The `"duplication:check"` script is added to `package.json`: `"duplication:check": "jscpd src"`. Only `src/` is scanned; `tests/` duplication is tracked separately and is not a build gate.
- `FR-004`: `reports/duplication/` is added to `.gitignore` so generated HTML reports are not committed.
- `FR-005`: After the first `pnpm duplication:check` run, the baseline duplication percentage is recorded in a comment at the top of `.jscpd.json`.
- `FR-006`: If the baseline exceeds 5%, a `// TODO(duplication-debt):` block lists the top 3 duplicated file pairs so they are visible to future maintainers.

## Non-Functional Requirements

- `NFR-001`: `pnpm duplication:check` completes in under 60 seconds on the full `src/` tree.
- `NFR-002`: The tool does not modify any source files.
- `NFR-003`: `stryker-tmp` and `coverage` are excluded so mutation-testing artifacts do not inflate the report.

## Observability Requirements

- `OBS-001`: The HTML report at `reports/duplication/` provides file-level and block-level duplication details for human review after each run.
- `OBS-002`: The baseline duplication percentage is recorded in `.jscpd.json` as a comment so future engineers can track trend direction.

## Acceptance Criteria

- `AC-001`: **Given** `pnpm duplication:check` is run, **When** it completes, **Then** it exits 0 or 1 consistently (not intermittently) and prints a duplication summary to the console.
- `AC-002`: **Given** the `reports/duplication/` directory after a run, **When** it is opened, **Then** an HTML report lists the detected duplicated blocks with file paths and line numbers.
- `AC-003`: **Given** `.gitignore`, **When** `git status` is run after a `duplication:check` run, **Then** `reports/duplication/` appears as ignored.
- `AC-004`: **Given** `.stryker-tmp/` files exist in the repo, **When** `pnpm duplication:check` runs, **Then** no files from `.stryker-tmp/` appear in the report.

## Required Tests

### Unit Tests

Not applicable — jscpd configuration is verified by running the tool against real source files.

### Integration Tests

- `IT-001`: **Scenario**: Duplication check runs and produces output  
  **Given** `.jscpd.json` is in place and `jscpd` is installed  
  **When** `pnpm duplication:check` runs  
  **Then** the command exits (0 or 1) and the console shows a percentage summary  
  **And** `reports/duplication/` contains at least one HTML file  
  Covers `FR-003`, `AC-001`, `AC-002`.

- `IT-002`: **Scenario**: Ignored paths are not scanned  
  **Given** `.stryker-tmp/` contains TypeScript files  
  **When** `pnpm duplication:check` runs  
  **Then** no `.stryker-tmp/` files appear in the report  
  Covers `FR-002`, `AC-004`.

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

Not applicable — duplication reporting is the tool's output itself, not operational telemetry.

## Definition of Done

- `jscpd` is in `devDependencies` and installed.
- `.jscpd.json` exists with the configuration in `FR-002`.
- `"duplication:check": "jscpd src"` is in `package.json` scripts.
- `reports/duplication/` is in `.gitignore`.
- `IT-001` and `IT-002` pass.
- Baseline duplication percentage is recorded in `.jscpd.json`.
