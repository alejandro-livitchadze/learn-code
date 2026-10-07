// host/dist/index.html as built (recorded). The browser has just received it.
const html =
  '<!DOCTYPE html><html><head><title>Rsbuild App</title><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><script defer src="http://localhost:3000/static/js/index.[hash].js"></script></head><body><div id="root"></div></body></html>';
// Which path does this HTML make the browser request next?
for (const match of html.matchAll(/src="([^"]+)"/g)) {
  console.log(new URL(match[1] ?? '').pathname);
}
