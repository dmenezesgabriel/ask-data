import type { ReadOnlyRepository } from '@/core/application/ports';
import type { Question } from '@/core/entities';

export class ListQuestions {
  constructor(private readonly questions: ReadOnlyRepository<Question>) {}

  async execute(): Promise<Question[]> {
    return this.questions.list();
  }
}
