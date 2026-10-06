// The same recording as the last step: remote_b asks for react '^20.0.0', every app has 19.3.0.
// Copied from samples/mismatch-recording.txt.
const recorded = {
  consoleErrors: [],
  consoleWarnings: [
    '[ Federation Runtime ] Version 19.3.0 from host of shared singleton module react does not satisfy the requirement of host which needs ^20.0.0)',
    '[ Federation Runtime ] Version 19.3.0 from remote_b of shared singleton module react-dom does not satisfy the requirement of remote_b which needs ^20.0.0)',
  ],
};
console.log(`${recorded.consoleWarnings.length} warnings, ${recorded.consoleErrors.length} errors`);
