import type { ReadOnlyRepository } from '@/core/application/ports';
import type { Question } from '@/core/entities';

export class HttpQuestionRepository implements ReadOnlyRepository<Question> {
  constructor(private readonly baseUrl: string = '/api/questions') {}

  async list(): Promise<Question[]> {
    const res = await fetch(this.baseUrl);
    if (!res.ok) throw new Error(`Failed to list questions: ${res.status}`);
    return res.json() as Promise<Question[]>;
  }

  async get(id: string): Promise<Question | null> {
    const res = await fetch(`${this.baseUrl}/${id}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Failed to get question: ${res.status}`);
    return res.json() as Promise<Question>;
  }
}
