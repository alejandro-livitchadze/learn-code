import { join } from 'node:path';
import { writeFileSync, mkdirSync } from 'node:fs';
import { parseFeed, vacancyIdFromLink } from './rss.js';
import { dirsFor, exists, writeJson } from './store.js';
import type { RawItem } from './schema.js';

export const EXP_LEVELS = ['no_exp', '1y', '2y', '3y', '4y', '5y', '6y', '7y', '8y', '9y', '10y'] as const;
export const DEFAULT_KEYWORDS = ['Fullstack', 'Node.js'] as const;
export const USER_AGENT = 'learn-code-demand-scanner/0.1 (public research on required skills; polite, 1 req / 3 s)';
const BASE = 'https://djinni.co/jobs/rss/';

export interface HttpResponse {
  readonly status: number;
  readonly text: string;
}
export type Fetcher = (url: string) => Promise<HttpResponse>;

export const httpFetcher: Fetcher = async (url) => {
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  return { status: res.status, text: await res.text() };
};

export class BlockedError extends Error {}

export function feedUrl(keyword: string, expLevel: string): string {
  const q = new URLSearchParams({ primary_keyword: keyword, exp_level: expLevel });
  return `${BASE}?${q.toString()}`;
}

export interface FetchOptions {
  readonly root: string;
  readonly keywords: readonly string[];
  readonly expLevels?: readonly string[];
  readonly delayMs?: number;
  readonly fetcher?: Fetcher;
  readonly now?: () => Date;
  readonly log?: (msg: string) => void;
}

export interface FetchSummary {
  readonly requests: number;
  readonly items: number;
  readonly newItems: number;
  readonly skippedCached: number;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export async function fetchFeeds(opts: FetchOptions): Promise<FetchSummary> {
  const fetcher = opts.fetcher ?? httpFetcher;
  const delay = opts.delayMs ?? 3000;
  const now = opts.now ?? (() => new Date());
  const log = opts.log ?? (() => undefined);
  const dirs = dirsFor(opts.root);
  mkdirSync(dirs.feeds, { recursive: true });
  let requests = 0, items = 0, newItems = 0, skippedCached = 0;

  for (const keyword of opts.keywords) {
    for (const exp of opts.expLevels ?? EXP_LEVELS) {
      if (requests > 0) await sleep(delay);
      const url = feedUrl(keyword, exp);
      const res = await fetcher(url);
      requests++;
      if (res.status === 429 || res.status === 403) {
        throw new BlockedError(`HTTP ${res.status} from ${url}; stopping`);
      }
      if (res.status !== 200) {
        log(`skip ${url}: HTTP ${res.status}`);
        continue;
      }
      const stamp = now().toISOString().slice(0, 10);
      writeFileSync(join(dirs.feeds, `${keyword}-${exp}-${stamp}.xml`), res.text);
      for (const item of parseFeed(res.text)) {
        items++;
        const id = typeof item.link === 'string' ? vacancyIdFromLink(item.link) : undefined;
        if (!id) {
          log(`item without a vacancy id in ${url}`);
          continue;
        }
        const path = join(dirs.raw, `${id}.json`);
        if (exists(path)) {
          skippedCached++;
          continue;
        }
        const raw: RawItem = { id, query: keyword, fetchedAt: now().toISOString(), ...item };
        writeJson(path, raw);
        newItems++;
      }
      log(`${keyword} ${exp}: ${items} items so far, ${newItems} new`);
    }
  }
  return { requests, items, newItems, skippedCached };
}
