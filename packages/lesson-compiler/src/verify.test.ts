import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { compileSource, formatError, verifySamples } from './index';

const dir = join(dirname(fileURLToPath(import.meta.url)), '__fixtures__');
const path = join(dir, 'lesson.mdoc');
const source = readFileSync(path, 'utf8')
  .replace('./samples/join.sql', './samples/date.sql')
  .replace('output="100 rows"', 'output="2024-03-11"')
  .replace('output="400 rows"', 'output="2024-03-10"');

describe('predict with a date output', () => {
  it('passes when the declared output is the date PostgreSQL prints', async () => {
    const r = compileSource(source, path);
    if (!r.ok) throw new Error(r.errors.map(formatError).join('\n'));
    const issues = await verifySamples(r.lesson, dir);
    expect(issues.filter((i) => i.stepId === 'p1')).toEqual([]);
  });

  it('fails when the declared output is an ISO timestamp', async () => {
    const r = compileSource(
      source.replace('output="2024-03-10"', 'output="2024-03-10T00:00:00.000Z"'),
      path,
    );
    if (!r.ok) throw new Error(r.errors.map(formatError).join('\n'));
    const issues = await verifySamples(r.lesson, dir);
    expect(issues.filter((i) => i.stepId === 'p1')).toHaveLength(1);
  });
});
