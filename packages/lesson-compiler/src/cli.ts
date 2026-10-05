#!/usr/bin/env node
import { mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { checkLesson, formatIssue } from './check';
import { compileLesson, formatError } from './compile';
import { scaffoldLesson } from './scaffold';

const USAGE = `usage:
  lesson build <path>              compile to dist/lessons/<course>/<lesson>.json
  lesson check <path> [--allow-unbuilt]  compile, lint and verify samples (flag: compiler fixtures only)
  lesson new <course> <lesson-id>  scaffold content/<course>/<lesson-id>/
<path> is a lesson.mdoc, a lesson folder, or a folder containing lessons (default: content).`;

/** Find every lesson.mdoc under `path` (a file, or a directory searched recursively). */
export function findLessons(path: string): string[] {
  if (statSync(path).isFile()) return [path];
  const found: string[] = [];
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = join(path, entry.name);
    if (entry.isDirectory()) found.push(...findLessons(full));
    else if (entry.name === 'lesson.mdoc') found.push(full);
  }
  return found.sort();
}

type Log = (line: string) => void;

export async function run(argv: readonly string[], log: Log = console.log): Promise<number> {
  const [command, ...rest] = argv;
  const allowUnbuilt = rest.includes('--allow-unbuilt');
  const args = rest.filter((a) => a !== '--allow-unbuilt');
  if (command === 'new') {
    const [course, id] = args;
    if (!course || !id) return fail(log, 'new needs <course> <lesson-id>');
    try {
      log(`created ${scaffoldLesson('content', course, id)}`);
      return 0;
    } catch (e) {
      return fail(log, e instanceof Error ? e.message : String(e));
    }
  }
  if (command !== 'build' && command !== 'check') return fail(log, USAGE);
  const target = args[0] ?? 'content';
  let lessons: string[];
  try {
    lessons = findLessons(target);
  } catch {
    return fail(log, `cannot read ${target}`);
  }
  if (lessons.length === 0) return fail(log, `no lesson.mdoc found under ${target}`);

  let failed = false;
  for (const file of lessons) {
    if (command === 'check') {
      const issues = await checkLesson(file, { allowUnbuilt });
      issues.forEach((i) => log(formatIssue(i)));
      const errors = issues.filter((i) => i.severity === 'error').length;
      if (errors > 0) failed = true;
      else log(`ok ${file}`);
    } else {
      const r = compileLesson(file);
      if (!r.ok) {
        r.errors.forEach((e) => log(formatError(e)));
        failed = true;
        continue;
      }
      const out = join('dist', 'lessons', r.lesson.courseId, `${r.lesson.id}.json`);
      mkdirSync(dirname(out), { recursive: true });
      writeFileSync(out, `${JSON.stringify(r.lesson, null, 2)}\n`);
      log(`wrote ${out}`);
    }
  }
  return failed ? 1 : 0;
}

function fail(log: Log, message: string): number {
  log(message);
  return 1;
}

if (process.argv[1] && basename(process.argv[1]) === 'cli.ts') {
  run(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (e: unknown) => {
      console.error(e);
      process.exit(1);
    },
  );
}
