// Recorded from our example: four changes to remote_a, each built and deployed alone. Host untouched.
// page: what the host page showed for remote_a (jsdom, three runs, same result).
// types: tsc on the host's App.tsx against the new build's @mf-types.zip.
const changes = [
  {
    id: 'A',
    change: "exposes: './Widget' renamed to './Card'",
    page: 'error box',
    types: 'TS2307',
  },
  {
    id: 'B',
    change: 'function renamed to Card, default export deleted',
    page: 'error box',
    types: 'TS2322',
  },
  {
    id: 'C',
    change: 'function renamed to Card, "export default Card"',
    page: 'Remote a',
    types: 'tsc exit 0',
  },
  {
    id: 'D',
    change: "'./Card' (new file) added, './Widget' kept",
    page: 'Remote a',
    types: 'tsc exit 0',
  },
];
// Which changes can remote_a ship without the host team?
console.log(
  changes
    .filter((c) => c.page === 'Remote a' && c.types === 'tsc exit 0')
    .map((c) => c.id)
    .join(', '),
);
