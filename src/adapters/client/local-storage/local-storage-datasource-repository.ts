import type { Clock, DatasourceRepository } from '@/core/application/ports';
import type { Datasource } from '@/core/entities';
import { createLogger } from '@/shared/observability/logger';

const V2_KEY = 'persisted_datasources_v2';
const V1_KEY = 'persisted_datasources_v1';
const logger = createLogger('catalog-repository');

function parse(raw: string | null): Datasource[] {
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Datasource[];
  } catch (error) {
    logger.error('read.error', error, {
      assetType: 'datasource',
      operation: 'parse',
      result: 'failure',
    });
    return [];
  }
}

function loadAll(): Datasource[] {
  return parse(localStorage.getItem(V2_KEY));
}

function persist(items: Datasource[]): void {
  try {
    localStorage.setItem(V2_KEY, JSON.stringify(items));
  } catch (error) {
    logger.error('write.error', error, {
      assetType: 'datasource',
      operation: 'persist',
      result: 'failure',
    });
    // ignore write errors (private browsing, storage full, etc.)
  }
}

function migrateV1toV2(): void {
  if (localStorage.getItem(V2_KEY) !== null) return;
  const v1Raw = localStorage.getItem(V1_KEY);
  if (!v1Raw) return;
  const records = parse(v1Raw);
  persist(records);
  try {
    localStorage.removeItem(V1_KEY);
  } catch {
    // ignore — v2 was written; best-effort cleanup of v1
  }
}

export class LocalStorageDatasourceRepository implements DatasourceRepository {
  constructor(private readonly clock: Clock) {
    migrateV1toV2();
  }

  async list(): Promise<Datasource[]> {
    return loadAll();
  }

  async get(id: string): Promise<Datasource | null> {
    return loadAll().find((d) => d.id === id) ?? null;
  }

  async save(datasource: Datasource): Promise<void> {
    const items = loadAll();
    const idx = items.findIndex((d) => d.id === datasource.id);
    if (idx >= 0) {
      items[idx] = { ...datasource, updatedAt: this.clock.now() };
    } else {
      items.push(datasource);
    }
    persist(items);
  }

  async delete(id: string): Promise<void> {
    persist(loadAll().filter((d) => d.id !== id));
  }
}
