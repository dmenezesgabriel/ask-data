import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { CatalogField } from '../../../shared/types/index';
import { AskDataEngine } from './ask-data';

const makeField = (overrides: Partial<CatalogField> & { id: string }): CatalogField => ({
  table: 'sales',
  column: overrides.column || overrides.id.split('::').pop() || 'col',
  role: 'measure',
  type: 'DOUBLE',
  label: overrides.label || overrides.column || overrides.id.split('::').pop() || 'col',
  labels: {},
  synonyms: [],
  localizedSynonyms: {},
  description: '',
  default: false,
  priority: 0,
  sampleValues: [],
  samples: [],
  dateProfile: null,
  cardinality: 0,
  rowCount: 100,
  ...overrides,
});

function makeEngine() {
  return new AskDataEngine({ dataSources: [] }, { query: async () => ({ schema: [], rows: [] }) });
}

describe('AskDataEngine.measurePriority()', () => {
  const originalLevel = globalThis.__ASK_DATA_LOG_LEVEL__;

  beforeEach(() => {
    globalThis.__ASK_DATA_LOG_LEVEL__ = 'info';
  });

  afterEach(() => {
    globalThis.__ASK_DATA_LOG_LEVEL__ = originalLevel;
    vi.restoreAllMocks();
  });

  it('UT-003: field with priority > 0 always ranks above name-heuristic "sales" field', () => {
    const engine = makeEngine();
    const salesField = makeField({
      id: 'sales::Sales',
      column: 'Sales',
      label: 'Sales',
      priority: 0,
    });
    const explicitField = makeField({
      id: 'sales::CustomKPI',
      column: 'CustomKPI',
      label: 'Custom KPI',
      priority: 5,
    });

    const salesScore = engine.measurePriority(salesField);
    const explicitScore = engine.measurePriority(explicitField);

    expect(explicitScore).toBeGreaterThan(salesScore);
    expect(explicitScore).toBe(1005);
    expect(salesScore).toBe(100);
  });

  it('returns 1000 + priority for any priority > 0', () => {
    const engine = makeEngine();
    const field = makeField({
      id: 'sales::Metric',
      column: 'Metric',
      label: 'Metric',
      priority: 1,
    });
    expect(engine.measurePriority(field)).toBe(1001);
  });

  it('returns 0 for fields with unrecognised names and priority = 0', () => {
    const engine = makeEngine();
    const field = makeField({ id: 'sales::Xyz', column: 'Xyz', label: 'Xyz', priority: 0 });
    expect(engine.measurePriority(field)).toBe(0);
  });

  it('OT-001: records Ask Data success telemetry with elapsed time without question text', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    const engine = makeEngine();
    const intent = { metric: makeField({ id: 'sales::Sales', column: 'Sales' }) };

    vi.spyOn(engine, 'initialize').mockResolvedValue();
    vi.spyOn(engine, 'parseQuestion').mockReturnValue({ intent } as never);
    vi.spyOn(engine, 'planSql').mockReturnValue({
      sql: 'SELECT region AS label, 10 AS value FROM sales',
      columns: ['label', 'value'],
      diagnostics: {},
    } as never);
    vi.spyOn(engine, 'evaluateDiagnostics').mockResolvedValue({} as never);
    vi.spyOn(engine, 'describeIntent').mockReturnValue('Sales by region');
    vi.spyOn(engine, 'describeEvidence').mockReturnValue([] as never);
    engine.duckDBManager = {
      query: vi.fn().mockResolvedValue({ rows: [{ label: 'West', value: 10 }] }),
    };

    await engine.ask('confidential sales by region');

    const askOkCall = info.mock.calls.find(([event]) => event === '[AskData] ask.ok');
    expect(askOkCall).toBeDefined();
    expect(askOkCall?.[1]).toEqual(
      expect.objectContaining({
        durationMs: expect.any(Number),
        outcome: 'success',
        metrics: expect.objectContaining({ totalAskMs: expect.any(Number) }),
      }),
    );
    expect(JSON.stringify(askOkCall)).not.toContain('confidential sales by region');
  });

  it('OT-001: records Ask Data failure telemetry with elapsed time without question text', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const engine = makeEngine();
    vi.spyOn(engine, 'initialize').mockRejectedValue(new Error('Catalog failed'));

    await expect(engine.ask('confidential margin question')).rejects.toThrow('Catalog failed');

    expect(error).toHaveBeenCalledWith(
      '[AskData] ask.error',
      expect.objectContaining({
        durationMs: expect.any(Number),
        error: expect.objectContaining({ message: 'Catalog failed' }),
      }),
    );
    expect(JSON.stringify(error.mock.calls)).not.toContain('confidential margin question');
  });
});
