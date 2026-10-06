// remote_b renders into a shadow root and puts its own CSS inside it:
//   import css from './widget.css?inline';   …   <style>{css}</style>
// The host's host.css:
//   main { color: blue; }
//   button { border: 3px solid green; }
// Recorded from our example project in Chromium, inside remote_b's shadow root
// (getComputedStyle, colors as red, green and blue channels):
const recorded = {
  headingColor: [0, 0, 255],
  buttonBorderTopWidth: '2px',
  buttonBorderTopColor: [0, 0, 0],
};
const names: Record<string, string> = {
  '0,0,255': 'blue',
  '0,0,0': 'black',
  '0,128,0': 'green',
};
const heading = names[recorded.headingColor.join()];
const border = `${recorded.buttonBorderTopWidth} ${names[recorded.buttonBorderTopColor.join()]}`;
console.log(`heading ${heading}, button border ${border}`);
