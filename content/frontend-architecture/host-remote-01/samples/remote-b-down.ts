// Recorded from our example project (jsdom, fresh page load, 8 seconds of waiting).
// Running: host on :3000 and remote_a on :3001. The server for remote_b on :3002 is stopped.
const recorded = {
  headingsOnPage: [] as string[],
  consoleError:
    'Uncaught (in promise) Error: [ Federation Runtime ]: Failed to get manifest. #RUNTIME-003 args: {"manifestUrl":"http://localhost:3002/mf-manifest.json","moduleName":"remote_b","hostName":"host"}',
};
// The error line is copied from examples/recorded/outputs.json (remote-b-down).
// What does the visitor see, and what does the console say?
const page =
  recorded.headingsOnPage.length === 0 ? '(empty page)' : recorded.headingsOnPage.join(', ');
console.log(`${page} | ${recorded.consoleError}`);
