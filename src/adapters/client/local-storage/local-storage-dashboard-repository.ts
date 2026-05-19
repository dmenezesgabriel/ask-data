import type { DashboardRepository } from '@/core/application/ports';
import type { Dashboard } from '@/core/entities';

/**
 * Persists Dashboard entities directly to localStorage.
 *
 * KNOWN LIMITATION — legacy data gap (NFR-003):
 *
 * The existing dashboard-registry.ts stores a legacy DashboardConfig shape
 * (with kpis/charts/tables arrays) under the key `persisted_dashboards_v1`. The core
 * Dashboard entity used here (with widgets/layout arrays) is structurally incompatible
 * with DashboardConfig and cannot be losslessly mapped to it. Delegating to the registry
 * is therefore not possible without data loss.
 *
 * To avoid clobbering the legacy key, this adapter writes and reads only from the
 * separate key `persisted_entity_dashboards_v1`. The legacy `persisted_dashboards_v1`
 * data remains in localStorage and is preserved, but it is completely inaccessible
 * through this adapter — any pre-existing user dashboards stored under that key will
 * appear as an empty list to any use case that reads through LocalStorageDashboardRepository.
 *
 * A proper migration (reading `persisted_dashboards_v1`, converting each DashboardConfig
 * to a Dashboard entity, and writing to `persisted_entity_dashboards_v1`) is deferred to
 * a future task once the migration strategy and entity mapping rules are agreed upon.
 */
const STORAGE_KEY = 'persisted_entity_dashboards_v1';

function load(): Dashboard[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Dashboard[]) : [];
  } catch {
    return [];
  }
}

function persist(dashboards: Dashboard[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dashboards));
  } catch {
    // localStorage unavailable; proceed without persisting
  }
}

export class LocalStorageDashboardRepository implements DashboardRepository {
  async list(): Promise<Dashboard[]> {
    return load();
  }

  async get(id: string): Promise<Dashboard | null> {
    return load().find((d) => d.id === id) ?? null;
  }

  async save(dashboard: Dashboard): Promise<void> {
    const current = load();
    const idx = current.findIndex((d) => d.id === dashboard.id);
    if (idx >= 0) {
      current[idx] = dashboard;
    } else {
      current.push(dashboard);
    }
    persist(current);
  }

  async delete(id: string): Promise<void> {
    const current = load().filter((d) => d.id !== id);
    persist(current);
  }
}
