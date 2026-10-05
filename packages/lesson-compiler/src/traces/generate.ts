import { createInlineEngine } from '@learn-code/sql-engine';
import {
  TRACE_VERSION,
  type JoinTrace,
  type TracePair,
  type TraceSpec,
  type TraceTable,
} from './types';

/** Same printing rule as declared outputs: SQL NULL is `NULL`. */
const cell = (v: unknown): string => {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'object') return v instanceof Date ? v.toISOString() : JSON.stringify(v);
  return String(v);
};

const quote = (ident: string): string => `"${ident.replace(/"/g, '""')}"`;

const KEYWORD: Record<TraceSpec['joinKind'], string> = { inner: 'inner join', left: 'left join' };

/**
 * Load the seed into a fresh PGlite database, ask it which rows it pairs for the join condition,
 * and record the result of the real query. Throws when the data contradicts itself.
 */
export async function generateTrace(spec: TraceSpec, seedSql: string): Promise<JoinTrace> {
  const session = await createInlineEngine().open(seedSql);
  try {
    const run = async (sql: string) => {
      const outcome = await session.execute(sql);
      if (!outcome.ok) throw new Error(`${spec.ref}: ${outcome.message} (${sql})`);
      return outcome.result;
    };
    const table = async (
      side: TraceSpec['left'],
    ): Promise<{ table: TraceTable; ids: readonly string[] }> => {
      const r = await run(`select * from ${quote(side.table)} order by ${quote(side.id)}`);
      const at = r.columns.indexOf(side.id);
      if (at < 0) throw new Error(`${spec.ref}: table ${side.table} has no column ${side.id}`);
      const rows = r.rows.map((row) => row.map(cell));
      return {
        table: { name: side.table, columns: r.columns, rows },
        ids: rows.map((row) => row[at] ?? ''),
      };
    };
    const left = await table(spec.left);
    const right = await table(spec.right);
    if (
      new Set(left.ids).size !== left.ids.length ||
      new Set(right.ids).size !== right.ids.length
    ) {
      throw new Error(`${spec.ref}: id columns must be unique`);
    }
    const paired = await run(
      `select l.${quote(spec.left.id)}, r.${quote(spec.right.id)} ` +
        `from ${quote(spec.left.table)} as l ${KEYWORD[spec.joinKind]} ${quote(spec.right.table)} as r ` +
        `on ${spec.on} order by 1, 2`,
    );
    const pairs: TracePair[] = paired.rows.map((row) => {
      const l = left.ids.indexOf(cell(row[0]));
      const rid = row[1] === null ? -1 : right.ids.indexOf(cell(row[1]));
      if (l < 0 || (row[1] !== null && rid < 0))
        throw new Error(`${spec.ref}: paired a row that is not in its table`);
      return { left: l, right: row[1] === null ? null : rid };
    });
    const result = await run(spec.query);
    if (result.rows.length !== pairs.length) {
      throw new Error(
        `${spec.ref}: the query returned ${result.rows.length} rows but the join pairs ${pairs.length}; ` +
          'the query must be the plain join the spec describes',
      );
    }
    return {
      version: TRACE_VERSION,
      ref: spec.ref,
      query: spec.query,
      joinKind: spec.joinKind,
      on: spec.on,
      left: left.table,
      right: right.table,
      pairs,
      result: { columns: result.columns, rows: result.rows.map((row) => row.map(cell)) },
    };
  } finally {
    await session.close();
  }
}
