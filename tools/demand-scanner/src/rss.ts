import { XMLParser } from 'fast-xml-parser';

export interface FeedItem {
  readonly title: unknown;
  readonly link: unknown;
  readonly description: unknown;
  readonly pubDate: unknown;
}

const xml = new XMLParser({ processEntities: true, htmlEntities: true, parseTagValue: false });

export function parseFeed(body: string): readonly FeedItem[] {
  const doc: unknown = xml.parse(body);
  const channel = (doc as { rss?: { channel?: { item?: unknown } } }).rss?.channel;
  if (!channel) throw new Error('not an RSS feed: <rss><channel> missing');
  const items = channel.item;
  if (items === undefined) return [];
  return (Array.isArray(items) ? items : [items]) as FeedItem[];
}

export function vacancyIdFromLink(link: string): string | undefined {
  return /\/jobs\/(\d+)-/.exec(link)?.[1];
}

const ENTITIES: Readonly<Record<string, string>> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

export function htmlToText(html: string): string {
  return html
    .replace(/<\/(p|li|div|h\d|ul|ol|tr)>|<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e: string) => {
      if (e.startsWith('#')) {
        const code =
          e[1]?.toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
        return Number.isFinite(code) ? String.fromCodePoint(code) : m;
      }
      return ENTITIES[e.toLowerCase()] ?? m;
    })
    .replace(/[ \t\u00a0]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
