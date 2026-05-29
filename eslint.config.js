// TODO(lint-debt): Violation counts after adding rules in Task 016 (2026-05-29).
// Regenerate with: npx eslint src tests 2>&1 | grep -oP '(?<=\s{2})([@a-z][a-z-]*(/[@a-z][a-z-]*)?)' | sort | uniq -c | sort -rn
//
// === New rules from Task 015 ===
// Rule                                             Count  Risk
// max-lines-per-function                             441  high    — functions/arrow-fns > 20 lines; split in follow-up tasks
// id-denylist                                        278  low     — warn only; vague identifiers; accept as-is until renamed
// @typescript-eslint/explicit-function-return-type   111  high    — missing return type annotations; fix in follow-up tasks
// complexity                                          68  medium  — cyclomatic complexity > 8; sonarjs/cognitive-complexity also active
// @typescript-eslint/no-unsafe-member-access          54  high    — member access on any-typed values; fix in follow-up tasks
// max-depth                                           42  medium  — nesting > 2 levels; fix in follow-up tasks
// @typescript-eslint/no-unsafe-assignment             37  high    — unsafe assignments near any boundaries; fix in follow-up tasks
// @typescript-eslint/no-floating-promises             31  medium  — unhandled promises; fix in follow-up tasks
// no-console                                          16  low     — debug logs in src/; fix in follow-up tasks
// max-params                                          10  medium  — > 4 params; fix in follow-up tasks
// max-lines                                            8  medium  — files > 500 lines; split in follow-up tasks
// @typescript-eslint/no-explicit-any                   0  —       — all suppressed by pre-existing eslint-disable-next-line
// @typescript-eslint/no-unsafe-call                    0  —       — no violations found
// @typescript-eslint/consistent-type-imports           0  —       — FIXED IN THIS TASK (23 auto-fixed; 16 typeof import() allowed via disallowTypeAnnotations: false)
// no-else-return                                       0  —       — no violations found
//
// === Side effects: sonarjs rules now active due to type-aware parsing (projectService: true) ===
// These were already 'error' in sonarjs.configs.recommended but required type info to detect.
// sonarjs/deprecation                                813  high    — deprecated internal types (@deprecated JSDoc); fix in follow-up tasks
// sonarjs/function-return-type                        11  high    — overlaps with explicit-function-return-type; fix together
// sonarjs/prefer-regexp-exec                          10  low     — use RegExp.exec() instead of String.match(); fix in follow-up
// sonarjs/no-redundant-optional                        6  low     — redundant optional chaining; fix in follow-up
// sonarjs/no-alphabetical-sort                         5  low     — misleading sort usage; fix in follow-up
// sonarjs/no-misleading-array-reverse                  4  low     — array mutation; fix in follow-up
// sonarjs/no-undefined-argument                        2  medium  — undefined passed as arg; fix in follow-up
// sonarjs/different-types-comparison                   1  medium  — type mismatch comparison; fix in follow-up
//
// === New rules from Task 016 ===
// Rule                                             Count  Risk
// unicorn/no-useless-undefined                        32  low     — explicit return undefined; fix in follow-up tasks
// jsdoc/require-example                                9  low     — exported functions missing @example; fix in follow-up tasks
// unicorn/prefer-ternary                               4  low     — warn only; single-line if-else can be ternary; fix in follow-up tasks
// unicorn/no-lonely-if                                 0  —       — no violations found
// jsdoc/require-description                            0  —       — no violations found (fires only on existing JSDoc blocks lacking description)
// jsdoc/no-blank-block-descriptions                    0  —       — no violations found
// jsdoc/check-tag-names                                0  —       — no violations found
//
// === Pre-existing violations (before Task 015) ===
// simple-import-sort/imports                           1  low     — datasource-picker.spec.ts; pre-existing
// sonarjs/void-use                                     0  —       — resolved by type context (was 1 before)
//
// sonarjs overlap notes:
//   sonarjs/cognitive-complexity (error) measures cognitive complexity, different from cyclomatic
//   `complexity` rule. Both are kept — they catch different structural problems.
//   sonarjs/function-return-type (error) partially overlaps with explicit-function-return-type;
//   the @typescript-eslint rule enforces annotation syntax more precisely; both kept for coverage.

// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from 'eslint-plugin-storybook';

import js from '@eslint/js';
import boundaries from 'eslint-plugin-boundaries';
import jsdoc from 'eslint-plugin-jsdoc';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import lit from 'eslint-plugin-lit';
import sonarjs from 'eslint-plugin-sonarjs';
import unicorn from 'eslint-plugin-unicorn';
import tseslint from 'typescript-eslint';

import architectureBoundaries from './architecture-boundaries.config.cjs';

const { architectureBoundaryElements, architectureBoundaryRules } = architectureBoundaries;

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'coverage', 'storybook-static'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  sonarjs.configs.recommended,
  {
    plugins: {
      'simple-import-sort': simpleImportSort,
      lit,
    },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    files: ['src/components/**/*.ts'],
    plugins: { lit },
    rules: {
      ...lit.configs.recommended.rules,
    },
  },
  storybook.configs['flat/recommended'],
  {
    plugins: { boundaries },
    settings: {
      'import/resolver': {
        typescript: { alwaysTryTypes: true },
      },
      'boundaries/elements': architectureBoundaryElements,
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          // Task 001 keeps legacy-compatible allowances explicit. Later migration tasks
          // tighten broad shared and feature-to-feature imports after behavior moves.
          rules: architectureBoundaryRules,
        },
      ],
      'boundaries/no-unknown': 'off',
    },
  },
  // FR-001: Type-safety rules for TypeScript files (require type information for no-unsafe-* and no-floating-promises)
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        projectService: {
          // Virtual files used by architecture-boundary tests (lintText with non-existent paths)
          // are not found by the project service. Explicitly allow them so type-aware rules
          // get a default program rather than throwing.
          allowDefaultProject: [
            'src/core/architecture-boundary-fixture.ts',
            'src/adapters/architecture-boundary-fixture.ts',
            'src/features/dashboard/ui/architecture-boundary-fixture.ts',
          ],
          defaultProject: 'tsconfig.json',
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': ['error', { allowExpressions: true }],
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      // disallowTypeAnnotations: false allows typeof import() patterns used in dynamic-import tests
      '@typescript-eslint/consistent-type-imports': ['error', { disallowTypeAnnotations: false }],
    },
  },
  // FR-002: Size and complexity guardrails for all source files
  // FR-003: Naming discipline (warn to avoid blocking public API names)
  // FR-004: Control flow — enforce early returns
  // FR-005: Console hygiene for application code
  {
    rules: {
      // cyclomatic complexity; sonarjs/cognitive-complexity (error) covers a related but different measure
      'complexity': ['error', 8],
      'max-depth': ['error', 2],
      // sonarjs/max-lines is off; this enforces the 500-line structural limit
      'max-lines': ['error', { max: 500, skipBlankLines: true, skipComments: true }],
      // sonarjs/max-lines-per-function is off; this enforces the 20-line function limit
      'max-lines-per-function': ['error', { max: 20, skipBlankLines: true, skipComments: true }],
      'max-params': ['error', 4],
      'id-denylist': ['warn', 'data', 'obj', 'item', 'thing', 'stuff', 'manager', 'handler', 'helper', 'utils'],
      'no-else-return': 'error',
      'no-console': 'error',
    },
  },
  // FR-005: Allow console in test files, entrypoints, and scripts
  // Also covers collocated spec files under src/ to avoid surprises as test suite grows
  {
    files: ['tests/**', 'src/app/**', '**/*.scripts.ts', 'scripts/**', '**/*.spec.ts'],
    rules: {
      'no-console': 'off',
    },
  },
  // tests/ files are not in tsconfig.json — disable type-aware rules so eslint tests/ works
  {
    files: ['tests/**'],
    ...tseslint.configs.disableTypeChecked,
  },
  // Integration/e2e test files have naturally long setup methods and complex step definitions;
  // structural size/complexity rules and return-type annotations don't apply to them.
  {
    files: ['tests/**'],
    rules: {
      'max-lines-per-function': 'off',
      'max-lines': 'off',
      'complexity': 'off',
      'max-depth': 'off',
      'max-params': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },
  // FR-001: Unicorn idiomatic pattern rules for TypeScript source files
  {
    files: ['src/**/*.ts'],
    plugins: { unicorn },
    rules: {
      'unicorn/no-lonely-if': 'error',
      'unicorn/no-useless-undefined': 'error',
      'unicorn/prefer-ternary': ['warn', 'only-single-line'],
    },
  },
  // FR-002: JSDoc documentation rules for exported TypeScript functions (src only)
  // FR-005: Storybook story files are excluded — stories are not public API documentation targets
  {
    files: ['src/**/*.ts'],
    ignores: ['**/*.stories.ts'],
    plugins: { jsdoc },
    rules: {
      'jsdoc/require-description': ['warn', { checkConstructors: false }],
      'jsdoc/require-example': ['warn', { enableFixer: false }],
      'jsdoc/no-blank-block-descriptions': 'error',
      'jsdoc/check-tag-names': 'error',
    },
    settings: {
      jsdoc: { mode: 'typescript', publicOnly: true },
    },
  },
);
