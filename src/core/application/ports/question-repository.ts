import type { Question } from '@/core/entities';

export interface QuestionRepository {
  list(): Promise<Question[]>;
  get(id: string): Promise<Question | null>;
  save(question: Question): Promise<void>;
  delete(id: string): Promise<void>;
}
