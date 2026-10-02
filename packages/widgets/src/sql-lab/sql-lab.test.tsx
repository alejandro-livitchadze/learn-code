import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { sqlLabStep } from '@learn-code/lesson-schema';
import { createFakeEngine, type SqlOutcome, type SqlResult } from '@learn-code/sql-engine';
import { compareResults } from './compare';
import { LabController } from './controller';
import { diagnosticRange } from './editor-range';
import { SCHEMA_QUERY, groupSchema, mayChangeSchema } from './schema';
import { createSqlLab } from './SqlLab';

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

describe('diagnosticRange', () => {
  it('marks the word at the reported 1-based position', () => {
    expect(diagnosticRange('select * form books', 10)).toEqual({ from: 9, to: 13 });
  });
  it('marks one character on punctuation and clamps past the end', () => {
    expect(diagnosticRange('select (', 8)).toEqual({ from: 7, to: 8 });
    expect(diagnosticRange('select', 99)).toEqual({ from: 5, to: 6 });
    expect(diagnosticRange('', 3)).toEqual({ from: 0, to: 0 });
  });
});

describe('schema helpers', () => {
  it('groups information_schema rows by table in order', () => {
    const tables = groupSchema(
      res(
        ['table_name', 'column_name', 'data_type', 'is_nullable'],
        [
          ['authors', 'id', 'integer', 'NO'],
          ['authors', 'name', 'text', 'YES'],
          ['books', 'id', 'integer', 'NO'],
        ],
      ),
    );
    expect(tables.map((t) => t.name)).toEqual(['authors', 'books']);
    expect(tables[0]?.columns).toEqual([
      { name: 'id', type: 'integer', nullable: false },
      { name: 'name', type: 'text', nullable: true },
    ]);
  });
  it('detects statements that may change the schema', () => {
    expect(mayChangeSchema('CREATE TABLE t (a int)')).toBe(true);
    expect(mayChangeSchema('select * from created_at')).toBe(false);
  });
});

/** A fake database: maps a query to the rows it should return. */
function scripted(table: Record<string, SqlOutcome>) {
  return createFakeEngine({
    respond: (sql) => {
      if (sql === SCHEMA_QUERY) {
        return {
          ok: true,
          result: res(
            ['table_name', 'column_name', 'data_type', 'is_nullable'],
            [['books', 'id', 'integer', 'NO']],
          ),
        };
      }
      return table[sql] ?? { ok: false, sqlState: '42601', message: 'syntax error', position: 1 };
    },
  });
}
const ok = (columns: string[], rows: unknown[][]): SqlOutcome => ({
  ok: true,
  result: res(columns, rows),
});

describe('LabController', () => {
  const solution = 'select a from t order by a';
  const engine = () =>
    scripted({
      [solution]: ok(['a'], [['1'], ['2']]),
      right: ok(['A'], [['2'], ['1']]),
      wrong: ok(['a'], [['1']]),
    });
  const config = (e: ReturnType<typeof engine>, orderMatters = false) => ({
    engine: e,
    seedSql: 'seed',
    solution,
    orderMatters,
  });

  it('accepts the first matching result and counts every attempt', async () => {
    const e = engine();
    const lab = new LabController(config(e));
    await lab.start();
    const bad = await lab.run('wrong');
    expect(bad.report.correct).toBe(false);
    expect(bad.report.diff?.missingRows).toEqual([['2']]);
    const syntax = await lab.run('nonsense');
    expect(syntax.report.outcome.ok).toBe(false);
    expect(syntax.report.attempts).toBe(2);
    const good = await lab.run('right');
    expect(good.report.correct).toBe(true);
    expect(good.report.attempts).toBe(3);
  });

  it('runs the reference once, then resets to the seed before the learner starts', async () => {
    const e = engine();
    const lab = new LabController(config(e));
    const schema = await lab.start();
    expect(e.executed[0]).toBe(solution);
    expect(e.resets).toBe(1);
    expect(schema).toEqual([
      { name: 'books', columns: [{ name: 'id', type: 'integer', nullable: false }] },
    ]);
    await lab.close();
    expect(e.closed).toBe(1);
  });

  it('honours orderMatters', async () => {
    const lab = new LabController(config(engine(), true));
    await lab.start();
    expect((await lab.run('right')).report.diff?.orderMismatch).toBe(true);
  });

  it('fails to start when the reference query fails', async () => {
    const e = scripted({});
    await expect(new LabController(config(e)).start()).rejects.toThrow('reference query failed');
  });

  it('refreshes the schema after DDL only', async () => {
    const e = scripted({
      [solution]: ok(['a'], []),
      'create table x (a int)': ok([], []),
    });
    const lab = new LabController(config(e));
    await lab.start();
    expect((await lab.run('create table x (a int)')).schema).toBeDefined();
    expect((await lab.run('select 1')).schema).toBeUndefined();
  });
});

describe('SqlLab widget', () => {
  const step = sqlLabStep.parse({
    id: 's1',
    kind: 'sqlLab',
    estSeconds: 60,
    concepts: ['joins'],
    prompt: 'List every **book** with its author.',
    seedRef: 'library',
    starter: 'select 1',
    solution: 'select 1',
    orderMatters: false,
    hints: ['Join on author_id.'],
  });
  const Lab = createSqlLab({
    getEngine: () => Promise.reject(new Error('not used during server render')),
    loadSeed: () => Promise.resolve(''),
  });

  it('renders the prompt, controls and a solved state without loading an engine', () => {
    const html = renderToString(
      <Lab
        step={step}
        restored={{ status: 'answered', correct: true, attempts: 2, payload: { sql: 'select 2' } }}
        onComplete={() => undefined}
      />,
    );
    expect(html).toContain('Reset database');
    expect(html).toContain('Run (Ctrl+Enter)');
    expect(html).toContain('<strong>book</strong>');
    expect(html).toContain('Correct. Your query returns the expected result.');
  });
});
