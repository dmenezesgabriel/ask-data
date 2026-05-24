import type { Clock, DatasourceRepository } from '@/core/application/ports';
import type { Datasource } from '@/core/entities';

import { recordCatalogMutation } from '../catalog-mutation-logger';

export type UpdateDatasourceInput = Partial<Omit<Datasource, 'id' | 'createdAt' | 'updatedAt'>>;

export class UpdateDatasource {
  constructor(
    private readonly datasources: DatasourceRepository,
    private readonly clock: Clock,
  ) {}

  async execute(id: string, patch: UpdateDatasourceInput): Promise<Datasource> {
    const existing = await this.datasources.get(id);
    if (!existing) {
      throw new Error(`Datasource not found: ${id}`);
    }
    const updated: Datasource = { ...existing, ...patch, id, updatedAt: this.clock.now() };
    return recordCatalogMutation('datasource', 'update', async () => {
      await this.datasources.save(updated);
      return updated;
    });
  }
}
