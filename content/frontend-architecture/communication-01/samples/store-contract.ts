// remote_a/src/cartStore.ts, version 1 (excerpt)
export interface CartState {
  readonly cart: { readonly count: number };
}
// remote_a/rsbuild.config.ts: the store is published like a component
exposes: { './Widget': './src/Widget.tsx', './cartStore': './src/cartStore.ts' },
// remote_b/rsbuild.config.ts and src/Widget.tsx (excerpts)
remotes: { remote_a: 'remote_a@http://localhost:3001/mf-manifest.json' },
import { getState, subscribe } from 'remote_a/cartStore';
const state = useSyncExternalStore(subscribe, getState);
return <p>Cart count: {state.cart.count}</p>;
