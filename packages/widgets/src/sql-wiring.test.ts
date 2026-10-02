import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchSeed } from './sql-wiring';

afterEach(() => vi.unstubAllGlobals());

describe('sqlLab wiring', () => {
  it('imports the engine package only dynamically and only for types otherwise', () => {
    const text = readFileSync(join(import.meta.dirname, 'sql-wiring.tsx'), 'utf8');
    const staticImports = text.match(/^import[^;]*from\s+'@learn-code\/sql-engine';/gm) ?? [];
    for (const line of staticImports) expect(line).toMatch(/^import type /);
    expect(text).toContain("import('@learn-code/sql-engine')");
  });

  it('fetches <base>/<seedRef>.sql', async () => {
    const fetchMock = vi.fn(async () => new Response('create table t (id int);'));
    vi.stubGlobal('fetch', fetchMock);
    await expect(fetchSeed('/seeds/c/l', 'default')).resolves.toBe('create table t (id int);');
    expect(fetchMock).toHaveBeenCalledWith('/seeds/c/l/default.sql');
  });

  it('fails with a readable message when the seed is missing or no base is given', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('nope', { status: 404 })),
    );
    await expect(fetchSeed('/seeds/c/l', 'gone')).rejects.toThrow('Could not load the seed "gone"');
    await expect(fetchSeed(undefined, 'default')).rejects.toThrow('does not provide seed files');
  });
});
