import type { ReadOnlyRepository } from '@/core/application/ports';
import type { Datasource } from '@/core/entities';

export class ListDatasources {
  constructor(private readonly datasources: ReadOnlyRepository<Datasource>) {}

  async execute(): Promise<Datasource[]> {
    return this.datasources.list();
  }
}
