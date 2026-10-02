import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

/** The `content` directory of the repository (`CONTENT_DIR` overrides it). */
function contentDir(): string {
  const fromEnv = process.env['CONTENT_DIR'];
  if (fromEnv) return resolve(fromEnv);
  let dir = process.cwd();
  for (;;) {
    const candidate = join(dir, 'content');
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) throw new Error('content directory not found');
    dir = parent;
  }
}

export interface SeedRef {
  readonly course: string;
  readonly lesson: string;
  /** File name with extension, e.g. `default.sql`. */
  readonly file: string;
}

/** Every `content/<course>/<lesson>/seeds/*.sql`. */
export function listSeeds(): readonly SeedRef[] {
  const root = contentDir();
  const dirs = (path: string): string[] =>
    existsSync(path)
      ? readdirSync(path, { withFileTypes: true })
          .filter((d) => d.isDirectory())
          .map((d) => d.name)
      : [];
  return dirs(root).flatMap((course) =>
    dirs(join(root, course)).flatMap((lesson) => {
      const seeds = join(root, course, lesson, 'seeds');
      return existsSync(seeds)
        ? readdirSync(seeds)
            .filter((f) => f.endsWith('.sql'))
            .map((file) => ({ course, lesson, file }))
        : [];
    }),
  );
}

/** Only names that `listSeeds` found are readable, so a request cannot leave the seeds folder. */
export function readSeed(ref: SeedRef): string | undefined {
  const known = listSeeds().some(
    (s) => s.course === ref.course && s.lesson === ref.lesson && s.file === ref.file,
  );
  if (!known) return undefined;
  return readFileSync(join(contentDir(), ref.course, ref.lesson, 'seeds', ref.file), 'utf8');
}
