import type { SqlResult } from './types';

const hex = (bytes: Uint8Array): string =>
  `\\x${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`;

function toJsonSafe(value: unknown): unknown {
  if (value === null || value === undefined) return null;
  if (typeof value === 'bigint') return value.toString();
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? 'invalid' : value.toISOString();
  if (value instanceof Uint8Array) return hex(value);
  if (Array.isArray(value)) return value.map(toJsonSafe);
  if (typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, toJsonSafe(v)]));
  }
  return value;
}

/** Turn any value PGlite can return into `null` or a string. */
export function normalizeValue(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'bigint') return value.toString();
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? 'invalid' : value.toISOString();
  if (value instanceof Uint8Array) return hex(value);
  return JSON.stringify(toJsonSafe(value));
}

/** Normalize every cell and keep at most `maxRows` rows; `rowCount` stays the true count. */
export function buildResult(
  columns: readonly string[],
  rows: readonly (readonly unknown[])[],
  maxRows: number,
): SqlResult {
  return {
    columns: [...columns],
    rows: rows.slice(0, Math.max(0, maxRows)).map((r) => r.map(normalizeValue)),
    rowCount: rows.length,
  };
}
