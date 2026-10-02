import { buildResult } from './normalize';
import { SQLSTATE_INTERNAL, type SqlOutcome } from './types';

/** The part of a PGlite instance the runner needs. */
export interface DatabaseLike {
  exec(
    sql: string,
    options?: { readonly rowMode?: 'array' | 'object' },
  ): Promise<readonly DatabaseResult[]>;
  close(): Promise<void>;
}

export interface DatabaseResult {
  readonly rows: readonly unknown[];
  readonly fields: readonly { readonly name: string }[];
}

const RESET_SQL = 'drop schema if exists public cascade; create schema public;';

/** Runs seed, reset and learner SQL on one database. Used inline (Node) and inside the worker. */
export class SqlRunner {
  constructor(
    private readonly db: DatabaseLike,
    private readonly seedSql: string,
    private readonly maxRows: number,
  ) {}

  async seed(): Promise<void> {
    if (this.seedSql.trim() !== '') await this.db.exec(this.seedSql);
  }

  async reset(): Promise<void> {
    await this.db.exec(RESET_SQL);
    await this.seed();
  }

  /** Runs a script; the outcome is the last statement's result, or the first error. */
  async execute(sql: string): Promise<SqlOutcome> {
    try {
      const results = await this.db.exec(sql, { rowMode: 'array' });
      const last = results[results.length - 1];
      if (last === undefined) return { ok: true, result: buildResult([], [], this.maxRows) };
      const rows = last.rows.map((r) => (Array.isArray(r) ? r : []));
      return {
        ok: true,
        result: buildResult(
          last.fields.map((f) => f.name),
          rows,
          this.maxRows,
        ),
      };
    } catch (error) {
      return toErrorOutcome(error);
    }
  }

  close(): Promise<void> {
    return this.db.close();
  }
}

function field(error: object, key: string): unknown {
  return Reflect.get(error, key);
}

/** Map a PGlite error to an outcome. `code` is the SQLSTATE; messages are shown as PostgreSQL sent them. */
export function toErrorOutcome(error: unknown): SqlOutcome {
  if (typeof error !== 'object' || error === null) {
    return { ok: false, sqlState: SQLSTATE_INTERNAL, message: String(error) };
  }
  const code = field(error, 'code');
  const message = field(error, 'message');
  const position = Number(field(error, 'position'));
  const base = {
    ok: false as const,
    sqlState: typeof code === 'string' && code !== '' ? code : SQLSTATE_INTERNAL,
    message: typeof message === 'string' ? message : 'Unknown database error',
  };
  return Number.isInteger(position) && position > 0 ? { ...base, position } : base;
}
