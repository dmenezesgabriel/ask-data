import {
  CapabilityRegistry,
  type DatasourceConnector,
  type FeatureFlagProvider,
  type PlatformContribution,
  StaticFeatureFlagProvider,
  type WidgetRenderer,
} from '@/core/platform';
import { createLogger } from '@/shared/observability/logger';

const logger = createLogger('platform.capabilities');

function datasourceConnector(type: 'csv' | 'json' | 'parquet'): DatasourceConnector {
  return {
    capability: {
      id: `datasource.connector.${type}`,
      displayName: `${type.toUpperCase()} datasource`,
      contributionType: 'datasource-connector',
      enabled: true,
      featureFlagKey: `datasource.${type}`,
    },
    accepts: (datasource) => datasource.type === type,
    load: async () => ({ columns: [], rows: [] }),
  };
}

function chartRenderer(chartType: string): WidgetRenderer {
  return {
    capability: {
      id: `visualization.chart.${chartType}`,
      displayName: `${chartType} chart`,
      contributionType: 'widget-renderer',
      enabled: true,
      featureFlagKey: `visualization.chart.${chartType}`,
    },
    render: async (input) => ({ kind: 'chart', data: input.queryResult }),
  };
}

export const defaultPlatformContributions: readonly PlatformContribution[] = [
  datasourceConnector('csv'),
  datasourceConnector('json'),
  datasourceConnector('parquet'),
  chartRenderer('bar'),
  chartRenderer('line'),
  chartRenderer('area'),
  chartRenderer('pie'),
  chartRenderer('donut'),
  chartRenderer('scatter'),
  chartRenderer('bubble'),
  chartRenderer('histogram'),
];

export type PlatformRegistryOptions = {
  contributions?: readonly PlatformContribution[];
  featureFlags?: FeatureFlagProvider;
};

export function createPlatformRegistry(options: PlatformRegistryOptions = {}): CapabilityRegistry {
  const registry = new CapabilityRegistry({
    featureFlags: options.featureFlags ?? new StaticFeatureFlagProvider(),
    onEvent: (event) => {
      if (event.event.endsWith('.failed') || event.event.endsWith('.disabled')) {
        logger.warn(event.event, event);
        return;
      }
      logger.info(event.event, event);
    },
  });

  for (const contribution of options.contributions ?? defaultPlatformContributions) {
    registry.register(contribution);
  }

  return registry;
}
