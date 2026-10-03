import { afterAll, describe, expect, it } from 'vitest';
import { createInlineEngine } from './inline';
import type { SqlOutcome } from './types';

const engine = createInlineEngine();
const session = await engine.open('');
afterAll(() => session.close());

async function one(expr: string): Promise<string | null> {
  const out: SqlOutcome = await session.execute(`select ${expr}`);
  if (!out.ok) throw new Error(out.message);
  const cell = out.result.rows[0]?.[0];
  return typeof cell === 'string' || cell === null ? cell : String(cell);
}

const CASES: readonly (readonly [string, string, string | null])[] = [
  ['date', "date '2024-03-10'", '2024-03-10'],
  ['timestamp', "timestamp '2024-03-10 12:00:00'", '2024-03-10 12:00:00'],
  ['timestamp fraction', "timestamp '2024-03-10 12:00:00.5'", '2024-03-10 12:00:00.5'],
  ['timestamptz', "timestamptz '2024-03-10 12:00:00+02'", '2024-03-10 10:00:00+00'],
  ['time', "time '12:34:56'", '12:34:56'],
  ['interval', "interval '1 day 2 hours'", '1 day 02:00:00'],
  ['numeric', "1.50::numeric", '1.50'],
  ['bigint', "9007199254740993::bigint", '9007199254740993'],
  ['boolean true', 'true', 't'],
  ['boolean false', 'false', 'f'],
  ['int array', 'array[1,2,3]', '{1,2,3}'],
  ['text array', "array['a','b c']", '{a,"b c"}'],
  ['date array', "array[date '2024-03-10']", '{2024-03-10}'],
  ['json', `'{"a": 1,  "b": [true]}'::json`, '{"a": 1,  "b": [true]}'],
  ['jsonb', `'{"a": 1,  "b": [true]}'::jsonb`, '{"a": 1, "b": [true]}'],
  ['float', "1.5::float8", '1.5'],
  ['integer', '42', '42'],
  ['text', "'hi'", 'hi'],
  ['null', 'null::date', null],
];

describe('values are shown as PostgreSQL prints them', () => {
  it.each(CASES)('%s', async (_name, expr, expected) => {
    expect(await one(expr)).toBe(expected);
  });

  it('uses UTC for the session time zone', async () => {
    expect(await one('current_setting(\'TimeZone\')')).toBe('UTC');
  });
});
