// Recorded from our routing variant. A fresh page opens http://localhost:4300/, then the
// visitor clicks "Orders" (/orders) and then "Order 42" (/orders/42). This is every request
// the shell's server on :4300 saw during the whole visit.
const shellServerLog = [
  'GET /',
  'GET /static/js/index.cdc48b9ac7.js',
  'GET /static/js/async/k.80cffe1650.js',
];
// Which page paths (no static files) did the shell's server receive?
console.log(
  shellServerLog
    .filter((line) => !line.includes('/static/'))
    .map((line) => line.replace('GET ', ''))
    .join(', '),
);
