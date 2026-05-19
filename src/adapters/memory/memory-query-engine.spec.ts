import { describe, expect, it } from 'vitest';

import { MemoryQueryEngine } from './memory-query-engine';

describe('MemoryQueryEngine', () => {
  it('returns the configured result for any SQL', async () => {
    const result = { columns: ['total'], rows: [{ total: 42 }] };
    const engine = new MemoryQueryEngine(result);
    const response = await engine.execute({ datasourceId: 'ds-1', sql: 'SELECT 1' });
    expect(response).toEqual(result);
  });

  it('returns empty result by default', async () => {
    const engine = new MemoryQueryEngine();
    expect(await engine.execute({ datasourceId: 'x', sql: 'SELECT 1' })).toEqual({
      columns: [],
      rows: [],
    });
  });
});
