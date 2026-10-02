import { describe, expect, it } from 'vitest';
import { step as stepSchema, type Step } from '@learn-code/lesson-schema';
import {
  checkFillBlanks,
  checkPredict,
  correctPredictIndex,
  humanizeMisconception,
  normalizeAnswer,
  parseTemplate,
  readAnswers,
  readChosen,
} from './check';
import { fixtures } from './fixtures';
import type { StepOfKind } from './types';

function fill(): StepOfKind<'fillBlanks'> {
  const f = fixtures.find((x) => x.id === 'fill-wrong')?.step;
  if (f?.kind !== 'fillBlanks') throw new Error('fixture missing');
  return f;
}
function predict(): StepOfKind<'predict'> {
  const f = fixtures.find((x) => x.id === 'predict-idle')?.step;
  if (f?.kind !== 'predict') throw new Error('fixture missing');
  return f;
}

describe('fixtures', () => {
  it.each(fixtures.map((f) => [f.id, f.step] as const))('%s is a valid step', (_id, s: Step) => {
    expect(stepSchema.safeParse(s).success).toBe(true);
  });
  it('has unique step ids', () => {
    const ids = fixtures.map((f) => f.step.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('checkPredict', () => {
  it('accepts the correct option', () => {
    const s = predict();
    expect(checkPredict(s, correctPredictIndex(s)).correct).toBe(true);
  });
  it('rejects a wrong option, returns its feedback and misconception', () => {
    const r = checkPredict(predict(), 0);
    expect(r.correct).toBe(false);
    expect(r.feedback).toContain('filtered');
    expect(r.misconception).toBe('left-join-keeps-unmatched-rows');
  });
  it('rejects an out of range index', () => {
    expect(checkPredict(predict(), 9)).toEqual({ correct: false, feedback: '' });
  });
});

describe('humanizeMisconception', () => {
  it('turns ids into words', () => {
    expect(humanizeMisconception('inner-join_keeps-all')).toBe('inner join keeps all');
  });
});

describe('normalizeAnswer', () => {
  it('collapses whitespace and ignores it around punctuation', () => {
    expect(normalizeAnswer('  a   =  b ', false)).toBe('a=b');
    expect(normalizeAnswer('count( * )', false)).toBe('count(*)');
  });
  it('keeps one space between words', () => {
    expect(normalizeAnswer('group   by', false)).toBe('group by');
    expect(normalizeAnswer('groupby', false)).not.toBe(normalizeAnswer('group by', false));
  });
  it('lowercases only when asked', () => {
    expect(normalizeAnswer('LEFT', true)).toBe('left');
    expect(normalizeAnswer('LEFT', false)).toBe('LEFT');
  });
});

describe('parseTemplate', () => {
  it('splits text and blanks', () => {
    expect(parseTemplate('a ___x___ b ___y-1___')).toEqual([
      { kind: 'text', text: 'a ' },
      { kind: 'blank', id: 'x' },
      { kind: 'text', text: ' b ' },
      { kind: 'blank', id: 'y-1' },
    ]);
  });
  it('returns plain text when there are no blanks', () => {
    expect(parseTemplate('abc')).toEqual([{ kind: 'text', text: 'abc' }]);
  });
});

describe('checkFillBlanks', () => {
  it('accepts correct answers, ignoring whitespace and sql case', () => {
    expect(checkFillBlanks(fill(), { kw: ' LEFT ', g: 'Group' }).correct).toBe(true);
  });
  it('rejects wrong and empty answers and reports feedback per blank', () => {
    const r = checkFillBlanks(fill(), { kw: 'inner', g: '' });
    expect(r.correct).toBe(false);
    expect(r.blanks.map((b) => b.correct)).toEqual([false, false]);
    expect(r.blanks[0]?.feedback).toContain('keep users');
  });
  it('accepts any of several accepted answers', () => {
    const f = fixtures.find((x) => x.id === 'fill-idle')?.step;
    if (f?.kind !== 'fillBlanks') throw new Error('fixture missing');
    expect(checkFillBlanks(f, { kw: 'left outer' }).correct).toBe(true);
    expect(checkFillBlanks(f, { kw: 'left   outer' }).correct).toBe(true);
    expect(checkFillBlanks(f, { kw: 'right' }).blanks[0]?.misconception).toBe(
      'inner-join-keeps-all-rows',
    );
  });
  it('compares non-sql languages exactly', () => {
    const f = fixtures.find((x) => x.id === 'fill-long')?.step;
    if (f?.kind !== 'fillBlanks') throw new Error('fixture missing');
    expect(checkFillBlanks(f, { m: 'map', j: 'join' }).correct).toBe(true);
    expect(checkFillBlanks(f, { m: 'Map', j: 'join' }).correct).toBe(false);
  });
});

describe('payload readers', () => {
  it('reads valid payloads', () => {
    expect(readChosen({ chosen: 2 })).toBe(2);
    expect(readAnswers({ answers: { a: 'x' } })).toEqual({ a: 'x' });
  });
  it('rejects malformed payloads', () => {
    expect(readChosen(null)).toBeUndefined();
    expect(readChosen({ chosen: -1 })).toBeUndefined();
    expect(readChosen({ chosen: 'a' })).toBeUndefined();
    expect(readAnswers('x')).toBeUndefined();
    expect(readAnswers({ answers: { a: 1 } })).toBeUndefined();
    expect(readAnswers({})).toBeUndefined();
  });
});
