import type { DashboardRepository } from '@/core/application/ports';

import { recordCatalogMutation } from '../catalog-mutation-logger';

export class DeleteDashboard {
  constructor(private readonly dashboards: DashboardRepository) {}

  async execute(id: string): Promise<void> {
    await recordCatalogMutation('dashboard', 'delete', () => this.dashboards.delete(id));
  }
}
