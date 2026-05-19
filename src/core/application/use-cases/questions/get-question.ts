import type { QuestionRepository } from '@/core/application/ports';
import type { Question } from '@/core/entities';

export class GetQuestion {
  constructor(private readonly questions: QuestionRepository) {}

  async execute(id: string): Promise<Question | null> {
    return this.questions.get(id);
  }
}
