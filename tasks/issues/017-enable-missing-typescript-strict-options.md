---
id: '017'
created: 2026-05-28
updated: 2026-05-28
status: active
---

# Task: Enable missing TypeScript strict compiler options

## Priority

P1 — Independent of ESLint tasks; operates only on `tsconfig.json` and can run in parallel with Task 016. Must complete before the unified quality gate (Task 020) can pass cleanly.

## Dependencies

- No task dependency; operates on `tsconfig.json` independently of ESLint changes.
- No ADR dependency; both options are standard TypeScript strictness flags with no architectural side effects beyond type-checking discipline.

## Assignability

**HITL** — `noUncheckedIndexedAccess: true` may produce a large number of violations across the codebase (every array index access and record lookup becomes `T | undefined`). The implementer must audit violations, fix low-risk ones, and present the remaining count to a human before deciding whether to keep the option enabled or to document it as a deferred enforcement item. The human decision point is: _enable now and add explicit guards_ vs _defer and document_.

## Context

The current `tsconfig.json` has `strict: true`, `noImplicitAny: true`, `strictNullChecks: true`, and `noImplicitOverride: true` — a strong baseline. Two options from the target strictness set are missing or disabled:

- `noUncheckedIndexedAccess: false` (explicitly disabled) — array index access (`arr[0]`) and record property access (`record[key]`) currently return `T` instead of `T | undefined`. Enabling this forces the codebase to acknowledge that indexed access can be out-of-bounds.
- `forceConsistentCasingInFileNames` — not present in `tsconfig.json`. On case-insensitive file systems (macOS, Windows), this prevents import paths that differ only in casing from silently resolving on dev but failing in CI (Linux).

`noUncheckedIndexedAccess` is the riskier change because it affects every array and record access site. The safe strategy is:

1. Enable it.
2. Run `pnpm typecheck` and count errors.
3. Fix low-risk violations (add `?? fallback` or explicit `if (x === undefined)` guards where the index is known safe).
4. Document remaining violations with `// TODO(strict-debt):` inline comments.
5. Present the final count to a human to decide on the path forward.

`forceConsistentCasingInFileNames` is low-risk — it only rejects imports with mismatched casing, which the project likely does not have. If violations are found, they are trivially fixed by correcting import paths.

## Use Cases

- **Feature**: Indexed access safety
- **Scenario**: Developer accesses an array element without a bounds check
- **Given** `const first = items[0]` where `items` is `string[]`
- **When** TypeScript compiles with `noUncheckedIndexedAccess: true`
- **Then** `first` has type `string | undefined` and code that uses it as `string` without a guard produces a type error

---

- **Feature**: Cross-platform import consistency
- **Scenario**: Developer imports `./MyComponent` but the file is named `my-component.ts`
- **Given** `import foo from './MyComponent'` on a case-insensitive file system
- **When** TypeScript compiles with `forceConsistentCasingInFileNames: true`
- **Then** a type error is reported regardless of whether the host file system resolves the import

## Definition of Ready

- `pnpm typecheck` currently exits 0 (or with only known errors unrelated to these options).
- The implementer has a clear count of existing typecheck violations before making any changes, so regressions can be identified.

## Functional Requirements

- `FR-001`: `tsconfig.json` sets `forceConsistentCasingInFileNames: true`.
- `FR-002`: `tsconfig.json` sets `noUncheckedIndexedAccess: true`.
- `FR-003`: After both options are set, `pnpm typecheck` is run and all violations are recorded.
- `FR-004`: Violations caused by `forceConsistentCasingInFileNames` are fixed immediately (they are always safe to fix — just correct the import path casing).
- `FR-005`: Violations caused by `noUncheckedIndexedAccess` are triaged:
  - Low-risk: add `?? defaultValue` or a null-check guard in pure utility/helper code with no side effects. Fix these.
  - High-risk: leave `// TODO(strict-debt): noUncheckedIndexedAccess — <reason>` on the access site. Do not suppress with `// @ts-ignore` or `// @ts-expect-error`.
- `FR-006`: The final `noUncheckedIndexedAccess` violation count (after low-risk fixes) is reported to the human reviewer before the task is marked complete.

## Non-Functional Requirements

- `NFR-001`: `pnpm typecheck` must complete in under 30 seconds after the change.
- `NFR-002`: No `// @ts-ignore` or `// @ts-expect-error` suppressions are introduced.
- `NFR-003`: Vite and Lit framework-required compiler options (`experimentalDecorators`, `useDefineForClassFields: false`, `moduleResolution: Bundler`) remain unchanged.

## Observability Requirements

- `OBS-001`: A summary comment is added to `tsconfig.json` listing the remaining `noUncheckedIndexedAccess` violation count and the date this task was completed, so future developers understand why `// TODO(strict-debt):` comments exist.

## Acceptance Criteria

- `AC-001`: **Given** `tsconfig.json` with both new options, **When** `pnpm typecheck` runs, **Then** the only remaining errors are `noUncheckedIndexedAccess` violations with `// TODO(strict-debt):` comments.
- `AC-002`: **Given** an import path with wrong casing, **When** `pnpm typecheck` runs, **Then** a type error is reported for the mismatched casing.
- `AC-003`: **Given** an array access `arr[0]` with no guard, **When** `pnpm typecheck` runs with `noUncheckedIndexedAccess: true`, **Then** TypeScript reports `Type 'T | undefined' is not assignable to type 'T'` where `T` is the element type.
- `AC-004`: **Given** the human review decision, **When** the remaining violation count is acceptable, **Then** `noUncheckedIndexedAccess: true` stays in `tsconfig.json`; otherwise it is reverted and a `// TODO(strict-debt):` note documents the deferral.

## Required Tests

### Unit Tests

Not applicable — TypeScript compiler option changes are verified by running `pnpm typecheck`, not by unit tests of config logic.

### Integration Tests

- `IT-001`: **Scenario**: `noUncheckedIndexedAccess` catches an unsafe array access  
  **Given** a temporary TypeScript file with `const x: string = arr[0]` where `arr` is `string[]`  
  **When** `pnpm typecheck` runs  
  **Then** TypeScript reports an error on that line  
  Covers `FR-002`, `AC-003`.

- `IT-002`: **Scenario**: `forceConsistentCasingInFileNames` catches a mismatched import  
  **Given** a temporary import using the wrong casing for an existing file  
  **When** `pnpm typecheck` runs  
  **Then** TypeScript reports a module resolution error  
  Covers `FR-001`, `AC-002`.

### Smoke Tests

Not applicable — no build or deploy path changes.

### End-to-End Tests

Not applicable — no user journey changes.

### Regression Tests

Not applicable — no known previous defect related to these compiler options.

### Performance Tests

Not applicable — typecheck runtime is bounded by `NFR-001` and verified manually.

### Security Tests

Not applicable — no trust boundary changes.

### Usability Tests

Not applicable — no user-facing behavior changes.

### Observability Tests

Not applicable — violation counts are recorded in source comments, not in operational telemetry.

## Definition of Done

- `tsconfig.json` has `forceConsistentCasingInFileNames: true` and `noUncheckedIndexedAccess: true`.
- All `forceConsistentCasingInFileNames` violations are fixed.
- Remaining `noUncheckedIndexedAccess` violations have `// TODO(strict-debt):` comments.
- Human reviewer has seen and approved the remaining violation count.
- `// @ts-ignore` and `// @ts-expect-error` count is unchanged from before this task.
- `OBS-001` summary comment is present in `tsconfig.json`.
- `IT-001` and `IT-002` pass.
