// Recorded from our example: scenario A (as built) and C (host calls preloadRemote).
// Three fresh page loads each, 100 ms per response; medians from recording/results.json.
// Across runs the timings varied by up to about 50 ms, so smaller differences are noise.
const median = {
  A: { lastFileMs: 777, remotesOnScreenMs: 965 },
  C: { lastFileMs: 632, remotesOnScreenMs: 966 },
};
const change = (a: number, c: number) => (Math.abs(c - a) < 50 ? 'no change' : `${c - a} ms`);
// With preloading, what changed?
console.log(
  `last file: ${change(median.A.lastFileMs, median.C.lastFileMs)}, ` +
    `remotes on screen: ${change(median.A.remotesOnScreenMs, median.C.remotesOnScreenMs)}`,
);
