// host/rsbuild.config.ts in a copy of our example (excerpt). Two changed lines.
const remoteAOrigin = process.env['REMOTE_A_ORIGIN'] ?? 'http://localhost:4101';

pluginModuleFederation({
  name: 'host',
  remotes: {
    remote_a: `remote_a@${remoteAOrigin}/mf-manifest.json`,
    remote_b: 'remote_b@http://localhost:4102/mf-manifest.json',
  },
});
