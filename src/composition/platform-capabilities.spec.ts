import { describe, expect, it } from 'vitest';

import { createPlatformRegistry } from './platform-capabilities';

describe('platform capability composition', () => {
  it('IT-001: registers a built-in datasource connector through the platform registry', async () => {
    const registry = createPlatformRegistry();

    const [connector] = registry.getContributions('datasource-connector');

    expect(connector?.capability).toEqual({
      id: 'datasource.connector.file',
      displayName: 'File datasource',
      contributionType: 'datasource-connector',
      enabled: true,
    });
    expect(connector?.accepts({ type: 'csv', url: '/sales.csv' })).toBe(true);
    await expect(connector?.load({ type: 'csv', url: '/sales.csv' })).resolves.toEqual({
      columns: [],
      rows: [],
    });
  });
});
