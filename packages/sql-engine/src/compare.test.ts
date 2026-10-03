import { describe, expect, it } from 'vitest';
import { compareResults } from './compare';
import type { SqlResult } from './types';

const res = (columns: string[], rows: unknown[][], rowCount = rows.length): SqlResult => ({
  columns,
  rows,
  rowCount,
});

describe('compareResults', () => {
  const expected = res(
    ['name', 'title'],
    [
      ['Ada', 'Notes'],
      ['Ada', 'More'],
      ['Linus', 'Kernel'],
    ],
  );

  it('matches the same rows in a different order when order does not matter', () => {
    const actual = res(
      ['name', 'title'],
      [
        ['Linus', 'Kernel'],
        ['Ada', 'More'],
        ['Ada', 'Notes'],
      ],
    );
    expect(compareResults(expected, actual, false).match).toBe(true);
  });

  it('fails on a different order when order matters, and says so', () => {
    const actual = res(
      ['name', 'title'],
      [
        ['Linus', 'Kernel'],
        ['Ada', 'More'],
        ['Ada', 'Notes'],
      ],
    );
    const d = compareResults(expected, actual, true);
    expect(d.match).toBe(false);
    expect(d.orderMismatch).toBe(true);
    expect(d.missingRows).toEqual([]);
  });

  it('compares column names case-insensitively and ignores column order', () => {
    const actual = res(
      ['TITLE', 'Name'],
      [
        ['Notes', 'Ada'],
        ['More', 'Ada'],
        ['Kernel', 'Linus'],
      ],
    );
    expect(compareResults(expected, actual, false).match).toBe(true);
  });

  it('reports missing and extra rows', () => {
    const actual = res(
      ['name', 'title'],
      [
        ['Ada', 'Notes'],
        ['Ada', 'Notes'],
        ['Linus', 'Kernel'],
      ],
    );
    const d = compareResults(expected, actual, false);
    expect(d.match).toBe(false);
    expect(d.missingRows).toEqual([['Ada', 'More']]);
    expect(d.extraRows).toEqual([['Ada', 'Notes']]);
  });

  it('treats duplicate rows as a multiset (a join that multiplies rows is wrong)', () => {
    const one = res(['n'], [['1']]);
    const two = res(['n'], [['1'], ['1']]);
    expect(compareResults(one, two, false).match).toBe(false);
    expect(compareResults(two, one, false).missingRows).toEqual([['1']]);
  });

  it('reports wrong columns and skips the row diff', () => {
    const actual = res(['name', 'price'], [['Ada', '1']]);
    const d = compareResults(expected, actual, false);
    expect(d.match).toBe(false);
    expect(d.missingColumns).toEqual(['title']);
    expect(d.extraColumns).toEqual(['price']);
    expect(d.missingRows).toEqual([]);
  });

  it('distinguishes null from the string "null"', () => {
    expect(compareResults(res(['a'], [[null]]), res(['a'], [['null']]), false).match).toBe(false);
  });

  it('refuses to match a result cut by the row cap', () => {
    const d = compareResults(res(['a'], [['1']], 1), res(['a'], [['1']], 900), false);
    expect(d.match).toBe(false);
    expect(d.truncated).toBe(true);
  });

  it('handles an empty expected result', () => {
    expect(compareResults(res(['a'], []), res(['a'], []), true).match).toBe(true);
    expect(compareResults(res(['a'], []), res(['a'], [['1']]), true).match).toBe(false);
  });
});
