// remote_b/src/widget.css now scopes its rule to its own section:
//   [data-remote='remote_b'] button { background-color: red; }
// The host team adds host.css to the host:
//   button { border: 3px solid green; }
// Recorded from our example project in Chromium: getComputedStyle of remote_b's button
// (colors as red, green and blue channels).
const remoteBButton = {
  background: [255, 0, 0],
  borderTopWidth: '3px',
  borderTopColor: [0, 128, 0],
};
const names: Record<string, string> = {
  '255,0,0': 'red',
  '239,239,239': 'grey',
  '0,128,0': 'green',
  '0,0,0': 'black',
};
const bg = names[remoteBButton.background.join()];
const border = `${remoteBButton.borderTopWidth} ${names[remoteBButton.borderTopColor.join()]}`;
console.log(`${bg}, ${border} border`);
