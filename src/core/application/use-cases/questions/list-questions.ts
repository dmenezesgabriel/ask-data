import type { QuestionRepository } from '@/core/application/ports';
import type { Question } from '@/core/entities';

export class ListQuestions {
  constructor(private readonly questions: QuestionRepository) {}

  async execute(): Promise<Question[]> {
    return this.questions.list();
  }
}
