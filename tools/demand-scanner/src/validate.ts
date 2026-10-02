import { join } from 'node:path';
import { ExtractedSkillsSchema, VacancySchema, type ExtractedSkills } from './schema.js';
import { dirsFor, exists, listIds, readJson } from './store.js';

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();

/** Skills that do not literally occur in the vacancy text (case and whitespace insensitive). */
export function missingSkills(ex: ExtractedSkills, vacancyText: string): readonly string[] {
  const hay = norm(vacancyText);
  return [...ex.required, ...ex.niceToHave].filter((s) => !hay.includes(norm(s)));
}

export interface ValidationResult {
  readonly checked: number;
  readonly errors: readonly string[];
}

export function validateExtractions(root: string): ValidationResult {
  const dirs = dirsFor(root);
  const errors: string[] = [];
  const ids = listIds(dirs.extracted);
  for (const id of ids) {
    const parsed = ExtractedSkillsSchema.safeParse(readJson(join(dirs.extracted, `${id}.json`)));
    if (!parsed.success) {
      errors.push(`${id}: schema: ${parsed.error.issues.map((i) => `${i.path.join('.')} ${i.message}`).join('; ')}`);
      continue;
    }
    if (parsed.data.vacancyId !== id) {
      errors.push(`${id}: vacancyId ${parsed.data.vacancyId} does not match the file name`);
      continue;
    }
    const vacPath = join(dirs.parsed, `${id}.json`);
    if (!exists(vacPath)) {
      errors.push(`${id}: no parsed vacancy`);
      continue;
    }
    const vac = VacancySchema.parse(readJson(vacPath));
    const missing = missingSkills(parsed.data, `${vac.title}\n${vac.description}`);
    if (missing.length > 0) errors.push(`${id}: not found in vacancy text: ${missing.join(', ')}`);
  }
  return { checked: ids.length, errors };
}
