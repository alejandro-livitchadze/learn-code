// Recorded from our routing variant (cold load of /orders/42). Shell and remote share
// react, react-dom and react-dom/, but react-router is left out of "shared" in both configs.
// The request log shows a lib-router chunk fetched from :4300 and another from :4301.
const recorded = {
  ordersBoundary:
    'orders failed: useRoutes() may be used only in the context of a <Router> component.',
};
// What does the orders area say?
console.log(recorded.ordersBoundary.replace('orders failed: ', ''));
