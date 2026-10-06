// Recorded from our example project. The requests the server on :3001 (remote_a) saw on first load,
// and the files of remote-a/dist that contain the text "Remote a", the Widget's heading.
const requestedFromRemoteA = [
  '/mf-manifest.json',
  '/static/js/remote_a.71bd68a471.js',
  '/static/js/async/__federation_expose_Widget.c2b648506a.js',
];
const filesWithText = [
  '/static/js/async/__federation_expose_Widget.c2b648506a.js',
  '/static/js/async/j.8d7b1078ff.js',
];
// Which request carried the Widget's code?
console.log(requestedFromRemoteA.filter((path) => filesWithText.includes(path)).join('\n'));
