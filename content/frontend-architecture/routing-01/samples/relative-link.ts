// Recorded from our routing variant. The visitor is on /orders, where the remote renders
// its OrderList with <Link to="42">Order 42</Link>. We read the href of each <a> in the page.
const hrefs = {
  Home: '/',
  Orders: '/orders',
  'Order 42': '/orders/42',
};
// Which href did the remote's relative link get?
console.log(hrefs['Order 42']);
