// Pure helpers for record.ts. Kept apart so they can be unit tested.

/** One request a server saw, in the format of the lesson samples: ":3000  GET /path". */
export interface LoggedRequest {
  readonly port: number;
  readonly method: string;
  readonly path: string;
  readonly status: number;
}

// Rspack content hashes in file names depend on the checkout path, so a
// recording made on one machine would not match CI's. The recording keeps the
// file name and replaces the 10-hex-digit hash with a placeholder.
const HASH = /\.[0-9a-f]{10}(?=\.js(?:\.LICENSE\.txt)?$)/;

export function normalizeHash(path: string): string {
  return path.replace(HASH, '.[hash]');
}

export function formatRequest(r: LoggedRequest): string {
  const line = `:${r.port}  ${r.method} ${normalizeHash(r.path)}`;
  return r.status === 200 ? line : `${line} (${r.status})`;
}

/**
 * Groups requests by server, keeping the order each server saw them in.
 * Order across servers is not recorded: jsdom is not a browser, and requests
 * to different servers race.
 */
export function requestsByServer(
  log: readonly LoggedRequest[],
  ports: readonly number[],
): Readonly<Record<string, readonly string[]>> {
  const out: Record<string, readonly string[]> = {};
  for (const port of ports) {
    out[`:${port}`] = log.filter((r) => r.port === port).map(formatRequest);
  }
  return out;
}

/**
 * The React package files whose license header the bundler extracted into a
 * chunk's .LICENSE.txt, for example "react.production.js".
 */
export function reactFilesInLicense(license: string): readonly string[] {
  const files: string[] = [];
  for (const m of license.matchAll(/@license React\s*\n\s*\*\s*([\w.-]+\.js)/g)) {
    const file = m[1];
    if (file !== undefined && !files.includes(file)) files.push(file);
  }
  return files;
}

/**
 * The headline of a console error: its first line, plus the "args: {...}" line
 * that Module Federation runtime errors put second (it names the failing URL).
 * Stack traces and doc links are dropped.
 */
export function errorHeadline(message: string): string {
  const [first = '', second = ''] = message.split('\n');
  return second.startsWith('args: ') ? `${first.trim()} ${second.trim()}` : first.trim();
}

/** A chunk that carries React code, and the request that fetched it. */
export interface ReactChunk {
  /** The request, as in requestsByServer. */
  readonly request: string;
  /** React package files whose code the chunk carries (from its .LICENSE.txt). */
  readonly reactFiles: readonly string[];
}

const portOf = (request: string): number => Number(/^:(\d+)/.exec(request)?.[1] ?? NaN);

/** Orders chunks by server port, keeping each server's own request order. */
export function sortByServer(chunks: readonly ReactChunk[]): readonly ReactChunk[] {
  return [...chunks].sort((a, b) => portOf(a.request) - portOf(b.request));
}

/** For each React package file, the servers (":3000") that served a chunk with its code. */
export function reactFileServers(
  chunks: readonly ReactChunk[],
): Readonly<Record<string, readonly string[]>> {
  const servers = new Map<string, string[]>();
  for (const chunk of sortByServer(chunks)) {
    const server = `:${portOf(chunk.request)}`;
    for (const file of chunk.reactFiles) {
      const list = servers.get(file) ?? [];
      if (!list.includes(server)) list.push(server);
      servers.set(file, list);
    }
  }
  return Object.fromEntries([...servers].sort(([a], [b]) => a.localeCompare(b)));
}
