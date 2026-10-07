// Three builds of remote_b, each loaded by the same host. Recorded from our example:
// A and B from examples/recorded/outputs.json ("shared-react", "duplicate-react"),
// C from samples/mismatch-recording.txt.
const builds = [
  { id: 'A', shared: "react, react-dom, react-dom/ as singletons, '^19.0.0'", pageErrors: 0 },
  { id: 'B', shared: 'nothing', pageErrors: 1 },
  { id: 'C', shared: "react, react-dom, react-dom/ as singletons, '^20.0.0'", pageErrors: 0 },
];
// Which builds put an error on the page?
console.log(
  builds
    .filter((build) => build.pageErrors > 0)
    .map((build) => build.id)
    .join(' and '),
);
