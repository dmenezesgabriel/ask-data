import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

const root = (path: string): string => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  base: '/ask-data',
  resolve: {
    alias: {
      '@': root('./src'),
      'chrono-node/en': root('./node_modules/chrono-node/dist/esm/locales/en/index.js'),
      'chrono-node/pt': root('./node_modules/chrono-node/dist/esm/locales/pt/index.js'),
    },
  },
  optimizeDeps: {
    exclude: ['@duckdb/duckdb-wasm'],
  },
  server: {
    host: '0.0.0.0',
    watch: {
      ignored: ['**/.pnpm-store/**'],
    },
  },
  preview: {
    host: '0.0.0.0',
  },
});
