// check-contract.ts: run in remote_a's CI after its build, before deploy.
import { readFileSync } from 'node:fs';

const hostNeeds = ['./Widget']; // what the host imports from remote_a
const manifest = JSON.parse(readFileSync('dist/mf-manifest.json', 'utf8')) as {
  exposes: { path: string }[];
};
const exposed = manifest.exposes.map((e) => e.path);
const missing = hostNeeds.filter((p) => !exposed.includes(p));
if (missing.length > 0) {
  console.error(`contract broken, missing: ${missing.join(', ')}`);
  process.exit(1);
}
console.log('check passed');
