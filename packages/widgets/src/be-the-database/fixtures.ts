import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beTheDatabaseStep } from '@learn-code/lesson-schema';
import { parseTrace, type JoinTrace } from './trace';

/** Test helpers: the committed traces of the sample lesson. */
const TRACES = join(import.meta.dirname, '../../../../content/fullstack/joins-01/traces');

export const TRACE_REFS = ['join-inner', 'join-left', 'join-multiply'] as const;
export type TraceRef = (typeof TRACE_REFS)[number];

export function loadTrace(ref: TraceRef): JoinTrace {
  const raw: unknown = JSON.parse(readFileSync(join(TRACES, `${ref}.trace.json`), 'utf8'));
  const trace = parseTrace(raw);
  if (trace === undefined) throw new Error(`trace ${ref} does not parse`);
  return trace;
}

export function stepFor(trace: JoinTrace) {
  return beTheDatabaseStep.parse({
    id: `bd-${trace.ref}`,
    kind: 'beTheDatabase',
    estSeconds: 120,
    concepts: [],
    query: trace.query,
    traceRef: trace.ref,
    prompt: `Pair the rows of **${trace.left.name}** and **${trace.right.name}** the way the join would.`,
    tables: [trace.left, trace.right].map((t) => ({
      name: t.name,
      columns: t.columns,
      rows: t.rows,
    })),
  });
}
