// Recorder for lesson deploy-01 (E09 rule 3). Not run in CI; kept so the recordings can be repeated.
// Serves scratch builds of the example host and remotes on 4100-4102 with a request log and
// loads the host in real Chromium (Playwright). Usage, after building the copies listed in
// variants.txt:
//   EXAMPLES_COPY=<dir with host, host-lf, remote-a, remote-a-v2, remote-a-both, remote-b>
//   PLAYWRIGHT_FROM=<a package.json that can resolve playwright, e.g. apps/web/package.json>
//   node record.ts down | cache-long | cache-nocache | rollback
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { existsSync, readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { tmpdir } from 'node:os';

const load = createRequire(process.env['PLAYWRIGHT_FROM'] ?? '');
const { chromium } = load('playwright');
const E = process.env['EXAMPLES_COPY'] ?? '';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json' };

const log = [];
// state per port: { dir, cache(file) => header | null, manifestFrom?: dir }
const state = {};
function serve(port) {
  const server = createServer((req, res) => {
    const st = state[port];
    const path = normalize(decodeURIComponent((req.url ?? '/').split('?')[0]));
    if (!st) {
      req.socket.destroy();
      return;
    }
    log.push(`:${port}  ${req.method} ${req.url}`);
    const rel = path === '/' ? 'index.html' : path.slice(1);
    let file = join(st.dir, rel);
    if (rel === 'mf-manifest.json' && st.manifestFrom) file = join(st.manifestFrom, rel);
    if (!existsSync(file)) {
      res.writeHead(404, { 'access-control-allow-origin': '*' }).end();
      return;
    }
    const headers = {
      'content-type': TYPES[extname(file)] ?? 'application/octet-stream',
      'access-control-allow-origin': '*',
    };
    const cc = st.cache ? st.cache(rel) : null;
    if (cc) headers['cache-control'] = cc;
    res.writeHead(200, headers);
    res.end(readFileSync(file));
  });
  return new Promise((r) => server.listen(port, '127.0.0.1', () => r(server)));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function visit(context, waitMs = 8000) {
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text().split('\n')[0]);
  });
  page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message.split('\n')[0]}`));
  const start = log.length;
  await page.goto('http://localhost:4100/');
  const t0 = Date.now();
  while (Date.now() - t0 < waitMs) {
    const text = await page.locator('body').innerText();
    if (text.includes('Host') && !text.includes('loading remote')) break;
    await sleep(100);
  }
  await sleep(500);
  const result = {
    headings: await page.locator('h1, h2').allInnerTexts(),
    errorsShownInPage: await page.locator('[data-testid^="error-"]').allInnerTexts(),
    bodyText: (await page.locator('body').innerText()).trim(),
    consoleErrors: [...new Set(consoleErrors)],
    requests: log.slice(start),
  };
  await page.close();
  return result;
}

const scenario = process.argv[2];
const servers = await Promise.all([serve(4100), serve(4101), serve(4102)]);
const userDir = mkdtempSync(join(tmpdir(), 'deploy01-'));
const context = await chromium.launchPersistentContext(userDir, { headless: true });
const out = {};
try {
  const hashed = (rel) =>
    rel.startsWith('static/') ? 'public, max-age=31536000, immutable' : null;
  if (scenario === 'down') {
    for (const hostDir of ['host', 'host-lf']) {
      state[4100] = { dir: join(E, hostDir, 'dist') };
      state[4101] = { dir: join(E, 'remote-a', 'dist') };
      // Stop the :4102 server: connections are refused, as when the remote's server is down.
      await new Promise((r) => servers[2].close(r));
      out[`${hostDir}: remote_b down`] = await visit(context);
      state[4102] = { dir: join(E, 'remote-b', 'dist') };
      servers[2] = await serve(4102);
      out[`${hostDir}: all up`] = await visit(context);
    }
  } else if (scenario === 'cache-long' || scenario === 'cache-nocache') {
    const manifestCc = scenario === 'cache-long' ? 'public, max-age=86400' : 'no-cache';
    const cache = (rel) => (rel === 'mf-manifest.json' ? manifestCc : hashed(rel));
    state[4100] = { dir: join(E, 'host', 'dist'), cache };
    state[4101] = { dir: join(E, 'remote-a', 'dist'), cache };
    state[4102] = { dir: join(E, 'remote-b', 'dist'), cache };
    out['visit 1, remote_a v1 deployed'] = await visit(context);
    state[4101] = { dir: join(E, 'remote-a-v2', 'dist'), cache };
    out['visit 2, same browser, remote_a v2 deployed'] = await visit(context);
  } else if (scenario === 'rollback') {
    // Both builds' files stay on the server; only the manifest decides.
    const cache = (rel) => (rel === 'mf-manifest.json' ? 'no-cache' : hashed(rel));
    const both = join(E, 'remote-a-both');
    state[4100] = { dir: join(E, 'host', 'dist'), cache };
    state[4102] = { dir: join(E, 'remote-b', 'dist'), cache };
    state[4101] = { dir: both, cache, manifestFrom: join(E, 'remote-a-v2', 'dist') };
    out['v2 manifest live'] = await visit(context);
    state[4101] = { dir: both, cache, manifestFrom: join(E, 'remote-a', 'dist') };
    out['v1 manifest restored, same browser'] = await visit(context);
  }
} finally {
  await context.close();
  await Promise.all(servers.map((s) => new Promise((r) => s.close(r))));
  rmSync(userDir, { recursive: true, force: true });
}
console.log(JSON.stringify(out, null, 2));
