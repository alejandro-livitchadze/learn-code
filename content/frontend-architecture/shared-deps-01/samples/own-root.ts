// Toy model of the note on react.dev's Rules of Hooks page: several copies of React on one page
// are supported; it breaks only if a component's react differs from the react that its
// rendering react-dom uses.
const parts = [
  { name: 'chat widget', react: 'chat copy', renderedBy: 'chat copy' }, // mounts its own root
  { name: 'remote_a', react: 'shared copy', renderedBy: 'shared copy' },
  { name: 'remote_b (broken build)', react: 'remote_b copy', renderedBy: 'shared copy' },
];
const broken = parts.filter((part) => part.react !== part.renderedBy).map((part) => part.name);
console.log(broken.join(', ') || 'none');
