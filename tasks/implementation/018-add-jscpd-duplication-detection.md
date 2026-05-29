# Implementation: 018 — Add jscpd for copy-paste duplication detection

## Files changed

- `package.json` — added `"duplication:check": "jscpd src"` script; `jscpd@^4.2.4` added to `devDependencies` by npm
- `package-lock.json` — updated by npm install
- `.jscpd.json` — created with threshold, minLines, minTokens, reporters, output, and ignore config; baseline comment and TODO(duplication-debt) block included
- `.gitignore` — added `reports/duplication` entry (redundant with existing `reports` entry, but explicit per FR-004)

## Behavior implemented

- `pnpm duplication:check` / `npm run duplication:check` runs jscpd against `src/` only
- Console summary and HTML report at `reports/duplication/html/` produced on every run
- Exits 1 when duplication exceeds threshold (1%); exits 0 when below
- Excludes `dist/`, `build/`, `coverage/`, `.next/`, `storybook-static/`, `node_modules/`, `*.d.ts`, `.stryker-tmp/`

## Baseline

- **Total duplication: 5.01%** (typescript: 5.61% across 231 files, css: 0.41%)
- Exceeds 5% — top 3 pairs documented in `.jscpd.json` per FR-006:
  1. `src/core/entities/ask.ts` ↔ `src/shared/types/ask.ts` (8 overlapping blocks, largest 32 lines)
  2. `src/adapters/client/local-storage/local-storage-datasource-repository.spec.ts` ↔ `local-storage-question-repository.spec.ts` (31 lines)
  3. `src/features/question/ui/question-editor-panel/question-editor-panel.spec.ts` (self-clones, largest 23 lines)

## Tests added or updated

None — jscpd configuration is verified by running the tool against real source files (per task: "Not applicable — jscpd configuration is verified by running the tool against real source files").

## Validations run

- IT-001: `npm run duplication:check` exits (1, above threshold) and prints percentage summary ✓
- IT-001: `reports/duplication/html/index.html` generated ✓
- IT-002: No `.stryker-tmp/` files appear in report (`.stryker-tmp/**` excluded in config) ✓
- AC-003: `git status` after run shows `reports/duplication/` as ignored (covered by `reports` in `.gitignore`) ✓

## Accessibility checks

Not applicable — no UI changes.

## ADRs updated

None — additive tool installation with no architectural implications.

## Intentional non-applicable test categories

Unit, smoke, e2e, regression, performance, security, usability, observability tests — all not applicable per task specification. The tool's output is its own observability artifact.

## Unresolved assumptions / follow-up

- `pnpm add -D jscpd` failed due to EACCES (node_modules installed by npm, conflicting lock files); installed via `npm install --save-dev jscpd` instead. The `pnpm-lock.yaml` is not updated — this is a pre-existing mixed-package-manager situation, not introduced by this task.
- Baseline duplication (5.01%) is above the 1% threshold, so CI will exit 1. Task 020 (unified quality gate) should decide whether to raise the threshold or treat the check as non-blocking.
