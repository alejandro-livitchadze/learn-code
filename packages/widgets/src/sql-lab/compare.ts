import type { SqlResult } from '@learn-code/sql-engine';

export interface ResultDiff {
  readonly match: boolean;
  /** Expected column names (lower case) the learner's result lacks. */
  readonly missingColumns: readonly string[];
  /** Learner column names (lower case) the expected result does not have. */
  readonly extraColumns: readonly string[];
  /** Expected rows the learner's result lacks, in the expected column order. */
  readonly missingRows: readonly (readonly unknown[])[];
  /** Learner rows the expected result does not have, in the expected column order. */
  readonly extraRows: readonly (readonly unknown[])[];
  /** Same rows, wrong order, and the step says order matters. */
  readonly orderMismatch: boolean;
  /** The learner's result was cut by the row cap, so it cannot be compared in full. */
  readonly truncated: boolean;
}

const lower = (names: readonly string[]): readonly string[] => names.map((n) => n.toLowerCase());

function countBy<T>(items: readonly T[], key: (item: T) => string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of items) counts.set(key(item), (counts.get(key(item)) ?? 0) + 1);
  return counts;
}

/** Items of `from` whose key occurs more often than in `other` (multiset difference). */
function surplus<T>(from: readonly T[], other: readonly T[], key: (item: T) => string): T[] {
  const available = countBy(other, key);
  const out: T[] = [];
  for (const item of from) {
    const k = key(item);
    const left = available.get(k) ?? 0;
    if (left > 0) available.set(k, left - 1);
    else out.push(item);
  }
  return out;
}

const rowKey = (row: readonly unknown[]): string => JSON.stringify(row);

/**
 * Compare the learner's result with the expected one. Column names are compared case-insensitively
 * and column order is ignored; rows are a multiset unless `orderMatters`.
 */
export function compareResults(
  expected: SqlResult,
  actual: SqlResult,
  orderMatters: boolean,
): ResultDiff {
  const expectedCols = lower(expected.columns);
  const actualCols = lower(actual.columns);
  const missingColumns = surplus(expectedCols, actualCols, (c) => c);
  const extraColumns = surplus(actualCols, expectedCols, (c) => c);
  const truncated = actual.rowCount !== actual.rows.length;
  const none = { missingRows: [], extraRows: [], orderMismatch: false };

  if (missingColumns.length > 0 || extraColumns.length > 0) {
    return { match: false, missingColumns, extraColumns, ...none, truncated };
  }

  // Same column names: line the learner's columns up with the expected order.
  const used = new Set<number>();
  const order = expectedCols.map((name) => {
    const index = actualCols.findIndex((c, i) => c === name && !used.has(i));
    used.add(index);
    return index;
  });
  const aligned = actual.rows.map((row) => order.map((i) => row[i]));

  const missingRows = surplus(expected.rows, aligned, rowKey);
  const extraRows = surplus(aligned, expected.rows, rowKey);
  const sameRows = missingRows.length === 0 && extraRows.length === 0;
  const orderMismatch =
    orderMatters &&
    sameRows &&
    expected.rows.some((row, i) => rowKey(row) !== rowKey(aligned[i] ?? []));
  return {
    match: sameRows && !orderMismatch && !truncated && expected.rowCount === actual.rowCount,
    missingColumns,
    extraColumns,
    missingRows,
    extraRows,
    orderMismatch,
    truncated,
  };
}
