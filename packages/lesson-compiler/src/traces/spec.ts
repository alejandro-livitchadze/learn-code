import type { JoinKind, TraceSpec } from './types';

const IDENT = /^[a-z_][a-z0-9_]{0,62}$/;

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const text = (o: Record<string, unknown>, key: string): string | undefined => {
  const v = o[key];
  return typeof v === 'string' && v.trim() !== '' ? v : undefined;
};

function side(
  o: Record<string, unknown>,
  key: string,
  problems: string[],
): TraceSpec['left'] | undefined {
  const v = o[key];
  if (!isRecord(v)) {
    problems.push(`"${key}" must be an object with "table" and "id"`);
    return undefined;
  }
  const table = text(v, 'table');
  const id = text(v, 'id');
  if (table === undefined || !IDENT.test(table))
    problems.push(`"${key}.table" must be a plain lowercase identifier`);
  if (id === undefined || !IDENT.test(id))
    problems.push(`"${key}.id" must be a plain lowercase identifier`);
  return table !== undefined && id !== undefined && IDENT.test(table) && IDENT.test(id)
    ? { table, id }
    : undefined;
}

/** Validate untrusted JSON as a `TraceSpec`. Returns the spec or a list of problems. */
export function parseTraceSpec(value: unknown): TraceSpec | readonly string[] {
  if (!isRecord(value)) return ['the spec must be a JSON object'];
  const problems: string[] = [];
  const ref = text(value, 'ref');
  const seed = text(value, 'seed');
  const query = text(value, 'query');
  const on = text(value, 'on');
  if (ref === undefined || !/^[a-z0-9][a-z0-9-]*$/.test(ref))
    problems.push('"ref" must be a kebab-case id');
  if (seed === undefined || !/^[a-z0-9][a-z0-9-]*$/.test(seed))
    problems.push('"seed" must be a seed file name without extension');
  if (query === undefined) problems.push('"query" is required');
  if (on === undefined) problems.push('"on" is required');
  const kind = value['joinKind'];
  const joinKind: JoinKind | undefined = kind === 'inner' || kind === 'left' ? kind : undefined;
  if (joinKind === undefined) problems.push('"joinKind" must be "inner" or "left"');
  const left = side(value, 'left', problems);
  const right = side(value, 'right', problems);
  if (
    problems.length > 0 ||
    ref === undefined ||
    seed === undefined ||
    query === undefined ||
    on === undefined ||
    joinKind === undefined ||
    left === undefined ||
    right === undefined
  ) {
    return problems;
  }
  return { ref, seed, query, joinKind, on, left, right };
}
