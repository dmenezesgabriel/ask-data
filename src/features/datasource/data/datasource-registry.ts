import type { Datasource as DataSourceConfig } from '@/core/entities';
import { generateUniqueSlug, nameToSlug } from '@/shared/utils/slug';

import { createEmptyDatasourceConfig } from '../model/datasource-config';
import { parseDatasourceYaml } from '../model/datasource-yaml';
import sampleCustomersYaml from './datasources/sample-customers.yaml?raw';
import sampleProductsYaml from './datasources/sample-products.yaml?raw';
import sampleSalesYaml from './datasources/sample-sales.yaml?raw';

// ── Storage ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'persisted_datasources_v2';

function loadPersistedDatasources(): DataSourceConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DataSourceConfig[]) : [];
  } catch {
    return [];
  }
}

function persistDatasources(datasources: DataSourceConfig[]): void {
  const userDatasources = datasources.filter((d) => d.source === 'user');
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userDatasources));
  } catch {
    // localStorage may be unavailable or at quota; proceed without persisting
  }
}

// ── Seed datasources (YAML-sourced) ──────────────────────────────────────────

const _seedDatasources: DataSourceConfig[] = [];

export function registerSeedDatasource(d: DataSourceConfig): void {
  if (!_seedDatasources.find((s) => s.slug === d.slug)) {
    _seedDatasources.push({ ...d, source: 'yaml' });
  }
}

(function loadSeeds() {
  const seeds = [
    { yaml: sampleSalesYaml, slugHint: 'superstore-sales' },
    { yaml: sampleCustomersYaml, slugHint: 'superstore-customers' },
    { yaml: sampleProductsYaml, slugHint: 'superstore-products' },
  ];
  for (const { yaml, slugHint } of seeds) {
    try {
      const partial = parseDatasourceYaml(yaml);
      const now = new Date().toISOString();
      const ds: DataSourceConfig = {
        ...createEmptyDatasourceConfig(),
        ...partial,
        slug: slugHint,
        source: 'yaml',
        createdAt: now,
        updatedAt: now,
      };
      registerSeedDatasource(ds);
    } catch (err) {
      console.error('[datasource-registry] Failed to load seed datasource:', err);
    }
  }
})();

// ── Registry (reads from storage on every call — no stale in-memory cache) ───

export function datasourceList(): DataSourceConfig[] {
  return [..._seedDatasources, ...loadPersistedDatasources()];
}

export function getDatasourceBySlug(slug: string): DataSourceConfig | undefined {
  return datasourceList().find((d) => d.slug === slug);
}

export function getDatasourceByUrl(url: string): DataSourceConfig | undefined {
  const normalized = url.trim().toLowerCase();
  return datasourceList().find((d) => d.url.trim().toLowerCase() === normalized);
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function addDatasource(
  partial: Omit<DataSourceConfig, 'id' | 'slug' | 'createdAt' | 'updatedAt' | 'source'> &
    Partial<Pick<DataSourceConfig, 'slug'>>,
): DataSourceConfig {
  const base = partial.name ?? 'Untitled Datasource';
  const slug =
    partial.slug ??
    generateUniqueSlug(nameToSlug(base, 'datasource'), (s) => !!getDatasourceBySlug(s));

  if (getDatasourceBySlug(slug)) {
    throw new Error(`Datasource slug already exists: "${slug}"`);
  }

  const now = new Date().toISOString();
  const datasource: DataSourceConfig = {
    ...createEmptyDatasourceConfig(),
    ...partial,
    id: crypto.randomUUID(),
    slug,
    source: 'user',
    createdAt: now,
    updatedAt: now,
  };

  persistDatasources([...loadPersistedDatasources(), datasource]);
  return datasource;
}

export function updateDatasource(
  slug: string,
  changes: Partial<DataSourceConfig>,
): DataSourceConfig {
  const current = loadPersistedDatasources();
  const existing = current.find((d) => d.slug === slug);
  if (!existing) {
    throw new Error(`Cannot update datasource: slug "${slug}" not found or is read-only`);
  }

  const updated: DataSourceConfig = {
    ...existing,
    ...changes,
    slug,
    source: 'user',
    updatedAt: new Date().toISOString(),
  };

  persistDatasources(current.map((d) => (d.slug === slug ? updated : d)));
  return updated;
}

export function deleteDatasource(slug: string): void {
  const datasource = getDatasourceBySlug(slug);
  if (!datasource) return;
  if (datasource.source === 'yaml') {
    throw new Error(`Cannot delete YAML-seeded datasource: "${slug}"`);
  }
  persistDatasources(loadPersistedDatasources().filter((d) => d.slug !== slug));
}
