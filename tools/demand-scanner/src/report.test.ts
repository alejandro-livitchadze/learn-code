import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  EXCLUDED_IDS,
  aiBucket,
  buildAliasMap,
  computeStats,
  isBackendSide,
  loadContext,
  normalize,
  pct,
  renderJsReport,
  renderReport,
  renderUnknown,
  unknownCounts,
  sampleIds,
  writeReports,
  type Context,
  type Synonyms,
} from './report.js';
import { ExtractedSkillsSchema } from './schema.js';
import { dirsFor, listIds, readJson, writeJson } from './store.js';

const syn: Synonyms = {
  categories: ['language', 'runtime', 'framework', 'database', 'queue', 'ai', 'frontend'],
  skills: {
    nodejs: { category: 'runtime', aliases: ['node.js', 'node'] },
    typescript: { category: 'language', aliases: ['ts'] },
    nestjs: { category: 'framework', aliases: ['nest.js'] },
    redis: { category: 'database', aliases: [] },
    kafka: { category: 'queue', aliases: [] },
    cursor: { category: 'ai', aliases: [] },
    rag: { category: 'ai', aliases: [] },
    react: { category: 'frontend', aliases: [] },
  },
};
const aliases = buildAliasMap(syn);
const vac = (id: string) => ({
  id,
  url: `https://djinni.co/jobs/${id}-x/`,
  title: `T${id}`,
  publishedAt: '2026-09-10T10:00:00.000Z',
});
const ex = (
  id: string,
  required: string[],
  niceToHave: string[],
  seniority: 'junior' | 'middle' | 'senior' | 'lead' | 'unknown',
) => normalize(vac(id), { vacancyId: id, required, niceToHave, seniority }, aliases);

describe('normalize', () => {
  it('maps aliases, keeps unknown terms apart, dedupes within a vacancy', () => {
    const r = ex('1', ['Node.js', 'node', 'Nest.js', 'Foo  Bar'], ['Redis', 'ts'], 'senior');
    expect([...r.required].sort()).toEqual(['nestjs', 'nodejs']);
    expect([...r.niceToHave].sort()).toEqual(['redis', 'typescript']);
    expect([...r.unknown]).toEqual(['foo bar']);
  });
  it('does not count a required skill as optional', () => {
    const r = ex('1', ['Redis'], ['redis'], 'unknown');
    expect(r.niceToHave.size).toBe(0);
  });
});

describe('stats', () => {
  it('counts required and optional shares', () => {
    const rs = [ex('1', ['node'], ['redis'], 'junior'), ex('2', ['node', 'redis'], [], 'lead')];
    const s = computeStats(rs, syn);
    expect(s.sample).toBe(2);
    expect(s.rows.find((r) => r.id === 'nodejs')).toMatchObject({ required: 2, niceToHave: 0 });
    expect(s.rows.find((r) => r.id === 'redis')).toMatchObject({ required: 1, niceToHave: 1 });
    expect(pct(1, 3)).toBe('33.3%');
  });
  it('classifies backend-side skills and AI buckets', () => {
    expect(isBackendSide('react', 'frontend')).toBe(false);
    expect(isBackendSide('websockets', 'frontend')).toBe(true);
    expect(isBackendSide('english', 'other')).toBe(false);
    expect(isBackendSide('nestjs', 'framework')).toBe(true);
    expect(aiBucket('cursor')).toBe('coding-tools');
    expect(aiBucket('rag')).toBe('genai-building');
    expect(aiBucket('pytorch')).toBe('classic-ml');
  });
});

describe('sampleIds', () => {
  const ids = Array.from({ length: 50 }, (_, i) => String(1000 + i));
  it('is deterministic, unique, and sorted', () => {
    const a = sampleIds(ids, 20, 7);
    expect(a).toEqual(sampleIds(ids, 20, 7));
    expect(new Set(a).size).toBe(20);
    expect([...a]).toEqual([...a].sort((x, y) => Number(x) - Number(y)));
  });
});

describe('JS report', () => {
  it('restricts the sample to JS vacancies and splits by level', () => {
    const rs = [
      ex('1', ['node', 'Nest.js', 'react'], [], 'senior'),
      ex('2', ['ts', 'redis', 'Kafka'], [], 'junior'),
      ex('3', ['react'], [], 'senior'),
    ];
    const ctx: Context = {
      syn,
      all: rs,
      sample: rs,
      rejected: 0,
      duplicates: 0,
      extractionFailures: 0,
    };
    const md = renderJsReport(ctx);
    expect(md).toContain('Sample size: 2 vacancies');
    expect(md).toContain('| nestjs | 1 | 50.0% |');
    expect(md).toContain('| any queue (category queue) | 1 | 50.0% |');
    expect(md).not.toContain('| react |');
  });
});

describe('committed reports match the extraction files', () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const root = join(here, '..', '..', '..', 'research', 'demand');
  const ctx = loadContext(root, join(here, '..', 'synonyms.json'));
  it('are up to date with the data', () => {
    expect(readFileSync(join(root, 'report-js.md'), 'utf8')).toBe(renderJsReport(ctx));
    expect(readFileSync(join(root, 'report.md'), 'utf8')).toBe(
      `${renderReport(ctx)}\n${renderUnknown(unknownCounts(ctx.sample))}`,
    );
  });
  it('state a JS sample size that an independent recount of the files agrees with', () => {
    const dir = dirsFor(root).extracted;
    const js = new Set(['node.js', 'nodejs', 'node', 'typescript', 'javascript', 'js', 'ts']);
    let n = 0;
    for (const id of listIds(dir)) {
      if (EXCLUDED_IDS.includes(id)) continue;
      const e = ExtractedSkillsSchema.parse(readJson(join(dir, `${id}.json`)));
      if (e.required.some((t) => js.has(t.trim().toLowerCase()))) n++;
    }
    expect(readFileSync(join(root, 'report-js.md'), 'utf8')).toContain(
      `Sample size: ${n} vacancies`,
    );
  });
});

describe('writeReports on a fixture', () => {
  it('writes the four files and excludes the non-developer vacancies', () => {
    const root = mkdtempSync(join(tmpdir(), 'demand-rep-'));
    const d = dirsFor(root);
    const text = 'x'.repeat(60);
    const mk = (id: string, req: string[], seniority: string) => {
      writeJson(join(d.parsed, `${id}.json`), {
        ...vac(id),
        description: text,
        fetchedAt: '2026-10-01T10:00:00.000Z',
        query: 'Fullstack',
      });
      writeJson(join(d.extracted, `${id}.json`), {
        vacancyId: id,
        required: req,
        niceToHave: [],
        seniority,
      });
    };
    mk('1', ['Node.js'], 'senior');
    mk(EXCLUDED_IDS[0] ?? '2', ['Node.js'], 'lead');
    const synPath = join(root, 'syn.json');
    writeJson(synPath, syn);
    const ctx = writeReports(root, synPath);
    expect(ctx.all).toHaveLength(2);
    expect(ctx.sample).toHaveLength(1);
    const report = readFileSync(join(root, 'report.md'), 'utf8');
    expect(report).toContain('Sample size: 1 vacancies');
    expect(readFileSync(join(root, 'report-js.md'), 'utf8')).toContain('Sample size: 1 vacancies');
    expect(readFileSync(join(root, 'spot-check.md'), 'utf8')).toContain(
      'https://djinni.co/jobs/1-x/',
    );
  });
});
