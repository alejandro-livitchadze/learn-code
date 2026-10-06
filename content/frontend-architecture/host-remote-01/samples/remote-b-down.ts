// Recorded from our example project (jsdom, fresh page load, 8 seconds of waiting).
// Running: host on :3000 and remote_a on :3001. The server for remote_b on :3002 is stopped.
const recorded = {
  headingsOnPage: [] as string[],
  consoleError:
    'Failed to get manifest. #RUNTIME-003 (manifestUrl http://localhost:3002/mf-manifest.json)',
};
// What does the visitor see?
console.log(
  recorded.headingsOnPage.length === 0 ? '(empty page)' : recorded.headingsOnPage.join(', '),
);
