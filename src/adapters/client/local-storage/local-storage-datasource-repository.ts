import type { DatasourceRepository } from '@/core/application/ports';
import type { Datasource } from '@/core/entities';

const STORAGE_KEY = 'persisted_datasources_v1';

function loadAll(): Datasource[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Datasource[]) : [];
  } catch {
    return [];
  }
}

function persist(items: Datasource[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore write errors (private browsing, storage full, etc.)
  }
}

export class LocalStorageDatasourceRepository implements DatasourceRepository {
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
      items[idx] = { ...datasource, updatedAt: new Date().toISOString() };
    } else {
      items.push(datasource);
    }
    persist(items);
  }

  async delete(id: string): Promise<void> {
    persist(loadAll().filter((d) => d.id !== id));
  }
}
