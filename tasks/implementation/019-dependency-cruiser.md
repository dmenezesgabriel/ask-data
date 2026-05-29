---
task: '019'
date: 2026-05-29
status: complete
---

# Implementation: dependency-cruiser circular dependency check

## Files changed

- `package.json` — added `"architecture:check"` script; added `dependency-cruiser` to `devDependencies`
- `.dependency-cruiser.cjs` — new config: `no-circular` (error) + `no-orphans` (warn), excludes `env.d.ts` and story files from orphan detection

## Behavior implemented

- `pnpm architecture:check` runs `depcruise src --config .dependency-cruiser.cjs`
- `no-circular` rule enforces error-level detection of any circular import cycle within `src/`
- `no-orphans` rule warns on unreachable modules; `src/env.d.ts` and `.stories.*` files are excluded
- Architecture layer boundary rules are not duplicated (those remain in `eslint-plugin-boundaries`)

## Circular-debt policy (FR-005 Option A)

First run found **0 circular dependencies**. All circular imports are errors immediately. No known-debt exceptions needed.

## Validations run

- `pnpm architecture:check` → exits 0, 0 errors, 20 orphan warnings (all core entities/ports — expected in ports-and-adapters, since depcruise doesn't trace through the composition root)
- AC-004: `src/env.d.ts` — no orphan warning raised
- IT-001: temp `A → B → A` files → `no-circular` error reported with full chain, exit 1
- IT-002: unmodified `src/` → exits 0

## Test categories

- Unit tests: not applicable — depcruise config is verified by running the tool against the source tree
- Integration tests (IT-001, IT-002): passed manually
- All other categories: not applicable per task requirements

## Unresolved assumptions

The 20 orphan warnings on `src/core/**` are expected false-positives: core entities and ports are used by adapters and composition, but depcruise infers the module graph from import statements rather than from the TypeScript compilation root, so ports with no direct runtime importer appear orphaned. These are warnings, not errors, and do not block CI.
