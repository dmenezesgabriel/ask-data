import type { DashboardRepository } from '@/core/application/ports';
import type { Dashboard } from '@/core/entities';

export class MemoryDashboardRepository implements DashboardRepository {
  private readonly store = new Map<string, Dashboard>();

  async list(): Promise<Dashboard[]> {
    return Array.from(this.store.values());
  }

  async get(id: string): Promise<Dashboard | null> {
    return this.store.get(id) ?? null;
  }

  async save(dashboard: Dashboard): Promise<void> {
    this.store.set(dashboard.id, dashboard);
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }
}
