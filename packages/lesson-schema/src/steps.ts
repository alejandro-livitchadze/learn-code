import { z } from 'zod';
import { designTask } from './design';

/** An aside shown in the margin of a step (E08 section 9). */
export const marginItem = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('sticky'),
    who: z.literal('olha'),
    label: z.enum(['asks', 'says']),
    text: z.string().min(1),
  }),
  z.object({
    type: z.literal('bubble'),
    who: z.enum(['bug', 'runtime']),
    text: z.string().min(1),
  }),
  z.object({ type: z.literal('gotcha'), text: z.string().min(1) }),
  z.object({ type: z.literal('stopAndThink'), text: z.string().min(1) }),
  z.object({ type: z.literal('diagram'), ref: z.string().min(1), caption: z.string().min(1) }),
]);
export type MarginItem = z.infer<typeof marginItem>;

const stepBase = z.object({
  id: z.string().min(1),
  estSeconds: z.number().int().positive(),
  concepts: z.array(z.string()).readonly(),
  margin: z.array(marginItem).readonly().optional(),
});

const codeLanguage = z.enum(['ts', 'js', 'sql', 'http']);

const wrongOptionNeedsMisconception = (o: {
  isCorrect: boolean;
  misconception?: string | undefined;
}) => o.isCorrect || (o.misconception !== undefined && o.misconception.length > 0);

const predictOption = z
  .object({
    output: z.string(),
    isCorrect: z.boolean(),
    feedback: z.string().min(1),
    misconception: z.string().optional(),
  })
  .refine(wrongOptionNeedsMisconception, {
    message: 'a wrong option needs a misconception id',
    path: ['misconception'],
  });

const choiceOption = z
  .object({
    text: z.string().min(1),
    isCorrect: z.boolean(),
    feedback: z.string().min(1),
    misconception: z.string().optional(),
  })
  .refine(wrongOptionNeedsMisconception, {
    message: 'a wrong option needs a misconception id',
    path: ['misconception'],
  });

const hasOneCorrect = (options: readonly { isCorrect: boolean }[]) =>
  options.filter((o) => o.isCorrect).length === 1;

export const hookStep = stepBase.extend({
  kind: z.literal('hook'),
  body: z.string().min(1),
  character: z.enum(['bug', 'olha', 'mrRuntime']).optional(),
});

export const recallStep = stepBase.extend({
  kind: z.literal('recall'),
  questions: z
    .array(
      z.object({
        prompt: z.string().min(1),
        options: z
          .array(choiceOption)
          .min(2)
          .refine(hasOneCorrect, 'exactly one correct option')
          .readonly(),
        fromLessonId: z.string().optional(),
      }),
    )
    .min(2)
    .max(3)
    .readonly(),
});

export const predictStep = stepBase.extend({
  kind: z.literal('predict'),
  code: z.string(),
  language: codeLanguage,
  options: z
    .array(predictOption)
    .min(2)
    .refine(hasOneCorrect, 'exactly one correct option')
    .readonly(),
});

export const revealStep = stepBase.extend({
  kind: z.literal('reveal'),
  body: z.string(),
  traceRef: z.string().min(1),
  caption: z.string().optional(),
});

export const explainStep = stepBase.extend({
  kind: z.literal('explain'),
  body: z.string(), // markdown
  code: z.string().optional(),
  annotations: z
    .array(z.object({ line: z.number().int().positive(), text: z.string() }))
    .readonly(),
});

export const beTheRuntimeStep = stepBase.extend({
  kind: z.literal('beTheRuntime'),
  code: z.string(),
  language: z.enum(['ts', 'js']),
  traceRef: z.string().min(1),
  prompt: z.string().min(1),
});

export const beTheDatabaseStep = stepBase.extend({
  kind: z.literal('beTheDatabase'),
  query: z.string().min(1),
  tables: z
    .array(
      z.object({
        name: z.string().min(1),
        columns: z.array(z.string()).min(1).readonly(),
        rows: z.array(z.array(z.string()).readonly()).readonly(),
      }),
    )
    .min(1)
    .readonly(),
  traceRef: z.string().min(1),
  prompt: z.string().min(1),
});

export const parsonsStep = stepBase.extend({
  kind: z.literal('parsons'),
  prompt: z.string().min(1),
  /** Pieces in the correct order. The player shuffles them. */
  items: z
    .array(z.object({ id: z.string().min(1), text: z.string().min(1) }))
    .min(3)
    .readonly(),
  feedback: z.string().min(1),
});

export const fillBlanksStep = stepBase.extend({
  kind: z.literal('fillBlanks'),
  /** Code with blanks written as `___id___`. */
  template: z.string().min(1),
  language: codeLanguage,
  blanks: z
    .array(
      z.object({
        id: z.string().min(1),
        accepted: z.array(z.string().min(1)).min(1).readonly(),
        feedback: z.string().min(1),
        misconception: z.string().optional(),
      }),
    )
    .min(1)
    .readonly(),
});

export const firesideChatStep = stepBase.extend({
  kind: z.literal('firesideChat'),
  speakers: z.tuple([z.string().min(1), z.string().min(1)]).readonly(),
  messages: z
    .array(z.object({ speaker: z.string().min(1), text: z.string().min(1) }))
    .min(2)
    .readonly(),
  question: z.string().min(1),
  options: z
    .array(choiceOption)
    .min(2)
    .refine(hasOneCorrect, 'exactly one correct option')
    .readonly(),
});

export const brainPowerStep = stepBase.extend({
  kind: z.literal('brainPower'),
  question: z.string().min(1),
  minChars: z.number().int().positive().default(20),
  explanation: z.string().min(1),
});

export const matchingStep = stepBase.extend({
  kind: z.literal('matching'),
  prompt: z.string().min(1),
  pairs: z
    .array(z.object({ left: z.string().min(1), right: z.string().min(1) }))
    .min(2)
    .readonly(),
});

export const pitfallStep = stepBase.extend({
  kind: z.literal('pitfall'),
  body: z.string(),
  badCode: z.string().optional(),
  goodCode: z.string().optional(),
  language: codeLanguage.optional(),
});

export const sqlLabStep = stepBase.extend({
  kind: z.literal('sqlLab'),
  prompt: z.string().min(1),
  seedRef: z.string().min(1),
  starter: z.string().default(''),
  solution: z.string().min(1),
  orderMatters: z.boolean().default(false),
  hints: z.array(z.string()).readonly().default([]),
});

export const schemaBuilderStep = stepBase.extend({
  kind: z.literal('schemaBuilder'),
  prompt: z.string().min(1),
  /** Loose fields, roles, scenarios and the reference and wrong drafts (E06). */
  ...designTask.shape,
});

export const relationLabStep = stepBase.extend({
  kind: z.literal('relationLab'),
  prompt: z.string().min(1),
  entities: z.array(z.string().min(1)).min(2).readonly(),
  expected: z
    .array(
      z.object({
        from: z.string().min(1),
        to: z.string().min(1),
        cardinality: z.enum(['one-to-one', 'one-to-many', 'many-to-many']),
      }),
    )
    .min(1)
    .readonly(),
});

export const normalizeLabStep = stepBase.extend({
  kind: z.literal('normalizeLab'),
  prompt: z.string().min(1),
  startTable: z.object({
    name: z.string().min(1),
    columns: z.array(z.string().min(1)).min(1).readonly(),
    rows: z.array(z.array(z.string()).readonly()).readonly(),
  }),
  targetForm: z.enum(['1nf', '2nf', '3nf']),
  expectedTables: z
    .array(
      z.object({ name: z.string().min(1), columns: z.array(z.string().min(1)).min(1).readonly() }),
    )
    .min(2)
    .readonly(),
});

export const namingReviewStep = stepBase.extend({
  kind: z.literal('namingReview'),
  prompt: z.string().min(1),
  ddl: z.string().min(1),
  issues: z
    .array(
      z.object({
        identifier: z.string().min(1),
        problem: z.string().min(1),
        fix: z.string().min(1),
      }),
    )
    .min(1)
    .readonly(),
});

export const migrationLabStep = stepBase.extend({
  kind: z.literal('migrationLab'),
  prompt: z.string().min(1),
  seedRef: z.string().min(1),
  before: z.string().min(1),
  after: z.string().min(1),
  steps: z.array(z.string().min(1)).min(1).readonly(),
});

export const recapStep = stepBase.extend({
  kind: z.literal('recap'),
  points: z.array(z.string().min(1)).min(3).max(4).readonly(),
});

export const cliffhangerStep = stepBase.extend({
  kind: z.literal('cliffhanger'),
  question: z.string().min(1),
  nextLessonId: z.string().optional(),
});

export const step = z.discriminatedUnion('kind', [
  hookStep,
  recallStep,
  predictStep,
  revealStep,
  explainStep,
  beTheRuntimeStep,
  beTheDatabaseStep,
  parsonsStep,
  fillBlanksStep,
  firesideChatStep,
  brainPowerStep,
  matchingStep,
  pitfallStep,
  sqlLabStep,
  schemaBuilderStep,
  relationLabStep,
  normalizeLabStep,
  namingReviewStep,
  migrationLabStep,
  recapStep,
  cliffhangerStep,
]);
export type Step = z.infer<typeof step>;
export type StepKind = Step['kind'];

export const PASSIVE_KINDS = [
  'hook',
  'explain',
  'reveal',
  'pitfall',
  'recap',
  'cliffhanger',
] as const;
export type PassiveKind = (typeof PASSIVE_KINDS)[number];

const passiveSet: ReadonlySet<StepKind> = new Set<StepKind>(PASSIVE_KINDS);

export function isActive(s: { readonly kind: StepKind }): boolean {
  return !passiveSet.has(s.kind);
}

/** Kinds that have a real widget in the player. The rest render a placeholder and cannot be played. */
export const IMPLEMENTED_KINDS = [
  'hook',
  'explain',
  'recap',
  'cliffhanger',
  'pitfall',
  'predict',
  'fillBlanks',
  'sqlLab',
  'schemaBuilder',
  'beTheDatabase',
] as const satisfies readonly StepKind[];
export type ImplementedKind = (typeof IMPLEMENTED_KINDS)[number];
