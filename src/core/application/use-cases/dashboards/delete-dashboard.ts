import type { DashboardRepository } from '@/core/application/ports';

export class DeleteDashboard {
  constructor(private readonly dashboards: DashboardRepository) {}

  async execute(id: string): Promise<void> {
    await this.dashboards.delete(id);
  }
}
