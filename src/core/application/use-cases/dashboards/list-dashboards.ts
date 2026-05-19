import type { DashboardRepository } from '@/core/application/ports';
import type { Dashboard } from '@/core/entities';

export class ListDashboards {
  constructor(private readonly dashboards: DashboardRepository) {}

  async execute(): Promise<Dashboard[]> {
    return this.dashboards.list();
  }
}
