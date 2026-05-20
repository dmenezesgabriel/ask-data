import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Question } from '@/core/entities';

import { HttpQuestionRepository } from './http-question-repository';

const now = new Date().toISOString();

function makeQuestion(id = 'q-1'): Question {
  return {
    id,
    slug: `slug-${id}`,
    title: 'Test Question',
    type: 'table',
    source: 'user',
    createdAt: now,
    updatedAt: now,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('HttpQuestionRepository — write interface', () => {
  it('UT-001: does not expose a save or delete method', () => {
    const repo = new HttpQuestionRepository();
    expect('save' in repo).toBe(false);
    expect('delete' in repo).toBe(false);
  });
});

describe('HttpQuestionRepository — read path', () => {
  it('REG-001: list() returns questions from the server', async () => {
    const question = makeQuestion();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([question]),
      }),
    );

    const repo = new HttpQuestionRepository();
    const result = await repo.list();

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe(question.id);
  });

  it('get(id) returns null when server responds 404', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));

    const repo = new HttpQuestionRepository();
    const result = await repo.get('missing-id');

    expect(result).toBeNull();
  });
});
