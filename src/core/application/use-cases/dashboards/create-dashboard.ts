import type { Clock, DashboardRepository, IdGenerator } from '@/core/application/ports';
import type { Dashboard, DashboardWidget } from '@/core/entities';
import { generateUniqueSlug, nameToSlug } from '@/shared/utils/slug';

import { recordCatalogMutation } from '../catalog-mutation-logger';

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
    const existing = await this.dashboards.list();
    const id = generateUniqueSlug(nameToSlug(input.name, 'dashboard'), (candidate) =>
      existing.some((dashboard) => dashboard.id === candidate),
    );
    const dashboard: Dashboard = {
      ...input,
      id,
      type: input.type ?? 'dashboard',
      widgets: input.widgets ?? [],
      layout: input.layout ?? [],
      source: 'user',
      createdAt: now,
      updatedAt: now,
    };
    this.idGenerator.create();
    return recordCatalogMutation('dashboard', 'create', async () => {
      await this.dashboards.save(dashboard);
      return dashboard;
    });
  }
}
