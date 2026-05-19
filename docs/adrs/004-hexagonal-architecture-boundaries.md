# ADR 004: Hexagonal Architecture Layer Boundaries

## Status

Accepted

## Date

2026-05-18

## Related Tasks

- `tasks/issues/003-define-core-entities.md`
- `tasks/issues/004-introduce-repository-ports-and-adapters.md`
- `tasks/issues/005-create-crud-use-cases.md`
- `tasks/issues/006-extract-ask-data-use-case.md`
- `tasks/issues/008-enforce-import-boundaries.md`

## Context

The refactoring introduces a hexagonal architecture with strict import-direction rules:

- `core` (entities + ports + use cases) must not import from `features`, `adapters`, `infra`, or `shared/ui`.
- `features` may import from `core` only — not from `adapters`, `infra`, or peer features.
- `adapters` may import from `core` — not from `features` or `infra`.
- `composition` may import from everything to wire the app.

Without tooling, these rules will erode silently. The project currently has no boundary enforcement. `eslint.config.js` uses `simple-import-sort` and `sonarjs` only.

## Decision

Use `eslint-plugin-boundaries` to declare import zones and enforce allowed-only relationships between them. Configure zones as `core`, `features`, `adapters`, `composition`, `infra`, and `shared`. Add boundary rules as ESLint errors.

## Options Considered

1. `eslint-plugin-boundaries` with named import zones. `(recommended)`
2. `eslint` `no-restricted-imports` rules per file pattern — simpler but requires repeating rules per folder and breaks silently when folders are renamed.
3. TypeScript project references — compile-time enforcement but adds significant build and editor-restart complexity to a Vite project.

## Consequences

Positive:

- Violations are caught at lint time, before tests or review.
- Zone rules are declared once in `eslint.config.js` and apply project-wide.
- Adding a new adapter or feature folder does not require updating import rules.

Negative:

- Adds one new dev dependency.
- Initial setup requires classifying all existing paths before violations can be enforced.

## Validation

- ESLint reports zero boundary violations after Task 008 completes.
- A deliberate violation (importing an adapter from core) is confirmed to produce an ESLint error.
- CI fails on boundary violations.

## Ask-Model File Classification (Task 006)

The following files from `src/features/ask/model/` were classified as deployment-agnostic (→ `core`) vs. browser/WASM-specific (→ `adapters`):

| File                                             | Classification              | Reason                                                |
| ------------------------------------------------ | --------------------------- | ----------------------------------------------------- |
| `question-parser.ts`                             | core                        | Pure NL parsing, no browser API                       |
| `sql-planner.ts`                                 | core                        | Pure SQL planning                                     |
| `sql-renderer.ts`                                | core                        | Pure SQL string building                              |
| `result-analysis.ts`                             | core                        | Pure result shaping                                   |
| `result-analyzer.ts`                             | core                        | Pure result pattern analysis                          |
| `catalog-builder.ts`                             | core                        | Pure field profiling                                  |
| `semantic-modeling.ts`                           | core                        | Pattern-based role detection, no browser API          |
| `narrative-generator.ts`                         | core                        | Pure text generation                                  |
| `intent-describer.ts`                            | core                        | Pure intent formatting                                |
| `date-range-parser.ts`                           | core                        | Pure date parsing (chrono-node)                       |
| `vocabulary.ts`                                  | core                        | Pure bilingual dictionaries                           |
| `term-matcher.ts`                                | core                        | Pure regex matching                                   |
| `field-search.ts`                                | core                        | MiniSearch (runs in Node and browser)                 |
| `semantic-field-matcher.ts`                      | core                        | ONNX via transformers.js — runs in Node too           |
| `value-filter-resolver.ts`                       | core                        | Pure resolver with Fuse.js                            |
| `ask-data.ts` (AskDataEngine)                    | core/use-cases              | Main use case class (deferred; currently in features) |
| `infra/db/db.ts`                                 | adapters/client/duckdb-wasm | Browser WASM — adapter                                |
| `infra/data-sources/data-source-manager.ts`      | adapters/client/duckdb-wasm | DuckDB-specific — adapter                             |
| `orchestration/create-dashboard-orchestrator.ts` | adapters/client/duckdb-wasm | Wires DuckDB — adapter                                |

Physical file movement of pure helpers (→ `src/core/ask/`) is deferred to a follow-up task due to the scope of import updates required across 15+ spec files.

## Open Questions

- Should `shared/utils` (pure helpers like slug generation) be classified under `core` or remain a separate `shared` zone?
- Should `infra` be abolished entirely in favor of `adapters`, or kept for framework-bootstrap-only code?
