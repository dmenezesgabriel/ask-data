import type { Clock, QuestionRepository } from '@/core/application/ports';
import type { Datasource, DataSourceType, Question } from '@/core/entities';
import { createLogger } from '@/shared/observability/logger';
import { generateUniqueSlug, nameToSlug } from '@/shared/utils/slug';

const V2_KEY = 'persisted_questions_v2';
const V1_KEY = 'persisted_questions_v1';
const DATASOURCE_V2_KEY = 'persisted_datasources_v2';
const logger = createLogger('catalog-repository');

type LegacyDataSourceEntry = { name?: string; url?: string; type?: DataSourceType };
type LegacyQuestion = Question & { dataSources?: LegacyDataSourceEntry[] };

function parse(raw: string | null): Question[] {
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Question[];
  } catch (error) {
    logger.error('read.error', error, {
      assetType: 'question',
      operation: 'parse',
      result: 'failure',
    });
    return [];
  }
}

function loadAll(): Question[] {
  return parse(localStorage.getItem(V2_KEY));
}

function parseDatasources(raw: string | null): Datasource[] {
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Datasource[];
  } catch (error) {
    logger.error('read.error', error, {
      assetType: 'datasource',
      operation: 'parse',
      result: 'failure',
    });
    return [];
  }
}

function inferTypeFromUrl(url: string): DataSourceType {
  const lower = url.toLowerCase();
  if (lower.endsWith('.parquet')) return 'parquet';
  if (lower.endsWith('.json')) return 'json';
  return 'csv';
}

function inferNameFromUrl(url: string): string {
  try {
    const segment = new URL(url).pathname.split('/').filter(Boolean).pop() ?? '';
    const base = segment.replace(/\.[^.]+$/, '');
    return base ? base.charAt(0).toUpperCase() + base.slice(1).replace(/[-_]/g, ' ') : 'Datasource';
  } catch {
    return 'Datasource';
  }
}

function promoteEmbeddedDatasources(questions: LegacyQuestion[]): Question[] {
  let datasources = parseDatasources(localStorage.getItem(DATASOURCE_V2_KEY));
  const migrated = questions.map((question) => {
    if (!Array.isArray(question.dataSources) || question.dataSources.length === 0) return question;
    const dataSourceSlugs: string[] = [];

    for (const entry of question.dataSources) {
      const url = entry.url?.trim();
      if (!url) continue;
      const existing = datasources.find(
        (datasource) => datasource.url.toLowerCase() === url.toLowerCase(),
      );
      if (existing) {
        dataSourceSlugs.push(existing.slug);
        continue;
      }
      const name = entry.name || inferNameFromUrl(url);
      const slug = generateUniqueSlug(nameToSlug(name, 'datasource'), (candidate) =>
        datasources.some((datasource) => datasource.slug === candidate),
      );
      const datasource: Datasource = {
        id: slug,
        slug,
        name,
        type: entry.type ?? inferTypeFromUrl(url),
        url,
        source: 'user',
        createdAt: question.createdAt,
        updatedAt: question.updatedAt,
      };
      datasources = [...datasources, datasource];
      dataSourceSlugs.push(slug);
    }

    const rest = { ...question };
    delete rest.dataSources;
    return { ...rest, dataSourceSlugs };
  });

  try {
    localStorage.setItem(DATASOURCE_V2_KEY, JSON.stringify(datasources));
  } catch (error) {
    logger.error('write.error', error, {
      assetType: 'datasource',
      operation: 'persist',
      result: 'failure',
    });
  }

  return migrated;
}

function persist(items: Question[]): void {
  try {
    localStorage.setItem(V2_KEY, JSON.stringify(items));
  } catch (error) {
    logger.error('write.error', error, {
      assetType: 'question',
      operation: 'persist',
      result: 'failure',
    });
    // ignore write errors (private browsing, storage full, etc.)
  }
}

function migrateV1toV2(): void {
  if (localStorage.getItem(V2_KEY) !== null) return;
  const v1Raw = localStorage.getItem(V1_KEY);
  if (!v1Raw) return;
  const records = promoteEmbeddedDatasources(parse(v1Raw) as LegacyQuestion[]);
  persist(records);
  try {
    localStorage.removeItem(V1_KEY);
  } catch {
    // ignore — v2 was written; best-effort cleanup of v1
  }
}

export class LocalStorageQuestionRepository implements QuestionRepository {
  constructor(private readonly clock: Clock) {
    migrateV1toV2();
  }

  async list(): Promise<Question[]> {
    return loadAll();
  }

  async get(id: string): Promise<Question | null> {
    return loadAll().find((q) => q.id === id) ?? null;
  }

  async save(question: Question): Promise<void> {
    const items = loadAll();
    const idx = items.findIndex((q) => q.id === question.id);
    if (idx >= 0) {
      items[idx] = { ...question, updatedAt: this.clock.now() };
    } else {
      items.push(question);
    }
    persist(items);
  }

  async delete(id: string): Promise<void> {
    persist(loadAll().filter((q) => q.id !== id));
  }
}
