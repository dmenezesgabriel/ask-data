import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Datasource } from '@/core/entities';

import { HttpDatasourceRepository } from './http-datasource-repository';

const now = new Date().toISOString();

function makeDatasource(id = 'ds-1'): Datasource {
  return {
    id,
    slug: `slug-${id}`,
    name: 'Test Datasource',
    type: 'csv',
    url: 'https://example.com/data.csv',
    source: 'user',
    createdAt: now,
    updatedAt: now,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

// UT-001: HttpDatasourceRepository does not expose write methods
describe('HttpDatasourceRepository — write interface', () => {
  it('UT-001: does not expose a save or delete method', () => {
    const repo = new HttpDatasourceRepository();
    expect('save' in repo).toBe(false);
    expect('delete' in repo).toBe(false);
  });
});

// REG-001: read path is intact after write interface removal
describe('HttpDatasourceRepository — read path', () => {
  it('REG-001: list() returns datasources from the server', async () => {
    const datasource = makeDatasource();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([datasource]),
      }),
    );

    const repo = new HttpDatasourceRepository();
    const result = await repo.list();

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe(datasource.id);
  });

  it('get(id) returns a datasource by id', async () => {
    const datasource = makeDatasource();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(datasource),
      }),
    );

    const repo = new HttpDatasourceRepository();
    const result = await repo.get(datasource.id);

    expect(result?.id).toBe(datasource.id);
  });

  it('get(id) returns null when server responds 404', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));

    const repo = new HttpDatasourceRepository();
    const result = await repo.get('missing-id');

    expect(result).toBeNull();
  });
});
