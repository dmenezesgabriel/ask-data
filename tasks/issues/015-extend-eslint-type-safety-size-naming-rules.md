---
id: '015'
created: 2026-05-28
updated: 2026-05-28
status: active
---

# Task: Extend ESLint with type-safety, size, naming, and control-flow rules

## Priority

P0 — Establishes the violation baseline that Tasks 016 and 020 depend on; all remaining ESLint-dependent tasks build on this config extension.

## Dependencies

- No task dependency; all required packages (`typescript-eslint`, `eslint-plugin-sonarjs`) are already installed.
- No ADR dependency; this task extends the existing `eslint.config.js` without changing architectural tooling.

## Assignability

**AFK** — all rules, file locations, and violation-reporting strategy are fully specified; no irreversible decisions remain open.

## Context

The project already has ESLint with `typescript-eslint`, `sonarjs`, `eslint-plugin-boundaries`, `eslint-plugin-lit`, and `eslint-plugin-simple-import-sort` configured in `eslint.config.js`. The current config is missing several rule categories required by the static-checking foundation:

- **Type safety**: no `@typescript-eslint/no-explicit-any`, no `explicit-function-return-type`, no `no-unsafe-*` rules, no `no-floating-promises`, no `consistent-type-imports`.
- **Size and complexity**: no `complexity`, `max-depth`, `max-lines`, `max-lines-per-function`, or `max-params` rules (sonarjs covers some code smells but not these structural limits).
- **Naming discipline**: no `id-denylist` to guard against vague identifiers like `data`, `handler`, `utils`.
- **Control flow**: no `no-else-return` to enforce early returns.
- **Console hygiene**: no `no-console` restriction on application code.

All needed packages are already in `devDependencies`. Only `eslint.config.js` needs to change.

**Strategy for existing violations**: do not mass-disable. Add the rules, run `pnpm lint`, record violation counts per rule in a `// TODO(lint-debt):` block at the top of `eslint.config.js`, fix low-risk violations (unused imports, trivial type annotations), and leave high-risk refactors for follow-up tasks.

**Overlap with sonarjs**: `eslint-plugin-sonarjs` already detects some complexity issues. Verify rule overlap before adding duplicates — prefer the `sonarjs` rule where it already covers the same concern.

## Use Cases

- **Feature**: Static type-safety enforcement
- **Scenario**: Developer writes a function with implicit `any` return
- **Given** a TypeScript function that returns inferred `any`
- **When** ESLint runs on that file
- **Then** the linter reports a `@typescript-eslint/no-explicit-any` or `explicit-function-return-type` error

---

- **Feature**: Size guardrails
- **Scenario**: A file grows past 500 logical lines
- **Given** a source file exceeding 500 non-blank, non-comment lines
- **When** ESLint runs
- **Then** `max-lines` reports an error and the developer splits the file

---

- **Feature**: Console hygiene
- **Scenario**: Debug `console.log` is committed in application code
- **Given** a `console.log` call in `src/core/` or `src/features/`
- **When** ESLint runs
- **Then** `no-console` reports an error

## Definition of Ready

- `eslint.config.js` is the single ESLint flat-config file and is already working (`pnpm lint` exits 0 or with known errors before this task begins).
- All rule names used below are valid for `eslint@^10` with `typescript-eslint@^8`.
- The pre-commit hook (`npm run lint:staged`) and `test:hooks` still pass after changes so git commits are not blocked unintentionally.

## Functional Requirements

- `FR-001`: `eslint.config.js` adds the following rules to the TypeScript file glob (`**/*.ts`, `**/*.tsx`):
  - `@typescript-eslint/no-explicit-any: "error"`
  - `@typescript-eslint/explicit-function-return-type: "error"` (with `allowExpressions: true` to avoid noisy anonymous callbacks)
  - `@typescript-eslint/no-unsafe-assignment: "error"`
  - `@typescript-eslint/no-unsafe-member-access: "error"`
  - `@typescript-eslint/no-unsafe-call: "error"`
  - `@typescript-eslint/no-floating-promises: "error"`
  - `@typescript-eslint/consistent-type-imports: "error"`
- `FR-002`: `eslint.config.js` adds the following language rules to all source files:
  - `complexity: ["error", 8]`
  - `max-depth: ["error", 2]`
  - `max-lines: ["error", { max: 500, skipBlankLines: true, skipComments: true }]`
  - `max-lines-per-function: ["error", { max: 20, skipBlankLines: true, skipComments: true }]`
  - `max-params: ["error", 4]`
- `FR-003`: `id-denylist` is added to warn (not error) on identifiers: `data`, `obj`, `item`, `thing`, `stuff`, `manager`, `handler`, `helper`, `utils`. Warning level avoids blocking existing public API names.
- `FR-004`: `no-else-return: "error"` is added to all source files.
- `FR-005`: `no-console: "error"` is added, with explicit overrides allowing `console` in:
  - `tests/**` (all test files)
  - `src/app/**` (entrypoints)
  - any file matched by `**/*.scripts.ts` or `scripts/**`
- `FR-006`: After adding rules, `pnpm lint` is run and the violation count per rule is recorded in a `// TODO(lint-debt):` comment block at the top of `eslint.config.js`.
- `FR-007`: Low-risk violations (missing `consistent-type-imports`, trivially missing return types on simple pure functions) are fixed in this task. High-risk refactors (functions exceeding 20 lines, files exceeding 500 lines, unsafe `any` assignments in complex adapters) are left with `// TODO(lint-debt):` inline comments and are not suppressed with `eslint-disable`.
- `FR-008`: `sonarjs` rule overlap is verified. If `sonarjs` already enforces a rule equivalent to one of the above, the new rule is omitted and a comment notes the sonarjs equivalent.

## Non-Functional Requirements

- `NFR-001`: `pnpm lint` completes in under 60 seconds on the full `src/` tree.
- `NFR-002`: No existing `eslint-disable` directives are added by this task.
- `NFR-003`: Storybook and test files retain their existing rule overrides without regression.
- `NFR-004`: The `lint:staged` hook continues to work; changed files are linted on commit.

## Observability Requirements

- `OBS-001`: The `// TODO(lint-debt):` block in `eslint.config.js` lists each new rule with its current violation count and a brief description of the risk level (low/medium/high). This block is machine-readable for future automation.

## Acceptance Criteria

- `AC-001`: **Given** `pnpm lint` runs on `src/`, **When** the command completes, **Then** it exits with a non-zero code only for known violations documented in the `// TODO(lint-debt):` block, and all new rules are active.
- `AC-002`: **Given** a TypeScript function returning implicit `any`, **When** ESLint runs, **Then** at least one of `@typescript-eslint/no-explicit-any` or `explicit-function-return-type` fires.
- `AC-003`: **Given** a `console.log` in `src/core/`, **When** ESLint runs, **Then** `no-console` reports an error.
- `AC-004`: **Given** a `console.log` in `tests/`, **When** ESLint runs, **Then** no error is reported.
- `AC-005`: **Given** a function with 9 branches, **When** ESLint runs, **Then** `complexity` reports an error.
- `AC-006`: **Given** `pnpm lint` exits, **Then** no new `// eslint-disable` comments exist in any source file that were not present before this task.

## Required Tests

### Unit Tests

Not applicable — ESLint rule configuration is verified by running the linter against the real source tree, not by unit tests of config logic.

### Integration Tests

- `IT-001`: **Scenario**: Lint rule baseline is established  
  **Given** the updated `eslint.config.js` is in place  
  **When** `pnpm lint` runs on the full `src/` directory  
  **Then** the command exits and the output matches the violation counts in `// TODO(lint-debt):`  
  **And** no rules are silently ignored or overridden  
  Covers `FR-001`, `FR-002`, `FR-006`, `AC-001`.

- `IT-002`: **Scenario**: Test files are exempt from no-console  
  **Given** a test file in `tests/` contains `console.log`  
  **When** `pnpm lint` runs  
  **Then** no `no-console` error is reported for that file  
  Covers `FR-005`, `AC-004`.

### Smoke Tests

Not applicable — no build or deploy path changes.

### End-to-End Tests

Not applicable — no user journey changes.

### Regression Tests

Not applicable — no known previous defect related to lint config.

### Performance Tests

Not applicable — linting performance is not a measurable risk at this scale.

### Security Tests

Not applicable — this task does not touch authentication, authorization, input handling, storage, secrets, or external communication.

### Usability Tests

Not applicable — no user-facing behavior changes.

### Observability Tests

- `OT-001`: After running `pnpm lint`, verify the `// TODO(lint-debt):` block exists in `eslint.config.js` with at least one rule entry, a violation count, and a risk level. Covers `OBS-001`.

## Definition of Done

- Code is implemented in `eslint.config.js` only; no other source files are refactored.
- `IT-001` and `IT-002` pass (linter output matches documented baseline).
- `OT-001` passes (debt block is present and populated).
- The pre-commit hook (`npm run lint:staged`) still works after the config change.
- No new `eslint-disable` directives introduced.
- `// TODO(lint-debt):` block is present at the top of `eslint.config.js` with counts.
