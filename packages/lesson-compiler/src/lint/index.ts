import type { Lesson } from '@learn-code/lesson-schema';
import {
  annotationLines,
  conceptRepresentations,
  fillBlanksMarkers,
  fillBlanksSolvable,
  implementedKinds,
  knownBlankMisconceptions,
  knownConcepts,
  markdownSubset,
  stepCount,
  uniqueStepIds,
  minActiveRatio,
  noAdjacentPassive,
  passiveWordLimit,
  predictBeforeExplain,
  reviewCards,
  wrongOptionFeedback,
} from './rules';
import { DESIGN_RULES } from './design';
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
  uniqueStepIds,
  fillBlanksMarkers,
  fillBlanksSolvable,
  knownConcepts,
  knownBlankMisconceptions,
  implementedKinds,
  stepCount,
  markdownSubset,
  ...DESIGN_RULES,
];

export interface LintOptions {
  /** Skip the unbuilt-kind rule. Only for compiler fixtures. */
  readonly allowUnbuilt?: boolean;
}

export function lintLesson(
  lesson: Lesson,
  registries: Registries,
  options: LintOptions = {},
): readonly LintIssue[] {
  return LINT_RULES.filter(
    (rule) => !(options.allowUnbuilt === true && rule === implementedKinds),
  ).flatMap((rule) => rule(lesson, registries));
}

export * from './design';
export * from './rules';
export type { LintIssue, LintRule, Registries } from './types';
