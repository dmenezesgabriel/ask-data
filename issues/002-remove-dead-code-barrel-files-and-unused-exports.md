# Task: Remove dead code — barrel files, shims, and unused exported symbols

## Priority

P1 — Knip reports 7 unused files and 2 unused exported symbols; none block functionality but they pollute the module graph and produce false confidence in the public surface.

## Dependencies

- No task dependency; can start independently.
- No ADR dependency; this task removes dead code with no architectural impact.

## Context

Knip identified dead code across three categories:

**Barrel `index.ts` files (5 files)** — Each feature directory has a re-export barrel that is never imported. The app shell imports directly from deep paths (e.g. `../../features/dashboard/data/dashboard-registry`), not from the barrel. `src/main.ts` is a one-line wrapper (`import './app/main'`) that is also dead because `index.html` already points directly to `src/app/main.ts`.

Files to delete:
- `src/main.ts`
- `src/features/ask/index.ts`
- `src/features/dashboard/index.ts`
- `src/features/datasource/index.ts`
- `src/features/question/index.ts`

**Chrono-node stub shims (2 files)** — `src/infra/shims/chrono-node/en.ts` and `pt.ts` each export a stub `parse()` that returns `[]`. They were presumably placeholder shims before the real aliasing was wired. `vite.config.ts` already aliases `chrono-node/en` and `chrono-node/pt` directly to the real chrono-node dist files, making these shims unreachable and unused.

Files to delete:
- `src/infra/shims/chrono-node/en.ts`
- `src/infra/shims/chrono-node/pt.ts`

**Unused exported symbols (2)** — `pixelToGrid` in `src/features/dashboard/model/grid-layout-engine.ts:183` and `LegacyDataSourceConfig` in `src/shared/types/data-source.ts:15` are exported but never imported anywhere. Both should be deleted (not just unexported) since they have no callers anywhere in the codebase.

## Use Cases

- **Feature**: Dead code removal
- **Scenario**: Developer runs knip after cleanup
- **Given** the dead files and symbols are deleted
- **When** the developer runs `npm run knip`
- **Then** knip reports no unused files or unused exported symbols in these categories

## Definition of Ready

- Confirmed: none of the barrel files are imported by any source, test, or story file.
- Confirmed: `src/infra/shims/chrono-node/en.ts` and `pt.ts` are not imported; real aliasing is in `vite.config.ts`.
- Confirmed: `pixelToGrid` appears only at its definition site.
- Confirmed: `LegacyDataSourceConfig` appears only at its definition site.

## Functional Requirements

- `FR-001`: The 5 barrel/wrapper files are deleted from the repository.
- `FR-002`: The 2 chrono-node stub shims are deleted from the repository.
- `FR-003`: The `pixelToGrid` function is removed from `grid-layout-engine.ts`.
- `FR-004`: The `LegacyDataSourceConfig` interface is removed from `data-source.ts`.

## Non-Functional Requirements

- `NFR-001`: All existing tests (`npm run test`) continue to pass after deletion.
- `NFR-002`: TypeScript compilation (`npm run typecheck`) produces no new errors after deletion.

## Observability Requirements

- `OBS-001`: Not applicable — dead code removal has no runtime observability impact.

## Acceptance Criteria

- `AC-001`: **Given** the files are deleted, **When** `npm run typecheck` is run, **Then** it exits with zero errors.
- `AC-002`: **Given** the files are deleted, **When** `npm run test` is run, **Then** all tests pass.
- `AC-003`: **Given** the symbols are removed, **When** `npm run knip` is run, **Then** it reports no unused files or unused exported symbols for the deleted items.

## Required Tests

### Unit Tests

- `UT-001`: Not applicable — dead code removal; no production logic changes.

### Integration Tests

- `IT-001`: Not applicable — no boundary behavior changes.

### Smoke Tests

- `SMK-001`: Not applicable — no deploy artifact changes.

### End-to-End Tests

- `E2E-001`: Not applicable — no user-facing behavior changes.

### Regression Tests

- `REG-001`: Not applicable — no known previous defect related to these symbols.

### Performance Tests

- `PT-001`: Not applicable — no runtime performance impact.

### Security Tests

- `ST-001`: Not applicable — no auth, input, or trust boundary changes.

### Usability Tests

- `UX-001`: Not applicable — no user-facing changes.

### Observability Tests

- `OT-001`: Not applicable — no operational behavior changes.

## Definition of Done

- All 7 files listed above are deleted.
- `export` of `pixelToGrid` and `LegacyDataSourceConfig` are removed from their respective files (or the symbols deleted entirely if the body is also unused).
- `npm run typecheck` passes with zero errors.
- `npm run test` passes with all tests green.
- `npm run knip` no longer reports these files or symbols as unused.
