import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { conceptsFile, lesson, type Lesson } from '@learn-code/lesson-schema';

/** Directory with compiled lessons (`pnpm lesson build content` writes `dist/lessons`). */
function lessonsDir(): string {
  const fromEnv = process.env['LESSONS_DIR'];
  if (fromEnv) return resolve(fromEnv);
  let dir = process.cwd();
  for (;;) {
    const candidate = join(dir, 'dist', 'lessons');
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) {
      throw new Error('dist/lessons not found. Run `pnpm lesson build content` first.');
    }
    dir = parent;
  }
}

export interface LessonRef {
  readonly course: string;
  readonly lesson: string;
}

export function listLessonRefs(): readonly LessonRef[] {
  const root = lessonsDir();
  return readdirSync(root, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .flatMap((d) =>
      readdirSync(join(root, d.name))
        .filter((f) => f.endsWith('.json'))
        .map((f) => ({ course: d.name, lesson: f.slice(0, -'.json'.length) })),
    );
}

export function loadLesson(ref: LessonRef): Lesson {
  const raw: unknown = JSON.parse(
    readFileSync(join(lessonsDir(), ref.course, `${ref.lesson}.json`), 'utf8'),
  );
  return lesson.parse(raw);
}

/** Learner-facing names of a course's concepts, by concept id. Empty when the registry is missing. */
export function loadConceptNames(course: string): Readonly<Record<string, string>> {
  let dir = process.cwd();
  for (;;) {
    const file = join(dir, 'content', course, 'registry', 'concepts.json');
    if (existsSync(file)) {
      const parsed = conceptsFile.safeParse(JSON.parse(readFileSync(file, 'utf8')));
      return parsed.success ? Object.fromEntries(parsed.data.map((c) => [c.id, c.name])) : {};
    }
    const parent = dirname(dir);
    if (parent === dir) return {};
    dir = parent;
  }
}
