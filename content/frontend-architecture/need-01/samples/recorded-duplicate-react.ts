// Copied from content/frontend-architecture/examples/recorded/outputs.json, recording "duplicate-react":
// remote_b was built with no shared react (MF_SHARE_REACT=off) and the host rendered it.
const recorded = {
  name: 'duplicate-react',
  remoteHeadings: ['Remote a'],
  errorsShownInPage: ["remote_b failed: Cannot read properties of null (reading 'useState')"],
};
console.log(recorded.errorsShownInPage[0]);
