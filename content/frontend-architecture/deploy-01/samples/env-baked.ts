// Recorded. The host's config reads process.env['REMOTE_A_ORIGIN'] (previous step).
// Built once with REMOTE_A_ORIGIN=https://staging.example.com/remote-a, then searched:
const filesInHostDist = {
  'staging.example.com/remote-a/mf-manifest.json': [
    'static/js/index.9c28080880.js',
    'mf-manifest.json',
    'mf-stats.json',
  ],
  'www.example.com': [] as string[],
};
// Production copies this dist folder and sets REMOTE_A_ORIGIN=https://www.example.com/remote-a
// on its server. Which remote_a address is written in the host's script?
const inScript = Object.entries(filesInHostDist).find(([, files]) =>
  files.includes('static/js/index.9c28080880.js'),
);
console.log(`https://${inScript?.[0] ?? ''}`);
