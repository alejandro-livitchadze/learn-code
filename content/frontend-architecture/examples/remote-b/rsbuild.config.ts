import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginModuleFederation } from '@module-federation/rsbuild-plugin';

// MF_SHARE_REACT=off builds the deliberately broken variant (lesson 4:
// duplicate React). The remote then bundles its own copy of React.
const shareReact = process.env['MF_SHARE_REACT'] !== 'off';
const reactShare = { singleton: true, requiredVersion: '^19.0.0' } as const;

export default defineConfig({
  plugins: [
    pluginReact(),
    pluginModuleFederation({
      name: 'remote_b',
      exposes: { './Widget': './src/Widget.tsx' },
      shared: shareReact
        ? { react: reactShare, 'react-dom': reactShare, 'react-dom/': reactShare }
        : {},
    }),
  ],
  server: { port: 3002 },
  output: {
    distPath: { root: shareReact ? 'dist' : 'dist-broken' },
    assetPrefix: 'http://localhost:3002/',
  },
});
