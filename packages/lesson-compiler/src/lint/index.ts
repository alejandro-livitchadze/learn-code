import type { Lesson } from '@learn-code/lesson-schema';
import {
  annotationLines,
  conceptRepresentations,
  minActiveRatio,
  noAdjacentPassive,
  passiveWordLimit,
  predictBeforeExplain,
  reviewCards,
  wrongOptionFeedback,
} from './rules';
import type { LintIssue, LintRule, Registries } from './types';

export const LINT_RULES: readonly LintRule[] = [
  noAdjacentPassive,
  minActiveRatio,
  predictBeforeExplain,
  passiveWordLimit,
  wrongOptionFeedback,
  conceptRepresentations,
  reviewCards,
  annotationLines,
];

export function lintLesson(lesson: Lesson, registries: Registries): readonly LintIssue[] {
  return LINT_RULES.flatMap((rule) => rule(lesson, registries));
}

export * from './rules';
export type { LintIssue, LintRule, Registries } from './types';
