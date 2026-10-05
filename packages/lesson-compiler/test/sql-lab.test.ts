import { describe, expect, it } from 'vitest';
import { COMPARE_CASES } from '@learn-code/sql-engine';
import { checkSqlLab } from '../src/verify/sql-lab';

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

describe('checkSqlLab uses the shared comparer', () => {
  it.each(COMPARE_CASES)(
    'check path: $name',
    async (c) => {
      const issues = await checkSqlLab({
        seed: c.seed,
        solution: c.solution,
        starter: c.attempt,
        orderMatters: c.orderMatters,
      });
      // A starter that matches the reference is reported; one that differs is accepted.
      expect(issues.includes('the starter already passes; it must fail')).toBe(c.match);
    },
    60_000,
  );

  it('fails a reference result above the row cap', async () => {
    const issues = await checkSqlLab({
      seed: '',
      solution: 'select g from generate_series(1, 501) g',
      starter: '',
      orderMatters: false,
    });
    expect(issues).toHaveLength(1);
    expect(issues[0]).toContain('row cap');
  }, 60_000);
});
