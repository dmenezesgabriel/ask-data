import { describe, expect, it } from 'vitest';

import { StaticFeatureFlagProvider } from '@/core/platform';
import { createSeedDashboards } from '@/features/catalog/data/seeded-catalog-repositories';

import { createPlatformRegistry } from './platform-capabilities';

describe('platform capability composition', () => {
  it('IT-001: registers built-in datasource and visualization capabilities through composition', async () => {
    const registry = createPlatformRegistry();

    const [connector] = registry.getContributions('datasource-connector');

    expect(connector?.capability).toEqual({
      id: 'datasource.connector.csv',
      displayName: 'CSV datasource',
      contributionType: 'datasource-connector',
      enabled: true,
      featureFlagKey: 'datasource.csv',
    });
    expect(connector?.accepts({ type: 'csv', url: '/sales.csv' })).toBe(true);
    await expect(connector?.load({ type: 'csv', url: '/sales.csv' })).resolves.toEqual({
      columns: [],
      rows: [],
    });
    expect(registry.getSnapshot().capabilities).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'datasource.connector.csv' }),
        expect.objectContaining({ id: 'visualization.chart.bar' }),
      ]),
    );
  });

  it('AC-004: resolves deterministic snapshots for different flag adapters', () => {
    const enabled = createPlatformRegistry({
      featureFlags: new StaticFeatureFlagProvider({ 'visualization.chart.pie': true }),
    });
    const disabled = createPlatformRegistry({
      featureFlags: new StaticFeatureFlagProvider({ 'visualization.chart.pie': false }),
    });

    expect(
      enabled
        .getSnapshot()
        .capabilities.some((capability) => capability.id === 'visualization.chart.pie'),
    ).toBe(true);
    expect(
      disabled
        .getSnapshot()
        .capabilities.some((capability) => capability.id === 'visualization.chart.pie'),
    ).toBe(false);
  });

  it('REG-001: default client-only flags keep seed dashboard chart capabilities available', () => {
    const registry = createPlatformRegistry();
    const capabilityIds = registry.getSnapshot().capabilities.map((capability) => capability.id);
    const seedChartTypes = createSeedDashboards()
      .flatMap((dashboard) => dashboard.widgets)
      .filter((widget) => widget.type === 'chart')
      .map((widget) => widget.chartType);

    for (const chartType of seedChartTypes) {
      expect(capabilityIds).toContain(`visualization.chart.${chartType}`);
    }
  });
});
