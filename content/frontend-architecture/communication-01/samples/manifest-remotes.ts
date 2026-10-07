// The "remotes" field of remote-b/dist/mf-manifest.json, recorded from two builds of our example.
const remotesOfRemoteB = {
  storeVersion: [{ alias: 'remote_a', entry: 'http://localhost:3001/mf-manifest.json' }],
  eventVersion: [] as { readonly alias: string; readonly entry: string }[],
};
// In the event version, which remotes does remote_b's manifest name?
const names = remotesOfRemoteB.eventVersion.map((remote) => remote.alias);
console.log(names.length === 0 ? '(none)' : names.join(', '));
