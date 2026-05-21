import type { Question as QuestionConfig } from '@/core/entities';
import { generateUniqueSlug, nameToSlug } from '@/shared/utils/slug';

import { migrateQuestions } from '../../datasource/model/datasource-migration';
import { createEmptyQuestionConfig } from '../model/question-config';
import { parseQuestionYaml } from '../model/question-yaml';
import salesByRegionYaml from './questions/sales-by-region.yaml?raw';
import topProductsYaml from './questions/top-products.yaml?raw';

// ── Storage ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'persisted_questions_v2';

function loadPersistedQuestions(): QuestionConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as QuestionConfig[];
    const migrated = migrateQuestions(parsed);
    // Persist migrated state back if any questions were promoted
    const changed = migrated.some((q, i) => q !== parsed[i]);
    if (changed) {
      const userOnly = migrated.filter((q) => q.source === 'user');
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(userOnly));
      } catch {
        // localStorage may be unavailable in some environments; proceed without persisting
      }
    }
    return migrated;
  } catch {
    return [];
  }
}

function persistQuestions(questions: QuestionConfig[]): void {
  const userQuestions = questions.filter((q) => q.source === 'user');
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userQuestions));
  } catch {
    // localStorage may be unavailable or at quota; proceed without persisting
  }
}

// ── Seed questions (YAML-sourced) ─────────────────────────────────────────────

const _seedQuestions: QuestionConfig[] = [];

export function registerSeedQuestion(q: QuestionConfig): void {
  if (!_seedQuestions.find((s) => s.slug === q.slug)) {
    _seedQuestions.push({ ...q, source: 'yaml' });
  }
}

(function loadSeeds() {
  for (const raw of [salesByRegionYaml, topProductsYaml]) {
    try {
      const q = parseQuestionYaml(raw);
      registerSeedQuestion(q);
    } catch (err) {
      console.error('[question-registry] Failed to load seed question:', err);
    }
  }
})();

// ── Registry (reads from storage on every call — no stale in-memory cache) ───

export function questionList(): QuestionConfig[] {
  return [..._seedQuestions, ...loadPersistedQuestions()];
}

export function getQuestionBySlug(slug: string): QuestionConfig | undefined {
  return questionList().find((q) => q.slug === slug);
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function addQuestion(partial: Partial<QuestionConfig>): QuestionConfig {
  const base = partial.title ?? 'Untitled Question';
  const slug =
    partial.slug ?? generateUniqueSlug(nameToSlug(base, 'question'), (s) => !!getQuestionBySlug(s));

  if (getQuestionBySlug(slug)) {
    throw new Error(`Question slug already exists: "${slug}"`);
  }

  const question: QuestionConfig = {
    ...createEmptyQuestionConfig(),
    ...partial,
    slug,
    source: 'user',
  };

  persistQuestions([...loadPersistedQuestions(), question]);
  return question;
}

export function updateQuestion(slug: string, changes: Partial<QuestionConfig>): QuestionConfig {
  const current = loadPersistedQuestions();
  const existing = current.find((q) => q.slug === slug);
  if (!existing)
    throw new Error(`Cannot update question: slug "${slug}" not found or is read-only`);

  const updated: QuestionConfig = {
    ...existing,
    ...changes,
    slug,
    source: 'user',
    updatedAt: new Date().toISOString(),
  };

  persistQuestions(current.map((q) => (q.slug === slug ? updated : q)));
  return updated;
}

export function deleteQuestion(slug: string): void {
  const question = getQuestionBySlug(slug);
  if (!question) return;
  if (question.source === 'yaml') {
    throw new Error(`Cannot delete YAML-seeded question: "${slug}"`);
  }
  persistQuestions(loadPersistedQuestions().filter((q) => q.slug !== slug));
}
