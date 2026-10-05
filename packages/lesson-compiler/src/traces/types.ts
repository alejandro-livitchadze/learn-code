/**
 * The recorded trace of a `beTheDatabase` join step. It is generated from real PostgreSQL (PGlite)
 * and committed next to the lesson, so the widget never has to run SQL to know the right answer.
 * The widgets package reads the same JSON shape; keep `packages/widgets/src/be-the-database/trace.ts`
 * in step with this file.
 */

export const TRACE_VERSION = 1;

export type JoinKind = 'inner' | 'left';

export interface TraceTable {
  readonly name: string;
  readonly columns: readonly string[];
  /** Rows in id order. Cells are printed text; SQL NULL is `NULL`. */
  readonly rows: readonly (readonly string[])[];
}

export interface TracePair {
  /** Index into `left.rows`. */
  readonly left: number;
  /** Index into `right.rows`, or `null` when a left join found no match. */
  readonly right: number | null;
}

export interface JoinTrace {
  readonly version: typeof TRACE_VERSION;
  readonly ref: string;
  readonly query: string;
  readonly joinKind: JoinKind;
  /** The join condition, in terms of the aliases `l` and `r`. */
  readonly on: string;
  readonly left: TraceTable;
  readonly right: TraceTable;
  /** Every row pairing the database made, ordered by left row, then right row. */
  readonly pairs: readonly TracePair[];
  /** What the real query returned. */
  readonly result: {
    readonly columns: readonly string[];
    readonly rows: readonly (readonly string[])[];
  };
}

/** The author's input: which seed to load, which join to trace. */
export interface TraceSpec {
  readonly ref: string;
  /** Name of `<lesson dir>/seeds/<seed>.sql`. */
  readonly seed: string;
  /** The query shown to the learner and recorded as the real result. Give it an `order by`. */
  readonly query: string;
  readonly joinKind: JoinKind;
  /** Join condition using the aliases `l` (left table) and `r` (right table). */
  readonly on: string;
  readonly left: { readonly table: string; readonly id: string };
  readonly right: { readonly table: string; readonly id: string };
}
