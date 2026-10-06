// Recorded in Chromium, one browser profile. remote_a's server holds the hashed files of
// build 1 and build 2 side by side. mf-manifest.json: no-cache. Hashed files: immutable.
// Visit 1: build 2's manifest is live; the page shows "Remote a v2".
// Rollback: build 1's mf-manifest.json is put back. The host is not rebuilt. Visit 2:
const visit2 = {
  requestsToRemoteA: [
    '/mf-manifest.json',
    '/static/js/remote_a.4c90afa552.js',
    '/static/js/async/__federation_expose_Widget.95557ec38c.js',
  ],
  headings: ['Host', 'Remote a', 'Remote b'],
};
// Which heading does remote_a show?
console.log(visit2.headings[1]);
