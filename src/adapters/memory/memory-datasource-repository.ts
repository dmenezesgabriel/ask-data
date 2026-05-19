import type { DatasourceRepository } from '@/core/application/ports';
import type { Datasource } from '@/core/entities';

export class MemoryDatasourceRepository implements DatasourceRepository {
  private readonly store = new Map<string, Datasource>();

  async list(): Promise<Datasource[]> {
    return Array.from(this.store.values());
  }

  async get(id: string): Promise<Datasource | null> {
    return this.store.get(id) ?? null;
  }

  async save(datasource: Datasource): Promise<void> {
    this.store.set(datasource.id, datasource);
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }
}
