// remote-a/dist after two builds (recorded). Build 2 changed one thing: the heading "Remote a v2".
// Three of the files in each build:
const build1 = [
  'mf-manifest.json',
  'static/js/remote_a.4c90afa552.js',
  'static/js/async/__federation_expose_Widget.95557ec38c.js',
];
const build2 = [
  'mf-manifest.json',
  'static/js/remote_a.8c5b437924.js',
  'static/js/async/__federation_expose_Widget.4d34cec5d4.js',
];
// Which of the three kept its name?
console.log(build1.filter((file) => build2.includes(file)).join('\n'));
