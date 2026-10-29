import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { listLessonRefs } from './lessons';

let root: string;
let previous: string | undefined;

beforeAll(() => {
  previous = process.env['LESSONS_DIR'];
  root = mkdtempSync(join(tmpdir(), 'lessons-'));
  const course = join(root, 'frontend-architecture');
  mkdirSync(course);
  for (const id of ['unlisted-01', 'performance-01', 'need-01', 'compose-01']) {
    writeFileSync(join(course, `${id}.json`), '{}');
  }
  process.env['LESSONS_DIR'] = root;
});

afterAll(() => {
  if (previous === undefined) delete process.env['LESSONS_DIR'];
  else process.env['LESSONS_DIR'] = previous;
  rmSync(root, { recursive: true, force: true });
});

describe('listLessonRefs', () => {
  it('lists lessons in the order of content/<course>/roadmap.json, unlisted ones last', () => {
    expect(listLessonRefs().map((r) => r.lesson)).toEqual([
      'need-01',
      'compose-01',
      'performance-01',
      'unlisted-01',
    ]);
  });
});
