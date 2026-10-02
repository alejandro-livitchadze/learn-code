import { describe, expect, it } from 'vitest';
import { lesson as lessonSchema } from '@learn-code/lesson-schema';
import type { Lesson, Step } from '@learn-code/lesson-schema';
import {
  LINT_RULES,
  RULE_IDS,
  annotationLines,
  conceptRepresentations,
  countWords,
  lintLesson,
  minActiveRatio,
  noAdjacentPassive,
  passiveWordLimit,
  predictBeforeExplain,
  proseOf,
  reviewCards,
  wrongOptionFeedback,
} from '../src/lint';
import { brokenFixtures, registries, validLesson, validSteps } from './lint-fixtures';

const rulesById = {
  'no-adjacent-passive': noAdjacentPassive,
  'min-active-ratio': minActiveRatio,
  'predict-before-explain': predictBeforeExplain,
  'passive-word-limit': passiveWordLimit,
  'wrong-option-feedback': wrongOptionFeedback,
  'concept-representations': conceptRepresentations,
  'review-cards': reviewCards,
} as const;

const step = (id: string): Step => {
  const s = validSteps.find((x) => x.id === id);
  if (s === undefined) throw new Error(`no step ${id}`);
  return s;
};
const withSteps = (steps: readonly Step[]): Lesson => ({ ...validLesson, steps });

describe('valid lesson', () => {
  it('passes the schema and every rule', () => {
    expect(lessonSchema.safeParse(validLesson).success).toBe(true);
    expect(lintLesson(validLesson, registries)).toEqual([]);
    expect(LINT_RULES).toHaveLength(8);
  });
});

describe('broken fixtures', () => {
  for (const [id, rule] of Object.entries(rulesById)) {
    it(`${id}: fixture fails exactly this rule`, () => {
      const fixture = brokenFixtures[id];
      if (fixture === undefined) throw new Error(`missing fixture ${id}`);
      expect(rule(fixture, registries).length).toBeGreaterThan(0);
      const failing = new Set(lintLesson(fixture, registries).map((i) => i.rule));
      expect([...failing]).toEqual([id]);
    });
  }
});

describe('rule details', () => {
  it('reports the offending step for adjacent passives', () => {
    const issues = noAdjacentPassive(brokenFixtures['no-adjacent-passive'] as Lesson, registries);
    expect(issues[0]?.stepId).toBe('explain');
    expect(issues[0]?.severity).toBe('error');
  });

  it('accepts exactly 60% active and rejects just below', () => {
    const p = (id: string): Step => ({ ...step('hook'), id });
    const a = (id: string): Step => ({ ...step('brain'), id });
    expect(minActiveRatio(withSteps([a('1'), a('2'), a('3'), p('4'), a('5')]), registries)).toEqual(
      [],
    );
    const sixOfTen = [
      a('1'),
      p('2'),
      a('3'),
      p('4'),
      a('5'),
      p('6'),
      a('7'),
      a('8'),
      a('9'),
      p('10'),
    ];
    expect(minActiveRatio(withSteps(sixOfTen), registries)).toEqual([]);
    const fiveOfTen = [...sixOfTen.slice(0, 9), p('10')].map((s, i) => (i === 8 ? p('9') : s));
    expect(minActiveRatio(withSteps(fiveOfTen), registries)).toHaveLength(1);
  });

  it('predict-before-explain: no explain is fine, no predict is an error', () => {
    const noExplain = validSteps.filter((s) => s.kind !== 'explain');
    expect(predictBeforeExplain(withSteps(noExplain), registries)).toEqual([]);
    const noPredict = validSteps.filter((s) => s.kind !== 'predict');
    const issues = predictBeforeExplain(withSteps(noPredict), registries);
    expect(issues[0]?.message).toContain('no predict');
    expect(issues[0]?.stepId).toBe('explain');
  });

  it('counts prose words and ignores fenced code', () => {
    expect(countWords('one two\nthree')).toBe(3);
    expect(countWords('a\n```sql\nselect 1 from t\n```\nb')).toBe(2);
    expect(countWords('')).toBe(0);
  });

  it('proseOf covers every passive kind and ignores active ones', () => {
    expect(
      proseOf({
        ...step('reveal'),
        kind: 'reveal',
        body: 'x',
        traceRef: 't',
        caption: 'y',
      } as Step),
    ).toBe('x y');
    expect(proseOf(step('reveal')).trim()).toBe('Here is what happened.');
    expect(proseOf(step('recap'))).toContain('Joins keep rows.');
    expect(proseOf(step('hook'))).toBe('The Bug ate a row.');
    expect(proseOf({ ...step('hook'), kind: 'cliffhanger', question: 'Q?' } as Step)).toBe('Q?');
    expect(proseOf(step('predict'))).toBe('');
  });

  it('passive word limit allows exactly 80 words', () => {
    const eighty = Array.from({ length: 80 }, () => 'w').join(' ');
    const s: Step = { ...step('hook'), kind: 'hook', body: eighty } as Step;
    expect(passiveWordLimit(withSteps([s]), registries)).toEqual([]);
    expect(
      passiveWordLimit(withSteps([{ ...s, body: `${eighty} w` } as Step]), registries),
    ).toHaveLength(1);
  });

  it('wrong options: blank feedback, unknown id, recall and fireside groups', () => {
    const predict = step('predict');
    if (predict.kind !== 'predict') throw new Error('shape');
    const bad = {
      ...predict,
      options: [
        { output: '1', isCorrect: true, feedback: '' },
        { output: '0', isCorrect: false, feedback: '  ', misconception: 'made-up' },
        { output: '2', isCorrect: false, feedback: 'ok', misconception: '' },
      ],
    } satisfies Step;
    const issues = wrongOptionFeedback(withSteps([bad]), registries);
    expect(issues.map((i) => i.message)).toEqual([
      'wrong option 2 has no feedback',
      'wrong option 2 uses unknown misconception "made-up"',
      'wrong option 3 has no misconception id',
    ]);

    const opt = { text: 't', isCorrect: false, feedback: 'f' };
    const good = { text: 'g', isCorrect: true, feedback: 'f' };
    const recall = {
      ...step('hook'),
      kind: 'recall',
      questions: [
        { prompt: 'p', options: [good, opt] },
        { prompt: 'q', options: [good, { ...opt, misconception: 'null-equals-null' }] },
      ],
    } as Step;
    expect(wrongOptionFeedback(withSteps([recall]), registries)).toHaveLength(1);
    const chat = {
      ...step('hook'),
      kind: 'firesideChat',
      speakers: ['a', 'b'],
      messages: [],
      question: 'q',
      options: [good, opt],
    } as Step;
    expect(wrongOptionFeedback(withSteps([chat]), registries)).toHaveLength(1);
  });

  it('concept without any step reports zero representations', () => {
    const l: Lesson = { ...validLesson, concepts: ['join-types', 'orphan'] };
    const issues = conceptRepresentations(l, registries);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toContain('"orphan" appears in 0');
  });

  it('review cards: syntax concepts are exempt and warned when carded', () => {
    const l: Lesson = { ...validLesson, concepts: ['join-types', 'sql-syntax'] };
    const issues = reviewCards(l, registries);
    expect(issues).toEqual([]);
    const carded = withSteps(
      validSteps.map((s) =>
        s.kind === 'recap' ? { ...s, concepts: ['join-types', 'sql-syntax'] } : s,
      ),
    );
    const warn = reviewCards({ ...carded, concepts: ['join-types', 'sql-syntax'] }, registries);
    expect(warn.map((i) => i.severity)).toEqual(['warning']);
  });

  it('review cards work without a syntaxConcepts list', () => {
    const issues = reviewCards(
      { ...validLesson, concepts: ['sql-syntax'] },
      { ...registries, syntaxConcepts: undefined },
    );
    expect(issues).toHaveLength(1);
  });

  it('annotation lines must exist in the code', () => {
    const explain = step('explain');
    if (explain.kind !== 'explain') throw new Error('shape');
    const bad = { ...explain, annotations: [{ line: 3, text: 'x' }] };
    expect(annotationLines(withSteps([bad]), registries)).toHaveLength(1);
    const noCode = { ...explain, code: undefined, annotations: [{ line: 1, text: 'x' }] };
    expect(annotationLines(withSteps([noCode]), registries)).toHaveLength(1);
    expect(annotationLines(withSteps([explain]), registries)).toEqual([]);
  });

  it('exposes stable rule ids', () => {
    expect(Object.values(RULE_IDS)).toContain('review-cards');
  });
});
