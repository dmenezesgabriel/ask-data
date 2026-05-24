import type { Clock, QuestionRepository } from '@/core/application/ports';
import type { Question } from '@/core/entities';

import { recordCatalogMutation } from '../catalog-mutation-logger';

export type UpdateQuestionInput = Partial<Omit<Question, 'id' | 'createdAt' | 'updatedAt'>>;

export class UpdateQuestion {
  constructor(
    private readonly questions: QuestionRepository,
    private readonly clock: Clock,
  ) {}

  async execute(id: string, patch: UpdateQuestionInput): Promise<Question> {
    const existing = await this.questions.get(id);
    if (!existing) {
      throw new Error(`Question not found: ${id}`);
    }
    const updated: Question = { ...existing, ...patch, id, updatedAt: this.clock.now() };
    return recordCatalogMutation('question', 'update', async () => {
      await this.questions.save(updated);
      return updated;
    });
  }
}
