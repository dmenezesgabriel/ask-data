import { describe, expect, it } from 'vitest';

import { MemoryDashboardRepository } from '@/adapters/memory/memory-dashboard-repository';
import { MemoryDatasourceRepository } from '@/adapters/memory/memory-datasource-repository';
import { MemoryQuestionRepository } from '@/adapters/memory/memory-question-repository';
import { CreateDashboard } from '@/core/application/use-cases/dashboards/create-dashboard';
import { DeleteDashboard } from '@/core/application/use-cases/dashboards/delete-dashboard';
import { GetDashboard } from '@/core/application/use-cases/dashboards/get-dashboard';
import { ListDashboards } from '@/core/application/use-cases/dashboards/list-dashboards';
import { UpdateDashboard } from '@/core/application/use-cases/dashboards/update-dashboard';
import { CreateDatasource } from '@/core/application/use-cases/datasources/create-datasource';
import { DeleteDatasource } from '@/core/application/use-cases/datasources/delete-datasource';
import { GetDatasource } from '@/core/application/use-cases/datasources/get-datasource';
import { ListDatasources } from '@/core/application/use-cases/datasources/list-datasources';
import { UpdateDatasource } from '@/core/application/use-cases/datasources/update-datasource';
import { CreateQuestion } from '@/core/application/use-cases/questions/create-question';
import { DeleteQuestion } from '@/core/application/use-cases/questions/delete-question';
import { GetQuestion } from '@/core/application/use-cases/questions/get-question';
import { UpdateQuestion } from '@/core/application/use-cases/questions/update-question';
import { CapabilityDisabledError, StaticFeatureFlagProvider } from '@/core/platform';

import { createPlatformRegistry } from './platform-capabilities';

const fakeId = { create: () => 'test-id' };
const fakeClock = { now: () => '2026-01-01T00:00:00.000Z' };

// UT-001: CreateDatasource returns entity with id, createdAt, updatedAt
describe('CreateDatasource', () => {
  it('UT-001: execute() returns datasource with generated id and timestamps', async () => {
    const repo = new MemoryDatasourceRepository();
    const uc = new CreateDatasource(repo, fakeId, fakeClock);
    const result = await uc.execute({
      name: 'Sales',
      type: 'csv',
      url: 'https://example.com/s.csv',
    });

    expect(result.id).toBe('test-id');
    expect(result.createdAt).toBe('2026-01-01T00:00:00.000Z');
    expect(result.updatedAt).toBe('2026-01-01T00:00:00.000Z');
    expect(result.name).toBe('Sales');
    expect(result.slug).toBe('sales');
  });

  it('AC-002: returns a stable capability-disabled error when connector is disabled', async () => {
    const repo = new MemoryDatasourceRepository();
    const registry = createPlatformRegistry({
      featureFlags: new StaticFeatureFlagProvider({ 'datasource.csv': false }),
    });
    const uc = new CreateDatasource(repo, fakeId, fakeClock, registry);

    await expect(
      uc.execute({ name: 'Sales', type: 'csv', url: 'https://example.com/s.csv' }),
    ).rejects.toThrow(new CapabilityDisabledError('datasource.connector.csv', 'CreateDatasource'));
  });
});

// UT-002 / UT-003: UpdateDatasource
describe('UpdateDatasource', () => {
  it('UT-002: execute() throws when datasource does not exist', async () => {
    const repo = new MemoryDatasourceRepository();
    const uc = new UpdateDatasource(repo, fakeClock);
    await expect(uc.execute('missing-id', { name: 'X' })).rejects.toThrow(
      'Datasource not found: missing-id',
    );
  });

  it('UT-003: execute() updates patched fields and updatedAt', async () => {
    const repo = new MemoryDatasourceRepository();
    const createUc = new CreateDatasource(repo, fakeId, fakeClock);
    const created = await createUc.execute({
      name: 'Old',
      type: 'csv',
      url: 'https://example.com/o.csv',
    });

    const laterClock = { now: () => '2026-06-01T00:00:00.000Z' };
    const updateUc = new UpdateDatasource(repo, laterClock);
    const updated = await updateUc.execute(created.id, { name: 'New Name' });

    expect(updated.name).toBe('New Name');
    expect(updated.updatedAt).toBe('2026-06-01T00:00:00.000Z');
    expect(updated.createdAt).toBe('2026-01-01T00:00:00.000Z');
  });
});

// UT-004: DeleteDatasource / GetDatasource
describe('DeleteDatasource', () => {
  it('UT-004: execute() removes entity; GetDatasource returns null', async () => {
    const repo = new MemoryDatasourceRepository();
    const createUc = new CreateDatasource(repo, fakeId, fakeClock);
    const created = await createUc.execute({
      name: 'Sales',
      type: 'csv',
      url: 'https://example.com/s.csv',
    });

    const deleteUc = new DeleteDatasource(repo);
    await deleteUc.execute(created.id);

    const getUc = new GetDatasource(repo);
    expect(await getUc.execute(created.id)).toBeNull();
  });
});

// UT-006: ListDatasources returns empty array when none exist
describe('ListDatasources', () => {
  it('UT-006: execute() returns empty array when no datasources exist', async () => {
    const repo = new MemoryDatasourceRepository();
    const uc = new ListDatasources(repo);
    expect(await uc.execute()).toEqual([]);
  });
});

// UT-005: Question create/update/delete cycle
describe('Question use cases (UT-005)', () => {
  it('create/update/delete cycle works', async () => {
    const repo = new MemoryQuestionRepository();
    const createUc = new CreateQuestion(repo, fakeId, fakeClock);
    const created = await createUc.execute({ title: 'Top Sales', type: 'chart' });

    expect(created.id).toBe('test-id');
    expect(created.slug).toBe('top-sales');

    const laterClock = { now: () => '2026-06-01T00:00:00.000Z' };
    const updateUc = new UpdateQuestion(repo, laterClock);
    const updated = await updateUc.execute(created.id, { title: 'Best Sales' });
    expect(updated.title).toBe('Best Sales');
    expect(updated.updatedAt).toBe('2026-06-01T00:00:00.000Z');

    const getUc = new GetQuestion(repo);
    await new DeleteQuestion(repo).execute(created.id);
    expect(await getUc.execute(created.id)).toBeNull();
  });

  it('UpdateQuestion throws when question does not exist', async () => {
    const repo = new MemoryQuestionRepository();
    const uc = new UpdateQuestion(repo, fakeClock);
    await expect(uc.execute('ghost', { title: 'X' })).rejects.toThrow('Question not found: ghost');
  });
});

// UT-005: Dashboard create/update/delete cycle
describe('Dashboard use cases (UT-005)', () => {
  it('create/update/delete cycle works', async () => {
    const repo = new MemoryDashboardRepository();
    const createUc = new CreateDashboard(repo, fakeId, fakeClock);
    const created = await createUc.execute({ name: 'Overview' });

    expect(created.id).toBe('overview');
    expect(created.type).toBe('dashboard');
    expect(created.widgets).toEqual([]);

    const laterClock = { now: () => '2026-06-01T00:00:00.000Z' };
    const updateUc = new UpdateDashboard(repo, laterClock);
    const updated = await updateUc.execute(created.id, { name: 'Overview v2' });
    expect(updated.name).toBe('Overview v2');
    expect(updated.updatedAt).toBe('2026-06-01T00:00:00.000Z');

    const getUc = new GetDashboard(repo);
    await new DeleteDashboard(repo).execute(created.id);
    expect(await getUc.execute(created.id)).toBeNull();
  });

  it('UpdateDashboard throws when dashboard does not exist', async () => {
    const repo = new MemoryDashboardRepository();
    const uc = new UpdateDashboard(repo, fakeClock);
    await expect(uc.execute('ghost', { name: 'X' })).rejects.toThrow('Dashboard not found: ghost');
  });

  it('ListDashboards returns all saved dashboards', async () => {
    const repo = new MemoryDashboardRepository();
    const createUc = new CreateDashboard(repo, { create: () => 'id-1' }, fakeClock);
    await createUc.execute({ name: 'A' });
    const uc2 = new CreateDashboard(repo, { create: () => 'id-2' }, fakeClock);
    await uc2.execute({ name: 'B' });
    const listUc = new ListDashboards(repo);
    const list = await listUc.execute();
    expect(list).toHaveLength(2);
  });
});
