# E09. Course: Microfrontends

Read `00-context.md` and `E08-visual-system.md` first.

## Why this course exists

The author needs microfrontends for his own job search now. It is a second course, `frontend-architecture`, next to `fullstack`. Same platform, same visual system, same pedagogy rules.

## Audience

Experienced React and TypeScript developers who have built single-page apps but never split one across teams. They know bundlers exist; they have not configured Module Federation.

## Correctness rules (stricter than for course 1)

The author is learning this topic from the course and cannot catch mistakes himself. Therefore:

1. **Primary sources only.** Every claim about a tool's behavior links to its official documentation or source: module-federation.io, webpack.js.org, rspack.dev, vite.dev and the official plugin repositories, single-spa.js.org, developer.mozilla.org (import maps, custom elements, shadow DOM), react.dev. Blog posts are not sources.
2. **Check what is current before writing.** Before the roadmap, record in `content/frontend-architecture/sources.md`: the current Module Federation major version and package names, which bundlers and meta-frameworks it officially supports today, and anything deprecated. Date every entry. Lessons must not teach deprecated setups as the default.
3. **Every code sample is real.** Configuration and code samples are taken from a working example project in `content/frontend-architecture/examples/` that CI builds. A `predict` output about runtime behavior is recorded from that example, not written by hand.
4. **Opinions are labelled.** Architecture trade-offs are presented as trade-offs with the conditions under which each side wins, never as rules.

## Draft roadmap (the curriculum task may reorder; it may not drop the misconceptions)

1. **Do you even need this?** Misconception: microfrontends make apps faster. They solve team and deployment coupling, and usually cost performance. Interaction: sorter of team situations into "monolith", "modular monolith", "microfrontends", with a consequence per wrong choice.
2. **Ways to compose.** Misconception: microfrontends means Module Federation. Build-time packages, server or edge composition, iframes, web components, import maps, Module Federation. Interaction: match each requirement (independent deploy, shared state, style isolation, SEO) to the options that satisfy it.
3. **Host and remote.** Misconception: the host bundles the remote. The remote is fetched at runtime from its own deployment. Interaction: be the browser, order the network requests on first load.
4. **Two Reacts.** Misconception: shared dependencies are automatic. Break it first: two copies of React cause an invalid hook call. Then fix it with a shared singleton and see what `requiredVersion` does on a mismatch.
5. **Contracts between teams.** Misconception: a remote can change its exports freely. Types, versioned contracts, what breaks at runtime and how to detect it before deploy.
6. **Routing and the shell.** Who owns the URL; nested routing; deep links into a remote.
7. **Talking without coupling.** Misconception: a shared global store is the easy answer. Custom events, URL state, callbacks through props, and why a shared store couples deploys.
8. **Styles that leak.** Break it first: a global `button` rule in one remote restyles the host. Isolation options and their costs.
9. **Deploying independently.** Remote URLs per environment, cache busting, rollback of one remote, what happens when a remote is down.
10. **Paying the performance bill.** Duplicate dependencies, waterfall loading, preloading. Interaction: a meter of bytes and requests while toggling sharing and preloading.

## Interactions available

Only widgets that exist after V4: `hook`, `explain`, `predict`, `fillBlanks`, `recap`, `cliffhanger`, `pitfall`, plus margin items and MiniDiagram. If a lesson needs an engine from E07 (sorter, sequence builder, meter), write the step as `predict` or `fillBlanks` for now and add the better interaction to `inbox.md` as a proposal.

## Characters in this course

The Bug causes the incidents (a remote that took down checkout, a style leak). Olha asks the questions. Mr. Runtime plays the browser loading modules, in steps where the learner orders requests.
