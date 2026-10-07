// Recorded from our example project. The requests the server on :3001 (remote_a) saw on first load,
// and the files of remote-a/dist that contain the text "Remote a", the Widget's heading.
const requestedFromRemoteA = [
  '/mf-manifest.json',
  '/static/js/remote_a.[hash].js',
  '/static/js/async/__federation_expose_Widget.[hash].js',
];
const filesWithText = [
  '/static/js/async/__federation_expose_Widget.[hash].js',
  '/static/js/async/j.[hash].js',
];
// Which request carried the Widget's code?
console.log(requestedFromRemoteA.filter((path) => filesWithText.includes(path)).join('\n'));
