import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  CapabilityRegistry,
  type DatasourceConnector,
  DuplicateCapabilityError,
  PLATFORM_OBSERVABILITY_EVENTS,
  type QueryExecutor,
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
