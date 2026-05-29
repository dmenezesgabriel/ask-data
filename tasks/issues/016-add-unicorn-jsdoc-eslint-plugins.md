---
id: '016'
created: 2026-05-28
updated: 2026-05-28
status: active
---

# Task: Install eslint-plugin-unicorn and eslint-plugin-jsdoc

## Priority

P1 — Depends on Task 015 establishing the violation baseline; unicorn and jsdoc rules build on the same ESLint config and must be added after the base rule audit is complete.

## Dependencies

- Depends on Task 015 (`015-extend-eslint-type-safety-size-naming-rules`): ESLint violation baseline must be documented before adding more rules that may generate their own violations.
- No ADR dependency; this is a plugin addition to an existing ESLint flat-config setup.

## Assignability

**AFK** — both plugins are well-defined, installation steps are deterministic, and the rule surface is fully specified below.

## Context

Two ESLint plugins required by the static-checking foundation are not yet installed:

- **`eslint-plugin-unicorn`**: enforces idiomatic JavaScript/TypeScript patterns. The project needs `unicorn/no-lonely-if` (forbids `if` inside an `else` that could be `else if`) and a selective set of unicorn rules aligned with the project's Lit + Vite + TypeScript stack. Do not enable the full unicorn recommended config — many rules conflict with Lit decorator patterns and the project's existing style.
- **`eslint-plugin-jsdoc`**: enforces JSDoc comments on exported functions. The project has a convention of intent-focused comments on public APIs. This plugin verifies that exported functions have a description and at least one `@example` tag where practical.

Both plugins must be added to `devDependencies` via `pnpm add -D` and configured in `eslint.config.js`.

**Scope boundary**: configure only the rules listed in FR-001 and FR-002. Do not enable recommended presets wholesale — they introduce noise on this codebase.

## Use Cases

- **Feature**: Idiomatic control flow
- **Scenario**: Developer writes an `else` block containing only an `if`
- **Given** code using `else { if (x) { ... } }` instead of `else if (x)`
- **When** ESLint runs
- **Then** `unicorn/no-lonely-if` reports an error

---

- **Feature**: Public API documentation
- **Scenario**: Developer exports a function with a JSDoc block missing a description
- **Given** an exported function in `src/core/` with a JSDoc block that has no description text
- **When** ESLint runs
- **Then** `jsdoc/require-description` reports a warning

## Definition of Ready

- Task 015 is complete and the `// TODO(lint-debt):` block exists in `eslint.config.js`.
- `pnpm` is the active package manager (pnpm-lock.yaml exists).
- ESLint flat-config format is confirmed working (both plugins support flat config).

## Functional Requirements

- `FR-001`: `eslint-plugin-unicorn` is added to `devDependencies`. The following unicorn rules are enabled in `eslint.config.js` for TypeScript source files (`src/**/*.ts`):
  - `unicorn/no-lonely-if: "error"` — prevents `else { if }` that should be `else if`.
  - `unicorn/no-useless-undefined: "error"` — removes explicit `return undefined` noise.
  - `unicorn/prefer-ternary: ["warn", "only-single-line"]` — warn-only; do not force multi-line ternaries.
  - No other unicorn rules are enabled in this task.
- `FR-002`: `eslint-plugin-jsdoc` is added to `devDependencies`. The following jsdoc rules are enabled for exported TypeScript functions only (using `checkConstructors: false` and `publicOnly: true` options where supported):
  - `jsdoc/require-description: "warn"` — exported functions must have an intent description.
  - `jsdoc/require-example: ["warn", { enableFixer: false }]` — exported functions must have at least one `@example` tag.
  - `jsdoc/no-blank-block-descriptions: "error"` — empty JSDoc blocks are not allowed.
  - `jsdoc/check-tag-names: "error"` — unknown JSDoc tags are not allowed.
  - No `jsdoc/require-param` or `jsdoc/require-returns` rules are enabled; those are handled by TypeScript types.
- `FR-003`: Both plugins are added using the flat-config plugin object pattern (`plugins: { unicorn, jsdoc }`), consistent with the existing `eslint.config.js` style.
- `FR-004`: After adding the plugins, `pnpm lint` is run and new violation counts are appended to the existing `// TODO(lint-debt):` block in `eslint.config.js`.
- `FR-005`: Storybook story files (`**/*.stories.ts`) are excluded from jsdoc rules — stories are not public API documentation targets.
- `FR-006`: Test files (`tests/**`) are excluded from both unicorn and jsdoc rules.

## Non-Functional Requirements

- `NFR-001`: `pnpm lint` runtime does not increase by more than 15 seconds compared to the Task 015 baseline.
- `NFR-002`: No `eslint-disable` directives are added during this task.
- `NFR-003`: The Lit decorator pattern (`@customElement`, `@property`) must not be flagged by any newly added unicorn rule.

## Observability Requirements

- `OBS-001`: The `// TODO(lint-debt):` block in `eslint.config.js` is updated with unicorn and jsdoc violation counts after `pnpm lint` runs.

## Acceptance Criteria

- `AC-001`: **Given** `eslint-plugin-unicorn` and `eslint-plugin-jsdoc` are installed, **When** `pnpm lint` runs, **Then** both plugins are loaded without `plugin not found` errors.
- `AC-002`: **Given** code with `else { if (x) { ... } }`, **When** ESLint runs, **Then** `unicorn/no-lonely-if` reports an error.
- `AC-003`: **Given** an exported TypeScript function whose existing JSDoc block has no description text, **When** ESLint runs, **Then** `jsdoc/require-description` reports a warning.
- `AC-004`: **Given** a Storybook story file (`*.stories.ts`), **When** ESLint runs, **Then** no jsdoc warnings are reported regardless of JSDoc presence.
- `AC-005`: **Given** a test file in `tests/`, **When** ESLint runs, **Then** no unicorn or jsdoc rules fire.

## Required Tests

### Unit Tests

Not applicable — plugin configuration is verified by running the linter against real source files.

### Integration Tests

- `IT-001`: **Scenario**: Unicorn rule fires on lonely-if pattern  
  **Given** a temporary source file containing `else { if (x) {} }`  
  **When** `pnpm lint` runs on that file  
  **Then** `unicorn/no-lonely-if` is reported  
  Covers `FR-001`, `AC-002`.

- `IT-002`: **Scenario**: jsdoc rule fires on exported function with JSDoc block missing description  
  **Given** a temporary source file exporting a function with a JSDoc block that has no description text  
  **When** `pnpm lint` runs on that file  
  **Then** `jsdoc/require-description` is reported  
  Covers `FR-002`, `AC-003`.

- `IT-003`: **Scenario**: Story files are exempt from jsdoc  
  **Given** a Storybook story file with no JSDoc on its exported `default`  
  **When** `pnpm lint` runs  
  **Then** no jsdoc warning is reported  
  Covers `FR-005`, `AC-004`.

### Smoke Tests

Not applicable — no build or deploy path changes.

### End-to-End Tests

Not applicable — no user journey changes.

### Regression Tests

Not applicable — no known previous defect.

### Performance Tests

Not applicable — linting time increase is bounded by `NFR-001` and verified manually.

### Security Tests

Not applicable — no trust boundary changes.

### Usability Tests

Not applicable — no user-facing behavior changes.

### Observability Tests

Not applicable — violation counts are recorded in the lint-debt block, not in operational telemetry.

## Definition of Done

- `eslint-plugin-unicorn` and `eslint-plugin-jsdoc` are in `devDependencies` and installed.
- Rules in `FR-001` and `FR-002` are active in `eslint.config.js`.
- Story and test file overrides exclude jsdoc and unicorn rules.
- `IT-001`, `IT-002`, `IT-003` pass.
- `// TODO(lint-debt):` block is updated with new violation counts.
- No new `eslint-disable` directives introduced.
