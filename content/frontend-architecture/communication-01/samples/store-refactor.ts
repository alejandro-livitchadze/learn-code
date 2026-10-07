// Model of our example, store version; the printed text was recorded from the real build:
// remote_a exposes ./cartStore, remote_b's badge imports it.
// remote_a deploys version 2 of its store. Only remote_a is rebuilt.
// After one "add to cart", remote_a's state is:
const state = { cart: { items: ['sku-1'] } };

// remote_b was built against version 1 and renders <p>Cart count: {state.cart.count}</p>.
// React renders nothing in place of undefined, so this is the badge's text:
const count = (state.cart as { readonly count?: number }).count;
const badge = `Cart count: ${count ?? ''}`;
// What does the visitor see in remote_b?
console.log(JSON.stringify(badge));
