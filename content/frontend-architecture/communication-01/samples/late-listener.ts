// Node.js has the browser's EventTarget and CustomEvent, so this runs as it would on a page.
// remote_a announces the cart as soon as it mounts.
// remote_b's code arrives later and subscribes then.
const page = new EventTarget();
page.dispatchEvent(new CustomEvent('cart:changed', { detail: { count: 3 } }));

let badge = 'Cart count: 0';
page.addEventListener('cart:changed', (event) => {
  badge = `Cart count: ${(event as CustomEvent<{ readonly count: number }>).detail.count}`;
});
// What does remote_b's badge show?
console.log(badge);
