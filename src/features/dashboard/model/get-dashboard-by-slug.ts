import type { DashboardConfig } from '@/shared/types/index';

import { getDashboardBySlug as _lookup } from '../data/dashboard-registry';

export class GetDashboardBySlug {
  execute(slug: string): DashboardConfig | undefined {
    return _lookup(slug);
  }
}
