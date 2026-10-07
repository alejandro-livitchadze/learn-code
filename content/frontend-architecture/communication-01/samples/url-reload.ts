// Model of our example, URL version; the printed text was recorded from the real build:
// a colleague pastes a link, http://localhost:3000/?sort=price
// A fresh page load; nobody clicks anything. remote_b's first render runs:
const location = new URL('http://localhost:3000/?sort=price');
const readSort = () => new URLSearchParams(location.search).get('sort') ?? 'none';
// What does remote_b show?
console.log(`Sort: ${readSort()}`);
