// Our example, event version: no import between the remotes.
// remote_a keeps its store private and, on "add to cart", dispatches
//   new CustomEvent('cart:changed', { detail: { count } })
// remote_b listens for 'cart:changed' and renders <p>Cart count: {detail.count}</p>.
// remote_a deploys the same store refactor. Only remote_a is rebuilt.
// After one "add to cart", remote_a's private state is:
const state = { cart: { items: ['sku-1'] } };
// remote_a's version 2 builds the event's detail from it:
const detail = { count: state.cart.items.length };
// remote_b is unchanged. What does its badge show?
console.log(JSON.stringify(`Cart count: ${detail.count}`));
