import type { Dashboard } from '@/core/entities';

export interface DashboardRepository {
  list(): Promise<Dashboard[]>;
  get(id: string): Promise<Dashboard | null>;
  save(dashboard: Dashboard): Promise<void>;
  delete(id: string): Promise<void>;
}
