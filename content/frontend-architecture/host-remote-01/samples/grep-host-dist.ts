// Recorded from our example project after "pnpm examples:build".
// "Remote a" is the heading that remote_a's Widget renders.
// For each dist folder: the files that contain the text "Remote a" (grep -rl).
const filesWithText: Record<string, string[]> = {
  'host/dist': [],
  'remote-a/dist': [
    'static/js/async/__federation_expose_Widget.[hash].js',
    'static/js/async/j.[hash].js',
  ],
  'remote-b/dist': [],
};
console.log(`host/dist: ${filesWithText['host/dist']?.length} files contain "Remote a"`);
