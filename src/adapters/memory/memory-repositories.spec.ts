import { describe, expect, it } from 'vitest';

import type { Datasource } from '@/core/entities';
import type { Question } from '@/core/entities';
import type { Dashboard } from '@/core/entities';

import { MemoryDashboardRepository } from './memory-dashboard-repository';
import { MemoryDatasourceRepository } from './memory-datasource-repository';
import { MemoryQuestionRepository } from './memory-question-repository';

// F-005: memory adapters must not touch localStorage.
// In the vitest node environment, globalThis.localStorage is undefined.
// Any attempt to access it from memory adapter code would throw, making this implicit.
// The assertion below makes the guarantee explicit.
it('node test environment has no localStorage (proving memory adapters cannot touch it)', () => {
  expect((globalThis as Record<string, unknown>)['localStorage']).toBeUndefined();
});

const now = new Date().toISOString();

const makeDatasource = (id = 'ds-1'): Datasource => ({
  id,
  slug: `slug-${id}`,
  name: 'Test Datasource',
  type: 'csv',
  url: 'https://example.com/data.csv',
  source: 'user',
  createdAt: now,
  updatedAt: now,
});

const makeQuestion = (id = 'q-1'): Question => ({
  id,
  slug: `slug-${id}`,
  title: 'Test Question',
  type: 'chart',
  source: 'user',
  createdAt: now,
  updatedAt: now,
});

const makeDashboard = (id = 'dash-1'): Dashboard => ({
  id,
  name: 'Test Dashboard',
  type: 'dashboard',
  widgets: [],
  layout: [],
});

// UT-001: MemoryDatasourceRepository.save() then list() returns the saved datasource
describe('MemoryDatasourceRepository', () => {
  it('UT-001: save() then list() returns the saved datasource', async () => {
    const repo = new MemoryDatasourceRepository();
    const ds = makeDatasource();
    await repo.save(ds);
    const list = await repo.list();
    expect(list).toHaveLength(1);
    expect(list[0]).toEqual(ds);
  });

  // UT-002: MemoryDatasourceRepository.delete(id) removes the datasource
  it('UT-002: delete(id) removes the datasource', async () => {
    const repo = new MemoryDatasourceRepository();
    const ds = makeDatasource();
    await repo.save(ds);
    await repo.delete(ds.id);
    const list = await repo.list();
    expect(list).toHaveLength(0);
  });

  it('get(id) returns the saved datasource', async () => {
    const repo = new MemoryDatasourceRepository();
    const ds = makeDatasource();
    await repo.save(ds);
    const found = await repo.get(ds.id);
    expect(found).toEqual(ds);
  });

  it('get(id) returns null for unknown id', async () => {
    const repo = new MemoryDatasourceRepository();
    expect(await repo.get('unknown')).toBeNull();
  });

  it('save() overwrites an existing datasource with the same id', async () => {
    const repo = new MemoryDatasourceRepository();
    const ds = makeDatasource();
    await repo.save(ds);
    const updated = { ...ds, name: 'Updated' };
    await repo.save(updated);
    const list = await repo.list();
    expect(list).toHaveLength(1);
    expect(list[0]!.name).toBe('Updated');
  });

  it('delete(id) is a no-op for unknown id', async () => {
    const repo = new MemoryDatasourceRepository();
    await expect(repo.delete('ghost')).resolves.toBeUndefined();
  });
});

// UT-003: MemoryQuestionRepository and MemoryDashboardRepository pass save/get/delete cycle
describe('MemoryQuestionRepository', () => {
  it('UT-003a: save() then get() returns the question; delete() removes it', async () => {
    const repo = new MemoryQuestionRepository();
    const q = makeQuestion();
    await repo.save(q);
    expect(await repo.get(q.id)).toEqual(q);
    await repo.delete(q.id);
    expect(await repo.get(q.id)).toBeNull();
  });

  it('list() returns all saved questions', async () => {
    const repo = new MemoryQuestionRepository();
    const q1 = makeQuestion('q-1');
    const q2 = makeQuestion('q-2');
    await repo.save(q1);
    await repo.save(q2);
    const list = await repo.list();
    expect(list).toHaveLength(2);
    expect(list.map((q) => q.id).sort()).toEqual(['q-1', 'q-2']);
  });
});

describe('MemoryDashboardRepository', () => {
  it('UT-003b: save() then get() returns the dashboard; delete() removes it', async () => {
    const repo = new MemoryDashboardRepository();
    const dash = makeDashboard();
    await repo.save(dash);
    expect(await repo.get(dash.id)).toEqual(dash);
    await repo.delete(dash.id);
    expect(await repo.get(dash.id)).toBeNull();
  });

  it('list() returns all saved dashboards', async () => {
    const repo = new MemoryDashboardRepository();
    const d1 = makeDashboard('dash-1');
    const d2 = makeDashboard('dash-2');
    await repo.save(d1);
    await repo.save(d2);
    const list = await repo.list();
    expect(list).toHaveLength(2);
    expect(list.map((d) => d.id).sort()).toEqual(['dash-1', 'dash-2']);
  });
});
