import type { ReadOnlyRepository } from '@/core/application/ports';
import type { Question } from '@/core/entities';

export class GetQuestion {
  constructor(private readonly questions: ReadOnlyRepository<Question>) {}

  async execute(id: string): Promise<Question | null> {
    return this.questions.get(id);
  }
}
