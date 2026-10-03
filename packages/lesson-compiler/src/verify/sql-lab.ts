import { compareResults, createInlineEngine, type SqlSession } from '@learn-code/sql-engine';

export interface SqlLabCheck {
  readonly seed: string;
  readonly solution: string;
  readonly starter: string;
  readonly orderMatters: boolean;
}

/**
 * Runs a sqlLab step through the sql-engine inline adapter, the engine the browser uses minus the
 * Worker. The reference query defines the expected rows; it must run and give the same rows again
 * from a reset database (so the expected result is stable). The starter must not match them.
 */
export async function checkSqlLab(check: SqlLabCheck): Promise<readonly string[]> {
  const session: SqlSession = await createInlineEngine().open(check.seed);
  try {
    const reference = await session.execute(check.solution);
    if (!reference.ok) {
      return [`reference solution failed: ${reference.message}`];
    }
    if (reference.result.rowCount !== reference.result.rows.length) {
      return [
        `reference solution returns ${reference.result.rowCount} rows, more than the row cap of ${reference.result.rows.length}; the widget cannot compare it`,
      ];
    }
    await session.reset();
    const again = await session.execute(check.solution);
    if (!again.ok || !compareResults(reference.result, again.result, check.orderMatters).match) {
      return ['reference solution does not return the same rows after a database reset'];
    }
    await session.reset();
    if (check.starter.trim() === '') return [];
    const starter = await session.execute(check.starter);
    if (starter.ok && compareResults(reference.result, starter.result, check.orderMatters).match) {
      return ['the starter already passes; it must fail'];
    }
    return [];
  } finally {
    await session.close();
  }
}
