import { describe, expect, it } from 'vitest';

import type { QueryResult } from './query-result';

describe('QueryResult', () => {
  it('accepts valid structure', () => {
    const result: QueryResult = { columns: ['id', 'name'], rows: [{ id: 1, name: 'foo' }] };
    expect(result.columns).toHaveLength(2);
    expect(result.rows).toHaveLength(1);
  });

  it('requires columns and rows', () => {
    // Type-level: this file should compile with the assertion below
    const result: QueryResult = { columns: [], rows: [] };
    expect(result.columns).toBeDefined();
    expect(result.rows).toBeDefined();
  });
});
