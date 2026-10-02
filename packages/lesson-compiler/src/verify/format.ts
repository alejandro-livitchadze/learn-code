/** The cell types PGlite can hand back, narrowed to what we print. */
const cell = (v: unknown): string => {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'object') return v instanceof Date ? v.toISOString() : JSON.stringify(v);
  return String(v);
};

/**
 * Canonical text form of a query result, used for declared outputs:
 * a single value prints bare; anything else prints a header line and one `a | b` line per row.
 */
export function formatRows(
  fields: readonly string[],
  rows: readonly (readonly unknown[])[],
): string {
  const only = rows.length === 1 ? rows[0] : undefined;
  if (only !== undefined && only.length === 1) return cell(only[0]);
  return [fields.join(' | '), ...rows.map(formatRow)].join('\n');
}

/** One row as `a | b`. */
export const formatRow = (row: readonly unknown[]): string => row.map(cell).join(' | ');
