import type { DatasourceRepository } from '@/core/application/ports';
import type { Datasource } from '@/core/entities';

export class GetDatasource {
  constructor(private readonly datasources: DatasourceRepository) {}

  async execute(id: string): Promise<Datasource | null> {
    return this.datasources.get(id);
  }
}
