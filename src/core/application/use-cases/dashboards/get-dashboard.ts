import type { DashboardRepository } from '@/core/application/ports';
import type { Dashboard } from '@/core/entities';

export class GetDashboard {
  constructor(private readonly dashboards: DashboardRepository) {}

  async execute(id: string): Promise<Dashboard | null> {
    return this.dashboards.get(id);
  }
}
