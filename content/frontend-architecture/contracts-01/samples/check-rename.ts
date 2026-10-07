// The check from the last step, run on remote_a's build that renamed './Widget' to './Card'.
// "exposes" of that build's dist/mf-manifest.json (recorded; only the field path is kept):
const manifest = { exposes: [{ path: './Card' }] };
const hostNeeds = ['./Widget']; // the host imports remote_a/Widget
const exposed = manifest.exposes.map((e) => e.path);
const missing = hostNeeds.filter((p) => !exposed.includes(p));
console.log(
  missing.length === 0 ? 'check passed' : `contract broken, missing: ${missing.join(', ')}`,
);
