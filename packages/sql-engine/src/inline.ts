import { SQLSTATE_INTERNAL, type SqlEngine, type SqlOutcome, type SqlSession } from './types';
import { SqlRunner, type DatabaseLike } from './runner';
import { createPglite } from './pglite';

export interface InlineEngineOptions {
  readonly maxRows?: number;
  /** Replaces PGlite; used by tests. */
  readonly createDatabase?: () => Promise<DatabaseLike>;
}

export const DEFAULT_MAX_ROWS = 500;

/**
 * PGlite on the calling thread, with no time limit. This is the adapter for Node.js (the lesson
 * checker and CI). Browsers use `createWorkerEngine`.
 */
export function createInlineEngine(options: InlineEngineOptions = {}): SqlEngine {
  const maxRows = options.maxRows ?? DEFAULT_MAX_ROWS;
  const createDatabase = options.createDatabase ?? createPglite;
  return {
    id: 'pglite-inline',
    async open(seedSql: string): Promise<SqlSession> {
      const runner = new SqlRunner(createDatabase, seedSql, maxRows);
      await runner.open();
      let queue: Promise<unknown> = Promise.resolve();
      const serial = <T>(job: () => Promise<T>): Promise<T> => {
        const next = queue.then(job);
        queue = next.catch(() => undefined);
        return next;
      };
      return {
        execute: (sql): Promise<SqlOutcome> =>
          serial(() => runner.execute(sql)).catch((error: unknown): SqlOutcome => ({
            ok: false,
            sqlState: SQLSTATE_INTERNAL,
            message: error instanceof Error ? error.message : String(error),
          })),
        reset: () => serial(() => runner.reset()),
        close: () => serial(() => runner.close()),
      };
    },
  };
}
