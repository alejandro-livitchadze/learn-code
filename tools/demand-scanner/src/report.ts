import { join } from 'node:path';
import { z } from 'zod';
import {
  ExtractedSkillsSchema,
  VacancySchema,
  type ExtractedSkills,
  type Vacancy,
} from './schema.js';
import { dirsFor, listIds, readJson, writeJson, exists } from './store.js';
import { writeFileSync } from 'node:fs';

const SynonymsSchema = z.object({
  categories: z.array(z.string()),
  skills: z.record(z.object({ category: z.string(), aliases: z.array(z.string()) })),
});
export type Synonyms = z.infer<typeof SynonymsSchema>;

/** Vacancies that are not ordinary developer roles (interviewer, AI training or evaluation gigs). */
export const EXCLUDED_IDS: readonly string[] = ['850924', '850047', '850459'];

/** Skills in the `other` category and others that are not backend technology (soft or process skills). */
const NOT_TECH: ReadonlySet<string> = new Set([
  'english',
  'mentoring',
  'code-review',
  'agile',
  'jira',
]);
/** Skills in the `other` category that belong to the frontend, mobile or desktop side. */
const FRONTEND_OTHER: ReadonlySet<string> = new Set([
  'electron',
  'tauri',
  'react-hook-form',
  'pwa',
  'seo',
  'accessibility',
  'i18n',
  'flutter',
  'ios',
  'android',
  'unity',
  'webrtc',
]);
/** Skills in the `frontend` category that are backend-side too. */
const BACKEND_FROM_FRONTEND: ReadonlySet<string> = new Set(['websockets']);
/** Language and markup skills that are frontend only. */
const FRONTEND_LANG: ReadonlySet<string> = new Set(['html', 'css', 'sass']);
/** Frameworks that are frontend meta-frameworks. */
const FRONTEND_FRAMEWORK: ReadonlySet<string> = new Set(['remix', 'nuxt']);
/** The filter skills of the JS report. They define the sample, so they are not ranked in it. */
export const JS_FILTER: readonly string[] = ['nodejs', 'typescript', 'javascript'];

export const AI_CODING_TOOLS: ReadonlySet<string> = new Set([
  'claude-code',
  'copilot',
  'cursor',
  'codex',
  'windsurf',
  'ai-assisted-development',
]);
export const CLASSIC_ML: ReadonlySet<string> = new Set([
  'pytorch',
  'tensorflow',
  'scikit-learn',
  'machine-learning',
  'nlp',
  'computer-vision',
  'huggingface',
]);

export function isBackendSide(id: string, category: string): boolean {
  if (NOT_TECH.has(id) || FRONTEND_OTHER.has(id) || FRONTEND_LANG.has(id)) return false;
  if (FRONTEND_FRAMEWORK.has(id)) return false;
  if (category === 'frontend') return BACKEND_FROM_FRONTEND.has(id);
  return true;
}

export type AiBucket = 'coding-tools' | 'genai-building' | 'classic-ml';
export function aiBucket(id: string): AiBucket {
  if (AI_CODING_TOOLS.has(id)) return 'coding-tools';
  if (CLASSIC_ML.has(id)) return 'classic-ml';
  return 'genai-building';
}

const norm = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase();

export function buildAliasMap(syn: Synonyms): ReadonlyMap<string, string> {
  const m = new Map<string, string>();
  for (const [id, def] of Object.entries(syn.skills)) {
    m.set(norm(id), id);
    for (const a of def.aliases) m.set(norm(a), id);
  }
  return m;
}

export interface VacancyRecord {
  readonly id: string;
  readonly url: string;
  readonly title: string;
  readonly publishedAt: string;
  readonly seniority: ExtractedSkills['seniority'];
  readonly required: ReadonlySet<string>;
  readonly niceToHave: ReadonlySet<string>;
  readonly unknown: ReadonlySet<string>;
}

/** Normalizes one extraction; unknown terms are returned separately (never guessed). */
export function normalize(
  vac: Pick<Vacancy, 'id' | 'url' | 'title' | 'publishedAt'>,
  ex: ExtractedSkills,
  aliases: ReadonlyMap<string, string>,
): VacancyRecord {
  const required = new Set<string>();
  const niceToHave = new Set<string>();
  const unknown = new Set<string>();
  const put = (term: string, into: Set<string>) => {
    const id = aliases.get(norm(term));
    if (id === undefined) unknown.add(norm(term));
    else into.add(id);
  };
  for (const t of ex.required) put(t, required);
  for (const t of ex.niceToHave) put(t, niceToHave);
  // a skill that is required anywhere in the vacancy is not also optional
  for (const id of required) niceToHave.delete(id);
  return {
    id: vac.id,
    url: vac.url,
    title: vac.title,
    publishedAt: vac.publishedAt,
    seniority: ex.seniority,
    required,
    niceToHave,
    unknown,
  };
}

export interface Row {
  readonly id: string;
  readonly category: string;
  readonly required: number;
  readonly niceToHave: number;
}

export interface Stats {
  readonly sample: number;
  readonly rows: readonly Row[];
}

export function computeStats(records: readonly VacancyRecord[], syn: Synonyms): Stats {
  const req = new Map<string, number>();
  const nice = new Map<string, number>();
  for (const r of records) {
    for (const id of r.required) req.set(id, (req.get(id) ?? 0) + 1);
    for (const id of r.niceToHave) nice.set(id, (nice.get(id) ?? 0) + 1);
  }
  const ids = new Set([...req.keys(), ...nice.keys()]);
  const rows = [...ids]
    .map((id) => ({
      id,
      category: syn.skills[id]?.category ?? 'other',
      required: req.get(id) ?? 0,
      niceToHave: nice.get(id) ?? 0,
    }))
    .sort(
      (a, b) => b.required - a.required || b.niceToHave - a.niceToHave || a.id.localeCompare(b.id),
    );
  return { sample: records.length, rows };
}

export const pct = (n: number, of: number): string =>
  of === 0 ? '0.0%' : `${((n / of) * 100).toFixed(1)}%`;

/** Number of records for which at least one skill of the set is required. */
export function countAny(records: readonly VacancyRecord[], ids: ReadonlySet<string>): number {
  return records.filter((r) => [...r.required].some((s) => ids.has(s))).length;
}

export function unknownCounts(records: readonly VacancyRecord[]): ReadonlyMap<string, number> {
  const m = new Map<string, number>();
  for (const r of records) for (const t of r.unknown) m.set(t, (m.get(t) ?? 0) + 1);
  return m;
}

/** Deterministic pseudo-random sample (mulberry32 seeded Fisher-Yates), returned sorted by id. */
export function sampleIds(ids: readonly string[], n: number, seed: number): readonly string[] {
  let a = seed >>> 0;
  const rand = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const arr = [...ids];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const x = arr[i];
    const y = arr[j];
    if (x === undefined || y === undefined) continue;
    arr[i] = y;
    arr[j] = x;
  }
  return arr.slice(0, n).sort((p, q) => Number(p) - Number(q));
}

const table = (head: readonly string[], rows: readonly (readonly (string | number)[])[]): string =>
  [
    `| ${head.join(' | ')} |`,
    `|${head.map(() => '---').join('|')}|`,
    ...rows.map((r) => `| ${r.join(' | ')} |`),
  ].join('\n');

export interface Context {
  readonly syn: Synonyms;
  readonly all: readonly VacancyRecord[]; // every extracted vacancy
  readonly sample: readonly VacancyRecord[]; // excluding EXCLUDED_IDS
  readonly rejected: number;
  readonly duplicates: number;
  readonly extractionFailures: number;
}

const dateRange = (rs: readonly VacancyRecord[]): string => {
  const d = rs.map((r) => r.publishedAt.slice(0, 10)).sort();
  return `${d[0] ?? '-'} to ${d[d.length - 1] ?? '-'}`;
};

const SENIORITY_ORDER = ['junior', 'middle', 'senior', 'lead', 'unknown'] as const;

function bucketSection(sample: readonly VacancyRecord[], rows: readonly Row[]): string {
  const aiIds = rows.filter((r) => r.category === 'ai').map((r) => r.id);
  const lines: string[] = [];
  for (const bucket of ['coding-tools', 'genai-building', 'classic-ml'] as const) {
    const ids = new Set(aiIds.filter((id) => aiBucket(id) === bucket));
    const n = countAny(sample, ids);
    lines.push(`- ${bucket}: ${n} (${pct(n, sample.length)})`);
  }
  return lines.join('\n');
}

export function renderReport(ctx: Context): string {
  const { sample, syn } = ctx;
  const stats = computeStats(sample, syn);
  const n = sample.length;
  const bySen = SENIORITY_ORDER.map((s) => {
    const c = sample.filter((r) => r.seniority === s).length;
    return [s, c, pct(c, n)];
  });
  const sections = syn.categories.map((cat) => {
    const rows = stats.rows.filter((r) => r.category === cat).slice(0, 10);
    if (rows.length === 0) return '';
    return `### ${cat}\n\n${table(
      ['skill', 'required', 'required %', 'nice to have', 'nice to have %'],
      rows.map((r) => [r.id, r.required, pct(r.required, n), r.niceToHave, pct(r.niceToHave, n)]),
    )}`;
  });
  const aiAny = countAny(
    sample,
    new Set(
      Object.entries(syn.skills)
        .filter(([, d]) => d.category === 'ai')
        .map(([id]) => id),
    ),
  );
  return `# Demand report: Djinni fullstack and Node.js vacancies

Generated by \`pnpm demand report\` from \`parsed/\`, \`extracted/\` and \`tools/demand-scanner/synonyms.json\`. Do not edit by hand.

## Sample

- Sample size: ${n} vacancies (${ctx.all.length} extracted, ${ctx.all.length - n} excluded).
- Published: ${dateRange(sample)}.
- Failed vacancies: ${ctx.rejected} rejected at parsing, ${ctx.extractionFailures} without a valid extraction. ${ctx.duplicates} duplicate reposts were dropped before extraction.
- Excluded as not ordinary developer roles: ${EXCLUDED_IDS.join(', ')} (a technical interviewer role and two AI training or evaluation gigs).
- Shares are of the sample. "required" counts vacancies that list the skill as required; "nice to have" counts those that mark it optional.
- Source: Djinni RSS only. It reflects the Ukrainian market and is one input, not the whole picture.

## Seniority

${table(['seniority', 'vacancies', 'share'], bySen)}

"Junior-Middle" in a title is mapped to junior; "Junior/Middle" with other qualifiers may be middle. The report groups junior and middle together where it splits by level, so this does not change those numbers.

## AI skills in the sample

Any AI skill required: ${aiAny} (${pct(aiAny, n)}). Buckets, each counting vacancies that require at least one skill in it:

${bucketSection(sample, stats.rows)}

Bucketing: coding-tools = ${[...AI_CODING_TOOLS].join(', ')}. classic-ml = ${[...CLASSIC_ML].join(', ')}. genai-building = every other skill of the \`ai\` category (llm, rag, mcp, langchain, vector-db, ai-agents and so on).

## Top skills by category (top 10 each)

${sections.filter((s) => s !== '').join('\n\n')}
`;
}

export function renderJsReport(ctx: Context): string {
  const js = ctx.sample.filter((r) => JS_FILTER.some((s) => r.required.has(s)));
  const n = js.length;
  const syn = ctx.syn;
  const stats = computeStats(js, syn);
  const backend = stats.rows.filter(
    (r) => isBackendSide(r.id, r.category) && !JS_FILTER.includes(r.id),
  );
  const top20 = backend.filter((r) => r.required > 0).slice(0, 20);
  const get = (id: string) => stats.rows.find((r) => r.id === id)?.required ?? 0;
  const named = [
    'nestjs',
    'express',
    'fastify',
    'prisma',
    'typeorm',
    'drizzle',
    'sequelize',
    'redis',
  ];
  const idsOf = (cat: string) =>
    new Set(
      Object.entries(syn.skills)
        .filter(([, d]) => d.category === cat)
        .map(([id]) => id),
    );
  const queue = countAny(js, idsOf('queue'));
  const ai = countAny(js, idsOf('ai'));
  const shares: (readonly (string | number)[])[] = [
    ...named.map((id) => [id, get(id), pct(get(id), n)]),
    ['any queue (category queue)', queue, pct(queue, n)],
    ['any AI skill (category ai)', ai, pct(ai, n)],
  ];
  const aiBuckets = bucketSection(js, stats.rows);
  const hi = js.filter((r) => r.seniority === 'senior' || r.seniority === 'lead');
  const lo = js.filter((r) => r.seniority === 'junior' || r.seniority === 'middle');
  const unknownLevel = js.length - hi.length - lo.length;
  const top10 = (rs: readonly VacancyRecord[]) =>
    computeStats(rs, syn)
      .rows.filter((r) => isBackendSide(r.id, r.category) && !JS_FILTER.includes(r.id))
      .filter((r) => r.required > 0)
      .slice(0, 10);
  const split = (rs: readonly VacancyRecord[]) =>
    table(
      ['skill', 'required', 'share'],
      top10(rs).map((r) => [r.id, r.required, pct(r.required, rs.length)]),
    );
  const filterRows = JS_FILTER.map((id) => [id, get(id), pct(get(id), n)]);
  return `# Demand report: JavaScript and TypeScript backend vacancies

Generated by \`pnpm demand report\`. Do not edit by hand.

## Sample

- Sample size: ${n} vacancies where nodejs, typescript or javascript is required (of ${ctx.sample.length} in the main sample; see \`report.md\`).
- Excluded as not ordinary developer roles: ${EXCLUDED_IDS.join(', ')}.
- Published: ${dateRange(js)}.
- Percentages are shares of this sample, counting required skills only.

${table(['filter skill', 'required', 'share'], filterRows)}

## Top 20 required backend-side skills

Backend-side means every canonical skill except the \`frontend\` category (websockets kept), html, css, sass, frontend meta-frameworks (remix, nuxt), mobile and desktop skills, and soft or process skills (english, mentoring, code-review, agile, jira). The three filter skills are not ranked.

${table(
  ['#', 'skill', 'category', 'required', 'share'],
  top20.map((r, i) => [i + 1, r.id, r.category, r.required, pct(r.required, n)]),
)}

## Shares of named technologies

${table(['technology', 'vacancies', 'share'], shares)}

AI skills by bucket in this sample:

${aiBuckets}

## Top 10 by level

Senior and lead: ${hi.length} vacancies. Junior and middle: ${lo.length} vacancies. Level unknown: ${unknownLevel} (not in either table).

### Senior and lead

${split(hi)}

### Junior and middle

${split(lo)}
`;
}

export function renderSpotCheck(ctx: Context, ids: readonly string[]): string {
  const byId = new Map(ctx.all.map((r) => [r.id, r]));
  const rows = ids.map((id) => {
    const r = byId.get(id);
    return [id, r === undefined ? '' : `[${r.url}](${r.url})`, r?.title ?? '', r?.seniority ?? ''];
  });
  return `# Spot check

20 vacancy ids drawn at random (fixed seed ${SPOT_SEED}, from all ${ctx.all.length} extracted vacancies). Open each link and compare the vacancy text with \`extracted/<id>.json\`. \`pnpm demand validate\` already checks that every extracted skill occurs literally in the text; this check looks for missed or misread skills.

${table(['id', 'link', 'title', 'seniority'], rows)}
`;
}

export const SPOT_SEED = 20261002;

export function renderUnknown(counts: ReadonlyMap<string, number>): string {
  const rows = [...counts.entries()]
    .filter(([, c]) => c >= 3)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return `## Unknown terms seen 3 or more times

Terms from the extraction files that are not in \`synonyms.json\` (neither as an id nor as an alias). They are not counted in any table above; counts are vacancies in the main sample. All terms with counts: \`unknown-terms.json\`.

${table(['term', 'vacancies'], rows)}
`;
}

export function loadContext(root: string, synonymsPath: string): Context {
  const dirs = dirsFor(root);
  const syn = SynonymsSchema.parse(readJson(synonymsPath));
  const aliases = buildAliasMap(syn);
  const all: VacancyRecord[] = [];
  let failures = 0;
  for (const id of listIds(dirs.parsed)) {
    const exPath = join(dirs.extracted, `${id}.json`);
    const ex = exists(exPath) ? ExtractedSkillsSchema.safeParse(readJson(exPath)) : undefined;
    if (ex === undefined || !ex.success) {
      failures++;
      continue;
    }
    all.push(
      normalize(VacancySchema.parse(readJson(join(dirs.parsed, `${id}.json`))), ex.data, aliases),
    );
  }
  const dupPath = join(root, 'duplicates.json');
  const duplicates = exists(dupPath)
    ? Object.keys(z.record(z.string()).parse(readJson(dupPath))).length
    : 0;
  const rejected = listIds(dirs.rejected).length;
  return {
    syn,
    all,
    sample: all.filter((r) => !EXCLUDED_IDS.includes(r.id)),
    rejected,
    duplicates,
    extractionFailures: failures,
  };
}

export function writeReports(root: string, synonymsPath: string): Context {
  const ctx = loadContext(root, synonymsPath);
  const unknown = unknownCounts(ctx.sample);
  const sorted = [...unknown.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  writeJson(join(root, 'unknown-terms.json'), Object.fromEntries(sorted));
  writeFileSync(join(root, 'report.md'), `${renderReport(ctx)}\n${renderUnknown(unknown)}`);
  writeFileSync(join(root, 'report-js.md'), renderJsReport(ctx));
  writeFileSync(
    join(root, 'spot-check.md'),
    renderSpotCheck(
      ctx,
      sampleIds(
        ctx.all.map((r) => r.id),
        20,
        SPOT_SEED,
      ),
    ),
  );
  return ctx;
}
