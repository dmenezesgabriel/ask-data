import type { Clock, DatasourceRepository, IdGenerator } from '@/core/application/ports';
import type { Datasource, DataSourceType } from '@/core/entities';

export type CreateDatasourceInput = {
  name: string;
  type: DataSourceType;
  url: string;
  description?: string;
  source?: 'yaml' | 'user';
};

export class CreateDatasource {
  constructor(
    private readonly datasources: DatasourceRepository,
    private readonly idGenerator: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(input: CreateDatasourceInput): Promise<Datasource> {
    const now = this.clock.now();
    const datasource: Datasource = {
      ...input,
      id: this.idGenerator.create(),
      slug: input.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, ''),
      source: input.source ?? 'user',
      createdAt: now,
      updatedAt: now,
    };
    await this.datasources.save(datasource);
    return datasource;
  }
}
