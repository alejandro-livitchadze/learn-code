# Sources: current state of Module Federation

Course: `frontend-architecture`. Rule: E09 correctness rules 1 and 2.
All entries were fetched on **2026-10-06** from the pages linked. Fetched text is treated as data. Package versions come from the npm registry (`registry.npmjs.org`), which is the authoritative record of what is published, not a prose source; each is marked "registry". Anything not listed here has not been checked and must not be taught as fact until it is added with a date.

## 1. Current Module Federation version and packages (checked 2026-10-06)

- **Module Federation 2.0 is the current line.** The docs say it "differs from the Module Federation built into Webpack5 by providing not only the core features of module export, loading, and dependency sharing but also additional dynamic type hinting, Manifest, Federation Runtime, and Runtime Plugin System." Source: https://module-federation.io/guide/start/index.md (fetched 2026-10-06).
- **Latest published version is 2.9.2** for `@module-federation/enhanced`, `@module-federation/runtime`, `@module-federation/rsbuild-plugin`, `@module-federation/modern-js-v3`, `@module-federation/modern-js` and `@module-federation/metro` (registry, `latest` dist-tag; `enhanced` last modified 2026-09-26). Source: https://registry.npmjs.org/@module-federation/enhanced and the sibling package names (fetched 2026-10-06).
- **Packages differ in version number.** `@module-federation/vite` is at 1.23.2 and `@module-federation/nextjs-mf` at 8.8.76 (registry, 2026-10-06). Do not write "Module Federation 2.9" for them.
- **Which package to install per project type** (official table): https://module-federation.io/integrations/index.md (fetched 2026-10-06):

| Project | Package |
| --- | --- |
| Rsbuild app, Rslib module | `@module-federation/rsbuild-plugin` |
| Vite app | `@module-federation/vite` |
| Rspack app | `@module-federation/enhanced` |
| Webpack app | `@module-federation/enhanced` |
| React Native / Metro | `@module-federation/metro` plus the matching Metro plugin |
| Rspress site | `@module-federation/rspress-plugin` |
| Modern.js app | `@module-federation/modern-js-v3` (Modern.js v3, recommended) or `@module-federation/modern-js` (Modern.js v2) |
| Next.js app | `@module-federation/nextjs-mf` and `webpack` |
| Angular app | integration package depends on the Angular build setup |

- **Manifest entry point.** Current examples point remotes at a manifest, for example `remote1@http://localhost:2001/mf-manifest.json`, not only at `remoteEntry.js`. Sources: https://module-federation.io/integrations/build-tool/rsbuild.md and https://module-federation.io/integrations/bundler/rspack.md (fetched 2026-10-06).
- **Runtime-only use** is supported: "If you do not want to change your build setup and only need to load remote modules at runtime, you can use Runtime directly." A build plugin is required to expose modules. Source: https://module-federation.io/integrations/index.md (2026-10-06).
- **Node.js requirement:** "When using Module Federation build plugins, make sure your Node.js version is 20 or higher." Source: https://module-federation.io/guide/start/quick-start.md (2026-10-06).
- **Config helper.** Rspack and Vite pages use `createModuleFederationConfig` (from `@module-federation/enhanced/rspack` and `@module-federation/vite`); the webpack page uses a plain `module.exports` config and `ModuleFederationPlugin` from `@module-federation/enhanced/webpack`. Sources: the bundler pages above (2026-10-06).

## 2. Supported bundlers and meta-frameworks (checked 2026-10-06)

Stated by the official docs:

- **Rspack** and **Webpack**: package `@module-federation/enhanced`. https://module-federation.io/integrations/bundler/rspack.md , https://module-federation.io/integrations/bundler/webpack.md
- **Rsbuild** and **Rslib**: `@module-federation/rsbuild-plugin`. https://module-federation.io/integrations/build-tool/rsbuild.md
- **Vite**: `@module-federation/vite`. Docs list the `dev` option as unsupported ("Except for the dev option, all options are supported") and list "nuxt ssr" and hot update for consumed remotes as roadmap items. https://module-federation.io/integrations/build-tool/vite.md
- **Metro (React Native)**: `@module-federation/metro`. The docs say support "is still experimental and may lack some functionality". https://module-federation.io/integrations/bundler/metro.md
- **Modern.js**: v3 via `@module-federation/modern-js-v3` (recommended), v2.56.1 and later via `@module-federation/modern-js`; includes SSR. https://module-federation.io/integrations/framework/modernjs/index.md
- **Next.js**: Pages router and SSR only, `next ^15 || ^14 || ^13 || ^12`. See deprecations. https://module-federation.io/integrations/framework/nextjs/index.md
- **Angular**: guides for Angular CLI, Nx, SSR and service workers; "Angular integrations commonly depend on Angular CLI, a custom Webpack builder, or Nx." https://module-federation.io/integrations/framework/angular/index.md
- The Quick Start page also mentions Rollup, Rolldown and esbuild as build tools in its text. The integrations table lists no package for them, so **do not claim official support** for those three until a page with a package and install steps is recorded here. https://module-federation.io/guide/start/quick-start.md

## 3. Deprecated or discouraged setups (checked 2026-10-06)

- **Next.js integration is deprecated.** The page shows a banner "Project Deprecation: Support for Next.js is ending" (link target: https://github.com/module-federation/core/issues/3153, not read in this check) and the header "App Router Not Supported". Consequence: lessons use no Next.js example as the default, and mention Next.js only as "Pages router only, support ending". https://module-federation.io/integrations/framework/nextjs/index.md
- **`@module-federation/metro-plugin-rnef` is deprecated**: "RNEF integration (deprecated, use metro-plugin-rock instead)". Out of scope for the course; recorded for completeness. https://module-federation.io/integrations/bundler/metro.md
- **Webpack 5 built-in Module Federation is not "Module Federation 2.0".** The docs describe 2.0 as a different feature set (manifest, runtime, runtime plugins, type hints). Lessons teach `@module-federation/enhanced` as the default for webpack and rspack. The docs do not declare the built-in plugin deprecated; do not say so. https://module-federation.io/guide/start/index.md
- **Modern.js v2 package** `@module-federation/modern-js` is the older route; the docs recommend upgrading to Modern.js v3 and `@module-federation/modern-js-v3`. https://module-federation.io/integrations/framework/modernjs/index.md

## 4. Defaults chosen for the course (decisions, not facts)

- Default tool for worked examples: Rspack or Rsbuild with `@module-federation/enhanced` / `@module-federation/rsbuild-plugin`, remotes loaded through `mf-manifest.json`. Webpack is shown as the same configuration with a different plugin import. Reason: both are first-listed in the official table with a non-deprecated, non-experimental status. The example project and exact versions are pinned in the M-task that builds `examples/`; re-check this file's date before then.
- Vite is taught as supported with the caveats above.

## 5. Still to check before the related lessons are written

- Primary sources for the non-Module-Federation options in lesson 2: import maps and custom elements on developer.mozilla.org, single-spa.js.org, iframes. Not fetched in this task.
- The content of github.com/module-federation/core issue 3153 (reason and timeline for the Next.js deprecation). Not fetched in this task.
- `shared` options (`singleton`, `requiredVersion`, `strictVersion`) in module-federation.io/configure/shared before lesson 4.
