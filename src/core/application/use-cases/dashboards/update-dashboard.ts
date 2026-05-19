import type { Clock, DashboardRepository } from '@/core/application/ports';
import type { Dashboard } from '@/core/entities';

export type UpdateDashboardInput = Partial<Omit<Dashboard, 'id' | 'createdAt' | 'updatedAt'>>;

export class UpdateDashboard {
  constructor(
    private readonly dashboards: DashboardRepository,
    private readonly clock: Clock,
  ) {}

  async execute(id: string, patch: UpdateDashboardInput): Promise<Dashboard> {
    const existing = await this.dashboards.get(id);
    if (!existing) {
      throw new Error(`Dashboard not found: ${id}`);
    }
    const updated: Dashboard = { ...existing, ...patch, id, updatedAt: this.clock.now() };
    await this.dashboards.save(updated);
    return updated;
  }
}
