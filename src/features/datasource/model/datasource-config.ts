import type { Datasource as DataSourceConfig } from '@/core/entities';

export function createEmptyDatasourceConfig(
  overrides: Partial<DataSourceConfig> = {},
): DataSourceConfig {
  const now = new Date().toISOString();
  const id = `datasource-${Date.now()}`;
  return {
    id,
    slug: id,
    name: '',
    type: 'csv',
    url: '',
    source: 'user',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}
