// IT-002: Verifies forceConsistentCasingInFileNames catches mismatched-casing imports.
//
// To run: pnpm tsc --noEmit -p tests/typecheck-fixtures/tsconfig.json
// Expected error (line below):
//   Case-insensitive FS (macOS/Windows): "differs from already included file name only in casing"
//   Case-sensitive FS (Linux): "Cannot find module './someModule'" — the import still fails,
//   demonstrating that any wrong-casing import is caught by the compiler.
//
// The file on disk is SomeModule.ts; this import uses wrong casing intentionally:

import { value } from './someModule'; // forceConsistentCasingInFileNames: wrong casing for SomeModule.ts
export { value };
