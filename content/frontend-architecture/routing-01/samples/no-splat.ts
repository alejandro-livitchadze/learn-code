// Recorded from our routing variant (jsdom, cold load of http://localhost:4300/orders/42).
// The only change: the shell's route is path="/orders" instead of path="/orders/*".
const screens = {
  withStar: ['loading orders', 'Order 42'],
  withoutStar: ['Shell: page not found'],
};
// What does the main area show once the page settles?
console.log(screens.withoutStar.at(-1));
