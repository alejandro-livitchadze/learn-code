import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { listTraces, readTrace } from './traces';

let root: string;
let previous: string | undefined;

beforeAll(() => {
  previous = process.env['CONTENT_DIR'];
  root = mkdtempSync(join(tmpdir(), 'traces-'));
  const traces = join(root, 'course-a', 'lesson-1', 'traces');
  mkdirSync(traces, { recursive: true });
  writeFileSync(join(traces, 'one.trace.json'), '{"ref":"one"}');
  writeFileSync(join(traces, 'one.spec.json'), '{"ref":"spec"}');
  mkdirSync(join(root, 'course-a', 'lesson-2'));
  writeFileSync(join(root, 'secret.trace.json'), 'outside');
  process.env['CONTENT_DIR'] = root;
});

afterAll(() => {
  if (previous === undefined) delete process.env['CONTENT_DIR'];
  else process.env['CONTENT_DIR'] = previous;
  rmSync(root, { recursive: true, force: true });
});

describe('listTraces', () => {
  it('finds only *.trace.json files under content/<course>/<lesson>/traces', () => {
    expect(listTraces()).toEqual([
      { course: 'course-a', lesson: 'lesson-1', file: 'one.trace.json' },
    ]);
  });
});

describe('readTrace', () => {
  const ref = { course: 'course-a', lesson: 'lesson-1', file: 'one.trace.json' };

  it('returns the file text for a listed trace', () => {
    expect(readTrace(ref)).toBe('{"ref":"one"}');
  });

  it('returns undefined for an unknown name', () => {
    expect(readTrace({ ...ref, file: 'two.trace.json' })).toBeUndefined();
  });

  it('returns undefined for ../.. segments', () => {
    expect(readTrace({ course: '..', lesson: '..', file: 'secret.trace.json' })).toBeUndefined();
    expect(readTrace({ ...ref, file: '../../../secret.trace.json' })).toBeUndefined();
  });

  it('returns undefined for a .spec.json file', () => {
    expect(readTrace({ ...ref, file: 'one.spec.json' })).toBeUndefined();
  });
});
