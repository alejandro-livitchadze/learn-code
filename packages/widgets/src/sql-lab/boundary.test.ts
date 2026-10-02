import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('sqlLab depends on the SqlEngine interface only', () => {
  const dir = import.meta.dirname;
  const sources = readdirSync(dir).filter((f) => /\.tsx?$/.test(f) && !/\.test\./.test(f));

  it('has sources to check', () => {
    expect(sources.length).toBeGreaterThan(5);
  });

  it.each(sources)('%s never imports PGlite or a runtime value from the engine package', (file) => {
    const text = readFileSync(join(dir, file), 'utf8');
    expect(text).not.toMatch(/(from|import\()\s*['"][^'"]*pglite/i);
    const imports = text.match(/^import[^;]*from\s+'@learn-code\/sql-engine';/gm) ?? [];
    for (const line of imports) expect(line).toMatch(/^import type /);
  });
});
