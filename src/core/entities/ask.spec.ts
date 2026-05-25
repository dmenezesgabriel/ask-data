import { describe, expect, it } from 'vitest';

import type { AskDataConfig, AskDataResponse, SemanticModel } from './ask';

describe('core Ask Data contracts', () => {
  it('UT-001: imports stable Ask Data and Semantic Model types without matcher libraries', () => {
    const semanticModel: SemanticModel = {
      fields: [
        {
          table: 'orders',
          column: 'revenue',
          role: 'measure',
          label: 'Revenue',
          aggregation: 'sum',
        },
      ],
      entities: [
        {
          label: 'Customer',
          singular: 'customer',
          table: 'customers',
          key: 'id',
        },
      ],
      relationships: [
        {
          left: { table: 'orders', column: 'customer_id' },
          right: { table: 'customers', column: 'id' },
        },
      ],
    };
    const askDataConfig: AskDataConfig = {
      defaultQuestion: 'What is revenue?',
      fields: semanticModel.fields,
      entities: semanticModel.entities,
      relationships: semanticModel.relationships,
    };
    const response: AskDataResponse = { error: 'No datasource selected.' };

    expect(askDataConfig.fields?.[0]?.label).toBe('Revenue');
    expect(response).toEqual({ error: 'No datasource selected.' });
  });
});
