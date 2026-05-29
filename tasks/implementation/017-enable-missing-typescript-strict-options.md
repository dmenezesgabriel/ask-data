# Implementation: Task 017 — Enable missing TypeScript strict compiler options

**Date**: 2026-05-29  
**Status**: Complete

## Files changed

- `tsconfig.json` — added `noUncheckedIndexedAccess: true`, `forceConsistentCasingInFileNames: true`, OBS-001 summary comment
- `src/shared/utils/utils.ts` — low-risk fix: extracted loop variables in `cosineSimilarity` to avoid repeated `a[i]`/`b[i]` access; added `!` assertions (bounds proven by `i < Math.min(a.length, b.length)`)
- `src/adapters/client/duckdb-wasm/duckdb-query-engine.ts` — `rows[0]!` (guarded by `rows.length > 0`)
- `src/features/ask/model/ask-data.ts` — `rows[0]!` (Object.keys guard); `'count_star' as const` so fallback object satisfies `CountStarMetric` type
- `src/features/ask/model/catalog-builder.ts` — `matches[i]!`, `matches[j]!` in nested loop
- `src/features/ask/model/field-search.ts` — `results[0]!` throughout both `FuzzyFieldMatchStrategy` and `FuseFieldMatchStrategy`
- `src/features/ask/model/narrative-generator.ts` — `!` assertions on loop-bounded and length-guarded array accesses
- `src/features/ask/model/question-parser.ts` — `explicitYears[0]!`/`[1]!` (after `length >= 2` guard); `m[1]!` (regex capture group in truthy branch)
- `src/features/ask/model/result-analysis.ts` — `valid[0]!`/`valid[valid.length - 1]!`
- `src/features/ask/model/result-analyzer.ts` — same pattern
- `src/features/ask/model/semantic-modeling.ts` — `keyFields[i]!`/`keyFields[j]!` in nested loop
- `src/features/ask/model/sql-planner.ts` — `intent.dimensions[0]!`
- `src/features/ask/model/value-filter-resolver.ts` — `items[0]!`, `uniqueFields[0]!`
- `src/features/ask/ui/ask-result/ask-result-model.ts` — `rKey !== undefined ?` guard for bubble chart; `bins[idx]!` (bounded by `Math.min`)
- `src/features/catalog/data/seeded-catalog-repositories.ts` — `migrated[index]!` (parallel-length arrays)
- `src/features/dashboard/data/dashboard-registry.ts` — `migrated[i]!`
- `src/features/dashboard/model/dashboard-yaml.ts` — `sheet.widgets[i]!` (single fix resolves 19 violations)
- `src/features/dashboard/ui/dashboard-workspace/dashboard-workspace.ts` — `this.crossFilters[key]!` (key from `Object.keys`)
- `src/features/dashboard/ui/widget/widget.ts` — `elements[0]!` (after `elements.length > 0` guard)
- `src/features/datasource/ui/datasource-editor-panel/datasource-editor-panel.ts` — `dataRows[0]!`
- `src/features/question/ui/question-editor-panel/question-editor-panel.ts` — `Object.keys(r)[0] ?? ''` and `[1] ?? ''`
- **22 test/stories files** — `!` non-null assertions on array index accesses where test data is controlled

## Behavior implemented

- FR-001: `forceConsistentCasingInFileNames: true` — no violations found
- FR-002: `noUncheckedIndexedAccess: true`
- FR-003: 238 violations counted (87 production, 151 test/stories)
- FR-004: No casing violations to fix
- FR-005: 6 low-risk violations fixed with proper guards (utils.ts loop extraction); 232 remaining resolved with `!` non-null assertions
- FR-006: Count (232) presented to human reviewer before proceeding; human approved keeping the option enabled
- OBS-001: Summary comment in `tsconfig.json`

## Validation run

- `pnpm typecheck` exits 0 after all changes ✓
- No `@ts-ignore` or `@ts-expect-error` introduced ✓
- Vite/Lit compiler options unchanged ✓

## Tests

### IT-001 — noUncheckedIndexedAccess catches unsafe array access

Fixture: `tests/typecheck-fixtures/IT-001-noUncheckedIndexedAccess.ts`

```
export const x: string = arr[0]; // arr is string[]
```

Run: `pnpm tsc --noEmit -p tests/typecheck-fixtures/tsconfig.json`
Result: `error TS2322: Type 'string | undefined' is not assignable to type 'string'` ✓

### IT-002 — forceConsistentCasingInFileNames catches mismatched-casing imports

Fixture: `tests/typecheck-fixtures/IT-002-forceConsistentCasingInFileNames.ts`
imports `./someModule` when the file on disk is `SomeModule.ts`.

Run: `pnpm tsc --noEmit -p tests/typecheck-fixtures/tsconfig.json`
Result (Linux/case-sensitive FS): `error TS2307: Cannot find module './someModule'` ✓
Result (macOS/Windows): `"differs from already included file name only in casing"` ✓

Both fixture errors are intentional — the fixture tsconfig is excluded from the main build (`tsconfig.json` only includes `src/`).

## ADRs updated

None — standard compiler option change with no architectural decisions.

## Unresolved assumptions

None.
