import type { QuestionRepository } from '@/core/application/ports';
import type { Question } from '@/core/entities';

import { NotImplementedError } from './http-error';

export class HttpQuestionRepository implements QuestionRepository {
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

  async save(_question: Question): Promise<void> {
    throw new NotImplementedError(`${this.baseUrl} save`);
  }

  async delete(id: string): Promise<void> {
    throw new NotImplementedError(`${this.baseUrl}/${id} delete`);
  }
}
