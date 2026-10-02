import type { Step } from './steps';

type StepOfKind<K extends Step['kind']> = Extract<Step, { kind: K }>;

/** Turns a kebab-case misconception id into words: `inner-join-keeps-all` -> `inner join keeps all`. */
export function humanizeMisconception(id: string): string {
  return id.replace(/[-_]+/g, ' ').trim();
}

export function checkPredict(
  step: StepOfKind<'predict'>,
  optionIndex: number,
): { readonly correct: boolean; readonly feedback: string; readonly misconception?: string } {
  const option = step.options[optionIndex];
  if (option === undefined) return { correct: false, feedback: '' };
  return option.misconception === undefined || option.isCorrect
    ? { correct: option.isCorrect, feedback: option.feedback }
    : { correct: false, feedback: option.feedback, misconception: option.misconception };
}

export function correctPredictIndex(step: StepOfKind<'predict'>): number {
  return step.options.findIndex((o) => o.isCorrect);
}

export type TemplatePart =
  | { readonly kind: 'text'; readonly text: string }
  | { readonly kind: 'blank'; readonly id: string };

/** Splits a template with `___id___` markers into text and blank parts. */
export function parseTemplate(template: string): readonly TemplatePart[] {
  const parts: TemplatePart[] = [];
  const re = /___([A-Za-z0-9_-]+?)___/g;
  let last = 0;
  for (const m of template.matchAll(re)) {
    const at = m.index;
    if (at > last) parts.push({ kind: 'text', text: template.slice(last, at) });
    parts.push({ kind: 'blank', id: m[1] ?? '' });
    last = at + m[0].length;
  }
  if (last < template.length) parts.push({ kind: 'text', text: template.slice(last) });
  return parts;
}

/**
 * Comparison form of an answer: runs of whitespace collapse to one space, and whitespace next to
 * punctuation disappears, so `a = b` equals `a=b` but `GROUP BY` does not equal `GROUPBY`.
 */
export function normalizeAnswer(value: string, caseInsensitive: boolean): string {
  const squashed = value
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\s*([^\w\s])\s*/g, '$1');
  return caseInsensitive ? squashed.toLowerCase() : squashed;
}

export interface BlankResult {
  readonly id: string;
  readonly correct: boolean;
  readonly feedback: string;
  readonly misconception?: string;
}

export interface FillBlanksCheck {
  readonly correct: boolean;
  readonly blanks: readonly BlankResult[];
}

/** SQL is case-insensitive for keywords; the other languages are compared exactly. */
export function checkFillBlanks(
  step: StepOfKind<'fillBlanks'>,
  answers: Readonly<Record<string, string>>,
): FillBlanksCheck {
  const ci = step.language === 'sql';
  const blanks = step.blanks.map((b): BlankResult => {
    const given = normalizeAnswer(answers[b.id] ?? '', ci);
    const ok = given !== '' && b.accepted.some((a) => normalizeAnswer(a, ci) === given);
    return ok
      ? { id: b.id, correct: true, feedback: '' }
      : b.misconception === undefined
        ? { id: b.id, correct: false, feedback: b.feedback }
        : { id: b.id, correct: false, feedback: b.feedback, misconception: b.misconception };
  });
  return { correct: blanks.every((b) => b.correct), blanks };
}
