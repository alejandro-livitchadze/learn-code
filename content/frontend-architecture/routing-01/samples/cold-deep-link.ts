// Recorded from our routing variant: a fresh jsdom page opens http://localhost:4300/orders/42
// (the server answers unknown page paths with index.html). We sampled the main area every 50 ms.
const screensAfterShellStarted = ['loading orders', 'Order 42'];
// What does the visitor see, in order?
console.log(screensAfterShellStarted.join(' -> '));
