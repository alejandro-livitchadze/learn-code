import type { SqlEngine, SqlOutcome, SqlSession } from './types';

export interface FakeEngineOptions {
  readonly id?: string;
  /** Called for every `execute`; `seedSql` is the seed the session was opened with. */
  readonly respond: (sql: string, seedSql: string) => SqlOutcome | Promise<SqlOutcome>;
}

export interface FakeEngine extends SqlEngine {
  /** Every SQL string passed to `execute`, across sessions, in order. */
  readonly executed: readonly string[];
  readonly resets: number;
  readonly opened: number;
  readonly closed: number;
}

/** A scripted in-memory engine for widget tests. It runs no SQL. */
export function createFakeEngine(options: FakeEngineOptions): FakeEngine {
  const executed: string[] = [];
  const counters = { resets: 0, opened: 0, closed: 0 };
  const engine: FakeEngine = {
    id: options.id ?? 'fake',
    executed,
    get resets() {
      return counters.resets;
    },
    get opened() {
      return counters.opened;
    },
    get closed() {
      return counters.closed;
    },
    open(seedSql: string): Promise<SqlSession> {
      counters.opened += 1;
      const session: SqlSession = {
        async execute(sql) {
          executed.push(sql);
          return options.respond(sql, seedSql);
        },
        async reset() {
          counters.resets += 1;
        },
        async close() {
          counters.closed += 1;
        },
      };
      return Promise.resolve(session);
    },
  };
  return engine;
}
