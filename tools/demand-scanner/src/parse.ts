import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { z } from 'zod';
import { htmlToText } from './rss.js';
import { RawItemSchema, VacancySchema, type Vacancy } from './schema.js';
import { dirsFor, exists, listIds, readJson, writeJson } from './store.js';

export function dedupeKey(title: string, description: string): string {
  const t = title.toLowerCase().replace(/\s+/g, ' ').trim();
  const d = createHash('sha256').update(description.toLowerCase().replace(/\s+/g, ' ')).digest('hex');
  return `${t}|${d}`;
}

const str = z.string();

export function parseRaw(raw: unknown): { ok: true; vacancy: Vacancy } | { ok: false; reason: string } {
  const r = RawItemSchema.safeParse(raw);
  if (!r.success) return { ok: false, reason: r.error.message };
  const { id, query, fetchedAt } = r.data;
  const title = str.safeParse(r.data.title);
  const link = str.safeParse(r.data.link);
  const desc = str.safeParse(r.data.description);
  const pub = str.safeParse(r.data.pubDate);
  if (!title.success || !link.success || !desc.success || !pub.success) {
    return { ok: false, reason: 'a required field (title, link, description, pubDate) is missing' };
  }
  const published = new Date(pub.data);
  if (Number.isNaN(published.getTime())) return { ok: false, reason: `bad pubDate: ${pub.data}` };
  const v = VacancySchema.safeParse({
    id,
    url: link.data,
    title: title.data.trim(),
    description: htmlToText(desc.data),
    publishedAt: published.toISOString(),
    fetchedAt: new Date(fetchedAt).toISOString(),
    query,
  });
  return v.success ? { ok: true, vacancy: v.data } : { ok: false, reason: v.error.message };
}

export interface ParseSummary {
  readonly parsed: number;
  readonly rejected: number;
  readonly duplicates: number;
  readonly skippedExisting: number;
}

/** Parse raw items into parsed/<id>.json. Already-parsed ids are skipped. */
export function parseAll(root: string): ParseSummary {
  const dirs = dirsFor(root);
  const seen = new Map<string, string>();
  for (const id of listIds(dirs.parsed)) {
    const v = VacancySchema.safeParse(readJson(join(dirs.parsed, `${id}.json`)));
    if (v.success) seen.set(dedupeKey(v.data.title, v.data.description), id);
  }
  const dupPath = join(root, 'duplicates.json');
  const dups = (exists(dupPath) ? readJson(dupPath) : {}) as Record<string, string>;
  let parsed = 0, rejected = 0, duplicates = 0, skippedExisting = 0;

  for (const id of listIds(dirs.raw)) {
    if (exists(join(dirs.parsed, `${id}.json`)) || id in dups || exists(join(dirs.rejected, `${id}.json`))) {
      skippedExisting++;
      continue;
    }
    const res = parseRaw(readJson(join(dirs.raw, `${id}.json`)));
    if (!res.ok) {
      writeJson(join(dirs.rejected, `${id}.json`), { id, reason: res.reason });
      rejected++;
      continue;
    }
    const key = dedupeKey(res.vacancy.title, res.vacancy.description);
    const first = seen.get(key);
    if (first) {
      dups[id] = first;
      duplicates++;
      continue;
    }
    seen.set(key, id);
    writeJson(join(dirs.parsed, `${id}.json`), res.vacancy);
    parsed++;
  }
  if (duplicates > 0) writeJson(dupPath, dups);
  return { parsed, rejected, duplicates, skippedExisting };
}
