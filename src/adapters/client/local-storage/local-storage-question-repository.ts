import type { Clock, QuestionRepository } from '@/core/application/ports';
import type { Question } from '@/core/entities';

const V2_KEY = 'persisted_questions_v2';
const V1_KEY = 'persisted_questions_v1';

function parse(raw: string | null): Question[] {
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Question[];
  } catch {
    return [];
  }
}

function loadAll(): Question[] {
  return parse(localStorage.getItem(V2_KEY));
}

function persist(items: Question[]): void {
  try {
    localStorage.setItem(V2_KEY, JSON.stringify(items));
  } catch {
    // ignore write errors (private browsing, storage full, etc.)
  }
}

function migrateV1toV2(): void {
  if (localStorage.getItem(V2_KEY) !== null) return;
  const v1Raw = localStorage.getItem(V1_KEY);
  if (!v1Raw) return;
  const records = parse(v1Raw);
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
