---
id: '015'
created: 2026-05-29
status: complete
---

# Implementation Summary: Extend ESLint with type-safety, size, naming, and control-flow rules

## Files changed

- `eslint.config.js` — sole change; all new rules and lint-debt block added here
- `src/app/shell/app-shell.spec.ts` — restored 3 pre-existing `eslint-disable-next-line @typescript-eslint/no-explicit-any` comments removed by auto-fix; added `import type` for consistent-type-imports
- `src/features/ask/model/question-parser.ts` — restored 1 pre-existing `eslint-disable-next-line`; added `import type` fixes
- `src/features/ask/model/sql-planner.ts` — restored 2 pre-existing `eslint-disable-next-line`; added `import type` fixes
- `src/features/ask/model/date-range-parser.ts`, `field-search.ts`, `field-search.spec.ts`, `intent-cue-detector.ts` — `import type` auto-fix (consistent-type-imports)
- 10 additional spec files — `import type` auto-fix (consistent-type-imports)

## Behavior implemented

**FR-001** — Type-safety rules added to `**/*.ts, **/*.tsx` with type-aware parsing (`projectService`):

- `@typescript-eslint/no-explicit-any: error`
- `@typescript-eslint/explicit-function-return-type: error` (allowExpressions: true)
- `@typescript-eslint/no-unsafe-assignment: error`
- `@typescript-eslint/no-unsafe-member-access: error`
- `@typescript-eslint/no-unsafe-call: error`
- `@typescript-eslint/no-floating-promises: error`
- `@typescript-eslint/consistent-type-imports: error` (disallowTypeAnnotations: false to allow typeof import() patterns)

**FR-002** — Size and complexity guardrails added globally:

- `complexity: ["error", 8]` — cyclomatic complexity
- `max-depth: ["error", 2]`
- `max-lines: ["error", { max: 500, skipBlankLines: true, skipComments: true }]`
- `max-lines-per-function: ["error", { max: 20, skipBlankLines: true, skipComments: true }]`
- `max-params: ["error", 4]`

**FR-003** — `id-denylist: ["warn", ...]` on vague identifiers (data, obj, item, thing, stuff, manager, handler, helper, utils)

**FR-004** — `no-else-return: "error"` globally

**FR-005** — `no-console: "error"` globally; overridden to "off" for `tests/**`, `src/app/**`, `**/*.scripts.ts`, `scripts/**`

**FR-007** — Low-risk violations fixed:

- `@typescript-eslint/consistent-type-imports`: 23 violations auto-fixed across 18 files; 16 remaining `typeof import()` patterns allowed via `disallowTypeAnnotations: false`

**FR-008** — sonarjs overlap verified and noted in lint-debt block. `sonarjs/cognitive-complexity` (already error) differs from `complexity` (cyclomatic) — both kept. `sonarjs/function-return-type` (already error) partially overlaps with `explicit-function-return-type` — both kept for coverage.

**OBS-001** — `// TODO(lint-debt):` block added at the top of `eslint.config.js` with all rule counts, risk levels, and sonarjs overlap notes.

## Non-trivial decisions

**projectService allowDefaultProject** — The `@typescript-eslint/no-unsafe-*` rules require type information. Enabling `projectService: true` broke the architecture boundary fitness tests (`import-boundaries.spec.ts`) because those tests use ESLint's `lintText` API with virtual file paths that don't exist on disk. The TypeScript project service threw "file was not found by the project service" for those paths. Solution: `projectService: { allowDefaultProject: [...fixture paths...], defaultProject: 'tsconfig.json' }` — the specific fixture paths are listed explicitly since `allowDefaultProject` disallows `**` globs for performance reasons.

**Auto-fix side effect** — Running `eslint --fix` for `consistent-type-imports` also stripped 6 existing `// eslint-disable-next-line @typescript-eslint/no-explicit-any` comments (converting them to empty lines). These were manually restored, preserving the pre-existing suppression strategy for `as any` casts in test mocks and adapters.

**sonarjs rules activated by type-aware parsing** — Enabling `projectService` made sonarjs rules that require type information (particularly `sonarjs/deprecation`) start detecting violations. Before this task, `sonarjs/deprecation` was already set to "error" in `sonarjs.configs.recommended` but could not detect deprecated project-internal types without type info. Now 813 violations appear from deprecated `@deprecated`-tagged internal types. These are documented in lint-debt and left for follow-up.

## Tests added or updated

None added. All existing tests pass:

- `src/shared/architecture/import-boundaries.spec.ts` — 9/9 pass (required `allowDefaultProject` fix)
- Full `test:hooks` suite — 103 tests pass across 20 test files

## Validations run

- `pnpm lint` — exits with documented violations (all in lint-debt block); no new `eslint-disable` directives added
- `pnpm test:hooks` — 103 tests pass, 4 files skipped (pre-existing resource constraint skips)
- Lint timing: ~90 seconds with type-aware parsing on 268 TypeScript files (over NFR-001's 60s target due to `projectService` overhead; documented below)

## Acceptance criteria status

- AC-001 ✓ — lint exits non-zero only for known violations in `// TODO(lint-debt):`; all new rules active
- AC-002 ✓ — `@typescript-eslint/explicit-function-return-type` fires on functions without return type annotations
- AC-003 ✓ — `no-console: error` fires on `src/core/` console usage
- AC-004 ✓ — `no-console: off` in `tests/**` (exempt override applied)
- AC-005 ✓ — `complexity: error` fires on functions with 9+ branches
- AC-006 ✓ — no new `// eslint-disable` directives introduced; 6 pre-existing ones were accidentally removed by auto-fix and manually restored

## Unresolved assumptions / follow-up work

1. **NFR-001 exceeded**: `pnpm lint` takes ~90 seconds with `projectService` on 268 TS files, above the 60-second target. This is expected for type-aware linting at this scale; a tsconfig-based approach or caching (`eslint --cache`) would reduce it.
2. **813 sonarjs/deprecation violations**: Internal types marked `@deprecated` are used widely. These require removing deprecated type aliases from the shared types layer — medium-effort follow-up.
3. **441 max-lines-per-function violations**: Many functions exceed 20 lines; splitting is high-risk and left for dedicated follow-up tasks.
4. **111 explicit-function-return-type violations**: Classes and functions missing return type annotations; left for follow-up to avoid large-scope changes.
5. **sonarjs/function-return-type: 11**: Overlaps with `explicit-function-return-type`; will likely be resolved together.
