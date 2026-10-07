// Recorded from our example. Scenario C: a scratch copy of our host that calls preloadRemote
// for remote_a and remote_b before import('./bootstrap'); remotes as built.
// Copied from recording/results.json, scenario C, run 1 (the same rounds in all three runs).
const rounds = [
  [':3000 index.html'],
  [':3000 index.js', ':3000 a 238-byte chunk'],
  [':3000 bootstrap', ':3001 mf-manifest.json', ':3002 mf-manifest.json'],
  [':3001 Widget', ':3001 remote_a.js', ':3002 Widget', ':3002 remote_b.js'],
  [':3002 react', ':3002 react-dom/client', ':3002 react-dom'],
];
// Without preloading, the two Widget files came in round 6. In which round now?
const round = rounds.findIndex((files) => files.some((f) => f.endsWith('Widget'))) + 1;
console.log(
  `round ${round}, with ${rounds[round - 1]?.filter((f) => f.endsWith('.js')).join(' and ')}`,
);
