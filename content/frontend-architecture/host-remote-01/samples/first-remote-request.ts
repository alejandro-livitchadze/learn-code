// The "remotes" of host/dist/mf-manifest.json (recorded; fields alias and entry).
// The host's entry script has run and now needs remote_a.
const remotes = [
  { alias: 'remote_a', entry: 'http://localhost:3001/mf-manifest.json' },
  { alias: 'remote_b', entry: 'http://localhost:3002/mf-manifest.json' },
];
const remoteA = remotes.find((remote) => remote.alias === 'remote_a');
// Which path does the first request to remote_a's server ask for?
console.log(new URL(remoteA?.entry ?? '').pathname);
