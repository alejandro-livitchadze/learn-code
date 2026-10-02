import { mkdirSync, readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const DATA_DIR =
  process.env['DEMAND_DATA_DIR'] ??
  join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'research', 'demand');

export interface Dirs {
  readonly raw: string;
  readonly feeds: string;
  readonly parsed: string;
  readonly rejected: string;
  readonly extracted: string;
}

export function dirsFor(root: string): Dirs {
  return {
    raw: join(root, 'raw'),
    feeds: join(root, 'raw', 'feeds'),
    parsed: join(root, 'parsed'),
    rejected: join(root, 'rejected'),
    extracted: join(root, 'extracted'),
  };
}

export function writeJson(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(value, null, 2) + '\n');
}

export function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8'));
}

export const exists = existsSync;

/** Ids (file stems) of `<id>.json` files in a directory, sorted numerically. */
export function listIds(dir: string): readonly string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => /^\d+\.json$/.test(f))
    .map((f) => f.slice(0, -5))
    .sort((a, b) => Number(a) - Number(b));
}
