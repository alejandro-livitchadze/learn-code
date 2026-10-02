import { readFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { compileLesson } from './compile';
import { RULE_IDS, lintLesson, type Registries } from './lint';
import { loadRegistries } from './registries';
import { verifySamples } from './verify';

export interface CheckIssue {
  readonly file: string;
  /** 1-based line; 1 when the problem belongs to the whole lesson. */
  readonly line: number;
  /** `compile`, `verify`, `registry` or a lint rule id. */
  readonly rule: string;
  readonly severity: 'error' | 'warning';
  readonly message: string;
}

export const formatIssue = (i: CheckIssue): string =>
  `${i.file}:${i.line}: ${i.severity} [${i.rule}] ${i.message}`;

export interface CheckOptions {
  /** Registries to use instead of `<course dir>/registry/*.json`. */
  readonly registries?: Registries;
  /** Do not fail on step kinds without a widget. Only for compiler fixtures. */
  readonly allowUnbuilt?: boolean;
}

/**
 * Lessons that predate the playable-lesson rules. Their step count and unbuilt kinds are warnings
 * until they are rewritten (F6). Keyed `<courseId>/<lessonId>` by folder names.
 */
export const LEGACY_LESSONS: readonly string[] = ['fullstack/joins-01'];
const LEGACY_RULES: readonly string[] = [RULE_IDS.stepCount, RULE_IDS.unbuiltKind];

/** 1-based line of a top-level frontmatter key, or 1. */
function frontmatterLine(path: string, key: string): number {
  try {
    const lines = readFileSync(path, 'utf8').split('\n');
    const i = lines.findIndex((l) => l.startsWith(`${key}:`));
    return i < 0 ? 1 : i + 1;
  } catch {
    return 1;
  }
}

/**
 * Compile, lint and verify one `lesson.mdoc`. Registries default to
 * `<course dir>/registry/*.json`, where the course dir is the parent of the lesson dir.
 */
export async function checkLesson(path: string, options: CheckOptions = {}): Promise<CheckIssue[]> {
  const compiled = compileLesson(path);
  if (!compiled.ok) {
    return compiled.errors.map((e) => ({
      file: e.file,
      line: e.line,
      rule: 'compile',
      severity: 'error',
      message: e.message,
    }));
  }
  const issues: CheckIssue[] = [];
  const lineOf = (stepId: string | undefined): number =>
    (stepId === undefined ? undefined : compiled.stepLines[stepId]) ?? 1;

  let regs = options.registries;
  if (regs === undefined) {
    const loaded = loadRegistries(dirname(dirname(path)));
    if (loaded.ok) regs = loaded.registries;
    else {
      return loaded.errors.map((message) => ({
        file: path,
        line: 1,
        rule: 'registry',
        severity: 'error',
        message,
      }));
    }
  }
  const lessonDir = dirname(path);
  const folderLesson = basename(dirname(resolve(path)));
  const folderCourse = basename(dirname(dirname(resolve(path))));
  const legacy = LEGACY_LESSONS.includes(`${folderCourse}/${folderLesson}`);
  const folders: readonly (readonly [string, string, string])[] = [
    ['id', compiled.lesson.id, folderLesson],
    ['courseId', compiled.lesson.courseId, folderCourse],
  ];
  for (const [key, value, folder] of folders) {
    if (value !== folder) {
      issues.push({
        file: path,
        line: frontmatterLine(path, key),
        rule: 'folder-names',
        severity: 'error',
        message: `frontmatter ${key} "${value}" must equal the folder name "${folder}"`,
      });
    }
  }
  for (const i of lintLesson(compiled.lesson, regs, {
    allowUnbuilt: options.allowUnbuilt === true,
  })) {
    const line =
      i.stepIndex === undefined ? lineOf(i.stepId) : (compiled.stepLineList[i.stepIndex] ?? 1);
    issues.push({
      file: path,
      line,
      rule: i.rule,
      severity: legacy && LEGACY_RULES.includes(i.rule) ? 'warning' : i.severity,
      message: i.message,
    });
  }
  for (const v of await verifySamples(compiled.lesson, lessonDir)) {
    issues.push({
      file: path,
      line: lineOf(v.stepId),
      rule: 'verify',
      severity: 'error',
      message: `step "${v.stepId}": ${v.message}`,
    });
  }
  return issues.sort((a, b) => a.line - b.line);
}
