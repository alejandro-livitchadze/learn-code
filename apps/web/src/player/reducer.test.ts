import { describe, expect, it } from 'vitest';
import type { Step } from '@learn-code/lesson-schema';
import { gateIndex, initialState, isLessonComplete, reduce, sanitize } from './reducer';
import type { StepResult } from '@learn-code/widgets';
import type { PlayerState } from './types';

const base = { estSeconds: 10, concepts: [] };
const steps: readonly Step[] = [
  { ...base, id: 'h', kind: 'hook', body: 'x' },
  { ...base, id: 'p', kind: 'brainPower', question: 'q', minChars: 1, explanation: 'e' },
  { ...base, id: 'e', kind: 'explain', body: 'b', annotations: [] },
  { ...base, id: 'r', kind: 'recap', points: ['a', 'b', 'c'] },
];
const answered: StepResult = { status: 'answered', correct: true, attempts: 1, payload: null };
const start = initialState('c/l', steps);

describe('initialState', () => {
  it('marks a leading passive step as viewed', () => {
    expect(start).toEqual({ lessonId: 'c/l', index: 0, results: { h: { status: 'viewed' } } });
  });
  it('leaves a leading active step open', () => {
    expect(initialState('c/l', steps.slice(1)).results).toEqual({});
  });
  it('handles an empty lesson', () => {
    expect(initialState('c/l', [])).toEqual({ lessonId: 'c/l', index: 0, results: {} });
  });
});

describe('next', () => {
  it('moves from a passive step and enters an active step without a result', () => {
    const s = reduce(steps, start, { type: 'next' });
    expect(s.index).toBe(1);
    expect(s.results['p']).toBeUndefined();
  });
  it('is ignored while the active step has no result', () => {
    const at = reduce(steps, start, { type: 'next' });
    expect(reduce(steps, at, { type: 'next' })).toBe(at);
  });
  it('advances once the active step has a result, marking the passive step viewed', () => {
    let s = reduce(steps, start, { type: 'next' });
    s = reduce(steps, s, { type: 'complete', stepId: 'p', result: answered });
    s = reduce(steps, s, { type: 'next' });
    expect(s.index).toBe(2);
    expect(s.results['e']).toEqual({ status: 'viewed' });
  });
  it('does not overwrite an existing result when entering a passive step', () => {
    const s: PlayerState = { lessonId: 'c/l', index: 1, results: { p: answered, e: answered } };
    expect(reduce(steps, s, { type: 'next' }).results['e']).toBe(answered);
  });
  it('stops at the last step', () => {
    const s: PlayerState = { lessonId: 'c/l', index: 3, results: {} };
    expect(reduce(steps, s, { type: 'next' })).toBe(s);
  });
  it('is ignored when the index is out of range', () => {
    const s: PlayerState = { lessonId: 'c/l', index: -1, results: {} };
    expect(reduce(steps, s, { type: 'next' })).toBe(s);
  });
});

describe('back', () => {
  it('is allowed from an unanswered active step', () => {
    const at = reduce(steps, start, { type: 'next' });
    expect(reduce(steps, at, { type: 'back' }).index).toBe(0);
  });
  it('stops at the first step', () => {
    expect(reduce(steps, start, { type: 'back' })).toBe(start);
  });
  it('keeps results so a completed step shows its answered state', () => {
    let s = reduce(steps, start, { type: 'next' });
    s = reduce(steps, s, { type: 'complete', stepId: 'p', result: answered });
    s = reduce(steps, s, { type: 'back' });
    s = reduce(steps, s, { type: 'next' });
    expect(s.results['p']).toBe(answered);
  });
});

describe('complete', () => {
  it('records the result', () => {
    const s = reduce(steps, start, { type: 'complete', stepId: 'p', result: answered });
    expect(s.results['p']).toBe(answered);
  });
  it('ignores unknown step ids', () => {
    expect(reduce(steps, start, { type: 'complete', stepId: 'zzz', result: answered })).toBe(start);
  });
});

describe('restore', () => {
  it('restores index and results', () => {
    const stored: PlayerState = {
      lessonId: 'c/l',
      index: 2,
      results: { h: { status: 'viewed' }, p: answered },
    };
    const s = reduce(steps, start, { type: 'restore', state: stored });
    expect(s.index).toBe(2);
    expect(s.results['p']).toBe(answered);
    expect(s.results['e']).toEqual({ status: 'viewed' });
  });
  it('cannot skip an unanswered active step through a stored index', () => {
    const forged: PlayerState = { lessonId: 'c/l', index: 3, results: {} };
    expect(reduce(steps, start, { type: 'restore', state: forged }).index).toBe(1);
  });
  it('clamps a negative index and drops unknown result ids', () => {
    const stored: PlayerState = { lessonId: 'c/l', index: -5, results: { ghost: answered } };
    const s = reduce(steps, start, { type: 'restore', state: stored });
    expect(s.index).toBe(0);
    expect(s.results['ghost']).toBeUndefined();
  });
  it('ignores state of another lesson', () => {
    const other: PlayerState = { lessonId: 'c/other', index: 2, results: {} };
    expect(reduce(steps, start, { type: 'restore', state: other })).toBe(start);
  });
});

describe('helpers', () => {
  it('gateIndex returns the last step when nothing is open', () => {
    expect(gateIndex(steps.slice(0, 1), {})).toBe(0);
    expect(gateIndex([], {})).toBe(0);
  });
  it('sanitize truncates a fractional index', () => {
    expect(sanitize(steps, { lessonId: 'c/l', index: 0.9, results: {} }).index).toBe(0);
  });
  it('isLessonComplete needs a result for every step', () => {
    expect(isLessonComplete(steps, start)).toBe(false);
    expect(isLessonComplete([], start)).toBe(false);
    const all: PlayerState = {
      lessonId: 'c/l',
      index: 3,
      results: { h: answered, p: answered, e: answered, r: answered },
    };
    expect(isLessonComplete(steps, all)).toBe(true);
  });
});

it('rejects unknown actions at runtime by returning them as-is', () => {
  const bogus = { type: 'nope' } as never;
  expect(reduce(steps, start, bogus)).toBe(bogus);
});
