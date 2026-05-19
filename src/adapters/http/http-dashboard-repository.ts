import type { DashboardRepository } from '@/core/application/ports';
import type { Dashboard } from '@/core/entities';

import { NotImplementedError } from './http-error';

export class HttpDashboardRepository implements DashboardRepository {
  constructor(private readonly baseUrl: string = '/api/dashboards') {}

  async list(): Promise<Dashboard[]> {
    const res = await fetch(this.baseUrl);
    if (!res.ok) throw new Error(`Failed to list dashboards: ${res.status}`);
    return res.json() as Promise<Dashboard[]>;
  }

  async get(id: string): Promise<Dashboard | null> {
    const res = await fetch(`${this.baseUrl}/${id}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Failed to get dashboard: ${res.status}`);
    return res.json() as Promise<Dashboard>;
  }

  async save(_dashboard: Dashboard): Promise<void> {
    throw new NotImplementedError(`${this.baseUrl} save`);
  }

  async delete(id: string): Promise<void> {
    throw new NotImplementedError(`${this.baseUrl}/${id} delete`);
  }
}
