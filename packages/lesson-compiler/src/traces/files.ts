import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { generateTrace } from './generate';
import { parseTraceSpec } from './spec';
import type { JoinTrace } from './types';

const SPEC_SUFFIX = '.spec.json';
const TRACE_SUFFIX = '.trace.json';

export interface TraceFiles {
  /** `<lesson dir>/traces/<ref>.spec.json` */
  readonly specPath: string;
  /** `<lesson dir>/traces/<ref>.trace.json` */
  readonly tracePath: string;
  readonly seedDir: string;
}

/** Every `<content>/<course>/<lesson>/traces/*.spec.json`. */
export function findTraceSpecs(contentDir: string): readonly TraceFiles[] {
  const dirs = (path: string): string[] =>
    existsSync(path)
      ? readdirSync(path, { withFileTypes: true })
          .filter((d) => d.isDirectory())
          .map((d) => d.name)
      : [];
  return dirs(contentDir).flatMap((course) =>
    dirs(join(contentDir, course)).flatMap((lesson) => {
      const lessonDir = join(contentDir, course, lesson);
      const traces = join(lessonDir, 'traces');
      return existsSync(traces)
        ? readdirSync(traces)
            .filter((f) => f.endsWith(SPEC_SUFFIX))
            .sort()
            .map((f) => ({
              specPath: join(traces, f),
              tracePath: join(traces, f.slice(0, -SPEC_SUFFIX.length) + TRACE_SUFFIX),
              seedDir: join(lessonDir, 'seeds'),
            }))
        : [];
    }),
  );
}

/** Stable text form of a trace, so a diff shows only real changes. */
export const serializeTrace = (trace: JoinTrace): string => `${JSON.stringify(trace, null, 2)}\n`;

/** Read a spec file and generate its trace from PGlite. */
export async function generateFromFiles(files: TraceFiles): Promise<JoinTrace> {
  const raw: unknown = JSON.parse(readFileSync(files.specPath, 'utf8'));
  const spec = parseTraceSpec(raw);
  if ('length' in spec) throw new Error(`${files.specPath}: ${spec.join('; ')}`);
  const seedFile = join(files.seedDir, `${spec.seed}.sql`);
  if (!existsSync(seedFile))
    throw new Error(`${files.specPath}: seed "${spec.seed}" does not exist`);
  return generateTrace(spec, readFileSync(seedFile, 'utf8'));
}

/**
 * Compare every committed trace with a fresh run on PGlite. Returns one message per trace that is
 * missing or differs. Run in CI by the traces test.
 */
export async function checkTraces(contentDir: string): Promise<readonly string[]> {
  const problems: string[] = [];
  for (const files of findTraceSpecs(contentDir)) {
    try {
      const fresh = serializeTrace(await generateFromFiles(files));
      if (!existsSync(files.tracePath))
        problems.push(
          `${files.tracePath}: missing; run "pnpm exec tsx src/traces/cli.ts" in packages/lesson-compiler`,
        );
      else if (readFileSync(files.tracePath, 'utf8') !== fresh)
        problems.push(
          `${files.tracePath}: differs from what PostgreSQL produces now; regenerate it`,
        );
    } catch (e) {
      problems.push(e instanceof Error ? e.message : String(e));
    }
  }
  return problems;
}

/** Regenerate every recorded trace. Returns the paths written. */
export async function writeTraces(contentDir: string): Promise<readonly string[]> {
  const written: string[] = [];
  for (const files of findTraceSpecs(contentDir)) {
    writeFileSync(files.tracePath, serializeTrace(await generateFromFiles(files)));
    written.push(files.tracePath);
  }
  return written;
}
