// Recorded in Chromium. Same as before, remote_b's server stopped, but the host was rebuilt
// with one more line in its pluginModuleFederation options: shareStrategy: 'loaded-first'.
const recorded = {
  headingsOnPage: ['Host', 'Remote a'],
  // The error box text is shortened; recordings/run-1.json has it in full.
  errorBoxesOnPage: [
    'remote_b failed: [ Federation Runtime ]: Failed to get manifest. #RUNTIME-003 ...',
  ],
};
// What does a visitor see?
const boxes = recorded.errorBoxesOnPage.map((text) => `error box for ${text.split(' ')[0]}`);
const shown = [...recorded.headingsOnPage, ...boxes];
console.log(shown.length === 0 ? '(empty page)' : shown.join(', '));
