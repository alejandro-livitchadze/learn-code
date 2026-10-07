// Model: prints the values recorded from our example project.
// remote_b's Widget now renders its heading and button into a shadow root:
//   const shadow = el.attachShadow({ mode: 'open' });  then createPortal(…, shadow)
// It still imports './widget.css' (button { background-color: red; }) as before,
// so the build still emits a .css file and the page gets a <link> in document.head.
// Recorded from our example project in Chromium: getComputedStyle background-color
// of each button, as its red, green and blue channels.
const background: Readonly<Record<string, readonly number[]>> = {
  'Pay (host)': [255, 0, 0],
  remote_a: [255, 0, 0],
  remote_b: [239, 239, 239],
};
// Which buttons turned red?
const red = Object.keys(background).filter((b) => background[b]?.join() === '255,0,0');
console.log(red.join(', '));
