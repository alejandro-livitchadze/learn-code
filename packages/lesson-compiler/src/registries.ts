import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { conceptsFile, misconceptionsFile } from '@learn-code/lesson-schema';
import type { Registries } from './lint';

export type RegistryResult =
  | { readonly ok: true; readonly registries: Registries }
  | { readonly ok: false; readonly errors: readonly string[] };

function readJson(file: string): { value?: unknown; error?: string } {
  if (!existsSync(file)) return { error: `missing registry file ${file}` };
  try {
    return { value: JSON.parse(readFileSync(file, 'utf8')) };
  } catch (e) {
    return { error: `${file}: invalid JSON: ${(e instanceof Error ? e.message : String(e))}` };
  }
}

/**
 * Load the registries of one course from `<courseDir>/registry/`:
 * `concepts.json`, `misconceptions.json` (required) and `syntax-concepts.json` (optional list of concept ids
 * that never get review cards).
 */
export function loadRegistries(courseDir: string): RegistryResult {
  const dir = join(courseDir, 'registry');
  const errors: string[] = [];
  const concepts = readJson(join(dir, 'concepts.json'));
  const misconceptions = readJson(join(dir, 'misconceptions.json'));
  if (concepts.error) errors.push(concepts.error);
  if (misconceptions.error) errors.push(misconceptions.error);
  const c = concepts.error ? undefined : conceptsFile.safeParse(concepts.value);
  const m = misconceptions.error ? undefined : misconceptionsFile.safeParse(misconceptions.value);
  if (c && !c.success) errors.push(`${join(dir, 'concepts.json')}: ${c.error.issues[0]?.message}`);
  if (m && !m.success) {
    errors.push(`${join(dir, 'misconceptions.json')}: ${m.error.issues[0]?.message}`);
  }
  let syntaxConcepts: string[] = [];
  const syntaxFile = join(dir, 'syntax-concepts.json');
  if (existsSync(syntaxFile)) {
    const s = readJson(syntaxFile);
    if (s.error) errors.push(s.error);
    else if (Array.isArray(s.value) && s.value.every((x) => typeof x === 'string')) {
      syntaxConcepts = s.value as string[];
    } else errors.push(`${syntaxFile}: expected an array of concept ids`);
  }
  if (errors.length > 0 || !c?.success || !m?.success) return { ok: false, errors };
  return { ok: true, registries: { concepts: c.data, misconceptions: m.data, syntaxConcepts } };
}
