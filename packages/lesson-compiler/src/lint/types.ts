import type { ConceptEntry, Lesson, MisconceptionEntry } from '@learn-code/lesson-schema';

export interface LintIssue {
  readonly rule: string;
  readonly stepId?: string;
  /** Index of the step in the lesson; locates the right step when ids repeat. */
  readonly stepIndex?: number;
  readonly message: string;
  readonly severity: 'error' | 'warning';
}

/** Registry data the linter needs. */
export interface Registries {
  readonly concepts: readonly ConceptEntry[];
  readonly misconceptions: readonly MisconceptionEntry[];
  /** Concept ids that only describe syntax. They never get review cards. */
  readonly syntaxConcepts?: readonly string[] | undefined;
}

export type LintRule = (lesson: Lesson, registries: Registries) => readonly LintIssue[];
