import type { Clock, DatasourceRepository, IdGenerator } from '@/core/application/ports';
import type { Datasource, DataSourceType } from '@/core/entities';
import { CapabilityDisabledError, type CapabilityRegistry } from '@/core/platform';

import { recordCatalogMutation } from '../catalog-mutation-logger';
import { generateUniqueSlug, nameToSlug } from '../slug';

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
    private readonly capabilities?: CapabilityRegistry,
  ) {}

  async execute(input: CreateDatasourceInput): Promise<Datasource> {
    if (this.capabilities) {
      const connector = this.capabilities
        .getContributions('datasource-connector')
        .find((candidate) => candidate.accepts({ type: input.type, url: input.url }));

      if (!connector) {
        this.capabilities.requireCapability(
          `datasource.connector.${input.type}`,
          'CreateDatasource',
        );
        throw new CapabilityDisabledError(`datasource.connector.${input.type}`, 'CreateDatasource');
      }
    }

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
