import type { Clock, DashboardRepository, IdGenerator } from '@/core/application/ports';
import type { Dashboard, DashboardWidget } from '@/core/entities';

export type CreateDashboardInput = {
  name: string;
  type?: 'layout' | 'dashboard';
  widgets?: DashboardWidget[];
  layout?: Dashboard['layout'];
  filters?: Dashboard['filters'];
};

export class CreateDashboard {
  constructor(
    private readonly dashboards: DashboardRepository,
    private readonly idGenerator: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(input: CreateDashboardInput): Promise<Dashboard> {
    const now = this.clock.now();
    const dashboard: Dashboard = {
      ...input,
      id: this.idGenerator.create(),
      type: input.type ?? 'dashboard',
      widgets: input.widgets ?? [],
      layout: input.layout ?? [],
      createdAt: now,
      updatedAt: now,
    };
    await this.dashboards.save(dashboard);
    return dashboard;
  }
}
