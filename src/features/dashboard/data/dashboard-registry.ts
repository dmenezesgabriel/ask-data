import { parse as parseYaml } from 'yaml';

import { generateUniqueSlug } from '@/shared/utils/slug';

import type { DashboardConfig } from '../../../shared/types/index';
import { migrateDashboards } from '../../datasource/model/datasource-migration';
import portableBiDashboardYaml from './dashboards/portable-bi-dashboard.yaml?raw';

export function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export interface DashboardEntry {
  slug: string;
  config: DashboardConfig;
  source: 'yaml' | 'user';
}

const yamlModules: string[] = [portableBiDashboardYaml];

const staticEntries: DashboardEntry[] = yamlModules.map((yaml) => {
  const config = parseYaml(yaml) as DashboardConfig;
  const slug = titleToSlug(config.title);
  return { slug, config, source: 'yaml' };
});

const PERSIST_KEY = 'persisted_dashboards_v1';

function loadPersistedDashboards(): DashboardEntry[] {
  try {
    const raw = localStorage.getItem(PERSIST_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<{ slug: string; config: DashboardConfig }>;
    const configs = parsed.map((p) => p.config);
    const migrated = migrateDashboards(configs);
    const changed = migrated.some((c, i) => c !== configs[i]);
    if (changed) {
      const toSave = parsed.map((p, i) => ({ slug: p.slug, config: migrated[i] }));
      try {
        localStorage.setItem(PERSIST_KEY, JSON.stringify(toSave));
      } catch {
        // localStorage may be unavailable in some environments; proceed without persisting
      }
    }
    return parsed.map((p, i) => ({ slug: p.slug, config: migrated[i]!, source: 'user' as const }));
  } catch {
    return [];
  }
}

function savePersistedDashboards(entries: DashboardEntry[]): void {
  try {
    const toSave = entries.map((e) => ({ slug: e.slug, config: e.config }));
    localStorage.setItem(PERSIST_KEY, JSON.stringify(toSave));
  } catch (err) {
    console.warn('Failed to persist dashboards:', err);
  }
}

const persistedEntries: DashboardEntry[] =
  typeof window !== 'undefined' ? loadPersistedDashboards() : [];

// Single internal map — eliminates the parallel array+object that could diverge.
const _entries = new Map<string, DashboardEntry>();
for (const entry of [...staticEntries, ...persistedEntries]) {
  _entries.set(entry.slug, entry);
}

export function getDashboards(): DashboardEntry[] {
  return [..._entries.values()];
}

export function getDashboardBySlug(slug: string): DashboardConfig | undefined {
  return _entries.get(slug)?.config;
}

export function addDashboard(config: DashboardConfig): string {
  const base = titleToSlug(config.title) || 'dashboard';
  const slug = generateUniqueSlug(base, (s) => _entries.has(s));
  const entry: DashboardEntry = { slug, config, source: 'user' };
  _entries.set(slug, entry);
  savePersistedDashboards([..._entries.values()].filter((e) => e.source === 'user'));
  return slug;
}

export function deleteDashboard(slug: string): void {
  const entry = _entries.get(slug);
  if (!entry) return;
  if (entry.source === 'yaml') {
    console.warn(`Cannot delete YAML-seeded dashboard: "${slug}"`);
    return;
  }
  _entries.delete(slug);
  savePersistedDashboards([..._entries.values()].filter((e) => e.source === 'user'));
}
