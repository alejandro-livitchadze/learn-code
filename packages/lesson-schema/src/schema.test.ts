import { describe, expect, it } from 'vitest';
import {
  PASSIVE_KINDS,
  conceptsFile,
  isActive,
  lesson,
  lessonStatus,
  misconceptionsFile,
  roadmap,
  step,
  type StepKind,
} from './index';

const base = { estSeconds: 30, concepts: ['c'] };
const choices = [
  { text: 'a', isCorrect: true, feedback: 'yes' },
  { text: 'b', isCorrect: false, feedback: 'no', misconception: 'm1' },
];
const table = { name: 't', columns: ['id'], rows: [['1']] };

const fixtures: Record<StepKind, unknown> = {
  hook: { ...base, id: 'a', kind: 'hook', body: 'Friday.', character: 'bug' },
  recall: {
    ...base,
    id: 'a',
    kind: 'recall',
    questions: [
      { prompt: 'why?', options: choices },
      { prompt: 'why not?', options: choices },
    ],
  },
  predict: {
    ...base,
    id: 'a',
    kind: 'predict',
    code: 'select 1',
    language: 'sql',
    options: [
      { output: '1', isCorrect: true, feedback: 'ok' },
      { output: '2', isCorrect: false, feedback: 'nope', misconception: 'm1' },
    ],
  },
  reveal: { ...base, id: 'a', kind: 'reveal', body: 'x', traceRef: 't1' },
  explain: { ...base, id: 'a', kind: 'explain', body: 'x', annotations: [{ line: 1, text: 'hi' }] },
  beTheRuntime: {
    ...base,
    id: 'a',
    kind: 'beTheRuntime',
    code: 'x',
    language: 'js',
    traceRef: 't',
    prompt: 'p',
  },
  beTheDatabase: {
    ...base,
    id: 'a',
    kind: 'beTheDatabase',
    query: 'select 1',
    tables: [table],
    traceRef: 't',
    prompt: 'p',
  },
  parsons: {
    ...base,
    id: 'a',
    kind: 'parsons',
    prompt: 'p',
    items: [
      { id: '1', text: 'a' },
      { id: '2', text: 'b' },
      { id: '3', text: 'c' },
    ],
    feedback: 'f',
  },
  fillBlanks: {
    ...base,
    id: 'a',
    kind: 'fillBlanks',
    template: 'select ___x___',
    language: 'sql',
    blanks: [{ id: 'x', accepted: ['1'], feedback: 'f' }],
  },
  firesideChat: {
    ...base,
    id: 'a',
    kind: 'firesideChat',
    speakers: ['A', 'B'],
    messages: [
      { speaker: 'A', text: 'hi' },
      { speaker: 'B', text: 'yo' },
    ],
    question: 'who?',
    options: choices,
  },
  brainPower: { ...base, id: 'a', kind: 'brainPower', question: 'q', explanation: 'e' },
  matching: {
    ...base,
    id: 'a',
    kind: 'matching',
    prompt: 'p',
    pairs: [
      { left: 'a', right: 'b' },
      { left: 'c', right: 'd' },
    ],
  },
  pitfall: { ...base, id: 'a', kind: 'pitfall', body: 'x' },
  sqlLab: { ...base, id: 'a', kind: 'sqlLab', prompt: 'p', seedRef: 's', solution: 'select 1' },
  schemaBuilder: {
    ...base,
    id: 'a',
    kind: 'schemaBuilder',
    prompt: 'p',
    scenario: 's',
    expectedTables: [{ name: 't', columns: ['id'] }],
  },
  relationLab: {
    ...base,
    id: 'a',
    kind: 'relationLab',
    prompt: 'p',
    entities: ['a', 'b'],
    expected: [{ from: 'a', to: 'b', cardinality: 'one-to-many' }],
  },
  normalizeLab: {
    ...base,
    id: 'a',
    kind: 'normalizeLab',
    prompt: 'p',
    startTable: table,
    targetForm: '3nf',
    expectedTables: [
      { name: 'a', columns: ['id'] },
      { name: 'b', columns: ['id'] },
    ],
  },
  namingReview: {
    ...base,
    id: 'a',
    kind: 'namingReview',
    prompt: 'p',
    ddl: 'create table T(Id int)',
    issues: [{ identifier: 'T', problem: 'case', fix: 't' }],
  },
  migrationLab: {
    ...base,
    id: 'a',
    kind: 'migrationLab',
    prompt: 'p',
    seedRef: 's',
    before: 'a',
    after: 'b',
    steps: ['alter'],
  },
  recap: { ...base, id: 'a', kind: 'recap', points: ['a', 'b', 'c'] },
  cliffhanger: { ...base, id: 'a', kind: 'cliffhanger', question: 'q' },
};

describe('step kinds', () => {
  it.each(Object.entries(fixtures))('accepts a valid %s', (_kind, fixture) => {
    expect(step.safeParse(fixture).success).toBe(true);
  });

  it('rejects an unknown kind', () => {
    expect(step.safeParse({ ...base, id: 'a', kind: 'bugHunt' }).success).toBe(false);
  });

  it('rejects a wrong option without misconception', () => {
    const bad = {
      ...(fixtures.predict as object),
      options: [
        { output: '1', isCorrect: true, feedback: 'ok' },
        { output: '2', isCorrect: false, feedback: 'nope' },
      ],
    };
    expect(step.safeParse(bad).success).toBe(false);
  });

  it('rejects a wrong option with empty feedback', () => {
    const bad = {
      ...(fixtures.predict as object),
      options: [
        { output: '1', isCorrect: true, feedback: 'ok' },
        { output: '2', isCorrect: false, feedback: '', misconception: 'm' },
      ],
    };
    expect(step.safeParse(bad).success).toBe(false);
  });

  it('rejects predict with a single option or no correct option', () => {
    const one = {
      ...(fixtures.predict as object),
      options: [{ output: '1', isCorrect: true, feedback: 'ok' }],
    };
    expect(step.safeParse(one).success).toBe(false);
    const none = {
      ...(fixtures.predict as object),
      options: [
        { output: '1', isCorrect: false, feedback: 'a', misconception: 'm' },
        { output: '2', isCorrect: false, feedback: 'b', misconception: 'm' },
      ],
    };
    expect(step.safeParse(none).success).toBe(false);
  });

  it('rejects bad base fields', () => {
    expect(step.safeParse({ ...(fixtures.hook as object), id: '' }).success).toBe(false);
    expect(step.safeParse({ ...(fixtures.hook as object), estSeconds: 0 }).success).toBe(false);
  });

  it('applies defaults', () => {
    const parsed = step.parse(fixtures.sqlLab);
    expect(parsed.kind === 'sqlLab' && parsed.orderMatters).toBe(false);
  });
});

describe('isActive', () => {
  it('matches PASSIVE_KINDS for every fixture', () => {
    for (const [kind, fixture] of Object.entries(fixtures)) {
      const parsed = step.parse(fixture);
      expect(isActive(parsed)).toBe(!(PASSIVE_KINDS as readonly string[]).includes(kind));
    }
  });
});

describe('lesson', () => {
  const steps = Array.from({ length: 8 }, (_, i) => ({
    ...(fixtures.pitfall as object),
    id: `s${i}`,
  }));
  const valid = { schemaVersion: 1, id: 'l1', courseId: 'c', title: 'T', concepts: ['x'], steps };

  it('accepts a valid lesson and defaults locale', () => {
    const parsed = lesson.parse(valid);
    expect(parsed.locale).toBe('en');
  });

  it('rejects fewer than 8 steps', () => {
    expect(lesson.safeParse({ ...valid, steps: steps.slice(0, 7) }).success).toBe(false);
  });

  it('rejects a wrong schemaVersion', () => {
    expect(lesson.safeParse({ ...valid, schemaVersion: 2 }).success).toBe(false);
  });
});

describe('registry, roadmap and status files', () => {
  it('validates concepts and misconceptions', () => {
    expect(
      conceptsFile.safeParse([{ id: 'inner-join', name: 'Inner join', description: 'd' }]).success,
    ).toBe(true);
    expect(
      conceptsFile.safeParse([{ id: 'Inner Join', name: 'x', description: 'd' }]).success,
    ).toBe(false);
    expect(
      misconceptionsFile.safeParse([
        { id: 'm-1', belief: 'b', correction: 'c', concepts: ['inner-join'] },
      ]).success,
    ).toBe(true);
    expect(misconceptionsFile.safeParse([{ id: 'm-1', belief: 'b' }]).success).toBe(false);
  });

  it('validates a roadmap', () => {
    const ok = {
      courseId: 'c',
      modules: [{ id: 'm', title: 'M', lessons: [{ id: 'l', title: 'L', concepts: ['a-b'] }] }],
    };
    expect(roadmap.safeParse(ok).success).toBe(true);
    expect(roadmap.safeParse({ courseId: 'c' }).success).toBe(false);
  });

  it('validates a status file', () => {
    const ok = {
      lessonId: 'l',
      state: 'drafted',
      updatedBy: 'writer',
      updatedAt: '2026-10-02',
      retryCount: 0,
      defects: [],
      assumptions: [],
    };
    expect(lessonStatus.safeParse(ok).success).toBe(true);
    expect(lessonStatus.safeParse({ ...ok, state: 'bogus' }).success).toBe(false);
    expect(lessonStatus.safeParse({ ...ok, updatedAt: 'yesterday' }).success).toBe(false);
  });
});
