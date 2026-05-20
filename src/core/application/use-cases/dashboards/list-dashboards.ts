import type { ReadOnlyRepository } from '@/core/application/ports';
import type { Dashboard } from '@/core/entities';

export class ListDashboards {
  constructor(private readonly dashboards: ReadOnlyRepository<Dashboard>) {}

  async execute(): Promise<Dashboard[]> {
    return this.dashboards.list();
  }
}
