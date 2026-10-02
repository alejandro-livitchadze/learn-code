import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { checkLesson, lessonTemplate, scaffoldLesson } from '../src';
import { compileSource } from '../src/compile';
import { closeSql } from '../src/verify';
import { findLessons, run } from '../src/cli';

const repoContent = resolve(dirname(fileURLToPath(import.meta.url)), '../../../content');
const tmp = mkdtempSync(join(tmpdir(), 'lesson-cli-'));
const cwd = process.cwd();
beforeAll(() => process.chdir(tmp));
afterAll(async () => {
  await closeSql();
  process.chdir(cwd);
  rmSync(tmp, { recursive: true, force: true });
});

const collect = () => {
  const lines: string[] = [];
  return { lines, log: (l: string) => void lines.push(l) };
};

describe('scaffold', () => {
  it('template compiles', () => {
    const r = compileSource(lessonTemplate('c', 'l'), 'x.mdoc');
    expect(r.ok, JSON.stringify(!r.ok && r.errors)).toBe(true);
  });

  it('creates a lesson folder, empty registries, and refuses to overwrite', () => {
    const file = scaffoldLesson('content', 'demo', 'intro-01');
    expect(existsSync(file)).toBe(true);
    expect(existsSync('content/demo/intro-01/seeds')).toBe(true);
    expect(readFileSync('content/demo/registry/concepts.json', 'utf8')).toBe('[]\n');
    expect(() => scaffoldLesson('content', 'demo', 'intro-01')).toThrow('already exists');
    expect(() => scaffoldLesson('content', 'Demo', 'x')).toThrow('kebab-case');
    scaffoldLesson('content', 'demo', 'intro-02');
  });

  it('scaffolded lesson is checked and rejected until the author fills the registries', async () => {
    const issues = await checkLesson('content/demo/intro-01/lesson.mdoc');
    expect(issues.length).toBeGreaterThan(0);
  });
});

describe('cli', () => {
  it('new', async () => {
    const o = collect();
    expect(await run(['new', 'cli', 'a-01'], o.log)).toBe(0);
    expect(o.lines[0]).toContain('created');
    expect(await run(['new', 'cli', 'a-01'], o.log)).toBe(1);
    expect(await run(['new', 'cli'], o.log)).toBe(1);
  });

  it('--allow-unbuilt is accepted and drops the unbuilt-kind findings', async () => {
    const o = collect();
    const lesson = join(repoContent, 'fullstack/joins-01');
    expect(await run(['check', lesson, '--allow-unbuilt'], o.log)).toBe(0);
    expect(o.lines.join('\n')).not.toContain('unbuilt-kind');
  });

  it('prints usage for unknown commands', async () => {
    const o = collect();
    expect(await run(['nope'], o.log)).toBe(1);
    expect(o.lines[0]).toContain('usage');
  });

  it('check fails on the unfinished scaffold and passes on the real sample', async () => {
    const o = collect();
    expect(await run(['check', 'content/demo'], o.log)).toBe(1);
    expect(o.lines.join('\n')).toMatch(/lesson\.mdoc:\d+: error/);
    const ok = collect();
    expect(await run(['check', join(repoContent, 'fullstack/joins-01')], ok.log)).toBe(0);
    expect(ok.lines.at(-1)).toMatch(/^ok /);
    expect(ok.lines.join('\n')).not.toContain('warning');
  }, 120_000);

  it('build writes json, and reports compile errors', async () => {
    const o = collect();
    expect(await run(['build', join(repoContent, 'fullstack')], o.log)).toBe(0);
    const out = 'dist/lessons/fullstack/joins-01.json';
    expect(JSON.parse(readFileSync(out, 'utf8')).id).toBe('joins-01');
    mkdirSync('bad', { recursive: true });
    writeFileSync('bad/lesson.mdoc', 'text outside a tag\n');
    const bad = collect();
    expect(await run(['build', 'bad'], bad.log)).toBe(1);
    expect(bad.lines.join('\n')).toContain('bad/lesson.mdoc:');
    expect(await run(['check', 'bad'], collect().log)).toBe(1);
  });

  it('handles missing paths and empty folders', async () => {
    expect(await run(['check', 'does-not-exist'], collect().log)).toBe(1);
    mkdirSync('empty/.hidden', { recursive: true });
    expect(await run(['check', 'empty'], collect().log)).toBe(1);
    expect(findLessons('bad')).toEqual([join('bad', 'lesson.mdoc')]);
  });
});
