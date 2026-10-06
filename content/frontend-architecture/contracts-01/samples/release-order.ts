// Recorded from our example. Each state is one host build plus one remote_a build, loaded in jsdom.
// host v1 imports remote_a/Widget; host v2 imports remote_a/Card.
// remote v1 exposes './Widget'; remote v2 exposes './Widget' and './Card'; remote v3 exposes './Card'.
const pageWorks: Record<string, boolean> = {
  'host v1 + remote v1': true,
  'host v1 + remote v2': true,
  'host v1 + remote v3': false, // Module "./Widget" does not exist in container.
  'host v2 + remote v1': false, // Module "./Card" does not exist in container.
  'host v2 + remote v2': true,
  'host v2 + remote v3': true,
};
const plans: Record<string, string[]> = {
  'remote v3, then host v2': ['host v1 + remote v1', 'host v1 + remote v3', 'host v2 + remote v3'],
  'host v2, then remote v2, then remote v3': [
    'host v1 + remote v1',
    'host v2 + remote v1',
    'host v2 + remote v2',
    'host v2 + remote v3',
  ],
  'remote v2, then host v2, then remote v3': [
    'host v1 + remote v1',
    'host v1 + remote v2',
    'host v2 + remote v2',
    'host v2 + remote v3',
  ],
};
// Which plan keeps the page working at every moment?
console.log(
  Object.entries(plans)
    .filter(([, states]) => states.every((s) => pageWorks[s] === true))
    .map(([plan]) => plan)
    .join('\n'),
);
