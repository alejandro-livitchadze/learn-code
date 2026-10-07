// Recorded from our example: scenario A (as built) and D, a scratch copy of our host with one
// added line in its config: shareStrategy: 'loaded-first'. Remotes as built.
// Three fresh page loads each, 100 ms per response; medians from recording/results.json.
const median = {
  A: { hostHeadingMs: 665, remotesOnScreenMs: 965 },
  D: { hostHeadingMs: 432, remotesOnScreenMs: 732 },
};
// When did the host's heading and the two remotes appear with loaded-first?
console.log(`host ${median.D.hostHeadingMs} ms, remotes ${median.D.remotesOnScreenMs} ms`);
