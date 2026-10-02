import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const NODE_TIMEOUT_MS = 5000;

export type NodeRun =
  { readonly ok: true; readonly stdout: string } | { readonly ok: false; readonly error: string };

/** Run a JavaScript or TypeScript sample in a separate Node.js process with a timeout. */
export function runNode(code: string, language: 'js' | 'ts'): NodeRun {
  const dir = mkdtempSync(join(tmpdir(), 'lesson-sample-'));
  try {
    const file = join(dir, language === 'ts' ? 'sample.mts' : 'sample.mjs');
    writeFileSync(file, code);
    const r = spawnSync(process.execPath, [file], {
      encoding: 'utf8',
      timeout: NODE_TIMEOUT_MS,
      cwd: dir,
    });
    if (r.error) return { ok: false, error: r.error.message };
    if (r.status !== 0) return { ok: false, error: (r.stderr || `exit code ${r.status}`).trim() };
    return { ok: true, stdout: r.stdout.trim() };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
