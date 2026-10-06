// Recorded in Chromium, one browser profile, two visits. Same as before, except that
// mf-manifest.json is now served with Cache-Control: no-cache.
// Visit 1: remote_a build 1 is live. Then build 2 is deployed. Visit 2, same browser:
const visit2 = {
  requestsToRemoteA: [
    '/mf-manifest.json',
    '/static/js/remote_a.8c5b437924.js',
    '/static/js/async/__federation_expose_Widget.4d34cec5d4.js',
  ],
  headings: ['Host', 'Remote a v2', 'Remote b'],
};
// How many requests reached remote_a's server on visit 2?
console.log(`requests to remote_a: ${visit2.requestsToRemoteA.length}`);
