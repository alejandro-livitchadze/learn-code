// Toy model: three separately built apps, each bundling the libraries it imports.
const builds = [
  { name: 'host', bundlesReact: true },
  { name: 'cart', bundlesReact: true },
  { name: 'search', bundlesReact: true },
];
const copies = builds.filter((build) => build.bundlesReact).length;
console.log(`${copies} copies of React on the page`);
