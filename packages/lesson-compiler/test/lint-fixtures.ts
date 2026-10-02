import type { Lesson, Step } from '@learn-code/lesson-schema';
import type { Registries } from '../src/lint';

export const registries: Registries = {
  concepts: [
    { id: 'join-types', name: 'Join types', description: 'How joins keep rows', prerequisites: [] },
    { id: 'null-semantics', name: 'NULL', description: 'Three-valued logic', prerequisites: [] },
    { id: 'sql-syntax', name: 'SQL syntax', description: 'Keywords', prerequisites: [] },
  ],
  misconceptions: [
    { id: 'join-drops-rows', belief: 'Joins drop rows', correction: 'Not always', concepts: [] },
    { id: 'null-equals-null', belief: 'NULL = NULL', correction: 'It is NULL', concepts: [] },
  ],
  syntaxConcepts: ['sql-syntax'],
};

const base = { estSeconds: 30 };
const J = ['join-types'];
const N = ['null-semantics'];

export const validSteps: readonly Step[] = [
  { ...base, id: 'hook', kind: 'hook', body: 'The Bug ate a row.', concepts: J },
  {
    ...base,
    id: 'predict',
    kind: 'predict',
    code: 'select 1',
    language: 'sql',
    concepts: J,
    options: [
      { output: '1', isCorrect: true, feedback: 'Right.' },
      { output: '0', isCorrect: false, feedback: 'No.', misconception: 'join-drops-rows' },
    ],
  },
  {
    ...base,
    id: 'explain',
    kind: 'explain',
    body: 'A left join keeps every left row.',
    code: 'select *\nfrom a',
    annotations: [{ line: 2, text: 'the left side' }],
    concepts: J,
  },
  {
    ...base,
    id: 'blanks',
    kind: 'fillBlanks',
    template: 'select ___x___',
    language: 'sql',
    blanks: [{ id: 'x', accepted: ['1'], feedback: 'Close.' }],
    concepts: N,
  },
  {
    ...base,
    id: 'lab',
    kind: 'sqlLab',
    prompt: 'Count rows',
    seedRef: 'seed',
    starter: '',
    solution: 'select 1',
    orderMatters: false,
    hints: [],
    concepts: J,
  },
  {
    ...base,
    id: 'reveal',
    kind: 'reveal',
    body: 'Here is what happened.',
    traceRef: 't',
    concepts: N,
  },
  {
    ...base,
    id: 'match',
    kind: 'matching',
    prompt: 'Match',
    pairs: [
      { left: 'a', right: 'b' },
      { left: 'c', right: 'd' },
    ],
    concepts: N,
  },
  {
    ...base,
    id: 'brain',
    kind: 'brainPower',
    question: 'Why?',
    minChars: 20,
    explanation: 'Because.',
    concepts: N,
  },
  {
    ...base,
    id: 'blanks2',
    kind: 'fillBlanks',
    template: 'select ___y___',
    language: 'sql',
    blanks: [{ id: 'y', accepted: ['1'], feedback: 'Close.' }],
    concepts: J,
  },
  {
    ...base,
    id: 'recap',
    kind: 'recap',
    points: ['Joins keep rows.', 'NULL is not equal to NULL.', 'Test both sides.'],
    concepts: [...J, ...N],
  },
];

export const validLesson: Lesson = {
  schemaVersion: 1,
  id: 'joins-01',
  courseId: 'fullstack',
  locale: 'en',
  title: 'Joins',
  concepts: ['join-types', 'null-semantics'],
  steps: validSteps,
};

const withSteps = (steps: readonly Step[], extra: Partial<Lesson> = {}): Lesson => ({
  ...validLesson,
  ...extra,
  steps,
});
const replaceStep = (id: string, patch: (s: Step) => Step): Step[] =>
  validSteps.map((s) => (s.id === id ? patch(s) : s));

const words = (n: number): string => Array.from({ length: n }, () => 'word').join(' ');

/** Rule id -> a lesson that breaks exactly that rule. */
export const brokenFixtures: Readonly<Record<string, Lesson>> = {
  'no-adjacent-passive': withSteps(
    // swap predict with explain's neighbor: hook, explain adjacent; keep predict first via reorder
    [validSteps[1], validSteps[0], validSteps[2], ...validSteps.slice(3)].filter(
      (s): s is Step => s !== undefined,
    ),
  ),
  'min-active-ratio': withSteps(
    [
      ...validSteps.slice(0, 5),
      { ...base, id: 'cliff', kind: 'cliffhanger', question: 'What next?', concepts: N },
      validSteps[3],
      { ...base, id: 'pit', kind: 'pitfall', body: 'Oops.', concepts: N },
      validSteps[4],
      { ...base, id: 'pit2', kind: 'pitfall', body: 'Oops again.', concepts: N },
      validSteps[8],
      validSteps[9],
    ].filter((s): s is Step => s !== undefined),
  ),
  'predict-before-explain': withSteps(
    replaceStep('predict', () => ({
      ...base,
      id: 'predict',
      kind: 'matching',
      prompt: 'Match',
      pairs: [
        { left: 'a', right: 'b' },
        { left: 'c', right: 'd' },
      ],
      concepts: J,
    })),
  ),
  'passive-word-limit': withSteps(
    replaceStep('reveal', (s) => (s.kind === 'reveal' ? { ...s, body: words(81) } : s)),
  ),
  'wrong-option-feedback': withSteps(
    replaceStep('predict', (s) =>
      s.kind === 'predict'
        ? {
            ...s,
            options: [
              { output: '1', isCorrect: true, feedback: 'Right.' },
              { output: '0', isCorrect: false, feedback: 'No.' },
            ],
          }
        : s,
    ),
  ),
  'concept-representations': withSteps(
    replaceStep('match', (s) => ({ ...s, concepts: [] })).map((s) =>
      s.id === 'blanks' || s.id === 'brain' || s.id === 'reveal' ? { ...s, concepts: [] } : s,
    ),
  ),
  'review-cards': withSteps(
    replaceStep('recap', (s) => (s.kind === 'recap' ? { ...s, concepts: J } : s)),
  ),
};
