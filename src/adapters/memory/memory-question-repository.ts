import type { QuestionRepository } from '@/core/application/ports';
import type { Question } from '@/core/entities';

export class MemoryQuestionRepository implements QuestionRepository {
  private readonly store = new Map<string, Question>();

  async list(): Promise<Question[]> {
    return Array.from(this.store.values());
  }

  async get(id: string): Promise<Question | null> {
    return this.store.get(id) ?? null;
  }

  async save(question: Question): Promise<void> {
    this.store.set(question.id, question);
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }
}
