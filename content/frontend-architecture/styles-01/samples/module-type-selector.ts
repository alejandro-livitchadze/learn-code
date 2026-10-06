// remote_b/src/widget.module.css (Rsbuild treats *.module.css as CSS Modules):
//   button { background-color: rgb(255, 0, 0); }
// Widget.tsx: import './widget.module.css';
// Recorded from our example project in Chromium. Background of each button:
const backgroundColor: Record<string, string> = {
  'Pay (host)': 'rgb(255, 0, 0)',
  remote_a: 'rgb(255, 0, 0)',
  remote_b: 'rgb(255, 0, 0)',
};
// Which buttons turned red?
const red = Object.keys(backgroundColor).filter((b) => backgroundColor[b] === 'rgb(255, 0, 0)');
console.log(red.join(', '));
