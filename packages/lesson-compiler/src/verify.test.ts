import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { Lesson } from '@learn-code/lesson-schema';
import { compileSource, formatError, verifySamples } from './index';

const dir = join(dirname(fileURLToPath(import.meta.url)), '__fixtures__');
const path = join(dir, 'lesson.mdoc');
const source = readFileSync(path, 'utf8')
  .replace('./samples/join.sql', './samples/date.sql')
  .replace('output="100 rows"', 'output="2024-03-11"')
  .replace('output="400 rows"', 'output="2024-03-10"');

describe('predict with a date output', () => {
  it('passes when the declared output is the date PostgreSQL prints', async () => {
    const r = compileSource(source, path);
    if (!r.ok) throw new Error(r.errors.map(formatError).join('\n'));
    const issues = await verifySamples(r.lesson, dir);
    expect(issues.filter((i) => i.stepId === 'p1')).toEqual([]);
  });

  it('fails when the declared output is an ISO timestamp', async () => {
    const r = compileSource(
      source.replace('output="2024-03-10"', 'output="2024-03-10T00:00:00.000Z"'),
      path,
    );
    if (!r.ok) throw new Error(r.errors.map(formatError).join('\n'));
    const issues = await verifySamples(r.lesson, dir);
    expect(issues.filter((i) => i.stepId === 'p1')).toHaveLength(1);
  });
});

describe('beTheDatabase verification', () => {
  const real = join(dir, '..', '..', '..', '..', 'content', 'fullstack', 'joins-01');
  type Trace = {
    query: string;
    left: { name: string; columns: string[]; rows: string[][] };
    right: { name: string; columns: string[]; rows: string[][] };
  };

  /** A temp lesson dir holding the real join-inner spec, trace and seed, optionally altered. */
  function setup(opts: { spec?: boolean; trace?: boolean; edit?: (t: Trace) => void } = {}) {
    const root = mkdtempSync(join(tmpdir(), 'btd-'));
    mkdirSync(join(root, 'traces'));
    mkdirSync(join(root, 'seeds'));
    cpSync(join(real, 'seeds'), join(root, 'seeds'), { recursive: true });
    if (opts.spec !== false) {
      cpSync(
        join(real, 'traces', 'join-inner.spec.json'),
        join(root, 'traces', 'join-inner.spec.json'),
      );
    }
    const trace: Trace = JSON.parse(
      readFileSync(join(real, 'traces', 'join-inner.trace.json'), 'utf8'),
    );
    const step = {
      id: 'b1',
      kind: 'beTheDatabase',
      estSeconds: 60,
      concepts: [],
      query: trace.query,
      tables: [trace.left, trace.right].map((t) => structuredClone(t)),
      traceRef: 'join-inner',
      prompt: 'Pair the rows.',
    };
    return { root, trace, step };
  }

  async function run(
    opts: Parameters<typeof setup>[0] = {},
    editStep?: (s: ReturnType<typeof setup>['step']) => void,
  ): Promise<string[]> {
    const { root, trace, step } = setup(opts);
    const written: Trace = structuredClone(trace);
    opts.edit?.(written);
    if (opts.trace !== false) {
      writeFileSync(join(root, 'traces', 'join-inner.trace.json'), JSON.stringify(written));
    }
    editStep?.(step);
    // Only `steps` is read by verifySamples; the schema's 8-step minimum is irrelevant here.
    const lesson = { steps: [step] } as unknown as Lesson;
    const issues = await verifySamples(lesson, root);
    rmSync(root, { recursive: true, force: true });
    return issues.map((i) => i.message);
  }

  it('passes for a fresh trace that matches the step', async () => {
    expect(await run()).toEqual([]);
  });

  it('fails when the spec is missing', async () => {
    expect(await run({ spec: false })).toEqual([
      'trace spec "traces/join-inner.spec.json" does not exist',
    ]);
  });

  it('fails when the trace is missing', async () => {
    const [m] = await run({ trace: false });
    expect(m).toContain('trace "traces/join-inner.trace.json" is missing');
  });

  it('fails when the recorded trace is stale', async () => {
    const messages = await run({
      edit: (t) => {
        t.right.rows = t.right.rows.slice(1);
      },
    });
    expect(messages).toContain(
      'trace "join-inner" differs from what PostgreSQL produces now; run "pnpm --filter @learn-code/lesson-compiler traces"',
    );
  });

  it('fails when the step query differs from the trace', async () => {
    expect(
      await run({}, (s) => {
        s.query = 'select 1';
      }),
    ).toEqual(['query differs from the query of trace "join-inner"']);
  });

  it('fails when a table of the trace is not shown in the step', async () => {
    expect(
      await run({}, (s) => {
        s.tables = s.tables.slice(0, 1);
      }),
    ).toEqual(['table "orders" of the trace is not shown in the step']);
  });

  it('fails when a table in the step differs from the trace', async () => {
    expect(
      await run({}, (s) => {
        s.tables[0]!.rows = s.tables[0]!.rows.slice(1);
      }),
    ).toEqual(['table "customers" in the step differs from the trace']);
  });
});
