// The host's types for remote_a come from its own file, host/src/remotes.d.ts, written by the host team:
//   declare module 'remote_a/Widget' {
//     export function Widget(): import('react').JSX.Element;
//     export default Widget;
//   }
// remote_a has just deployed the build without a default export. No host file changed.
// Recorded: tsc -p host/tsconfig.json --noEmit
const recorded = { exitCode: 0, errorCodes: [] as string[] };
console.log(
  recorded.exitCode === 0
    ? 'tsc exit 0'
    : `tsc exit ${recorded.exitCode}: ${recorded.errorCodes.join(', ')}`,
);
