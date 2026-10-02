import { createInlineEngine, type SqlResult, type SqlSession } from '@learn-code/sql-engine';

/**
 * Same rule as the sqlLab widget: column names compare case-insensitively and in any order, rows
 * are a multiset unless `orderMatters`. Cells are already normalized by the engine.
 */
export function sameSqlResult(a: SqlResult, b: SqlResult, orderMatters: boolean): boolean {
  if (a.rowCount !== b.rowCount || a.rows.length !== b.rows.length) return false;
  const left = a.columns.map((c) => c.toLowerCase());
  const right = b.columns.map((c) => c.toLowerCase());
  if (left.length !== right.length) return false;
  const used = new Set<number>();
  const order: number[] = [];
  for (const name of left) {
    const index = right.findIndex((c, i) => c === name && !used.has(i));
    if (index < 0) return false;
    used.add(index);
    order.push(index);
  }
  const keys = (rows: readonly (readonly unknown[])[]): string[] =>
    rows.map((row) => JSON.stringify(row));
  const expected = keys(a.rows);
  const actual = keys(b.rows.map((row) => order.map((i) => row[i])));
  return orderMatters
    ? expected.every((k, i) => k === actual[i])
    : expected.sort().join('\n') === actual.sort().join('\n');
}

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
    await session.reset();
    const again = await session.execute(check.solution);
    if (!again.ok || !sameSqlResult(reference.result, again.result, check.orderMatters)) {
      return ['reference solution does not return the same rows after a database reset'];
    }
    await session.reset();
    if (check.starter.trim() === '') return [];
    const starter = await session.execute(check.starter);
    if (starter.ok && sameSqlResult(reference.result, starter.result, check.orderMatters)) {
      return ['the starter already passes; it must fail'];
    }
    return [];
  } finally {
    await session.close();
  }
}
