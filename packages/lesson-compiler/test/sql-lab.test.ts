import { describe, expect, it } from 'vitest';
import { checkSqlLab, sameSqlResult } from '../src/verify/sql-lab';

const result = (columns: string[], rows: unknown[][]) => ({
  columns,
  rows,
  rowCount: rows.length,
});

describe('sameSqlResult', () => {
  it('ignores case and column order, and row order unless it matters', () => {
    const a = result(
      ['Id', 'name'],
      [
        ['1', 'a'],
        ['2', 'b'],
      ],
    );
    const b = result(
      ['NAME', 'id'],
      [
        ['b', '2'],
        ['a', '1'],
      ],
    );
    expect(sameSqlResult(a, b, false)).toBe(true);
    expect(sameSqlResult(a, b, true)).toBe(false);
  });
  it('rejects different columns, row counts and duplicated rows', () => {
    const a = result(['id'], [['1'], ['1'], ['2']]);
    expect(sameSqlResult(a, result(['x'], [['1'], ['1'], ['2']]), false)).toBe(false);
    expect(sameSqlResult(a, result(['id'], [['1'], ['2']]), false)).toBe(false);
    expect(sameSqlResult(a, result(['id'], [['1'], ['2'], ['2']]), false)).toBe(false);
  });
});

const seed = 'create table t (id int); insert into t values (1), (2), (3);';

describe('checkSqlLab (inline sql-engine adapter)', () => {
  it('accepts a stable reference and a starter that differs', async () => {
    const issues = await checkSqlLab({
      seed,
      solution: 'select count(*) as n from t',
      starter: 'select * from t',
      orderMatters: false,
    });
    expect(issues).toEqual([]);
  });
  it('flags a starter that returns the expected rows, even with other column case', async () => {
    const issues = await checkSqlLab({
      seed,
      solution: 'select id from t',
      starter: 'select id as "ID" from t order by id desc',
      orderMatters: false,
    });
    expect(issues).toEqual(['the starter already passes; it must fail']);
  });
  it('treats row order as significant only when asked', async () => {
    const base = {
      seed,
      solution: 'select id from t order by id',
      starter: 'select id from t order by id desc',
    };
    expect(await checkSqlLab({ ...base, orderMatters: true })).toEqual([]);
    expect(await checkSqlLab({ ...base, orderMatters: false })).toHaveLength(1);
  });
  it('reports a failing reference and an unstable one', async () => {
    const broken = await checkSqlLab({
      seed,
      solution: 'select nope',
      starter: '',
      orderMatters: false,
    });
    expect(broken[0]).toContain('reference solution failed');
    const unstable = await checkSqlLab({
      seed,
      solution: 'select random() as r',
      starter: '',
      orderMatters: false,
    });
    expect(unstable[0]).toContain('same rows after a database reset');
  });
  it('accepts a starter that errors or is empty', async () => {
    const base = { seed, solution: 'select id from t', orderMatters: false };
    expect(await checkSqlLab({ ...base, starter: 'select nope' })).toEqual([]);
    expect(await checkSqlLab({ ...base, starter: '' })).toEqual([]);
  });
});
