import type { DatasourceRepository } from '@/core/application/ports';
import type { Datasource } from '@/core/entities';

export class ListDatasources {
  constructor(private readonly datasources: DatasourceRepository) {}

  async execute(): Promise<Datasource[]> {
    return this.datasources.list();
  }
}
