import type { Clock, DatasourceRepository, IdGenerator } from '@/core/application/ports';
import type { Datasource, DataSourceType } from '@/core/entities';
import { generateUniqueSlug, nameToSlug } from '@/shared/utils/slug';

import { recordCatalogMutation } from '../catalog-mutation-logger';

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
    const existing = await this.datasources.list();
    const slug = generateUniqueSlug(nameToSlug(input.name, 'datasource'), (candidate) =>
      existing.some((datasource) => datasource.slug === candidate),
    );
    const datasource: Datasource = {
      ...input,
      id: this.idGenerator.create(),
      slug,
      source: input.source ?? 'user',
      createdAt: now,
      updatedAt: now,
    };
    return recordCatalogMutation('datasource', 'create', async () => {
      await this.datasources.save(datasource);
      return datasource;
    });
  }
}
