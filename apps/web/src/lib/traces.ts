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

export interface TraceFile {
  readonly course: string;
  readonly lesson: string;
  /** File name with extension, e.g. `join-inner.trace.json`. */
  readonly file: string;
}

/** Every `content/<course>/<lesson>/traces/*.trace.json`. */
export function listTraces(): readonly TraceFile[] {
  const root = contentDir();
  const dirs = (path: string): string[] =>
    existsSync(path)
      ? readdirSync(path, { withFileTypes: true })
          .filter((d) => d.isDirectory())
          .map((d) => d.name)
      : [];
  return dirs(root).flatMap((course) =>
    dirs(join(root, course)).flatMap((lesson) => {
      const traces = join(root, course, lesson, 'traces');
      return existsSync(traces)
        ? readdirSync(traces)
            .filter((f) => f.endsWith('.trace.json'))
            .map((file) => ({ course, lesson, file }))
        : [];
    }),
  );
}

/** Only names that `listTraces` found are readable, so a request cannot leave the traces folder. */
export function readTrace(ref: TraceFile): string | undefined {
  const known = listTraces().some(
    (t) => t.course === ref.course && t.lesson === ref.lesson && t.file === ref.file,
  );
  if (!known) return undefined;
  return readFileSync(join(contentDir(), ref.course, ref.lesson, 'traces', ref.file), 'utf8');
}
