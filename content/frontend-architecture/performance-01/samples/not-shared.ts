// Recorded from our example. Scenario A: the example as built. Scenario B: the same page, but
// remote_b is the broken build of lesson 4 (MF_SHARE_REACT=off), which shares nothing.
// Copied from recording/results.json (the same numbers in all three runs).
const meter = {
  A: { requests: 12, bytes: 586465 },
  B: { requests: 13, bytes: 801814 },
};
// What did leaving React out of remote_b's "shared" add to one page load?
console.log(
  `+${meter.B.bytes - meter.A.bytes} bytes, +${meter.B.requests - meter.A.requests} request`,
);
