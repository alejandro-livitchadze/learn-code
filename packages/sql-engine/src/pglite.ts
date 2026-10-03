import type { DatabaseLike } from './runner';

const raw = (text: string): string => text;

/**
 * Create an in-memory PGlite database that returns PostgreSQL's own text output for every value
 * (`2024-03-10`, `{1,2}`, `t`), with the session time
 * zone fixed to UTC, so results never depend on the machine. The import is dynamic so nothing
 * loads until first use.
 */
export async function createPglite(): Promise<DatabaseLike> {
  const { PGlite, types } = await import('@electric-sql/pglite');
  const parsers: Record<number, (text: string) => string> = {};
  for (const oid of Object.values(types)) {
    if (typeof oid === 'number') parsers[oid] = raw;
  }
  const db = await PGlite.create({ parsers });
  // Array types get their parsers from the catalog at startup; replace those too.
  const arrays = await db.query<{ readonly typarray: number }>(
    'select typarray from pg_type where typarray <> 0',
  );
  for (const row of arrays.rows) db.parsers[row.typarray] = raw;
  await db.exec("set time zone 'UTC'");
  return db;
}
