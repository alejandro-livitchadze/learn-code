// Recorded from our routing variant (jsdom, cold load of http://localhost:4300/orders/42).
// The shell renders <BrowserRouter> and the route "/orders/*". The orders remote wraps
// itself in a second <BrowserRouter>, as it does when it runs alone.
const recorded = {
  shellRendered: true,
  ordersBoundary:
    'orders failed: You cannot render a <Router> inside another <Router>. You should never have more than one in your app.',
};
// What does the orders area of the page say? (first sentence of the error)
console.log(recorded.ordersBoundary.replace('orders failed: ', '').split('. ')[0] + '.');
