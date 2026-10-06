// remote_b rebuilt with one change: requiredVersion '^20.0.0' instead of '^19.0.0', still singleton.
// Host, remote_a and remote_b all have React 19.3.0 installed. Recorded from our example
// (fresh page in jsdom, see the note at the top of this lesson and samples/mismatch-recording.txt).
const recorded = {
  remoteHeadings: ['Remote a', 'Remote b'],
  errorsShownInPage: [],
};
// What does the page show?
console.log(recorded.errorsShownInPage[0] ?? recorded.remoteHeadings.join(', '));
