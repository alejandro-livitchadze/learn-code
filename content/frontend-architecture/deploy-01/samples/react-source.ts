// Recorded in Chromium, all three servers up. React's three files (react, react-dom,
// react-dom-client) were requested once per run. From which server?
const reactFilesFrom = {
  'version-first (default)': [':4102', ':4102', ':4102'],
  'loaded-first': [':4100', ':4100', ':4100'],
};
const servers: Record<string, string> = { ':4100': 'host', ':4101': 'remote_a', ':4102': 'remote_b' };
const from = reactFilesFrom['loaded-first'][0] ?? '';
console.log(`${from} (${servers[from]})`);
