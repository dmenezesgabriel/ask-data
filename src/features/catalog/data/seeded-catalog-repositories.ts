import { parse as parseYaml } from 'yaml';

import type {
  DashboardRepository,
  DatasourceRepository,
  QuestionRepository,
} from '@/core/application/ports';
import type { Dashboard, DashboardWidget, Datasource, Question } from '@/core/entities';
import portableBiDashboardYaml from '@/features/dashboard/data/dashboards/portable-bi-dashboard.yaml?raw';
import sampleCustomersYaml from '@/features/datasource/data/datasources/sample-customers.yaml?raw';
import sampleProductsYaml from '@/features/datasource/data/datasources/sample-products.yaml?raw';
import sampleSalesYaml from '@/features/datasource/data/datasources/sample-sales.yaml?raw';
import { createEmptyDatasourceConfig } from '@/features/datasource/model/datasource-config';
import { migrateDashboards } from '@/features/datasource/model/datasource-migration';
import { parseDatasourceYaml } from '@/features/datasource/model/datasource-yaml';
import salesByRegionYaml from '@/features/question/data/questions/sales-by-region.yaml?raw';
import topProductsYaml from '@/features/question/data/questions/top-products.yaml?raw';
import { parseQuestionYaml } from '@/features/question/model/question-yaml';
import type { DashboardConfig } from '@/shared/types';

const LEGACY_DASHBOARD_KEY = 'persisted_dashboards_v1';

type MutableRepository<T> = {
  list(): Promise<T[]>;
  get(id: string): Promise<T | null>;
  save(item: T): Promise<void>;
  delete(id: string): Promise<void>;
};

function dedupeById<T extends { id: string }>(items: T[]): T[] {
  return [...new Map(items.map((item) => [item.id, item])).values()];
}

function requireUserRecord<T extends { id: string; source?: string }>(
  seeds: T[],
  id: string,
): void {
  const seed = seeds.find((item) => item.id === id);
  if (seed) throw new Error(`Cannot mutate YAML-seeded catalog asset: ${id}`);
}

function titleToSlug(title: string, fallback: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || fallback
  );
}

function dashboardConfigToEntity(
  config: DashboardConfig,
  id = titleToSlug(config.title, 'dashboard'),
  source: Dashboard['source'] = 'user',
): Dashboard {
  const widgets: DashboardWidget[] = [
    ...config.kpis.map<DashboardWidget>((kpi) => ({
      id: kpi.id,
      type: 'kpi',
      title: kpi.title,
      query: kpi.query,
      kpiConfig: kpi,
      columnFormats: kpi.format ? { value: kpi.format } : undefined,
    })),
    ...config.charts.map<DashboardWidget>((chart) => ({
      id: chart.id,
      type: 'chart',
      title: chart.title ?? chart.id,
      query: chart.query,
      chartType: chart.type as DashboardWidget['chartType'],
      options: chart.options as Record<string, unknown> | undefined,
    })),
    ...config.tables.map<DashboardWidget>((table) => ({
      id: table.id,
      type: 'table',
      title: table.title,
      query: table.query,
      columns: table.columns,
      columnFormats: table.columnFormats,
    })),
  ];

  return {
    id,
    name: config.title,
    type: 'dashboard',
    widgets,
    layout: config.layout ?? [],
    filters: config.filters,
    source,
  };
}

function readLegacyDashboards(): Dashboard[] {
  try {
    const raw = localStorage.getItem(LEGACY_DASHBOARD_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<{ slug: string; config: DashboardConfig }>;
    const migrated = migrateDashboards(parsed.map((entry) => entry.config));
    return parsed.map((entry, index) =>
      dashboardConfigToEntity(migrated[index], entry.slug, 'user'),
    );
  } catch {
    return [];
  }
}

export function createSeedDatasources(): Datasource[] {
  const now = new Date().toISOString();
  return [
    { yaml: sampleSalesYaml, slug: 'superstore-sales' },
    { yaml: sampleCustomersYaml, slug: 'superstore-customers' },
    { yaml: sampleProductsYaml, slug: 'superstore-products' },
  ].map(({ yaml, slug }) => ({
    ...createEmptyDatasourceConfig(),
    ...parseDatasourceYaml(yaml),
    id: slug,
    slug,
    source: 'yaml',
    createdAt: now,
    updatedAt: now,
  }));
}

export function createSeedQuestions(): Question[] {
  return [salesByRegionYaml, topProductsYaml].map(parseQuestionYaml);
}

export function createSeedDashboards(): Dashboard[] {
  const config = parseYaml(portableBiDashboardYaml) as DashboardConfig;
  return [dashboardConfigToEntity(config, titleToSlug(config.title, 'dashboard'), 'yaml')];
}

export class SeededDatasourceRepository implements DatasourceRepository {
  constructor(
    private readonly userRepository: DatasourceRepository,
    private readonly seeds = createSeedDatasources(),
  ) {}

  async list(): Promise<Datasource[]> {
    return dedupeById([...this.seeds, ...(await this.userRepository.list())]);
  }

  async get(id: string): Promise<Datasource | null> {
    return this.seeds.find((item) => item.id === id) ?? this.userRepository.get(id);
  }

  async save(datasource: Datasource): Promise<void> {
    requireUserRecord(this.seeds, datasource.id);
    await this.userRepository.save({ ...datasource, source: 'user' });
  }

  async delete(id: string): Promise<void> {
    requireUserRecord(this.seeds, id);
    await this.userRepository.delete(id);
  }
}

export class SeededQuestionRepository implements QuestionRepository {
  constructor(
    private readonly userRepository: QuestionRepository,
    private readonly seeds = createSeedQuestions(),
  ) {}

  async list(): Promise<Question[]> {
    return dedupeById([...this.seeds, ...(await this.userRepository.list())]);
  }

  async get(id: string): Promise<Question | null> {
    return this.seeds.find((item) => item.id === id) ?? this.userRepository.get(id);
  }

  async save(question: Question): Promise<void> {
    requireUserRecord(this.seeds, question.id);
    await this.userRepository.save({ ...question, source: 'user' });
  }

  async delete(id: string): Promise<void> {
    requireUserRecord(this.seeds, id);
    await this.userRepository.delete(id);
  }
}

export class SeededDashboardRepository implements DashboardRepository {
  constructor(
    private readonly userRepository: MutableRepository<Dashboard>,
    private readonly seeds = createSeedDashboards(),
  ) {}

  async list(): Promise<Dashboard[]> {
    return dedupeById([
      ...this.seeds,
      ...readLegacyDashboards(),
      ...(await this.userRepository.list()),
    ]);
  }

  async get(id: string): Promise<Dashboard | null> {
    return (
      this.seeds.find((item) => item.id === id) ??
      readLegacyDashboards().find((item) => item.id === id) ??
      this.userRepository.get(id)
    );
  }

  async save(dashboard: Dashboard): Promise<void> {
    requireUserRecord(this.seeds, dashboard.id);
    requireUserRecord(readLegacyDashboards(), dashboard.id);
    await this.userRepository.save(dashboard);
  }

  async delete(id: string): Promise<void> {
    requireUserRecord(this.seeds, id);
    requireUserRecord(readLegacyDashboards(), id);
    await this.userRepository.delete(id);
  }
}
