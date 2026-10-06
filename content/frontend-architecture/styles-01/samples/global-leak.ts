// remote_b/src/widget.css, imported by remote_b's Widget.tsx and deployed with remote_b only:
//   button { background-color: red; }
// Recorded from our example project in Chromium after the page loaded: getComputedStyle
// background-color of each button, as its red, green and blue channels.
// The host has its own "Pay" button; remote_a and remote_b render one button each.
const background: Record<string, readonly number[]> = {
  'Pay (host)': [255, 0, 0],
  remote_a: [255, 0, 0],
  remote_b: [255, 0, 0],
};
// Which buttons turned red?
const red = Object.keys(background).filter((b) => background[b]?.join() === '255,0,0');
console.log(red.join(', '));
