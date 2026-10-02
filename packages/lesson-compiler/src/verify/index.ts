import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Lesson, Step } from '@learn-code/lesson-schema';
import { runNode } from './node';
import { runSql, sameResult, showSql, type SqlResult } from './sql';

export interface VerifyIssue {
  readonly stepId: string;
  readonly message: string;
}

const DEFAULT_SEED = 'default';

/** Seeds live in `<lesson dir>/seeds/<name>.sql`. */
function readSeed(lessonDir: string, name: string): string | undefined {
  const file = join(lessonDir, 'seeds', `${name}.sql`);
  return existsSync(file) ? readFileSync(file, 'utf8') : undefined;
}

const message = (e: unknown): string => (e instanceof Error ? e.message : String(e));

async function tryQuery(seed: string | undefined, sql: string): Promise<SqlResult | Error> {
  try {
    return await runSql(seed, sql);
  } catch (e) {
    return e instanceof Error ? e : new Error(String(e));
  }
}

async function verifyPredict(
  s: Extract<Step, { kind: 'predict' }>,
  lessonDir: string,
): Promise<VerifyIssue[]> {
  const correct = s.options.find((o) => o.isCorrect);
  if (correct === undefined) return [];
  const fail = (m: string): VerifyIssue[] => [{ stepId: s.id, message: m }];
  if (s.language === 'sql') {
    const r = await tryQuery(readSeed(lessonDir, DEFAULT_SEED), s.code);
    if (r instanceof Error) return fail(`sample failed to run: ${r.message}`);
    const actual = showSql(r);
    return actual === correct.output.trim()
      ? []
      : fail(`declared output "${correct.output}" but the sample printed "${actual}"`);
  }
  if (s.language === 'js' || s.language === 'ts') {
    const r = runNode(s.code, s.language);
    if (!r.ok) return fail(`sample failed to run: ${r.error}`);
    return r.stdout === correct.output.trim()
      ? []
      : fail(`declared output "${correct.output}" but the sample printed "${r.stdout}"`);
  }
  return []; // http samples have nothing to run
}

/** Reference solution must run; the starter must not produce the same result. */
async function verifySqlLab(
  s: Extract<Step, { kind: 'sqlLab' }>,
  lessonDir: string,
): Promise<VerifyIssue[]> {
  const seed = readSeed(lessonDir, s.seedRef);
  if (seed === undefined) {
    return [{ stepId: s.id, message: `seed "seeds/${s.seedRef}.sql" does not exist` }];
  }
  const solution = await tryQuery(seed, s.solution);
  if (solution instanceof Error) {
    return [{ stepId: s.id, message: `reference solution failed: ${solution.message}` }];
  }
  if (s.starter.trim() === '') return [];
  const starter = await tryQuery(seed, s.starter);
  if (!(starter instanceof Error) && sameResult(starter, solution, s.orderMatters)) {
    return [{ stepId: s.id, message: 'the starter already passes; it must fail' }];
  }
  return [];
}

/** Execute every code sample with a declared output and compare exactly. */
export async function verifySamples(lesson: Lesson, lessonDir: string): Promise<VerifyIssue[]> {
  const issues: VerifyIssue[] = [];
  for (const s of lesson.steps) {
    try {
      if (s.kind === 'predict') issues.push(...(await verifyPredict(s, lessonDir)));
      else if (s.kind === 'sqlLab') issues.push(...(await verifySqlLab(s, lessonDir)));
    } catch (e) {
      issues.push({ stepId: s.id, message: `verification crashed: ${message(e)}` });
    }
  }
  return issues;
}

export { formatRows } from './format';
export { closeSql, runSql, sameResult, showSql } from './sql';
export type { SqlResult } from './sql';
export { runNode, NODE_TIMEOUT_MS } from './node';
