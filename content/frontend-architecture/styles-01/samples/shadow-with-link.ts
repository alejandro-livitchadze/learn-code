// remote_b's Widget now renders its heading and button into a shadow root:
//   const shadow = el.attachShadow({ mode: 'open' });  then createPortal(…, shadow)
// It still imports './widget.css' (button { background-color: rgb(255, 0, 0); }) as before,
// so the build still emits a .css file and the page gets a <link> in document.head.
// Recorded from our example project in Chromium. Background of each button:
const backgroundColor: Record<string, string> = {
  'Pay (host)': 'rgb(255, 0, 0)',
  remote_a: 'rgb(255, 0, 0)',
  remote_b: 'rgb(239, 239, 239)',
};
// Which buttons turned red?
const red = Object.keys(backgroundColor).filter((b) => backgroundColor[b] === 'rgb(255, 0, 0)');
console.log(red.join(', '));
