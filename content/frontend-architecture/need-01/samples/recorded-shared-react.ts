// host = the page that loads the parts; remote_a, remote_b = parts built and deployed separately.
// Copied from content/frontend-architecture/examples/recorded/outputs.json, recording "shared-react":
// host and both remotes share react as a singleton (the working setup).
const recorded = {
  name: 'shared-react',
  remoteHeadings: ['Remote a', 'Remote b'],
  errorsShownInPage: [] as string[],
};
console.log(
  `${recorded.remoteHeadings.length} remotes rendered, ${recorded.errorsShownInPage.length} errors`,
);
