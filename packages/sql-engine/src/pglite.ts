import type { DatabaseLike } from './runner';

/** Create an in-memory PGlite database. The import is dynamic so nothing loads until first use. */
export async function createPglite(): Promise<DatabaseLike> {
  const { PGlite } = await import('@electric-sql/pglite');
  return PGlite.create();
}
