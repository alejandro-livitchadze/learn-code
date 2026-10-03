import type { SqlEngine, SqlOutcome, SqlResult, SqlSession } from '@learn-code/sql-engine';
import { compareResults, type ResultDiff } from '@learn-code/sql-engine/compare';
import { SCHEMA_QUERY, groupSchema, mayChangeSchema, type SchemaTable } from './schema';

export interface LabConfig {
  readonly engine: SqlEngine;
  readonly seedSql: string;
  readonly solution: string;
  readonly orderMatters: boolean;
}

export interface RunReport {
  readonly outcome: SqlOutcome;
  /** Present when the query ran and returned a result. */
  readonly diff: ResultDiff | undefined;
  readonly correct: boolean;
  readonly attempts: number;
}

/**
 * The logic of one sqlLab: open a session, learn the expected rows by running the reference
 * query, run learner queries and compare. No React here, so it is tested with the fake engine.
 */
export class LabController {
  private session: SqlSession | undefined;
  private expected: SqlResult | undefined;
  private attemptCount = 0;

  constructor(private readonly config: LabConfig) {}

  get attempts(): number {
    return this.attemptCount;
  }

  /** Restore the attempt counter of a restored step. */
  setAttempts(n: number): void {
    this.attemptCount = n;
  }

  async start(): Promise<readonly SchemaTable[]> {
    const session = await this.config.engine.open(this.config.seedSql);
    this.session = session;
    const reference = await session.execute(this.config.solution);
    if (!reference.ok) {
      throw new Error(`The reference query failed (${reference.sqlState}): ${reference.message}`);
    }
    this.expected = reference.result;
    // The reference query may have written data; start the learner from the seed.
    await session.reset();
    return this.loadSchema();
  }

  async run(
    sql: string,
  ): Promise<{ report: RunReport; schema: readonly SchemaTable[] | undefined }> {
    const { session, expected } = this.ready();
    this.attemptCount += 1;
    const outcome = await session.execute(sql);
    const diff = outcome.ok
      ? compareResults(expected, outcome.result, this.config.orderMatters)
      : undefined;
    const schema = outcome.ok && mayChangeSchema(sql) ? await this.loadSchema() : undefined;
    return {
      report: { outcome, diff, correct: diff?.match === true, attempts: this.attemptCount },
      schema,
    };
  }

  async reset(): Promise<readonly SchemaTable[]> {
    await this.ready().session.reset();
    return this.loadSchema();
  }

  async close(): Promise<void> {
    const session = this.session;
    this.session = undefined;
    await session?.close();
  }

  private ready(): { session: SqlSession; expected: SqlResult } {
    if (this.session === undefined || this.expected === undefined) {
      throw new Error('The database is not ready');
    }
    return { session: this.session, expected: this.expected };
  }

  private async loadSchema(): Promise<readonly SchemaTable[]> {
    const outcome = await this.ready().session.execute(SCHEMA_QUERY);
    return outcome.ok ? groupSchema(outcome.result) : [];
  }
}
