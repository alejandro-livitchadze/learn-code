import { describe, expect, it } from 'vitest';
import { lesson as lessonSchema } from '@learn-code/lesson-schema';
import type { Lesson, Step } from '@learn-code/lesson-schema';
import {
  LINT_RULES,
  annotationCount,
  bugPlacement,
  characterCount,
  gotchaStopCount,
  highlightLimits,
  marginCount,
  runtimePlacement,
  wordLimits,
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
  'dl1-margin-count': marginCount,
  'dl2-character-count': characterCount,
  'dl3-bug-placement': bugPlacement,
  'dl4-runtime-placement': runtimePlacement,
  'dl5-word-limits': wordLimits,
  'dl6-annotation-count': annotationCount,
  'dl7-highlight-limits': highlightLimits,
  'dl8-gotcha-stop-count': gotchaStopCount,
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
    expect(lintLesson(validLesson, registries, { allowUnbuilt: true })).toEqual([]);
    expect(LINT_RULES).toHaveLength(24);
  });
});

describe('broken fixtures', () => {
  for (const [id, rule] of Object.entries(rulesById)) {
    it(`${id}: fixture fails exactly this rule`, () => {
      const fixture = brokenFixtures[id];
      if (fixture === undefined) throw new Error(`missing fixture ${id}`);
      expect(rule(fixture, registries).length).toBeGreaterThan(0);
      const failing = new Set(
        lintLesson(fixture, registries, { allowUnbuilt: true }).map((i) => i.rule),
      );
      expect([...failing]).toEqual([id]);
    });
  }
});

describe('playable and solvable rules', () => {
  const only = (l: Lesson, rule: string) =>
    lintLesson(l, registries, { allowUnbuilt: true }).filter((i) => i.rule === rule);
  const blanks = (id: string): Step => step(id);
  const patchBlanks = (id: string, patch: Partial<Extract<Step, { kind: 'fillBlanks' }>>): Lesson =>
    withSteps(
      validSteps.map((s) => (s.id === id && s.kind === 'fillBlanks' ? { ...s, ...patch } : s)),
    );

  it('reports a duplicate id at the second step', () => {
    const l = withSteps(validSteps.map((s) => (s.id === 'match' ? { ...s, id: 'hook' } : s)));
    const [issue] = only(l, 'unique-step-ids');
    expect(issue?.stepIndex).toBe(validSteps.findIndex((s) => s.id === 'match'));
    expect(issue?.message).toContain('"hook"');
  });

  it('compares template markers with blank ids both ways', () => {
    const extra = only(
      patchBlanks('blanks', { template: 'select ___x___ ___ghost___' }),
      'fill-blanks-markers',
    );
    expect(extra.map((i) => i.message)).toEqual(['marker ___ghost___ has no blank']);
    const unused = only(patchBlanks('blanks', { template: 'select 1' }), 'fill-blanks-markers');
    expect(unused.map((i) => i.message)).toEqual(['blank "x" has no marker']);
    const twice = only(
      patchBlanks('blanks', { template: '___x___ ___x___' }),
      'fill-blanks-markers',
    );
    expect(twice.map((i) => i.message)).toEqual(['marker ___x___ appears more than once']);
    const b = blanks('blanks');
    if (b.kind !== 'fillBlanks') throw new Error('kind');
    const dup = only(
      patchBlanks('blanks', { blanks: [...b.blanks, ...b.blanks] }),
      'fill-blanks-markers',
    );
    expect(dup.map((i) => i.message)).toEqual(['blank "x" is defined twice']);
  });

  it('requires the first accepted answers to pass checkFillBlanks', () => {
    const l = patchBlanks('blanks', {
      blanks: [{ id: 'x', accepted: ['   ', '1'], feedback: 'Close.' }],
    });
    expect(only(l, 'fill-blanks-solvable')).toHaveLength(1);
    expect(only(validLesson, 'fill-blanks-solvable')).toEqual([]);
  });

  it('flags unknown lesson and step concepts', () => {
    const l = {
      ...withSteps(validSteps.map((s) => (s.id === 'hook' ? { ...s, concepts: ['nope'] } : s))),
      concepts: ['join-types', 'nope2'],
    };
    const issues = only(l, 'unknown-concept');
    expect(issues.map((i) => i.message)).toEqual([
      'lesson concept "nope2" is not in concepts.json',
      'step concept "nope" is not in concepts.json',
    ]);
  });

  it('flags unknown blank misconceptions and accepts known ones', () => {
    const blank = { id: 'x', accepted: ['1'], feedback: 'Close.' };
    const bad = patchBlanks('blanks', { blanks: [{ ...blank, misconception: 'nope' }] });
    expect(only(bad, 'unknown-misconception')).toHaveLength(1);
    const ok = patchBlanks('blanks', { blanks: [{ ...blank, misconception: 'join-drops-rows' }] });
    expect(only(ok, 'unknown-misconception')).toEqual([]);
  });

  it('flags unbuilt kinds unless allowed, and counts steps', () => {
    const strict = lintLesson(validLesson, registries).filter((i) => i.rule === 'unbuilt-kind');
    expect(strict.map((i) => i.stepId)).toEqual(['reveal', 'match', 'brain']);
    expect(only(withSteps(validSteps.slice(0, 11)), 'step-count')).toHaveLength(1);
    expect(
      only(
        withSteps([...validSteps, ...validSteps.map((s) => ({ ...s, id: `${s.id}2` }))]),
        'step-count',
      ),
    ).toHaveLength(1);
    expect(only(validLesson, 'step-count')).toEqual([]);
  });
});

describe('design lint details', () => {
  const margin = (id: string, m: Step['margin']): Lesson =>
    withSteps(validSteps.map((s) => (s.id === id ? { ...s, margin: m } : s)));
  const hookCharacter = (character: 'bug' | 'olha' | 'mrRuntime'): Lesson =>
    withSteps(validSteps.map((s) => (s.kind === 'hook' ? { ...s, character } : s)));

  it('allows the limits exactly', () => {
    const l = margin('hook', [
      { type: 'sticky', who: 'olha', label: 'says', text: Array(20).fill('w').join(' ') },
      { type: 'gotcha', text: Array(30).fill('w').join(' ') },
      { type: 'stopAndThink', text: Array(25).fill('w').join(' ') },
    ]);
    for (const rule of [marginCount, characterCount, wordLimits, gotchaStopCount])
      expect(rule(l, registries)).toEqual([]);
  });

  it('counts each limit one over', () => {
    const w = (n: number): string => Array(n).fill('w').join(' ');
    const one = (m: NonNullable<Step['margin']>[number]): readonly string[] =>
      wordLimits(margin('hook', [m]), registries).map((i) => i.message);
    expect(one({ type: 'bubble', who: 'bug', text: w(21) })).toHaveLength(1);
    expect(one({ type: 'gotcha', text: w(31) })).toHaveLength(1);
    expect(one({ type: 'stopAndThink', text: w(26) })).toHaveLength(1);
    const explain = step('explain');
    if (explain.kind !== 'explain') throw new Error('shape');
    const long = withSteps(
      validSteps.map((s) =>
        s.id === 'explain' ? { ...explain, annotations: [{ line: 1, text: w(9) }] } : s,
      ),
    );
    expect(wordLimits(long, registries)).toHaveLength(1);
    const ok = withSteps(
      validSteps.map((s) =>
        s.id === 'explain' ? { ...explain, annotations: [{ line: 1, text: w(8) }] } : s,
      ),
    );
    expect(wordLimits(ok, registries)).toEqual([]);
  });

  it('counts the hook character as a speaker', () => {
    expect(characterCount(hookCharacter('bug'), registries)).toEqual([]);
    const l = withSteps(
      validSteps.map((s) =>
        s.kind === 'hook'
          ? {
              ...s,
              character: 'olha',
              margin: [{ type: 'sticky', who: 'olha', label: 'asks', text: 'Why?' }],
            }
          : s,
      ),
    );
    expect(characterCount(l, registries)).toHaveLength(1);
  });

  it('places the characters by step kind', () => {
    expect(bugPlacement(hookCharacter('bug'), registries)).toEqual([]);
    expect(runtimePlacement(hookCharacter('mrRuntime'), registries)).toHaveLength(1);
    expect(runtimePlacement(hookCharacter('bug'), registries)).toEqual([]);
    const inRecap = margin('recap', [{ type: 'bubble', who: 'bug', text: 'Mine.' }]);
    expect(bugPlacement(inRecap, registries)).toEqual([]);
    const runtimeInLab = margin('lab', [{ type: 'bubble', who: 'runtime', text: 'Rule.' }]);
    expect(runtimePlacement(runtimeInLab, registries)).toHaveLength(1);
  });

  it('limits highlights in titles and prose, ignoring code', () => {
    const w = (n: number): string => Array(n).fill('w').join(' ');
    const prose = (body: string): Lesson =>
      withSteps(validSteps.map((s) => (s.id === 'hook' && s.kind === 'hook' ? { ...s, body } : s)));
    expect(highlightLimits(prose('==a== and ==b==.'), registries)).toEqual([]);
    expect(highlightLimits(prose('==a== ==b== ==c=='), registries)).toHaveLength(1);
    expect(highlightLimits(prose(`==${w(7)}==`), registries)).toHaveLength(1);
    expect(highlightLimits(prose(`==${w(6)}==`), registries)).toEqual([]);
    const code = withSteps(
      validSteps.map((s) => (s.kind === 'explain' ? { ...s, code: 'a == b == c == d == e' } : s)),
    );
    expect(highlightLimits(code, registries)).toEqual([]);
    expect(highlightLimits({ ...validLesson, titleHighlights: ['Joins'] }, registries)).toEqual([]);
    expect(highlightLimits({ ...validLesson, titleHighlights: [w(7)] }, registries)).toHaveLength(
      1,
    );
  });

  it('reports the step index', () => {
    const [issue] = marginCount(brokenFixtures['dl1-margin-count'] as Lesson, registries);
    expect(issue?.stepIndex).toBe(0);
    expect(issue?.stepId).toBe('hook');
  });
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
