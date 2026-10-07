// Records the runtime outputs that lessons quote (E09 correctness rule 3).
// Serves the built host and remotes on their ports, loads the host in jsdom,
// and writes recorded/outputs.json. Run `pnpm build` in each example first.
// Each recording also has the requests each server saw and which of them
// carried React's code. `--check` fails if the recording differs from the
// committed file.
import { createServer, type Server } from 'node:http';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM, VirtualConsole } from 'jsdom';
import {
  errorHeadline,
  formatRequest,
  reactFileServers,
  reactFilesInLicense,
  requestsByServer,
  sortByServer,
  type LoggedRequest,
  type ReactChunk,
} from './lib';

const root = fileURLToPath(new URL('../../', import.meta.url));
const outFile = join(root, 'recorded', 'outputs.json');
const TYPES: Readonly<Record<string, string>> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.json': 'application/json',
};

const PORTS = { host: 3000, remoteA: 3001, remoteB: 3002 } as const;

function serve(dir: string, port: number, log: LoggedRequest[]): Promise<Server> {
  if (!existsSync(dir))
    throw new Error(`missing build output ${dir}; run the example builds first`);
  const server = createServer((req, res) => {
    const urlPath = (req.url ?? '/').split('?')[0] ?? '/';
    const path = normalize(decodeURIComponent(urlPath));
    const file = join(dir, path === '/' || path === '\\' ? 'index.html' : path);
    const found = file.startsWith(dir) && existsSync(file);
    log.push({ port, method: req.method ?? 'GET', path: urlPath, status: found ? 200 : 404 });
    if (!found) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, {
      'content-type': TYPES[extname(file)] ?? 'application/octet-stream',
      'access-control-allow-origin': '*',
    });
    res.end(readFileSync(file));
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

interface Scenario {
  readonly name: string;
  readonly description: string;
  /** The dist folder served for remote_b, or null when remote_b's server is stopped. */
  readonly remoteBDir: string | null;
  /** Wait this long and then record, instead of waiting for the remotes to mount. */
  readonly fixedWaitMs?: number;
}

interface Recording {
  readonly name: string;
  readonly description: string;
  readonly headingsOnPage: readonly string[];
  readonly hostReactVersion: string | null;
  readonly remoteHeadings: readonly string[];
  readonly remoteReactVersions: readonly string[];
  readonly errorsShownInPage: readonly string[];
  readonly consoleErrors: readonly string[];
  readonly requestsByServer: Readonly<Record<string, readonly string[]>>;
  readonly reactChunks: readonly ReactChunk[];
  readonly reactFileServers: Readonly<Record<string, readonly string[]>>;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const dist = (pkg: string, dir = 'dist') => join(root, pkg, dir);

function reactChunks(log: readonly LoggedRequest[], dirs: ReadonlyMap<number, string>) {
  const chunks: ReactChunk[] = [];
  for (const r of log) {
    const dir = dirs.get(r.port);
    if (r.status !== 200 || dir === undefined || extname(r.path) !== '.js') continue;
    const license = join(dir, `${normalize(r.path)}.LICENSE.txt`);
    if (!existsSync(license)) continue;
    const reactFiles = reactFilesInLicense(readFileSync(license, 'utf8'));
    if (reactFiles.length > 0) chunks.push({ request: formatRequest(r), reactFiles });
  }
  return sortByServer(chunks);
}

async function load(scenario: Scenario): Promise<Recording> {
  const dirs = new Map<number, string>([
    [PORTS.host, dist('host')],
    [PORTS.remoteA, dist('remote-a')],
  ]);
  if (scenario.remoteBDir !== null) dirs.set(PORTS.remoteB, dist('remote-b', scenario.remoteBDir));
  const log: LoggedRequest[] = [];
  const servers = await Promise.all([...dirs].map(([port, dir]) => serve(dir, port, log)));
  const consoleErrors: string[] = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('error', (...args: unknown[]) => {
    consoleErrors.push(args.map((a) => (a instanceof Error ? a.message : String(a))).join(' '));
  });
  virtualConsole.on('jsdomError', (e: Error) => consoleErrors.push(e.message));
  // jsdom runs page scripts in this process, so a promise the page leaves
  // rejected surfaces here. A browser logs it as "Uncaught (in promise)".
  const onRejection = (reason: unknown) => {
    const message = reason instanceof Error ? `${reason.name}: ${reason.message}` : String(reason);
    consoleErrors.push(`Uncaught (in promise) ${message}`);
  };
  process.on('unhandledRejection', onRejection);
  try {
    const dom = await JSDOM.fromURL(`http://localhost:${PORTS.host}/`, {
      runScripts: 'dangerously',
      resources: 'usable',
      pretendToBeVisual: true,
      virtualConsole,
      beforeParse(window) {
        // jsdom has no fetch; the federation runtime needs it for the manifest.
        const windowFetch: typeof fetch = (input, init) =>
          fetch(typeof input === 'string' || input instanceof URL ? input : input.url, init);
        Object.defineProperty(window, 'fetch', {
          value: windowFetch,
          writable: true,
          configurable: true,
        });
      },
    });
    const doc = dom.window.document;
    if (scenario.fixedWaitMs !== undefined) {
      await sleep(scenario.fixedWaitMs);
    } else {
      for (let i = 0; i < 100; i++) {
        await sleep(100);
        const loading = doc.body.textContent?.includes('loading remote') ?? true;
        const mounted = doc.querySelector('[data-testid="host-react-version"]') !== null;
        if (mounted && !loading) break;
      }
      await sleep(300);
    }
    const texts = (sel: string) =>
      [...doc.querySelectorAll(sel)].map((e) => (e.textContent ?? '').trim());
    const chunks = reactChunks(log, dirs);
    const recording: Recording = {
      name: scenario.name,
      description: scenario.description,
      headingsOnPage: texts('h1, h2, h3'),
      hostReactVersion:
        doc.querySelector('[data-testid="host-react-version"]')?.textContent?.trim() ?? null,
      remoteHeadings: texts('[data-remote] h2'),
      remoteReactVersions: texts('[data-remote] [data-testid="react-version"]'),
      errorsShownInPage: texts('[data-testid^="error-"]'),
      consoleErrors: [...new Set(consoleErrors.map(errorHeadline))],
      requestsByServer: requestsByServer(log, [...dirs.keys(), PORTS.remoteB]),
      reactChunks: chunks,
      reactFileServers: reactFileServers(chunks),
    };
    dom.window.close();
    return recording;
  } finally {
    process.off('unhandledRejection', onRejection);
    await Promise.all(servers.map((s) => new Promise((r) => s.close(r))));
  }
}

const scenarios: readonly Scenario[] = [
  {
    name: 'shared-react',
    description:
      'Host and both remotes share react as a singleton (the working setup). Fresh page load, nothing cached.',
    remoteBDir: 'dist',
  },
  {
    name: 'duplicate-react',
    description:
      'remote_b is built with no shared react (MF_SHARE_REACT=off), so it bundles a second copy of React. The host renders its component with the host copy of react-dom.',
    remoteBDir: 'dist-broken',
  },
  {
    name: 'remote-b-down',
    description:
      'Host on :3000 and remote_a on :3001 are served; the server for remote_b on :3002 is stopped. Recorded after 8 seconds.',
    remoteBDir: null,
    fixedWaitMs: 8000,
  },
];

const recordings: Recording[] = [];
for (const s of scenarios) recordings.push(await load(s));
const json = JSON.stringify({ recordings }, null, 2) + '\n';
if (process.argv.includes('--check')) {
  const current = existsSync(outFile) ? readFileSync(outFile, 'utf8') : '';
  if (current !== json) {
    console.error('recorded/outputs.json is out of date; run `pnpm record` and commit it');
    process.exit(1);
  }
} else {
  mkdirSync(join(root, 'recorded'), { recursive: true });
  writeFileSync(outFile, json);
}
console.log(json);
