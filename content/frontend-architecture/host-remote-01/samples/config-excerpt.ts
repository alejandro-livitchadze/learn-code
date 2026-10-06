// remote_a/rsbuild.config.ts (excerpt)
pluginModuleFederation({
  name: 'remote_a',
  exposes: { './Widget': './src/Widget.tsx' },
});
// host/rsbuild.config.ts (excerpt)
pluginModuleFederation({
  name: 'host',
  remotes: { remote_a: 'remote_a@http://localhost:3001/mf-manifest.json' },
});
