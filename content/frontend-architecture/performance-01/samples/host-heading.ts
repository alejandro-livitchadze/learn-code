// Recorded from our example (scenario A). Every response waits 100 ms, so a file that needs
// another file starts in the next round. Copied from recording/results.json, scenario A, run 1.
const rounds = [
  { doneAtMs: 114, files: ':3000 index.html' },
  { doneAtMs: 231, files: ':3000 index.js (host entry)' },
  { doneAtMs: 387, files: ':3000 bootstrap, :3001 and :3002 mf-manifest.json' },
  { doneAtMs: 511, files: ':3001 remote_a.js, :3002 remote_b.js' },
  { doneAtMs: 629, files: ':3002 react, react-dom, react-dom/client' },
  { doneAtMs: 777, files: ':3001 Widget, :3002 Widget' },
];
const hostHeadingShownAtMs = 665;
// After which round did the host's own heading "Host" appear on the page?
const done = rounds.filter((r) => r.doneAtMs < hostHeadingShownAtMs).length;
console.log(`after round ${done}: ${rounds[done - 1]?.files}`);
