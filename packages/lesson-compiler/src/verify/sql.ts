import { PGlite } from '@electric-sql/pglite';
import { formatRow, formatRows } from './format';

export interface SqlResult {
  readonly fields: readonly string[];
  readonly rows: readonly (readonly unknown[])[];
}

let shared: Promise<PGlite> | undefined;
let queue: Promise<unknown> = Promise.resolve();

/** PGlite takes seconds to boot, so one instance is reused and wiped between runs. */
const database = (): Promise<PGlite> => (shared ??= PGlite.create());

/** Release the shared database. Safe to call when none was started. */
export async function closeSql(): Promise<void> {
  const db = shared;
  shared = undefined;
  if (db) await (await db).close();
}

/** Run a SQL script on a clean database; `seed` runs first. Returns the last statement's result. */
export function runSql(seed: string | undefined, script: string): Promise<SqlResult> {
  const job = queue.then(async () => {
    const db = await database();
    await db.exec('drop schema public cascade; create schema public;');
    if (seed !== undefined && seed.trim() !== '') await db.exec(seed);
    const results = await db.exec(script);
    const last = results[results.length - 1];
    if (last === undefined) return { fields: [], rows: [] };
    return {
      fields: last.fields.map((f) => f.name),
      rows: last.rows.map((r) => last.fields.map((f) => r[f.name])),
    };
  });
  queue = job.catch(() => undefined);
  return job;
}

export const showSql = (r: SqlResult): string => formatRows(r.fields, r.rows);

/** Compare two results; row order is ignored unless `orderMatters`. */
export function sameResult(a: SqlResult, b: SqlResult, orderMatters: boolean): boolean {
  const lines = (r: SqlResult): string[] => {
    const l = r.rows.map(formatRow);
    return orderMatters ? l : l.sort();
  };
  return (
    a.fields.join('|') === b.fields.join('|') &&
    a.rows.length === b.rows.length &&
    lines(a).join('\n') === lines(b).join('\n')
  );
}
