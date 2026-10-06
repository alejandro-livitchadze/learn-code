// remote_b renders into a shadow root and puts its own CSS inside it:
//   import css from './widget.css?inline';   …   <style>{css}</style>
// The host's host.css:
//   main { color: rgb(0, 0, 255); }
//   button { border: 3px solid rgb(0, 128, 0); }
// Recorded from our example project in Chromium, inside remote_b's shadow root:
const recorded = {
  headingColor: 'rgb(0, 0, 255)',
  buttonBorderTop: '2px rgb(0, 0, 0)',
};
const names: Record<string, string> = {
  'rgb(0, 0, 255)': 'blue',
  'rgb(0, 0, 0)': 'black',
  '2px rgb(0, 0, 0)': '2px black',
  '3px rgb(0, 128, 0)': '3px green',
};
console.log(
  `heading ${names[recorded.headingColor]}, button border ${names[recorded.buttonBorderTop]}`,
);
