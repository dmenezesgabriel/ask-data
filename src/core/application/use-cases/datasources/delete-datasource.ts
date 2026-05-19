import type { DatasourceRepository } from '@/core/application/ports';

export class DeleteDatasource {
  constructor(private readonly datasources: DatasourceRepository) {}

  async execute(id: string): Promise<void> {
    await this.datasources.delete(id);
  }
}
