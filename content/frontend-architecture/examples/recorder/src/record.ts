// Records the runtime outputs that lessons quote (E09 correctness rule 3).
// Serves the built host and remotes on their ports, loads the host in jsdom,
// and writes recorded/outputs.json. Run `pnpm build` in each example first.
// `--check` fails if the recording differs from the committed file.
import { createServer, type Server } from 'node:http';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM, VirtualConsole } from 'jsdom';

const root = fileURLToPath(new URL('../../', import.meta.url));
const outFile = join(root, 'recorded', 'outputs.json');
const TYPES: Readonly<Record<string, string>> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.json': 'application/json',
};

function serve(dir: string, port: number): Promise<Server> {
  if (!existsSync(dir))
    throw new Error(`missing build output ${dir}; run the example builds first`);
  const server = createServer((req, res) => {
    const path = normalize(decodeURIComponent((req.url ?? '/').split('?')[0] ?? '/'));
    const file = join(dir, path === '/' || path === '\\' ? 'index.html' : path);
    if (!file.startsWith(dir) || !existsSync(file)) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, {
      'content-type': TYPES[extname(file)] ?? 'application/octet-stream',
      'access-control-allow-origin': '*',
    });
    res.end(readFileSync(file));
  });
  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve(server)));
}

interface Scenario {
  readonly name: string;
  readonly description: string;
  readonly remoteBDir: string;
}

interface Recording {
  readonly name: string;
  readonly description: string;
  readonly hostReactVersion: string | null;
  readonly remoteHeadings: readonly string[];
  readonly remoteReactVersions: readonly string[];
  readonly errorsShownInPage: readonly string[];
  readonly consoleErrors: readonly string[];
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function load(scenario: Scenario): Promise<Recording> {
  const dist = (pkg: string, dir = 'dist') => join(root, pkg, dir);
  const servers = await Promise.all([
    serve(dist('host'), 3000),
    serve(dist('remote-a'), 3001),
    serve(dist('remote-b', scenario.remoteBDir), 3002),
  ]);
  const consoleErrors: string[] = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('error', (...args: unknown[]) => {
    consoleErrors.push(args.map((a) => (a instanceof Error ? a.message : String(a))).join(' '));
  });
  virtualConsole.on('jsdomError', (e: Error) => consoleErrors.push(e.message));
  try {
    const dom = await JSDOM.fromURL('http://localhost:3000/', {
      runScripts: 'dangerously',
      resources: 'usable',
      pretendToBeVisual: true,
      virtualConsole,
      beforeParse(window) {
        // jsdom has no fetch; the federation runtime needs it for the manifest.
        (window as unknown as { fetch: typeof fetch }).fetch = (input, init) =>
          fetch(typeof input === 'string' || input instanceof URL ? input : input.url, init);
      },
    });
    const doc = dom.window.document;
    for (let i = 0; i < 100; i++) {
      await sleep(100);
      const loading = doc.body.textContent?.includes('loading remote') ?? true;
      const mounted = doc.querySelector('[data-testid="host-react-version"]') !== null;
      if (mounted && !loading) break;
    }
    await sleep(300);
    const texts = (sel: string) =>
      [...doc.querySelectorAll(sel)].map((e) => (e.textContent ?? '').trim());
    const recording: Recording = {
      name: scenario.name,
      description: scenario.description,
      hostReactVersion:
        doc.querySelector('[data-testid="host-react-version"]')?.textContent?.trim() ?? null,
      remoteHeadings: texts('[data-remote] h2'),
      remoteReactVersions: texts('[data-remote] [data-testid="react-version"]'),
      errorsShownInPage: texts('[data-testid^="error-"]'),
      consoleErrors: [...new Set(consoleErrors)].map((m) => m.split('\n')[0] ?? m),
    };
    dom.window.close();
    return recording;
  } finally {
    await Promise.all(servers.map((s) => new Promise((r) => s.close(r))));
  }
}

const scenarios: readonly Scenario[] = [
  {
    name: 'shared-react',
    description: 'Host and both remotes share react as a singleton (the working setup).',
    remoteBDir: 'dist',
  },
  {
    name: 'duplicate-react',
    description:
      'remote_b is built with no shared react (MF_SHARE_REACT=off), so it bundles a second copy of React. The host renders its component with the host copy of react-dom.',
    remoteBDir: 'dist-broken',
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
