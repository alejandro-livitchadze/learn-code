// remote_a's build also writes dist/@mf-types.zip, its types as of this build. For the build
// without a default export, Widget.d.ts inside it says:
//   export declare function Card(): import("react").JSX.Element;
// Recorded: the host's App.tsx compiled against that zip instead of host/src/remotes.d.ts
// (tsconfig paths "*": ["./@mf-types/*"], as the Module Federation type docs show).
const recorded = {
  exitCode: 2,
  firstError:
    "src/App.tsx(4,28): error TS2322: Type 'Promise<typeof import(...)>' is not assignable",
};
const code = /error (TS\d+)/.exec(recorded.firstError)?.[1];
console.log(
  recorded.exitCode === 0
    ? 'tsc exit 0'
    : `tsc exit ${recorded.exitCode}: ${code} at App.tsx line 4`,
);
