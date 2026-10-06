// Recorded in Chromium, one browser profile, two visits.
// remote_a served mf-manifest.json with Cache-Control: public, max-age=86400,
// and its hashed files with Cache-Control: public, max-age=31536000, immutable.
// Visit 1: remote_a build 1 is live. Then build 2 (heading "Remote a v2") is deployed.
// Visit 2, a few seconds later, same browser:
const visit2 = {
  requestsToRemoteA: [] as string[],
  headings: ['Host', 'Remote a', 'Remote b'],
};
// Which heading does remote_a show?
console.log(visit2.headings[1]);
