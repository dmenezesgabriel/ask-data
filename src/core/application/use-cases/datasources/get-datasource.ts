import type { ReadOnlyRepository } from '@/core/application/ports';
import type { Datasource } from '@/core/entities';

export class GetDatasource {
  constructor(private readonly datasources: ReadOnlyRepository<Datasource>) {}

  async execute(id: string): Promise<Datasource | null> {
    return this.datasources.get(id);
  }
}
