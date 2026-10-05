/**
 * The recorded trace of a join, as committed under `content/<course>/<lesson>/traces/`. The
 * compiler writes it (`packages/lesson-compiler/src/traces`); the widget only reads it. The
 * widgets package cannot import the compiler, so the shape is restated here and checked by
 * `trace.test.ts` against the committed files.
 */

export interface TraceTable {
  readonly name: string;
  readonly columns: readonly string[];
  readonly rows: readonly (readonly string[])[];
}

export interface Pair {
  /** Index into the left table's rows. */
  readonly left: number;
  /** Index into the right table's rows; `null` is the empty row a left join adds. */
  readonly right: number | null;
}

export interface JoinTrace {
  readonly version: 1;
  readonly ref: string;
  readonly query: string;
  readonly joinKind: 'inner' | 'left';
  readonly on: string;
  readonly left: TraceTable;
  readonly right: TraceTable;
  readonly pairs: readonly Pair[];
  readonly result: {
    readonly columns: readonly string[];
    readonly rows: readonly (readonly string[])[];
  };
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const isStrings = (v: unknown): v is readonly string[] =>
  Array.isArray(v) && v.every((x) => typeof x === 'string');

const isRows = (v: unknown): v is readonly (readonly string[])[] =>
  Array.isArray(v) && v.every(isStrings);

function table(v: unknown): TraceTable | undefined {
  if (!isRecord(v)) return undefined;
  const { name, columns, rows } = v;
  if (typeof name !== 'string' || !isStrings(columns) || !isRows(rows)) return undefined;
  return rows.every((r) => r.length === columns.length) ? { name, columns, rows } : undefined;
}

function pair(v: unknown, leftRows: number, rightRows: number): Pair | undefined {
  if (!isRecord(v)) return undefined;
  const { left, right } = v;
  if (typeof left !== 'number' || !Number.isInteger(left) || left < 0 || left >= leftRows) {
    return undefined;
  }
  if (right === null) return { left, right: null };
  if (typeof right !== 'number' || !Number.isInteger(right) || right < 0 || right >= rightRows) {
    return undefined;
  }
  return { left, right };
}

/** Validate untrusted JSON. Returns `undefined` when anything is off, so the widget shows an error. */
export function parseTrace(value: unknown): JoinTrace | undefined {
  if (!isRecord(value) || value['version'] !== 1) return undefined;
  const { ref, query, joinKind, on } = value;
  if (typeof ref !== 'string' || typeof query !== 'string' || typeof on !== 'string') {
    return undefined;
  }
  if (joinKind !== 'inner' && joinKind !== 'left') return undefined;
  const left = table(value['left']);
  const right = table(value['right']);
  const result = isRecord(value['result']) ? value['result'] : undefined;
  if (left === undefined || right === undefined || result === undefined) return undefined;
  const { columns, rows } = result;
  if (!isStrings(columns) || !isRows(rows)) return undefined;
  const rawPairs: unknown = value['pairs'];
  if (!Array.isArray(rawPairs)) return undefined;
  const pairs: Pair[] = [];
  for (const p of rawPairs) {
    const ok = pair(p, left.rows.length, right.rows.length);
    if (ok === undefined) return undefined;
    pairs.push(ok);
  }
  return { version: 1, ref, query, joinKind, on, left, right, pairs, result: { columns, rows } };
}
