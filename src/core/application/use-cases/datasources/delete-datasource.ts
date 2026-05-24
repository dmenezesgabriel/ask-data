import type { DatasourceRepository } from '@/core/application/ports';

import { recordCatalogMutation } from '../catalog-mutation-logger';

export class DeleteDatasource {
  constructor(private readonly datasources: DatasourceRepository) {}

  async execute(id: string): Promise<void> {
    await recordCatalogMutation('datasource', 'delete', () => this.datasources.delete(id));
  }
}
