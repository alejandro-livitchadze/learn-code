// remote_b/src/widget.css now scopes its rule to its own section:
//   [data-remote='remote_b'] button { background-color: rgb(255, 0, 0); }
// The host team adds host.css to the host:
//   button { border: 3px solid rgb(0, 128, 0); }
// Recorded from our example project in Chromium. Computed style of remote_b's button:
const remoteBButton = {
  backgroundColor: 'rgb(255, 0, 0)',
  borderTop: '3px rgb(0, 128, 0)',
};
const names: Record<string, string> = {
  'rgb(255, 0, 0)': 'red',
  'rgb(239, 239, 239)': 'grey',
  '3px rgb(0, 128, 0)': '3px green',
  '2px rgb(0, 0, 0)': '2px black',
};
console.log(`${names[remoteBButton.backgroundColor]}, ${names[remoteBButton.borderTop]} border`);
