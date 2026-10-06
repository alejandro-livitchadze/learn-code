import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import * as prettier from 'prettier';
import { afterAll, describe, expect, it } from 'vitest';
import {
  checkTraces,
  findTraceSpecs,
  generateFromFiles,
  generateTrace,
  parseTraceSpec,
  serializeTrace,
} from './index';
import type { TraceSpec } from './types';

const CONTENT = resolve(import.meta.dirname, '../../../../content');

const SEED = `
create table a (id int primary key, k int);
create table b (id int primary key, k int);
insert into a values (1, 1), (2, 2), (3, 9);
insert into b values (10, 1), (11, 1), (12, 2);
`;
const spec: TraceSpec = {
  ref: 't',
  seed: 's',
  query: 'select a.id, b.id from a left join b on b.k = a.k order by a.id, b.id',
  joinKind: 'left',
  on: 'r.k = l.k',
  left: { table: 'a', id: 'id' },
  right: { table: 'b', id: 'id' },
};

describe('parseTraceSpec', () => {
  it('accepts a complete spec', () => {
    expect(parseTraceSpec(spec)).toEqual(spec);
  });
  it('lists every problem of a bad spec', () => {
    const bad = parseTraceSpec({
      ref: 'Bad Ref',
      joinKind: 'cross',
      left: { table: 'a b', id: 'id' },
    });
    expect(Array.isArray(bad)).toBe(true);
    expect((bad as readonly string[]).join('\n')).toMatch(
      /ref[\s\S]*seed[\s\S]*query[\s\S]*joinKind[\s\S]*left\.table[\s\S]*right/,
    );
  });
  it('rejects things that are not objects', () => {
    expect(parseTraceSpec(null)).toEqual(['the spec must be a JSON object']);
    expect(parseTraceSpec([])).toEqual(['the spec must be a JSON object']);
  });
});

describe('generateTrace on PGlite', () => {
  it('records left join pairs with a null for the unmatched row and the real result', async () => {
    const t = await generateTrace(spec, SEED);
    expect(t.pairs).toEqual([
      { left: 0, right: 0 },
      { left: 0, right: 1 },
      { left: 1, right: 2 },
      { left: 2, right: null },
    ]);
    expect(t.result.rows).toEqual([
      ['1', '10'],
      ['1', '11'],
      ['2', '12'],
      ['3', 'NULL'],
    ]);
    expect(t.left.rows).toEqual([
      ['1', '1'],
      ['2', '2'],
      ['3', '9'],
    ]);
  });
  it('drops the unmatched row for an inner join', async () => {
    const t = await generateTrace(
      { ...spec, joinKind: 'inner', query: spec.query.replace('left join', 'inner join') },
      SEED,
    );
    expect(t.pairs.map((p) => p.left)).toEqual([0, 0, 1]);
    expect(t.pairs.every((p) => p.right !== null)).toBe(true);
  });
  it('fails when the query is not the join the spec describes', async () => {
    await expect(generateTrace({ ...spec, query: 'select id from a' }, SEED)).rejects.toThrow(
      /returned 3 rows/,
    );
  });
  it('fails on a missing id column and on a SQL error', async () => {
    await expect(
      generateTrace({ ...spec, left: { table: 'a', id: 'nope' } }, SEED),
    ).rejects.toThrow();
    await expect(generateTrace({ ...spec, on: 'r.zzz = l.k' }, SEED)).rejects.toThrow(/zzz/);
  });
  it('fails when an id column repeats', async () => {
    await expect(
      generateTrace(
        { ...spec, left: { table: 'a', id: 'k' }, right: { table: 'b', id: 'k' } },
        SEED,
      ),
    ).rejects.toThrow(/unique/);
  });
});

describe('committed traces', () => {
  it('has the three join variants', () => {
    const refs = findTraceSpecs(CONTENT).map((f) => f.tracePath.split('/').pop());
    expect(refs).toEqual(
      expect.arrayContaining([
        'join-inner.trace.json',
        'join-left.trace.json',
        'join-multiply.trace.json',
      ]),
    );
  });
  it('match what PostgreSQL produces now', async () => {
    expect(await checkTraces(CONTENT)).toEqual([]);
  });
  it('the multiplying variant really multiplies, the left variant really keeps unmatched rows', async () => {
    const byRef = async (ref: string) => {
      const f = findTraceSpecs(CONTENT).find((x) => x.specPath.endsWith(`${ref}.spec.json`));
      if (f === undefined) throw new Error(ref);
      return generateFromFiles(f);
    };
    const multiply = await byRef('join-multiply');
    expect(multiply.pairs.length).toBeGreaterThan(multiply.left.rows.length);
    const left = await byRef('join-left');
    expect(left.pairs.some((p) => p.right === null)).toBe(true);
    const inner = await byRef('join-inner');
    expect(inner.pairs.some((p) => p.right === null)).toBe(false);
  });
});

describe('serializeTrace', () => {
  it('output is prettier-stable and matches the committed files', async () => {
    const specs = findTraceSpecs(CONTENT);
    expect(specs.length).toBeGreaterThan(0);
    for (const files of specs) {
      const text = await serializeTrace(await generateFromFiles(files), files.tracePath);
      const options = await prettier.resolveConfig(files.tracePath);
      expect(await prettier.check(text, { ...options, filepath: files.tracePath })).toBe(true);
      expect(text).toBe(readFileSync(files.tracePath, 'utf8'));
    }
  });
});

describe('checkTraces', () => {
  const dir = mkdtempSync(join(tmpdir(), 'traces-'));
  afterAll(() => rmSync(dir, { recursive: true, force: true }));
  it('reports a stale and a missing trace', async () => {
    cpSync(join(CONTENT, 'fullstack/joins-01'), join(dir, 'fullstack/joins-01'), {
      recursive: true,
    });
    const stale = join(dir, 'fullstack/joins-01/traces/join-inner.trace.json');
    writeFileSync(stale, readFileSync(stale, 'utf8').replace('"Anna"', '"Anya"'));
    rmSync(join(dir, 'fullstack/joins-01/traces/join-left.trace.json'));
    const problems = await checkTraces(dir);
    expect(problems).toHaveLength(2);
    expect(problems.join('\n')).toMatch(/join-inner[\s\S]*differs/);
    expect(problems.join('\n')).toMatch(/join-left[\s\S]*missing/);
  });
});
