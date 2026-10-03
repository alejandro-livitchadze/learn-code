import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { sqlLabStep } from '@learn-code/lesson-schema';
import {
  COMPARE_CASES,
  createFakeEngine,
  createInlineEngine,
  type SqlOutcome,
  type SqlResult,
} from '@learn-code/sql-engine';
import { compareResults } from '@learn-code/sql-engine/compare';
import { LabController } from './controller';
import { diagnosticRange } from './editor-range';
import { SCHEMA_QUERY, groupSchema, mayChangeSchema } from './schema';
import { DiffView, createSqlLab } from './SqlLab';

const res = (columns: string[], rows: unknown[][], rowCount = rows.length): SqlResult => ({
  columns,
  rows,
  rowCount,
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

describe('DiffView', () => {
  it('uses the expected column order as headers when the learner reordered columns', () => {
    const expected = res(['name', 'title'], [['Ada', 'Notes']]);
    const actual = res(['title', 'name'], [['More', 'Ada']]);
    const diff = compareResults(expected, actual, false);
    expect(diff.match).toBe(false);
    const html = renderToString(<DiffView diff={diff} />);
    const headers = [...html.matchAll(/<th>(.*?)<\/th>/g)].map((m) => m[1]);
    expect(headers).toEqual(['name', 'title', 'name', 'title']);
    expect(html).toContain('<td>Ada</td><td>Notes</td>');
    expect(html).toContain('<td>Ada</td><td>More</td>');
  });
});

describe('shared comparer cases', () => {
  it.each(COMPARE_CASES)(
    'widget path: $name',
    async (c) => {
      const lab = new LabController({
        engine: createInlineEngine(),
        seedSql: c.seed,
        solution: c.solution,
        orderMatters: c.orderMatters,
      });
      await lab.start();
      try {
        const { report } = await lab.run(c.attempt);
        expect(report.correct).toBe(c.match);
      } finally {
        await lab.close();
      }
    },
    60_000,
  );
});
