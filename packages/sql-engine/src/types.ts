/**
 * Every cell is `null` or a string. Dates, big integers, numerics, booleans, JSON and bytes are
 * normalized by `normalizeValue`, so results are JSON-safe and comparable.
 */
export interface SqlResult {
  readonly columns: readonly string[];
  readonly rows: readonly (readonly unknown[])[];
  /** Number of rows the statement produced. `rows` may hold fewer when the row cap applied. */
  readonly rowCount: number;
}

export type SqlOutcome =
  | { readonly ok: true; readonly result: SqlResult }
  | {
      readonly ok: false;
      readonly sqlState: string;
      readonly message: string;
      /** 1-based character offset into the submitted SQL, as PostgreSQL reports it. */
      readonly position?: number;
    };

export interface SqlSession {
  execute(sql: string): Promise<SqlOutcome>;
  reset(): Promise<void>;
  close(): Promise<void>;
}

export interface SqlEngine {
  readonly id: string;
  open(seedSql: string): Promise<SqlSession>;
}

/** SQLSTATE used when a query exceeds the time limit (PostgreSQL's `query_canceled`). */
export const SQLSTATE_TIMEOUT = '57014';
/** SQLSTATE used when the engine itself fails (PostgreSQL class XX, internal error). */
export const SQLSTATE_INTERNAL = 'XX000';
