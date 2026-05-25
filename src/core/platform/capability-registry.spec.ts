import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  type Capability,
  CapabilityDisabledError,
  CapabilityRegistry,
  type DatasourceConnector,
  DuplicateCapabilityError,
  PLATFORM_OBSERVABILITY_EVENTS,
  type QueryExecutor,
  StaticFeatureFlagProvider,
} from './index';

const dirname = path.dirname(fileURLToPath(import.meta.url));

function datasourceConnector(id: string, enabled = true): DatasourceConnector {
  return {
    capability: {
      id,
      displayName: `Datasource ${id}`,
      contributionType: 'datasource-connector',
      enabled,
    },
    accepts: (datasource) => datasource.type === 'csv',
    load: async () => ({ columns: ['id'], rows: [{ id }] }),
  };
}

function queryExecutor(id: string): QueryExecutor {
  return {
    capability: {
      id,
      displayName: `Query ${id}`,
      contributionType: 'query-executor',
      enabled: true,
      featureFlagKey: 'query.test',
    },
    execute: async () => ({ columns: ['id'], rows: [{ id }] }),
  };
}

describe('CapabilityRegistry', () => {
  it('UT-001: registers multiple capabilities and looks them up by ID and contribution type', () => {
    const registry = new CapabilityRegistry();
    const csvConnector = datasourceConnector('datasource.csv');
    const jsonConnector = datasourceConnector('datasource.json');
    const executor = queryExecutor('query.memory');

    registry.register(csvConnector);
    registry.register(jsonConnector);
    registry.register(executor);

    expect(registry.getCapability('datasource.csv')).toEqual(csvConnector.capability);
    expect(registry.getContributions('datasource-connector')).toEqual([
      csvConnector,
      jsonConnector,
    ]);
    expect(registry.getContributions('query-executor')).toEqual([executor]);
  });

  it('UT-002: rejects duplicate capability IDs with a deterministic error', () => {
    const registry = new CapabilityRegistry();

    registry.register(datasourceConnector('datasource.csv'));

    expect(() => registry.register(queryExecutor('datasource.csv'))).toThrow(
      new DuplicateCapabilityError('datasource.csv'),
    );
  });

  it('AC-003: excludes disabled contributions from available capabilities', () => {
    const registry = new CapabilityRegistry();

    registry.register(datasourceConnector('datasource.csv'));
    registry.register(datasourceConnector('datasource.disabled', false));

    expect(registry.listCapabilities()).toEqual([
      {
        id: 'datasource.csv',
        displayName: 'Datasource datasource.csv',
        contributionType: 'datasource-connector',
        enabled: true,
      },
      {
        id: 'datasource.disabled',
        displayName: 'Datasource datasource.disabled',
        contributionType: 'datasource-connector',
        enabled: false,
      },
    ]);
    expect(registry.listAvailableCapabilities()).toEqual([
      {
        id: 'datasource.csv',
        displayName: 'Datasource datasource.csv',
        contributionType: 'datasource-connector',
        enabled: true,
      },
    ]);
  });

  it('UT-001: feature flag provider returns defaults when no explicit value exists', () => {
    const flags = new StaticFeatureFlagProvider({ 'visualization.chart.pie': false });

    expect(flags.isEnabled('datasource.csv')).toBe(true);
    expect(flags.isEnabled('visualization.chart.pie')).toBe(false);
  });

  it('UT-002: excludes flag-disabled capabilities from contributions and snapshots', () => {
    const registry = new CapabilityRegistry({
      featureFlags: new StaticFeatureFlagProvider({ 'query.test': false }),
    });
    const executor = queryExecutor('query.memory');

    registry.register(executor);

    expect(registry.getCapability('query.memory')).toEqual({
      ...executor.capability,
      enabled: false,
    });
    expect(registry.getContributions('query-executor')).toEqual([]);
    expect(registry.getSnapshot().capabilities).toEqual([]);
  });

  it('IT-001: exposes a deeply read-only capability snapshot', () => {
    const registry = new CapabilityRegistry();

    registry.register(datasourceConnector('datasource.csv'));

    const snapshot = registry.getSnapshot();
    const [capability] = snapshot.capabilities;

    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.capabilities)).toBe(true);
    expect(Object.isFrozen(capability)).toBe(true);
    expect(() => {
      (snapshot.capabilities as Capability[]).push(
        datasourceConnector('datasource.json').capability,
      );
    }).toThrow(TypeError);
    expect(() => {
      (capability as { displayName: string }).displayName = 'mutated';
    }).toThrow(TypeError);
    expect(registry.getSnapshot().capabilities[0]?.displayName).toBe('Datasource datasource.csv');
  });

  it('UT-003: disabled capability access returns a stable domain error and emits redacted context', () => {
    const events: unknown[] = [];
    const registry = new CapabilityRegistry({
      featureFlags: new StaticFeatureFlagProvider({ 'query.test': false }),
      onEvent: (event) => events.push(event),
    });

    registry.register(queryExecutor('query.memory'));

    expect(() => registry.requireCapability('query.memory', 'WidgetEditor')).toThrow(
      new CapabilityDisabledError('query.memory', 'WidgetEditor'),
    );
    expect(events).toContainEqual({
      event: PLATFORM_OBSERVABILITY_EVENTS.capabilityAccessDisabled,
      capabilityId: 'query.memory',
      contributionType: 'query-executor',
      caller: 'WidgetEditor',
    });
  });

  it('ST-001: serializes capability metadata without configured secret fields', () => {
    const registry = new CapabilityRegistry();
    const connector = {
      ...datasourceConnector('datasource.secure'),
      capability: {
        id: 'datasource.secure',
        displayName: 'Secure datasource',
        contributionType: 'datasource-connector',
        enabled: true,
        apiKey: 'hidden',
        credentials: { token: 'hidden' },
        sql: 'select * from sensitive_table',
      },
    } as DatasourceConnector;

    registry.register(connector);

    expect(JSON.stringify(registry.listCapabilities())).toBe(
      JSON.stringify([
        {
          id: 'datasource.secure',
          displayName: 'Secure datasource',
          contributionType: 'datasource-connector',
          enabled: true,
        },
      ]),
    );
  });

  it('OBS-001: defines capability registration observability event names', () => {
    expect(PLATFORM_OBSERVABILITY_EVENTS.capabilityRegistrationSucceeded).toBe(
      'platform.capability.registration.succeeded',
    );
    expect(PLATFORM_OBSERVABILITY_EVENTS.capabilityRegistrationFailed).toBe(
      'platform.capability.registration.failed',
    );
    expect(PLATFORM_OBSERVABILITY_EVENTS.capabilityAccessDisabled).toBe(
      'platform.capability.access.disabled',
    );
  });

  it('OT-001: emits redacted registration failure context with capability ID and contribution type', () => {
    const events: unknown[] = [];
    const registry = new CapabilityRegistry({ onEvent: (event) => events.push(event) });

    registry.register(datasourceConnector('datasource.csv'));

    expect(() => registry.register(queryExecutor('datasource.csv'))).toThrow(
      new DuplicateCapabilityError('datasource.csv'),
    );
    expect(events).toContainEqual({
      event: PLATFORM_OBSERVABILITY_EVENTS.capabilityRegistrationFailed,
      capabilityId: 'datasource.csv',
      contributionType: 'query-executor',
    });
  });

  it('UT-003: keeps platform contracts free of UI, adapter, infra, and external library imports', () => {
    const sourceFiles = ['contracts.ts', 'capability-registry.ts', 'observability-events.ts'];
    const forbiddenImports = [
      '@/app/',
      '@/adapters/',
      '@/features/',
      '@/infra/',
      'lit',
      'chart.js',
      '@duckdb/duckdb-wasm',
      'fuse.js',
      'minisearch',
      '@huggingface/transformers',
    ];

    const sources = sourceFiles.map((file) =>
      readFileSync(path.join(dirname, file), { encoding: 'utf8' }),
    );

    for (const source of sources) {
      for (const forbiddenImport of forbiddenImports) {
        expect(source).not.toContain(`from '${forbiddenImport}`);
        expect(source).not.toContain(`from "${forbiddenImport}`);
      }
    }
  });
});
