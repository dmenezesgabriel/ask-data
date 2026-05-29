---
id: '016'
task: '016-add-unicorn-jsdoc-eslint-plugins'
date: 2026-05-29
status: complete
---

# Implementation Summary: Task 016 — Add eslint-plugin-unicorn and eslint-plugin-jsdoc

## Files Changed

- `package.json` — added `eslint-plugin-unicorn` and `eslint-plugin-jsdoc` to `devDependencies`
- `eslint.config.js` — added imports and two new config blocks for unicorn and jsdoc rules

## Behavior Implemented

**FR-001 (unicorn)**: Two new config blocks added to `eslint.config.js`:

```js
// files: ['src/**/*.ts']
unicorn/no-lonely-if: "error"
unicorn/no-useless-undefined: "error"
unicorn/prefer-ternary: ["warn", "only-single-line"]
```

Note: the task spec used `"onlySingleLine"` but the installed plugin (v64) uses kebab-case `"only-single-line"`. Used the actual plugin schema value.

**FR-002 (jsdoc)**: Rules enabled for `src/**/*.ts`, excluding `**/*.stories.ts`:

```js
jsdoc/require-description: "warn"
jsdoc/require-example: ["warn", { enableFixer: false }]
jsdoc/no-blank-block-descriptions: "error"
jsdoc/check-tag-names: "error"
```

Note: the task spec used `no-blank-block-description` (singular) but the plugin exposes `no-blank-block-descriptions` (plural). Used the actual plugin rule name.

**FR-003**: Both plugins use the flat-config `plugins: { unicorn }` / `plugins: { jsdoc }` pattern.

**FR-004**: `// TODO(lint-debt):` block updated with new violation counts.

**FR-005**: Story files (`**/*.stories.ts`) excluded from jsdoc rules via `ignores` in the jsdoc config block.

**FR-006**: Test files (`tests/**`) are excluded from both plugins because the unicorn/jsdoc blocks use `files: ['src/**/*.ts']` which does not include `tests/`.

## Tests Added or Updated

No unit tests added — plugin configuration is verified by running the linter against real source files per task guidance.

Integration tests verified manually:

- **IT-001** (PASS): `unicorn/no-lonely-if` fires on `if (x) { if (y) {} }` pattern in a temp `src/*.ts` file.
- **IT-002** (PARTIAL): `jsdoc/require-description` fires on a JSDoc block with no description text. It does **not** fire on a function with no JSDoc block at all — this is expected rule behavior. AC-003's precondition ("with no JSDoc block") is imprecise; the rule only checks existing JSDoc blocks. `require-jsdoc` would be needed to enforce JSDoc existence, but the task explicitly excludes it.
- **IT-003** (PASS): No jsdoc warnings reported on `*.stories.ts` files.

## Validations Run

- `npx eslint src tests` — runs without config errors; both plugins load without `plugin not found` errors (AC-001 ✓)
- Lit decorator files (`@customElement`, `@property`) not flagged by any unicorn rule (NFR-003 ✓)

## Violation Counts (OBS-001)

| Rule                                | Count | Severity |
| ----------------------------------- | ----- | -------- |
| `unicorn/no-useless-undefined`      | 32    | error    |
| `jsdoc/require-example`             | 9     | warn     |
| `unicorn/prefer-ternary`            | 4     | warn     |
| `unicorn/no-lonely-if`              | 0     | —        |
| `jsdoc/require-description`         | 0     | —        |
| `jsdoc/no-blank-block-descriptions` | 0     | —        |
| `jsdoc/check-tag-names`             | 0     | —        |

All counts appended to the `// TODO(lint-debt):` block in `eslint.config.js`.

## Accessibility Checks

Not applicable — no UI changes.

## ADRs Updated

None — this is a plugin addition to an existing ESLint flat-config, no architectural assumptions changed.

## Unresolved Assumptions

- **AC-003 wording mismatch**: `jsdoc/require-description` only fires on existing JSDoc blocks that lack a description. A function with _no_ JSDoc block does not trigger the rule. AC-003 says "with no JSDoc block" which contradicts the rule's behavior. The rule is configured correctly; the AC description is imprecise. If JSDoc existence enforcement is needed in a follow-up task, add `jsdoc/require-jsdoc` with `publicOnly: true`.
- **`onlySingleLine` vs `only-single-line`**: The task spec used camelCase `"onlySingleLine"` but unicorn v64 uses kebab-case `"only-single-line"`. Used the value the plugin actually accepts.
- **`no-blank-block-description` vs `no-blank-block-descriptions`**: Task spec used the singular form; the plugin exports the plural form. Used the actual rule name.
