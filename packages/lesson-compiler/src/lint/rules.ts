import {
  IMPLEMENTED_KINDS,
  checkFillBlanks,
  isActive,
  parseTemplate,
} from '@learn-code/lesson-schema';
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
  uniqueIds: 'unique-step-ids',
  blankMarkers: 'fill-blanks-markers',
  blankSolvable: 'fill-blanks-solvable',
  unknownConcept: 'unknown-concept',
  unknownMisconception: 'unknown-misconception',
  unbuiltKind: 'unbuilt-kind',
  stepCount: 'step-count',
  markdownSubset: 'markdown-subset',
} as const;

export const MIN_ACTIVE_PERCENT = 60;
export const MAX_PASSIVE_WORDS = 80;
export const MIN_REPRESENTATIONS = 2;
export const MIN_STEPS = 12;
export const MAX_STEPS = 20;

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

const at = (rule: string, message: string, stepIndex: number, stepId: string): LintIssue => ({
  rule,
  stepId,
  stepIndex,
  message,
  severity: 'error',
});

/** Rule 9: step ids are unique. Results are keyed by id, so a twin would complete with its sibling. */
export const uniqueStepIds: LintRule = (lesson) => {
  const first = new Map<string, number>();
  const issues: LintIssue[] = [];
  lesson.steps.forEach((s, i) => {
    const earlier = first.get(s.id);
    if (earlier === undefined) first.set(s.id, i);
    else {
      issues.push(
        at(
          RULE_IDS.uniqueIds,
          `duplicate step id "${s.id}" (first used by step ${earlier + 1})`,
          i,
          s.id,
        ),
      );
    }
  });
  return issues;
};

/** Rule 10: the `___id___` markers of a fillBlanks template and its `blank` ids are the same set. */
export const fillBlanksMarkers: LintRule = (lesson) => {
  const issues: LintIssue[] = [];
  lesson.steps.forEach((s, i) => {
    if (s.kind !== 'fillBlanks') return;
    const markers = parseTemplate(s.template).flatMap((p) => (p.kind === 'blank' ? [p.id] : []));
    const ids = s.blanks.map((b) => b.id);
    const problems = [
      ...markers
        .filter((m, j) => markers.indexOf(m) !== j)
        .map((m) => `marker ___${m}___ appears more than once`),
      ...ids.filter((b, j) => ids.indexOf(b) !== j).map((b) => `blank "${b}" is defined twice`),
      ...[...new Set(markers)]
        .filter((m) => !ids.includes(m))
        .map((m) => `marker ___${m}___ has no blank`),
      ...ids.filter((b) => !markers.includes(b)).map((b) => `blank "${b}" has no marker`),
    ];
    for (const p of problems) issues.push(at(RULE_IDS.blankMarkers, p, i, s.id));
  });
  return issues;
};

/** Rule 11: the first accepted answer of every blank passes `checkFillBlanks`. */
export const fillBlanksSolvable: LintRule = (lesson) => {
  const issues: LintIssue[] = [];
  lesson.steps.forEach((s, i) => {
    if (s.kind !== 'fillBlanks') return;
    const answers = Object.fromEntries(s.blanks.map((b) => [b.id, b.accepted[0] ?? '']));
    const result = checkFillBlanks(s, answers);
    if (!result.correct) {
      const wrong = result.blanks.filter((b) => !b.correct).map((b) => `"${b.id}"`);
      issues.push(
        at(
          RULE_IDS.blankSolvable,
          `the first accepted answers do not pass checkFillBlanks (blank ${wrong.join(', ')})`,
          i,
          s.id,
        ),
      );
    }
  });
  return issues;
};

/** Rule 12: concept ids of the lesson and of every step exist in `concepts.json`. */
export const knownConcepts: LintRule = (lesson, registries) => {
  const known = new Set(registries.concepts.map((c) => c.id));
  const issues: LintIssue[] = [];
  for (const c of lesson.concepts) {
    if (!known.has(c)) {
      issues.push(err(RULE_IDS.unknownConcept, `lesson concept "${c}" is not in concepts.json`));
    }
  }
  lesson.steps.forEach((s, i) => {
    for (const c of s.concepts) {
      if (!known.has(c)) {
        issues.push(
          at(RULE_IDS.unknownConcept, `step concept "${c}" is not in concepts.json`, i, s.id),
        );
      }
    }
  });
  return issues;
};

/** Rule 13: misconception ids on fillBlanks blanks exist in `misconceptions.json`. */
export const knownBlankMisconceptions: LintRule = (lesson, registries) => {
  const known = new Set(registries.misconceptions.map((m) => m.id));
  const issues: LintIssue[] = [];
  lesson.steps.forEach((s, i) => {
    if (s.kind !== 'fillBlanks') return;
    for (const b of s.blanks) {
      if (b.misconception !== undefined && !known.has(b.misconception)) {
        issues.push(
          at(
            RULE_IDS.unknownMisconception,
            `blank "${b.id}" uses unknown misconception "${b.misconception}"`,
            i,
            s.id,
          ),
        );
      }
    }
  });
  return issues;
};

/** Rule 14: every step kind has a real widget (`IMPLEMENTED_KINDS`). */
export const implementedKinds: LintRule = (lesson) => {
  const built: readonly StepKind[] = IMPLEMENTED_KINDS;
  const issues: LintIssue[] = [];
  lesson.steps.forEach((s, i) => {
    if (!built.includes(s.kind)) {
      issues.push(
        at(
          RULE_IDS.unbuiltKind,
          `step kind "${s.kind}" has no widget yet; it cannot be played`,
          i,
          s.id,
        ),
      );
    }
  });
  return issues;
};

/** Rule 15: a lesson has 12 to 20 steps. */
export const stepCount: LintRule = (lesson) =>
  lesson.steps.length < MIN_STEPS || lesson.steps.length > MAX_STEPS
    ? [
        err(
          RULE_IDS.stepCount,
          `lesson has ${lesson.steps.length} steps; it needs ${MIN_STEPS} to ${MAX_STEPS}`,
        ),
      ]
    : [];

/** Every Markdown field a learner sees, with a label for messages. */
function markdownFields(s: Step): readonly { readonly field: string; readonly text: string }[] {
  switch (s.kind) {
    case 'hook':
    case 'explain':
    case 'pitfall':
      return [{ field: 'body', text: s.body }];
    case 'reveal':
      return [{ field: 'body', text: s.body }];
    case 'recap':
      return s.points.map((text, i) => ({ field: `point ${i + 1}`, text }));
    case 'cliffhanger':
      return [{ field: 'question', text: s.question }];
    case 'sqlLab':
      return [
        { field: 'prompt', text: s.prompt },
        ...s.hints.map((text, i) => ({ field: `hint ${i + 1}`, text })),
      ];
    default:
      return [];
  }
}

const BLOCK_CONSTRUCTS: readonly (readonly [RegExp, string])[] = [
  [/^\s{0,3}#{1,6}(\s|$)/, 'heading'],
  [/^\s{0,3}>/, 'blockquote'],
  [/^\s*\d+[.)]\s/, 'numbered list'],
  [/^\s*[*+]\s/, 'list with * or +'],
  [/^\s+-\s/, 'indented or nested list'],
  [/^\s*([-*_])(\s*\1){2,}\s*$/, 'horizontal rule'],
  [/^\s*\|.*\|\s*$/, 'table'],
  [/^\s*~~~/, 'tilde fence'],
  [/^( {4}|\t)\S/, 'indented code block'],
];

const INLINE_CONSTRUCTS: readonly (readonly [RegExp, string])[] = [
  [/<\/?[a-zA-Z!][^>]*>/, 'HTML'],
  [/~~[^~]+~~/, 'strikethrough'],
  [/(^|\s)__[^_]+__(\s|$)/, '__underscore__ emphasis'],
  [/\[[^\]]*\]\[[^\]]*\]/, 'reference link'],
  [/^\s*\[[^\]]+\]:\s/, 'link definition'],
];

const GOOD_LINK = /\[[^\]]+\]\(https?:\/\/[^)\s]+\)/g;
const ANY_LINK = /\[[^\]]*\]\([^)]*\)/g;

/** Problems in one Markdown text, as `line N: ...` (N counts from 1 inside the field). */
export function markdownProblems(text: string): readonly string[] {
  const problems: string[] = [];
  const lines = text.split('\n');
  let inFence = false;
  let fenceLine = 0;
  lines.forEach((raw, idx) => {
    const n = idx + 1;
    if (/^\s*```/.test(raw)) {
      inFence = !inFence;
      fenceLine = n;
      return;
    }
    if (inFence) return;
    for (const [re, name] of BLOCK_CONSTRUCTS) {
      if (re.test(raw)) problems.push(`line ${n}: ${name} is not supported`);
    }
    if (/!\[[^\]]*\]\(/.test(raw.replace(/`[^`]*`/g, ''))) {
      problems.push(`line ${n}: image is not supported`);
    }
    const line = raw
      .replace(/`[^`]*`/g, '')
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
      .replace(GOOD_LINK, '')
      .replace(/\*\*[^*]+\*\*/g, '');
    for (const [re, name] of INLINE_CONSTRUCTS) {
      if (re.test(line)) problems.push(`line ${n}: ${name} is not supported`);
    }
    for (const link of line.match(ANY_LINK) ?? []) {
      if (!/^!/.test(link)) {
        problems.push(`line ${n}: link ${link} must use an http or https address`);
      }
    }
  });
  if (inFence) problems.push(`line ${fenceLine}: fenced code block is never closed`);
  return problems;
}

/** Rule 16: Markdown fields use only the supported subset (compiler README, "Markdown subset"). */
export const markdownSubset: LintRule = (lesson) => {
  const issues: LintIssue[] = [];
  lesson.steps.forEach((s, i) => {
    for (const { field, text } of markdownFields(s)) {
      for (const p of markdownProblems(text)) {
        issues.push(at(RULE_IDS.markdownSubset, `${field}, ${p}`, i, s.id));
      }
    }
  });
  return issues;
};
