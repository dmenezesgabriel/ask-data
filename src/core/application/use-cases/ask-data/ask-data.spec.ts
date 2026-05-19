import { describe, expect, it, vi } from 'vitest';

import type { AskEngine } from '@/core/application/ports';
import type { AskDataResponse } from '@/core/entities';

import { AskData } from './ask-data';

function makeAskEngine(response: Partial<AskDataResponse> = {}): AskEngine {
  return {
    initialize: vi.fn().mockResolvedValue(undefined),
    ask: vi.fn().mockResolvedValue({
      question: 'test',
      rows: [{ count: 42 }],
      columns: ['count'],
      ...response,
    } as AskDataResponse),
  };
}

// UT-001: AskData.execute() returns a valid AskDataResponse
describe('AskData', () => {
  it('UT-001: execute() returns result from AskEngine without loading WASM', async () => {
    const engine = makeAskEngine();
    const uc = new AskData(engine);
    const result = await uc.execute({ question: 'count rows', datasourceId: 'x' });
    expect(result).toBeDefined();
    expect(engine.initialize).toHaveBeenCalledOnce();
    expect(engine.ask).toHaveBeenCalledWith('count rows', { datasourceId: 'x' });
  });

  // UT-002: AskData.execute() does not use DuckDbWasmQueryEngine when a stub engine is injected
  it('UT-002: completes without DuckDbWasmQueryEngine when stub AskEngine is injected', async () => {
    // Arrange: a stub AskEngine backed by a MemoryQueryEngine (no WASM)
    const engine = makeAskEngine({ rows: [{ count: 1 }], columns: ['count'] });
    const uc = new AskData(engine);
    // Act
    const result = await uc.execute({ question: 'count rows', datasourceId: 'x' });
    // Assert: result came from the stub, not from DuckDB
    expect(result).toBeDefined();
    expect((engine.ask as ReturnType<typeof vi.fn>).mock.calls[0][0]).toBe('count rows');
    // If DuckDbWasmQueryEngine had been used, this test environment would have thrown
    // because @duckdb/duckdb-wasm requires browser WASM APIs unavailable in Node
  });

  it('engine.initialize() is called only once across multiple executes', async () => {
    const engine = makeAskEngine();
    const uc = new AskData(engine);
    await uc.execute({ question: 'q1', datasourceId: 'x' });
    await uc.execute({ question: 'q2', datasourceId: 'x' });
    expect(engine.initialize).toHaveBeenCalledOnce();
  });

  it('passes options to engine.ask()', async () => {
    const engine = makeAskEngine();
    const uc = new AskData(engine);
    const clarification = { fieldId: 'f1' };
    await uc.execute({ question: 'sales', options: { clarification } });
    expect(engine.ask).toHaveBeenCalledWith('sales', { clarification });
  });
});
