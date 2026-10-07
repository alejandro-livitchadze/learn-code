// Recorded in Chromium from a copy of our example (host, remote_a, remote_b as committed).
// The only change: the server for remote_b is stopped, so its requests are refused.
// The host already wraps each remote in an error boundary (host/src/App.tsx, excerpt):
//   <Boundary name="remote_b"><Suspense fallback={...}><RemoteB /></Suspense></Boundary>
const recorded = {
  headingsOnPage: [] as string[],
  errorBoxesOnPage: [] as string[],
  pageError: '[ Federation Runtime ]: Failed to get manifest. #RUNTIME-003',
};
// What does a visitor see after 8 seconds?
const shown = [...recorded.headingsOnPage, ...recorded.errorBoxesOnPage];
console.log(shown.length === 0 ? '(empty page)' : shown.join(', '));
