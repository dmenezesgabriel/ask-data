// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from 'eslint-plugin-storybook';

import js from '@eslint/js';
import boundaries from 'eslint-plugin-boundaries';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import lit from 'eslint-plugin-lit';
import sonarjs from 'eslint-plugin-sonarjs';
import tseslint from 'typescript-eslint';

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
      'boundaries/elements': [
        { type: 'core', pattern: 'src/core/**' },
        { type: 'adapters', pattern: 'src/adapters/**' },
        { type: 'composition', pattern: 'src/composition/**' },
        { type: 'features', pattern: 'src/features/**' },
        { type: 'infra', pattern: 'src/infra/**' },
        { type: 'shared', pattern: 'src/shared/**' },
        { type: 'app', pattern: 'src/app/**' },
      ],
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          rules: [
            { from: { type: 'core' }, allow: { to: { type: ['core', 'shared'] } } },
            { from: { type: 'adapters' }, allow: { to: { type: ['core', 'shared', 'infra'] } } },
            { from: { type: 'features' }, allow: { to: { type: ['core', 'shared', 'features'] } } },
            {
              from: { type: 'composition' },
              allow: { to: { type: ['core', 'adapters', 'features', 'shared', 'infra'] } },
            },
            {
              from: { type: 'app' },
              allow: { to: { type: ['composition', 'features', 'shared'] } },
            },
            { from: { type: 'infra' }, allow: { to: { type: ['core', 'shared'] } } },
          ],
        },
      ],
      'boundaries/no-unknown': 'off',
    },
  },
);
