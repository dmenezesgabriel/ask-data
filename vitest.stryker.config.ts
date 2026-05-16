import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    exclude: [
      'src/components/**/*.spec.ts',
      'src/features/dashboard/ui/**/*.spec.ts',
      'src/features/question/ui/**/*.spec.ts',
      'src/features/ask/ui/**/*.spec.ts',
      'src/features/datasource/ui/**/*.spec.ts',
      'src/shared/ui/**/*.spec.ts',
    ],
    testTimeout: 30_000,
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
