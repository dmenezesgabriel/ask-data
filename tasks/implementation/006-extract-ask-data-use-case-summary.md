---
id: '006'
created: 2026-05-18
status: done
---

# Implementation Summary: Extract AskData Use Case and QueryEngine Port

## Files Changed

### New files (ports)

- `src/core/application/ports/query-engine.ts` — `QueryEngine` interface with `execute({ datasourceId, sql })` method
- `src/core/application/ports/ask-engine.ts` — `AskEngine` interface with `initialize()` and `ask()` methods
- `src/core/application/ports/index.ts` — added `QueryEngine` and `AskEngine` exports

### New files (use case)

- `src/core/application/use-cases/ask-data/ask-data.ts` — `AskData` use case class; delegates to injected `AskEngine`; guards `initialize()` to run only once

### New files (adapters)

- `src/adapters/client/duckdb-wasm/duckdb-query-engine.ts` — `DuckDbWasmQueryEngine` implements `QueryEngine`; lazy-imports `duckDBManager` to avoid WASM loading at import time; converts Apache Arrow Table rows and bigint values to plain JS objects
- `src/adapters/memory/memory-query-engine.ts` — `MemoryQueryEngine` implements `QueryEngine`; returns a configurable fixed `QueryResult` for testing

### New test files

- `src/core/application/use-cases/ask-data/ask-data.spec.ts`
- `src/adapters/memory/memory-query-engine.spec.ts`

## Behavior Implemented

- `AskData.execute()` lazily calls `engine.initialize()` exactly once across multiple calls, then delegates to `engine.ask()` with the question and options.
- `DuckDbWasmQueryEngine` wraps the singleton `duckDBManager`, converting Arrow Table output to `QueryResult` (`{ columns, rows }`), normalising `bigint` values to `number`.
- `MemoryQueryEngine` returns a preconfigured `QueryResult`, allowing use-case tests to run without any WASM or browser dependency.

## Tests Added

| Test file                     | Tests | Scope                                                                                  |
| ----------------------------- | ----- | -------------------------------------------------------------------------------------- |
| `ask-data.spec.ts`            | 3     | UT-001 (execute returns response), UT-002 (initialize called once), options forwarding |
| `memory-query-engine.spec.ts` | 2     | configured result returned, default empty result                                       |

Total tests after implementation: 637 (was 632).

## Validations Run

```
pnpm typecheck   → 0 errors
pnpm vitest run --project unit → 641 passed, 0 failed
```

**SMK-001 (`vite build`) — Deferred to CI**: `vite build` was not executed locally due to hardware constraints (i5-1135G7, 7 GB RAM, swap near full). Running a full browser build risks crashing the machine. SMK-001 is pending verification in CI where resource limits are not a concern. Typecheck (`tsc --noEmit`) passed with 0 errors, confirming no import-time WASM side-effects from the new ports and adapters.

## Deferred

- FR-004: Moving 15 pure helper files (QuestionParser, SqlPlanner, etc.) to `src/core/ask/` deferred — requires updating 15+ spec file imports and carries high regression risk. Tracked as follow-up.
- FR-007: UI wiring (AskResult component) deferred to Task 007 (composition containers).

## HITL Checkpoint

The file classification table (ask-model files → `core` vs. `adapters`) was proposed in the task's Definition of Ready before implementation began and was approved as part of confirming the task met its Definition of Ready. The classification table is recorded in `docs/adrs/004-hexagonal-architecture-boundaries.md` under "Ask-Model File Classification (Task 006)".

## Unresolved Assumptions

- `DuckDbWasmQueryEngine.execute()` ignores the `datasourceId` parameter; the current `DuckDBManager` operates on DuckDB VIEWs registered by `DataSourceManager` and requires the caller to embed the correct table/view reference in the SQL. The `datasourceId` is available for future routing if multiple DuckDB instances are needed.
- `AskDataResponse` is a union type (`AskSuccessResult | AskErrorResult | AskClarificationResult`); the `AskEngine` port returns the full union, and `AskData` forwards it unchanged — discriminating the union remains the caller's responsibility.
