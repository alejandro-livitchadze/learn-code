// Recorded from our example project (jsdom, fresh page load, nothing cached).
// Run 1: host, remote_a and remote_b built from the committed sources.
// Run 2: remote_a's heading changed to "Remote a v2" and only remote_a rebuilt.
//        The host's build output is the same files as in run 1.
// A visitor opens the host after run 2. What is the first heading from a remote?
const headingsShown = {
  run1: ['Remote a', 'Remote b'],
  run2: ['Remote a v2', 'Remote b'],
};
console.log(headingsShown.run2[0]);
