// remote_a/rsbuild.config.ts, release 2 (built and recorded with two host builds)
pluginModuleFederation({
  name: 'remote_a',
  exposes: {
    './Widget': './src/Widget.tsx',
    './Card': './src/Card.tsx',
  },
});
// Recorded page with the old host: "Remote a | Remote b". No error box.
// Recorded page with a host that imports remote_a/Card: "Remote a card | Remote b".
