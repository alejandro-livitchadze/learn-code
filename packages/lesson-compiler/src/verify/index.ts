import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Lesson, Step } from '@learn-code/lesson-schema';
import { runNode } from './node';
import { createInlineEngine } from '@learn-code/sql-engine';
import { formatRows } from './format';
import { checkSqlLab } from './sql-lab';

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

/** Run a predict sample through the inline sql-engine adapter and print it as a declared output. */
export async function runPredictSql(
  seed: string | undefined,
  sql: string,
): Promise<string | Error> {
  const session = await createInlineEngine().open(seed ?? '');
  try {
    const outcome = await session.execute(sql);
    if (!outcome.ok) return new Error(outcome.message);
    return formatRows(outcome.result.columns, outcome.result.rows);
  } finally {
    await session.close();
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
    const actual = await runPredictSql(readSeed(lessonDir, DEFAULT_SEED), s.code);
    if (actual instanceof Error) return fail(`sample failed to run: ${actual.message}`);
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

/** Reference solution must run and be stable; the starter must not produce the same rows. */
async function verifySqlLab(
  s: Extract<Step, { kind: 'sqlLab' }>,
  lessonDir: string,
): Promise<VerifyIssue[]> {
  const seed = readSeed(lessonDir, s.seedRef);
  if (seed === undefined) {
    return [{ stepId: s.id, message: `seed "seeds/${s.seedRef}.sql" does not exist` }];
  }
  const problems = await checkSqlLab({
    seed,
    solution: s.solution,
    starter: s.starter,
    orderMatters: s.orderMatters,
  });
  return problems.map((message) => ({ stepId: s.id, message }));
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
export { checkSqlLab } from './sql-lab';
export { runNode, NODE_TIMEOUT_MS } from './node';
