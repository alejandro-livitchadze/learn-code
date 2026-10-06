// Requests the server of remote_b (:3002) saw on a fresh load, recorded from our example project.
// Run A: remote_b imports './widget.css' (normal import, no shadow DOM).
// Run B: remote_b imports './widget.css?inline' and puts it in a <style> inside its shadow root.
const runA = [
  '/mf-manifest.json',
  '/static/js/remote_b.2c22246e37.js',
  '/static/js/async/v.3654142d9c.js',
  '/static/js/async/6o.f5c80c7084.js',
  '/static/js/async/k.5d11aa151d.js',
  '/static/css/async/__federation_expose_Widget.dddc0405f8.css',
  '/static/js/async/__federation_expose_Widget.baa8ac7cad.js',
];
const runB = [
  '/mf-manifest.json',
  '/static/js/remote_b.2f5cc0ec44.js',
  '/static/js/async/v.3654142d9c.js',
  '/static/js/async/6o.f5c80c7084.js',
  '/static/js/async/k.5d11aa151d.js',
  '/static/js/async/__federation_expose_Widget.7840cce76a.js',
];
const css = (run: string[]) => run.filter((path) => path.endsWith('.css')).length;
// How many .css files did run B request?
console.log(`run A: ${css(runA)}, run B: ${css(runB)}`);
