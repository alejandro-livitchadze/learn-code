// remote_b/src/widget.css, imported by remote_b's Widget.tsx and deployed with remote_b only:
//   button { background-color: rgb(255, 0, 0); }
// Recorded from our example project in Chromium after the page loaded.
// The host has its own "Pay" button; remote_a and remote_b render one button each.
const backgroundColor: Record<string, string> = {
  'Pay (host)': 'rgb(255, 0, 0)',
  remote_a: 'rgb(255, 0, 0)',
  remote_b: 'rgb(255, 0, 0)',
};
// Which buttons turned red?
const red = Object.keys(backgroundColor).filter((b) => backgroundColor[b] === 'rgb(255, 0, 0)');
console.log(red.join(', '));
