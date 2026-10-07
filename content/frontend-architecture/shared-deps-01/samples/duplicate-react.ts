// remote_b, broken build (MF_SHARE_REACT=off): its config has shared: {}.
// The host and remote_a still share react, react-dom and react-dom/ as singletons.
// Copied from content/frontend-architecture/examples/recorded/outputs.json, recording "duplicate-react".
const recorded = {
  remoteHeadings: ['Remote a'],
  errorsShownInPage: ["remote_b failed: Cannot read properties of null (reading 'useState')"],
};
// What does the page show in remote_b's place?
console.log(recorded.errorsShownInPage[0] ?? 'Remote b');
