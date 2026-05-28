import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Question } from '@/core/entities';

type LocalStorageMock = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
};

function createLocalStorageMock(seed: Record<string, string> = {}): {
  store: Map<string, string>;
  localStorage: LocalStorageMock;
} {
  const store = new Map(Object.entries(seed));
  return {
    store,
    localStorage: {
      getItem: (key) => store.get(key) ?? null,
      setItem: (key, value) => {
        store.set(key, value);
      },
      removeItem: (key) => {
        store.delete(key);
      },
      clear: () => {
        store.clear();
      },
    },
  };
}

type RepositoryModule = typeof import('./local-storage-question-repository');

async function importFreshRepository(ls: LocalStorageMock): Promise<RepositoryModule> {
  vi.resetModules();
  vi.stubGlobal('localStorage', ls);
  return import('./local-storage-question-repository');
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

const FIXED_TIME = '2025-06-01T00:00:00.000Z';
const mockClock = { now: () => FIXED_TIME };

function makeUserQuestion(id = 'test-q-1'): Question {
  return {
    id,
    slug: `slug-${id}`,
    title: 'Test Question',
    type: 'chart',
    chartType: 'bar',
    queryType: 'sql',
    query: 'SELECT 1',
    source: 'user',
    createdAt: FIXED_TIME,
    updatedAt: FIXED_TIME,
  };
}

describe('LocalStorageQuestionRepository', () => {
  let lsMock: ReturnType<typeof createLocalStorageMock>;

  beforeEach(() => {
    lsMock = createLocalStorageMock();
  });

  it('save() then list() returns the question under v2 key', async () => {
    const { LocalStorageQuestionRepository } = await importFreshRepository(lsMock.localStorage);
    const repo = new LocalStorageQuestionRepository(mockClock);
    const question = makeUserQuestion();

    await repo.save(question);
    const list = await repo.list();

    expect(list.some((q) => q.id === question.id)).toBe(true);

    const raw = lsMock.store.get('persisted_questions_v2');
    expect(raw).toBeTruthy();
    const stored = JSON.parse(raw!) as Question[];
    expect(stored.some((q) => q.id === question.id)).toBe(true);
    expect(lsMock.store.has('persisted_questions_v1')).toBe(false);
  });

  it('UT-001: get(id) returns the question when looked up by q.id', async () => {
    const { LocalStorageQuestionRepository } = await importFreshRepository(lsMock.localStorage);
    const repo = new LocalStorageQuestionRepository(mockClock);
    const question = makeUserQuestion();

    await repo.save(question);
    const found = await repo.get(question.id);

    expect(found).not.toBeNull();
    expect(found?.id).toBe(question.id);
  });

  it('UT-002: get(slug) returns the question when looked up by q.slug', async () => {
    const { LocalStorageQuestionRepository } = await importFreshRepository(lsMock.localStorage);
    const repo = new LocalStorageQuestionRepository(mockClock);
    const question = makeUserQuestion('uuid-123');

    await repo.save(question);
    const found = await repo.get(question.slug);

    expect(found).not.toBeNull();
    expect(found?.id).toBe('uuid-123');
    expect(found?.slug).toBe(question.slug);
  });

  it('delete(id) removes a question', async () => {
    const { LocalStorageQuestionRepository } = await importFreshRepository(lsMock.localStorage);
    const repo = new LocalStorageQuestionRepository(mockClock);
    const question = makeUserQuestion();

    await repo.save(question);
    await repo.delete(question.id);
    const list = await repo.list();

    expect(list.some((q) => q.id === question.id)).toBe(false);
  });

  it('UT-003: get(unknown) returns null when no question matches id or slug', async () => {
    const { LocalStorageQuestionRepository } = await importFreshRepository(lsMock.localStorage);
    const repo = new LocalStorageQuestionRepository(mockClock);
    const question = makeUserQuestion();

    await repo.save(question);
    const found = await repo.get('does-not-exist');

    expect(found).toBeNull();
  });

  it('UT-004: save() uses the injected Clock for updatedAt when updating an existing record', async () => {
    const { LocalStorageQuestionRepository } = await importFreshRepository(lsMock.localStorage);
    const stubClock = { now: () => '2025-01-01T00:00:00.000Z' };
    const repo = new LocalStorageQuestionRepository(stubClock);
    const question = makeUserQuestion();

    await repo.save(question);
    await repo.save({ ...question, title: 'Updated Title' });

    const found = await repo.get(question.id);
    expect(found?.updatedAt).toBe('2025-01-01T00:00:00.000Z');
  });

  it('v1 records are migrated to v2 and v1 key is removed on construction', async () => {
    const legacyRecord = makeUserQuestion('legacy-q');
    const seedStore: Record<string, string> = {
      persisted_questions_v1: JSON.stringify([legacyRecord]),
    };
    const { store, localStorage: ls } = createLocalStorageMock(seedStore);

    const { LocalStorageQuestionRepository } = await importFreshRepository(ls);
    const repo = new LocalStorageQuestionRepository(mockClock);

    const list = await repo.list();
    expect(list.some((q) => q.id === 'legacy-q')).toBe(true);
    expect(store.has('persisted_questions_v2')).toBe(true);
    expect(store.has('persisted_questions_v1')).toBe(false);
  });
});
