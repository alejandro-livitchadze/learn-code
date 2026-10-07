// remote_a/rsbuild.config.ts (excerpt)
pluginModuleFederation({
  name: 'remote_a',
  exposes: { './Widget': './src/Widget.tsx' },
});
// remote_a/src/Widget.tsx (last line)
export default Widget;
// host/src/App.tsx, line 4 (it renders <RemoteA /> further down):
//   const RemoteA = lazy(() => import('remote_a/Widget'));
