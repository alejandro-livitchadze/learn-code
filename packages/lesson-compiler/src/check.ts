import { dirname } from 'node:path';
import { compileLesson } from './compile';
import { lintLesson, type Registries } from './lint';
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

/**
 * Compile, lint and verify one `lesson.mdoc`. Registries default to
 * `<course dir>/registry/*.json`, where the course dir is the parent of the lesson dir.
 */
export async function checkLesson(path: string, registries?: Registries): Promise<CheckIssue[]> {
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

  let regs = registries;
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
  for (const i of lintLesson(compiled.lesson, regs)) {
    issues.push({
      file: path,
      line: lineOf(i.stepId),
      rule: i.rule,
      severity: i.severity,
      message: i.message,
    });
  }
  for (const v of await verifySamples(compiled.lesson, dirname(path))) {
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
