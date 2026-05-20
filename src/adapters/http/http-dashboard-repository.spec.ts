import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Dashboard } from '@/core/entities';

import { HttpDashboardRepository } from './http-dashboard-repository';

const now = new Date().toISOString();

function makeDashboard(id = 'db-1'): Dashboard {
  return {
    id,
    name: 'Test Dashboard',
    type: 'dashboard',
    widgets: [],
    layout: [],
    createdAt: now,
    updatedAt: now,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('HttpDashboardRepository — write interface', () => {
  it('UT-001: does not expose a save or delete method', () => {
    const repo = new HttpDashboardRepository();
    expect('save' in repo).toBe(false);
    expect('delete' in repo).toBe(false);
  });
});

describe('HttpDashboardRepository — read path', () => {
  it('REG-001: list() returns dashboards from the server', async () => {
    const dashboard = makeDashboard();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([dashboard]),
      }),
    );

    const repo = new HttpDashboardRepository();
    const result = await repo.list();

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe(dashboard.id);
  });

  it('get(id) returns null when server responds 404', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));

    const repo = new HttpDashboardRepository();
    const result = await repo.get('missing-id');

    expect(result).toBeNull();
  });
});
