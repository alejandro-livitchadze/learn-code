// remote_b/src/widget.module.css (Rsbuild treats *.module.css as CSS Modules):
//   button { background-color: red; }
// Widget.tsx: import './widget.module.css';
// Recorded from our example project in Chromium: getComputedStyle background-color
// of each button, as its red, green and blue channels.
const background: Record<string, readonly number[]> = {
  'Pay (host)': [255, 0, 0],
  remote_a: [255, 0, 0],
  remote_b: [255, 0, 0],
};
// Which buttons turned red?
const red = Object.keys(background).filter((b) => background[b]?.join() === '255,0,0');
console.log(red.join(', '));
