import type { QuestionRepository } from '@/core/application/ports';
import type { Question } from '@/core/entities';

const STORAGE_KEY = 'persisted_questions_v1';

function loadAll(): Question[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Question[]) : [];
  } catch {
    return [];
  }
}

function persist(items: Question[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore write errors (private browsing, storage full, etc.)
  }
}

export class LocalStorageQuestionRepository implements QuestionRepository {
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
      items[idx] = { ...question, updatedAt: new Date().toISOString() };
    } else {
      items.push(question);
    }
    persist(items);
  }

  async delete(id: string): Promise<void> {
    persist(loadAll().filter((q) => q.id !== id));
  }
}
