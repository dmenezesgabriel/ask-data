// IT-001: Verifies noUncheckedIndexedAccess catches unsafe array access.
//
// To run: pnpm tsc --noEmit -p tests/typecheck-fixtures/tsconfig.json
// Expected error (line below): Type 'string | undefined' is not assignable to type 'string'.ts(2322)
//
// This fixture is excluded from the main tsconfig (which only includes src/).
// It is intentionally invalid — the type error is the proof that the compiler option works.

const arr: string[] = ['a', 'b'];
export const x: string = arr[0]; // noUncheckedIndexedAccess: arr[0] is 'string | undefined', not 'string'
