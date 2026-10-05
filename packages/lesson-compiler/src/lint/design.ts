import { findHighlights } from '@learn-code/lesson-schema';
import type { MarginItem, Step } from '@learn-code/lesson-schema';
import { countWords } from './rules';
import type { LintIssue, LintRule } from './types';

/** Lesson design lint, E08 section 8 (DL1 to DL8). Every rule is a pure function of the lesson. */
export const DESIGN_RULE_IDS = {
  marginCount: 'dl1-margin-count',
  characterCount: 'dl2-character-count',
  bugPlacement: 'dl3-bug-placement',
  runtimePlacement: 'dl4-runtime-placement',
  wordLimits: 'dl5-word-limits',
  annotationCount: 'dl6-annotation-count',
  highlightLimits: 'dl7-highlight-limits',
  gotchaStopCount: 'dl8-gotcha-stop-count',
} as const;

export const MAX_MARGIN_ITEMS = 3;
export const MAX_CHARACTERS = 1;
export const BUG_KINDS: readonly string[] = ['hook', 'pitfall', 'recap', 'cliffhanger'];
export const RUNTIME_KINDS: readonly string[] = ['beTheRuntime', 'beTheDatabase'];
export const WORD_LIMITS = { sticky: 20, bubble: 20, gotcha: 30, stopAndThink: 25, annotation: 8 };
export const MAX_ANNOTATIONS = 3;
export const MAX_TITLE_HIGHLIGHTS = 1;
export const MAX_STEP_HIGHLIGHTS = 2;
export const MAX_HIGHLIGHT_WORDS = 6;

const issue = (rule: string, message: string, i: number, s: Step): LintIssue => ({
  rule,
  stepId: s.id,
  stepIndex: i,
  message,
  severity: 'error',
});

const marginOf = (s: Step): readonly MarginItem[] => s.margin ?? [];

/** Run `check` on every step and collect the messages as issues of `rule`. */
const perStep =
  (rule: string, check: (s: Step) => readonly string[]): LintRule =>
  (lesson) =>
    lesson.steps.flatMap((s, i) => check(s).map((m) => issue(rule, m, i, s)));

/** Who speaks in this step: the hook's character plus every sticky and bubble. */
const speakers = (s: Step): readonly ('bug' | 'olha' | 'runtime')[] => [
  ...(s.kind === 'hook' && s.character !== undefined
    ? [s.character === 'mrRuntime' ? ('runtime' as const) : s.character]
    : []),
  ...marginOf(s).flatMap((m) =>
    m.type === 'sticky' ? ['olha' as const] : m.type === 'bubble' ? [m.who] : [],
  ),
];

/** DL1: at most 3 margin items per step. */
export const marginCount: LintRule = perStep(DESIGN_RULE_IDS.marginCount, (s) =>
  marginOf(s).length > MAX_MARGIN_ITEMS
    ? [`${marginOf(s).length} margin items; the limit is ${MAX_MARGIN_ITEMS}`]
    : [],
);

/** DL2: at most 1 character per step. */
export const characterCount: LintRule = perStep(DESIGN_RULE_IDS.characterCount, (s) =>
  speakers(s).length > MAX_CHARACTERS
    ? [`${speakers(s).length} characters speak; the limit is ${MAX_CHARACTERS}`]
    : [],
);

/** DL3: The Bug only in hook, pitfall, recap and cliffhanger steps. */
export const bugPlacement: LintRule = perStep(DESIGN_RULE_IDS.bugPlacement, (s) =>
  speakers(s).includes('bug') && !BUG_KINDS.includes(s.kind)
    ? [`The Bug cannot appear in a ${s.kind} step`]
    : [],
);

/** DL4: Mr. Runtime only in beTheRuntime and beTheDatabase steps. */
export const runtimePlacement: LintRule = perStep(DESIGN_RULE_IDS.runtimePlacement, (s) =>
  speakers(s).includes('runtime') && !RUNTIME_KINDS.includes(s.kind)
    ? [`Mr. Runtime cannot appear in a ${s.kind} step`]
    : [],
);

/** DL5: word limits of margin items and annotations. */
export const wordLimits: LintRule = perStep(DESIGN_RULE_IDS.wordLimits, (s) => {
  const out: string[] = [];
  for (const m of marginOf(s)) {
    if (m.type === 'diagram') continue;
    const words = countWords(m.text);
    const limit = WORD_LIMITS[m.type];
    if (words > limit) out.push(`${m.type} has ${words} words; the limit is ${limit}`);
  }
  if (s.kind === 'explain') {
    for (const a of s.annotations) {
      const words = countWords(a.text);
      if (words > WORD_LIMITS.annotation)
        out.push(
          `annotation on line ${a.line} has ${words} words; the limit is ${WORD_LIMITS.annotation}`,
        );
    }
  }
  return out;
});

/** DL6: at most 3 annotations per code block. */
export const annotationCount: LintRule = perStep(DESIGN_RULE_IDS.annotationCount, (s) =>
  s.kind === 'explain' && s.annotations.length > MAX_ANNOTATIONS
    ? [`${s.annotations.length} annotations; the limit is ${MAX_ANNOTATIONS}`]
    : [],
);

/** Fields that hold code or data, where `==` is not a highlight. */
const CODE_KEYS: ReadonlySet<string> = new Set([
  'code',
  'template',
  'starter',
  'solution',
  'badCode',
  'goodCode',
  'query',
  'ddl',
  'before',
  'after',
  'output',
  'accepted',
  'traceRef',
  'seedRef',
]);

function proseStrings(value: unknown, key = ''): readonly string[] {
  if (CODE_KEYS.has(key)) return [];
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap((v: unknown) => proseStrings(v, key));
  if (value !== null && typeof value === 'object')
    return Object.entries(value).flatMap(([k, v]) => proseStrings(v, k));
  return [];
}

const tooLong = (phrases: readonly string[], where: string): string[] =>
  phrases
    .filter((p) => countWords(p) > MAX_HIGHLIGHT_WORDS)
    .map(
      (p) =>
        `${where} highlight "${p}" has ${countWords(p)} words; the limit is ${MAX_HIGHLIGHT_WORDS}`,
    );

/** DL7: at most 1 highlight in the title, at most 2 per step, at most 6 words each. */
export const highlightLimits: LintRule = (lesson) => {
  const issues: LintIssue[] = [];
  const title = [...(lesson.titleHighlights ?? []), ...findHighlights(lesson.title)];
  const titleProblems = [
    ...(title.length > MAX_TITLE_HIGHLIGHTS
      ? [`the title has ${title.length} highlights; the limit is ${MAX_TITLE_HIGHLIGHTS}`]
      : []),
    ...tooLong(title, 'title'),
  ];
  for (const message of titleProblems)
    issues.push({ rule: DESIGN_RULE_IDS.highlightLimits, message, severity: 'error' });
  const steps = perStep(DESIGN_RULE_IDS.highlightLimits, (s) => {
    const found = proseStrings(s).flatMap(findHighlights);
    return [
      ...(found.length > MAX_STEP_HIGHLIGHTS
        ? [`${found.length} highlights; the limit is ${MAX_STEP_HIGHLIGHTS}`]
        : []),
      ...tooLong(found, 'step'),
    ];
  });
  return [...issues, ...steps(lesson, { concepts: [], misconceptions: [] })];
};

/** DL8: at most 1 gotcha and 1 stop-and-think per step. */
export const gotchaStopCount: LintRule = perStep(DESIGN_RULE_IDS.gotchaStopCount, (s) => {
  const count = (t: MarginItem['type']): number => marginOf(s).filter((m) => m.type === t).length;
  return [
    ...(count('gotcha') > 1 ? [`${count('gotcha')} gotchas; the limit is 1`] : []),
    ...(count('stopAndThink') > 1
      ? [`${count('stopAndThink')} stop-and-think items; the limit is 1`]
      : []),
  ];
});

export const DESIGN_RULES: readonly LintRule[] = [
  marginCount,
  characterCount,
  bugPlacement,
  runtimePlacement,
  wordLimits,
  annotationCount,
  highlightLimits,
  gotchaStopCount,
];
