// Toy model of the rule on module-federation.io (shared, "Prefix matching with trailing slash"):
// a key without a trailing slash intercepts only that exact import;
// a key ending in / intercepts every subpath import under it.
const sharedKeys = ['react', 'react-dom'];
const imports = ['react', 'react-dom', 'react-dom/client'];
const intercepted = (request: string) =>
  sharedKeys.some((key) => (key.endsWith('/') ? request.startsWith(key) : request === key));
// Which imports are bundled locally instead of shared?
console.log(imports.filter((request) => !intercepted(request)).join(', ') || 'none');
