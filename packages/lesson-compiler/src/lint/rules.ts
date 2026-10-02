import { isActive } from '@learn-code/lesson-schema';
import type { Step, StepKind } from '@learn-code/lesson-schema';
import type { LintIssue, LintRule } from './types';

export const RULE_IDS = {
  adjacentPassive: 'no-adjacent-passive',
  activeRatio: 'min-active-ratio',
  predictFirst: 'predict-before-explain',
  passiveWords: 'passive-word-limit',
  wrongOptions: 'wrong-option-feedback',
  representations: 'concept-representations',
  reviewCards: 'review-cards',
  annotationLines: 'annotation-lines',
} as const;

export const MIN_ACTIVE_PERCENT = 60;
export const MAX_PASSIVE_WORDS = 80;
export const MIN_REPRESENTATIONS = 2;

const err = (rule: string, message: string, stepId?: string): LintIssue =>
  stepId === undefined
    ? { rule, message, severity: 'error' }
    : { rule, stepId, message, severity: 'error' };

/** Rule 1: no two passive steps in a row. */
export const noAdjacentPassive: LintRule = (lesson) => {
  const issues: LintIssue[] = [];
  lesson.steps.forEach((s, i) => {
    const prev = lesson.steps[i - 1];
    if (prev !== undefined && !isActive(prev) && !isActive(s)) {
      issues.push(
        err(
          RULE_IDS.adjacentPassive,
          `passive step "${s.id}" (${s.kind}) follows passive step "${prev.id}" (${prev.kind})`,
          s.id,
        ),
      );
    }
  });
  return issues;
};

/** Rule 2: at least 60% of steps are active. */
export const minActiveRatio: LintRule = (lesson) => {
  const total = lesson.steps.length;
  const active = lesson.steps.filter(isActive).length;
  if (active * 100 >= MIN_ACTIVE_PERCENT * total) return [];
  return [
    err(
      RULE_IDS.activeRatio,
      `only ${active} of ${total} steps are active; at least ${MIN_ACTIVE_PERCENT}% are required`,
    ),
  ];
};

/** Rule 3: the first predict comes before the first explain. */
export const predictBeforeExplain: LintRule = (lesson) => {
  const firstExplain = lesson.steps.findIndex((s) => s.kind === 'explain');
  if (firstExplain === -1) return [];
  const firstPredict = lesson.steps.findIndex((s) => s.kind === 'predict');
  if (firstPredict !== -1 && firstPredict < firstExplain) return [];
  const explain = lesson.steps[firstExplain];
  return [
    err(
      RULE_IDS.predictFirst,
      firstPredict === -1
        ? 'the lesson has an explain step but no predict step'
        : 'the first predict step comes after the first explain step',
      explain?.id,
    ),
  ];
};

const stripCode = (text: string): string => text.replace(/```[\s\S]*?```/g, ' ');
export const countWords = (text: string): number =>
  stripCode(text).split(/\s+/).filter(Boolean).length;

/** The prose a passive step shows (code is not prose). */
export function proseOf(s: Step): string {
  switch (s.kind) {
    case 'hook':
    case 'explain':
    case 'pitfall':
      return s.body;
    case 'reveal':
      return `${s.body} ${s.caption ?? ''}`;
    case 'recap':
      return s.points.join(' ');
    case 'cliffhanger':
      return s.question;
    default:
      return '';
  }
}

/** Rule 4: a passive step has at most 80 words of prose. */
export const passiveWordLimit: LintRule = (lesson) =>
  lesson.steps.flatMap((s) => {
    if (isActive(s)) return [];
    const words = countWords(proseOf(s));
    return words > MAX_PASSIVE_WORDS
      ? [
          err(
            RULE_IDS.passiveWords,
            `passive step has ${words} words of prose; the limit is ${MAX_PASSIVE_WORDS}`,
            s.id,
          ),
        ]
      : [];
  });

interface OptionLike {
  readonly isCorrect: boolean;
  readonly feedback: string;
  readonly misconception?: string | undefined;
}

function optionGroups(s: Step): readonly (readonly OptionLike[])[] {
  switch (s.kind) {
    case 'predict':
    case 'firesideChat':
      return [s.options];
    case 'recall':
      return s.questions.map((q) => q.options);
    default:
      return [];
  }
}

/** Rule 5: every wrong option has feedback and a known misconception id. */
export const wrongOptionFeedback: LintRule = (lesson, registries) => {
  const known = new Set(registries.misconceptions.map((m) => m.id));
  const issues: LintIssue[] = [];
  for (const s of lesson.steps) {
    for (const group of optionGroups(s)) {
      group.forEach((o, i) => {
        if (o.isCorrect) return;
        const where = `option ${i + 1}`;
        if (o.feedback.trim() === '') {
          issues.push(err(RULE_IDS.wrongOptions, `wrong ${where} has no feedback`, s.id));
        }
        if (o.misconception === undefined || o.misconception === '') {
          issues.push(err(RULE_IDS.wrongOptions, `wrong ${where} has no misconception id`, s.id));
        } else if (!known.has(o.misconception)) {
          issues.push(
            err(
              RULE_IDS.wrongOptions,
              `wrong ${where} uses unknown misconception "${o.misconception}"`,
              s.id,
            ),
          );
        }
      });
    }
  }
  return issues;
};

type Representation = 'story' | 'text' | 'visual' | 'exercise';

const REPRESENTATION: Readonly<Record<StepKind, Representation>> = {
  hook: 'story',
  recap: 'story',
  cliffhanger: 'story',
  firesideChat: 'story',
  explain: 'text',
  pitfall: 'text',
  reveal: 'visual',
  beTheRuntime: 'visual',
  beTheDatabase: 'visual',
  schemaBuilder: 'visual',
  relationLab: 'visual',
  recall: 'exercise',
  predict: 'exercise',
  parsons: 'exercise',
  fillBlanks: 'exercise',
  brainPower: 'exercise',
  matching: 'exercise',
  sqlLab: 'exercise',
  normalizeLab: 'exercise',
  namingReview: 'exercise',
  migrationLab: 'exercise',
};

/** Rule 6: every concept appears in at least two representations. */
export const conceptRepresentations: LintRule = (lesson) =>
  lesson.concepts.flatMap((concept) => {
    const seen = new Set<Representation>();
    for (const s of lesson.steps) {
      if (s.concepts.includes(concept)) seen.add(REPRESENTATION[s.kind]);
    }
    return seen.size >= MIN_REPRESENTATIONS
      ? []
      : [
          err(
            RULE_IDS.representations,
            `concept "${concept}" appears in ${seen.size} representation(s); at least ${MIN_REPRESENTATIONS} are required`,
          ),
        ];
  });

/** Rule 7: every non-obvious concept has a review card; syntax never does. Cards come from recap steps. */
export const reviewCards: LintRule = (lesson, registries) => {
  const syntax = new Set(registries.syntaxConcepts ?? []);
  const carded = new Set(lesson.steps.filter((s) => s.kind === 'recap').flatMap((s) => s.concepts));
  const issues: LintIssue[] = [];
  for (const concept of lesson.concepts) {
    if (syntax.has(concept)) {
      if (carded.has(concept)) {
        issues.push({
          rule: RULE_IDS.reviewCards,
          message: `syntax concept "${concept}" must not become a review card`,
          severity: 'warning',
        });
      }
    } else if (!carded.has(concept)) {
      issues.push(err(RULE_IDS.reviewCards, `concept "${concept}" has no review card`));
    }
  }
  return issues;
};

/** Extra (epic pitfall): explain annotations must point at existing code lines. */
export const annotationLines: LintRule = (lesson) =>
  lesson.steps.flatMap((s) => {
    if (s.kind !== 'explain') return [];
    const lineCount = s.code === undefined ? 0 : s.code.split('\n').length;
    return s.annotations
      .filter((a) => a.line > lineCount)
      .map((a) =>
        err(
          RULE_IDS.annotationLines,
          `annotation points at line ${a.line} but the code has ${lineCount} line(s)`,
          s.id,
        ),
      );
  });
