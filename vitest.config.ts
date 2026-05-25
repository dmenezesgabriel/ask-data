import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
const dirname =
  typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(dirname, './src'),
      'chrono-node/en': path.resolve(
        dirname,
        './node_modules/chrono-node/dist/esm/locales/en/index.js',
      ),
      'chrono-node/pt': path.resolve(
        dirname,
        './node_modules/chrono-node/dist/esm/locales/pt/index.js',
      ),
    },
  },
  test: {
    maxWorkers: 1,
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['**/*.stories.ts', '**/index.ts'],
      watermarks: {
        statements: [50, 80],
        branches: [50, 80],
        functions: [50, 80],
        lines: [50, 80],
      },
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'node',
          include: ['src/**/*.spec.ts', 'tests/integration/**/*.test.ts'],
          exclude: [
            'src/app/**/*.spec.ts',
            'src/components/**/*.spec.ts',
            'src/features/dashboard/ui/**/*.spec.ts',
            'src/features/question/ui/**/*.spec.ts',
            'src/features/ask/ui/**/*.spec.ts',
            'src/features/datasource/ui/**/*.spec.ts',
            'src/shared/ui/**/*.spec.ts',
          ],
          testTimeout: 30_000,
        },
      },
      {
        extends: true,
        test: {
          name: 'components',
          include: [
            'src/app/**/*.spec.ts',
            'src/components/**/*.spec.ts',
            'src/features/dashboard/ui/**/*.spec.ts',
            'src/features/question/ui/**/*.spec.ts',
            'src/features/ask/ui/**/*.spec.ts',
            'src/features/datasource/ui/**/*.spec.ts',
            'src/shared/ui/**/*.spec.ts',
          ],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({
              launch: {
                args: [
                  '--disable-dev-shm-usage',
                  '--no-sandbox',
                  '--disable-gpu',
                  '--disable-extensions',
                ],
              },
            }),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
          storybookTest({
            configDir: path.join(dirname, '.storybook'),
            tags: {
              exclude: ['skip-browser-test'],
            },
          }),
        ],
        resolve: {
          alias: {
            '@': path.resolve(dirname, './src'),
            'chrono-node/en': path.resolve(
              dirname,
              './node_modules/chrono-node/dist/esm/locales/en/index.js',
            ),
            'chrono-node/pt': path.resolve(
              dirname,
              './node_modules/chrono-node/dist/esm/locales/pt/index.js',
            ),
          },
        },
        optimizeDeps: {
          include: [
            'lit',
            'lit/directives/if-defined.js',
            'lit/directives/style-map.js',
            'lit/async-directive.js',
            'lit/decorators.js',
            '@storybook/addon-a11y',
            '@storybook/addon-docs',
            '@storybook/web-components-vite',
            'dayjs',
            'dayjs/plugin/quarterOfYear.js',
          ],
          exclude: ['chrono-node', 'apache-arrow'],
        },
        server: {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': '*',
          },
        },
        test: {
          name: 'storybook',
          testTimeout: 30_000,
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({
              launch: {
                args: [
                  '--disable-dev-shm-usage',
                  '--no-sandbox',
                  '--disable-gpu',
                  '--disable-extensions',
                ],
              },
            }),
            instances: [
              {
                browser: 'chromium',
              },
            ],
          },
        },
      },
    ],
  },
});
