import { describe, expect, it } from 'vitest';

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
});
