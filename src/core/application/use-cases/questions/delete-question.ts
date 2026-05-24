import type { QuestionRepository } from '@/core/application/ports';

import { recordCatalogMutation } from '../catalog-mutation-logger';

export class DeleteQuestion {
  constructor(private readonly questions: QuestionRepository) {}

  async execute(id: string): Promise<void> {
    await recordCatalogMutation('question', 'delete', () => this.questions.delete(id));
  }
}
