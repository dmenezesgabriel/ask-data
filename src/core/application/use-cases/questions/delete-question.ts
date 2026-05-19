import type { QuestionRepository } from '@/core/application/ports';

export class DeleteQuestion {
  constructor(private readonly questions: QuestionRepository) {}

  async execute(id: string): Promise<void> {
    await this.questions.delete(id);
  }
}
