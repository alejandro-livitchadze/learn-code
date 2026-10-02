import { mkdtempSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BlockedError, feedUrl, fetchFeeds, type Fetcher } from './fetch.js';
import { parseAll } from './parse.js';
import { htmlToText, parseFeed, vacancyIdFromLink } from './rss.js';
import { dirsFor, writeJson } from './store.js';
import { missingSkills, validateExtractions } from './validate.js';

const LONG = 'We need a developer who knows Node.js, PostgreSQL and Redis. '.repeat(3);
const item = (id: number, title: string, desc = `&lt;p&gt;${LONG}&lt;/p&gt;`) =>
  `<item><title>${title}</title><link>https://djinni.co/jobs/${id}-slug/</link><description>${desc}</description><pubDate>Thu, 01 Oct 2026 14:44:26 +0300</pubDate></item>`;
const feed = (...items: string[]) =>
  `<?xml version="1.0"?><rss version="2.0"><channel><title>x</title>${items.join('')}</channel></rss>`;
const tmp = () => mkdtempSync(join(tmpdir(), 'demand-'));
const okFetcher =
  (body: string): Fetcher =>
  async () => ({ status: 200, text: body });
const opts = { keywords: ['Fullstack'], expLevels: ['1y'], delayMs: 0 };

describe('rss', () => {
  it('parses one and many items, and an empty feed', () => {
    expect(parseFeed(feed(item(1, 'A')))).toHaveLength(1);
    expect(parseFeed(feed(item(1, 'A'), item(2, 'B')))).toHaveLength(2);
    expect(parseFeed(feed())).toHaveLength(0);
  });
  it('rejects non-RSS bodies', () => {
    expect(() => parseFeed('<html></html>')).toThrow();
  });
  it('extracts ids and converts html to text', () => {
    expect(vacancyIdFromLink('https://djinni.co/jobs/813752-junior-dev-/')).toBe('813752');
    expect(vacancyIdFromLink('https://djinni.co/about/')).toBeUndefined();
    expect(htmlToText('<p>A &amp; B</p><p>&nbsp;</p><p>- C&nbsp;D</p>')).toBe('A & B\n\n- C D');
  });
});

describe('fetchFeeds', () => {
  it('caches new vacancies and skips cached ones on re-run', async () => {
    const root = tmp();
    const body = feed(item(1, 'A'), item(2, 'B'));
    const first = await fetchFeeds({ root, ...opts, fetcher: okFetcher(body) });
    expect(first).toMatchObject({ newItems: 2, skippedCached: 0 });
    const second = await fetchFeeds({
      root,
      ...opts,
      fetcher: okFetcher(feed(item(1, 'A'), item(3, 'C'))),
    });
    expect(second).toMatchObject({ newItems: 1, skippedCached: 1 });
    expect(readdirSync(dirsFor(root).raw).filter((f) => f.endsWith('.json'))).toHaveLength(3);
  });
  it('stops on 429 and 403', async () => {
    for (const status of [429, 403]) {
      const f: Fetcher = async () => ({ status, text: '' });
      await expect(fetchFeeds({ root: tmp(), ...opts, fetcher: f })).rejects.toBeInstanceOf(
        BlockedError,
      );
    }
  });
  it('builds the feed url', () => {
    expect(feedUrl('Node.js', '1y')).toBe(
      'https://djinni.co/jobs/rss/?primary_keyword=Node.js&exp_level=1y',
    );
  });
});

describe('parseAll', () => {
  it('parses, rejects invalid, deduplicates, and is idempotent', async () => {
    const root = tmp();
    const body = feed(
      item(1, 'Dev'),
      item(2, 'Dev'),
      item(3, 'Short', '&lt;p&gt;tiny&lt;/p&gt;'),
      item(4, 'Other'),
    );
    await fetchFeeds({ root, ...opts, fetcher: okFetcher(body) });
    expect(parseAll(root)).toMatchObject({ parsed: 2, rejected: 1, duplicates: 1 });
    expect(parseAll(root)).toMatchObject({
      parsed: 0,
      rejected: 0,
      duplicates: 0,
      skippedExisting: 4,
    });
    expect(readdirSync(dirsFor(root).rejected)).toEqual(['3.json']);
  });
});

describe('validate', () => {
  const setup = (extraction: unknown) => {
    const root = tmp();
    const d = dirsFor(root);
    mkdirSync(d.parsed, { recursive: true });
    writeJson(join(d.parsed, '1.json'), {
      id: '1',
      url: 'https://djinni.co/jobs/1-x/',
      title: 'Backend',
      description: LONG,
      publishedAt: '2026-10-01T11:44:26.000Z',
      fetchedAt: '2026-10-02T00:00:00.000Z',
      query: 'Fullstack',
    });
    writeJson(join(d.extracted, '1.json'), extraction);
    return root;
  };
  it('accepts skills that occur literally, ignoring case', () => {
    const root = setup({
      vacancyId: '1',
      required: ['node.js', 'PostgreSQL'],
      niceToHave: ['Redis'],
      seniority: 'unknown',
    });
    expect(validateExtractions(root)).toEqual({ checked: 1, errors: [] });
  });
  it('flags invented skills', () => {
    const root = setup({
      vacancyId: '1',
      required: ['Kafka'],
      niceToHave: [],
      seniority: 'senior',
    });
    expect(validateExtractions(root).errors[0]).toContain('Kafka');
  });
  it('flags schema errors and id mismatch', () => {
    expect(
      validateExtractions(setup({ vacancyId: '1', required: [], seniority: 'god' })).errors[0],
    ).toContain('schema');
    expect(
      validateExtractions(
        setup({ vacancyId: '2', required: [], niceToHave: [], seniority: 'junior' }),
      ).errors[0],
    ).toContain('file name');
  });
  it('missingSkills collapses whitespace', () => {
    const ex = {
      vacancyId: '1',
      required: ['a  b'],
      niceToHave: [],
      seniority: 'unknown' as const,
    };
    expect(missingSkills(ex, 'A\nB')).toEqual([]);
  });
});

describe('synonyms.json', () => {
  const file = JSON.parse(readFileSync(new URL('../synonyms.json', import.meta.url), 'utf8')) as {
    categories: string[];
    skills: Record<string, { category: string; aliases: string[] }>;
  };
  const ids = Object.keys(file.skills);

  it('covers at least 150 skills in known categories', () => {
    expect(ids.length).toBeGreaterThanOrEqual(150);
    for (const id of ids) expect(file.categories).toContain(file.skills[id]!.category);
  });

  it('has the required AI ids and no alias claimed by two skills', () => {
    for (const id of [
      'claude-code',
      'copilot',
      'openai-api',
      'rag',
      'mcp',
      'langchain',
      'langgraph',
      'vector-db',
      'embeddings',
      'ai-agents',
    ])
      expect(file.skills[id]?.category).toBe('ai');
    const owner = new Map<string, string>();
    for (const id of ids)
      for (const alias of [id, ...file.skills[id]!.aliases]) {
        const key = alias.toLowerCase();
        expect(owner.get(key) ?? id).toBe(id);
        owner.set(key, id);
      }
  });
});
