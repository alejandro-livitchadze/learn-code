// Recorded from our routing variant with the buggy shell route path="/orders" (no star).
// A fresh page opens http://localhost:4300/orders, the page a reviewer opens first.
const recorded = {
  pathname: '/orders',
  linksInMainArea: ['Order 42', 'Order 42 (absolute)'],
  notFoundShown: false,
};
// What does the main area show once the page settles?
console.log(
  recorded.notFoundShown
    ? 'Shell: page not found'
    : `order list with ${recorded.linksInMainArea.length} links`,
);
