import { afterEach, describe, expect, it, vi } from 'vitest';

import { MemoryQueryEngine } from '@/adapters/memory/memory-query-engine';
import type { AskEngine } from '@/core/application/ports';
import { AskData } from '@/core/application/use-cases/ask-data/ask-data';
import type { AskDataResponse } from '@/core/entities';

// IT-001: AskData produces results end-to-end with MemoryQueryEngine
// Given AskData is wired with a MemoryQueryEngine-backed AskEngine
// When execute({ question: 'total sales', datasourceId: 'ds-1' }) is called
// Then the returned AskDataResponse contains a non-empty result
describe('IT-001: AskData end-to-end with MemoryQueryEngine', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('IT-001: execute() returns a non-empty result without loading WASM', async () => {
    const fixedResult = { columns: ['total'], rows: [{ total: 42 }] };
    const memoryQE = new MemoryQueryEngine(fixedResult);

    // AskEngine stub that uses the MemoryQueryEngine internally
    const engine: AskEngine = {
      initialize: vi.fn().mockResolvedValue(undefined),
      ask: vi.fn().mockImplementation(async (question: string) => {
        // Simulate the engine using queryEngine internally
        const queryResult = await memoryQE.execute({ datasourceId: 'ds-1', sql: 'SELECT total' });
        return {
          question,
          rows: queryResult.rows,
          columns: queryResult.columns,
        } as AskDataResponse;
      }),
    };

    const askData = new AskData(engine);
    const result = await askData.execute({ question: 'total sales', datasourceId: 'ds-1' });

    expect(result).toBeDefined();
    // The result must be non-empty — narrow to success result shape
    expect('rows' in result).toBe(true);
    const successResult = result as { rows: unknown[]; columns: string[] };
    expect(successResult.rows).toHaveLength(1);
    expect(successResult.rows[0]).toMatchObject({ total: 42 });
    // AskEngine was initialized exactly once
    expect(engine.initialize).toHaveBeenCalledOnce();
  });
});
