import {
  CapabilityRegistry,
  type DatasourceConnector,
  type PlatformContribution,
} from '@/core/platform';

const fileDatasourceConnector: DatasourceConnector = {
  capability: {
    id: 'datasource.connector.file',
    displayName: 'File datasource',
    contributionType: 'datasource-connector',
    enabled: true,
  },
  accepts: (datasource) => ['csv', 'json', 'parquet'].includes(datasource.type),
  load: async () => ({ columns: [], rows: [] }),
};

export function createPlatformRegistry(
  contributions: readonly PlatformContribution[] = [fileDatasourceConnector],
): CapabilityRegistry {
  const registry = new CapabilityRegistry();

  for (const contribution of contributions) {
    registry.register(contribution);
  }

  return registry;
}
