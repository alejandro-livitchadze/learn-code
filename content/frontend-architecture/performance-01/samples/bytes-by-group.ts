// Recorded from our example (scenario A: the example as built, headless Chromium, fresh page).
// Every file the three servers sent for one page load, in bytes, uncompressed.
// Copied from recording/results.json, scenario A, run 1.
const files = [
  { file: ':3000 index.html', group: 'other', bytes: 274 },
  { file: ':3000 index.js (host entry)', group: 'entry files', bytes: 121101 },
  { file: ':3000 async/4.js (host bootstrap)', group: 'other', bytes: 1446 },
  { file: ':3001 mf-manifest.json', group: 'other', bytes: 2212 },
  { file: ':3002 mf-manifest.json', group: 'other', bytes: 2212 },
  { file: ':3001 remote_a.js (entry)', group: 'entry files', bytes: 119369 },
  { file: ':3002 remote_b.js (entry)', group: 'entry files', bytes: 119371 },
  { file: ':3002 react', group: 'React', bytes: 7875 },
  { file: ':3002 react-dom/client', group: 'React', bytes: 206982 },
  { file: ':3002 react-dom', group: 'React', bytes: 3911 },
  { file: ':3001 Widget', group: 'the two Widgets', bytes: 856 },
  { file: ':3002 Widget', group: 'the two Widgets', bytes: 856 },
];
const total = new Map<string, number>();
for (const f of files) total.set(f.group, (total.get(f.group) ?? 0) + f.bytes);
// Which group of files is the biggest?
const [biggest] = [...total].sort((a, b) => b[1] - a[1]);
console.log(`${biggest?.[0]}: ${biggest?.[1]} bytes`);
