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

export type DatabaseFactory = () => Promise<DatabaseLike>;

/** Runs seed, reset and learner SQL on one database. Used inline (Node) and inside the worker. */
export class SqlRunner {
  private db: DatabaseLike | undefined;

  constructor(
    private readonly createDatabase: DatabaseFactory,
    private readonly seedSql: string,
    private readonly maxRows: number,
  ) {}

  /** Creates the first database and seeds it. On failure nothing stays open. */
  async open(): Promise<void> {
    this.db = await this.freshSeeded();
  }

  /**
   * Replaces the database with a new, seeded one, so the result is identical to a fresh `open`
   * whatever state the learner left the old session in (aborted or open transaction, changed
   * `search_path` or settings, extra schemas). If creating or seeding fails, the old database
   * stays in place and the next call can retry.
   */
  async reset(): Promise<void> {
    const old = this.db;
    this.db = await this.freshSeeded();
    if (old !== undefined) await old.close().catch(() => undefined);
  }

  private async freshSeeded(): Promise<DatabaseLike> {
    const db = await this.createDatabase();
    try {
      if (this.seedSql.trim() !== '') await db.exec(this.seedSql);
    } catch (error) {
      await db.close().catch(() => undefined);
      throw error;
    }
    return db;
  }

  /** Runs a script; the outcome is the last statement's result, or the first error. */
  async execute(sql: string): Promise<SqlOutcome> {
    try {
      if (this.db === undefined) throw new Error('session is not open');
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

  async close(): Promise<void> {
    const db = this.db;
    this.db = undefined;
    await db?.close();
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
