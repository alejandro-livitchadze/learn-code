# @learn-code/lesson-compiler

Compiles `lesson.mdoc` to a validated `Lesson` (see `@learn-code/lesson-schema`).

```ts
const result = compileLesson('content/fullstack/joins-01/lesson.mdoc');
if (!result.ok) result.errors.forEach((e) => console.error(formatError(e))); // file:line: message
```

## Markdoc maintenance status (checked 2026-10-02)

`@markdoc/markdoc` 0.5.10 was published 2026-09-16; releases 0.5.5 to 0.5.10 landed between March and September 2026. It is maintained, so the E01 stop condition does not apply.

## Markdown subset

Step prose (`body`, recap `points`, cliffhanger `question`, sqlLab `prompt` and `hints`) is Markdown, rendered by `packages/widgets/src/markdown.tsx`. Only this subset is supported:

- Paragraphs, separated by a blank line.
- Lists whose every line starts with `- ` (no nesting, no numbers).
- Fenced code blocks between lines that start with three backticks (an optional language name is ignored). Blank lines and markup characters inside are kept as written; the word-count rule does not count them.
- Inline `` `code` ``, `**bold**`, `*italic*`.
- Links `[text](url)` where `url` starts with `http://` or `https://`. They render with `rel="noreferrer"`. Any other scheme (such as `javascript:`) is never rendered as a link.

Everything else is rejected by the lint rule `markdown-subset`, which prints `file:line: error [markdown-subset] <field>, line <n>: <construct> is not supported`. The file line is the step; `<n>` counts from 1 inside the field. Rejected: headings, blockquotes, numbered or nested lists, `*` and `+` bullets, horizontal rules, tables, tilde fences, indented code, images, HTML, strikethrough, `__bold__`, reference links, and links that are not http or https.

## CLI

Run from the repository root:

- `pnpm lesson build <path>` compiles and writes `dist/lessons/<course>/<lesson>.json`.
- `pnpm lesson check <path>` compiles, lints and verifies samples; prints `file:line: error [rule] message` and exits non-zero on any error. `<path>` is a `lesson.mdoc`, a folder, or a folder of lessons (default `content`). CI runs `pnpm lesson check content`.
- `pnpm lesson new <course> <lesson-id>` scaffolds `content/<course>/<lesson-id>/` (lesson, `samples/`, `seeds/`) and empty course registries.

## Content layout and registries

```
content/<course>/registry/concepts.json          required
content/<course>/registry/misconceptions.json    required
content/<course>/registry/syntax-concepts.json   optional: concept ids that never get review cards
content/<course>/<lesson>/lesson.mdoc
content/<course>/<lesson>/samples/               files referenced as ./samples/x.sql
content/<course>/<lesson>/seeds/<name>.sql       seeds
```

The linter gets its registries from the course folder (the parent of the lesson folder).

## Sample verification

Run by `check`, in Node.js, exactly compared after trimming:

- `predict` with `language="sql"`: the code runs on PGlite after `seeds/default.sql` (if present); the last statement's result must equal the correct option's `output`. One value prints bare (`400`); anything else prints a header line and `a | b` rows; NULL prints `NULL`.
- `predict` with `js` or `ts`: run in a Node.js child process (5 s timeout); stdout must equal the correct `output`.
- `sqlLab`: the solution must run on `seeds/<seedRef>.sql`, and a non-empty starter must not produce the same result (row order ignored unless `orderMatters`).

## Adding a step kind

1. Add the Zod schema in `lesson-schema` and register it in the `step` union.
2. Add an entry to `KIND_TAGS` in `src/tags/kinds.ts` (attributes, allowed child tags, `build`).
3. Add any new nested helper tag to `CHILD_TAGS`.
4. Add the step to `src/__fixtures__/lesson.mdoc`. A test fails until every schema kind has a tag.
5. If it has runnable code with a declared output, add a case in `src/verify/index.ts`; add the kind to `REPRESENTATION` in `src/lint/rules.ts` and, if it is passive, to `PASSIVE_KINDS`.

Nested tags (`option`, `blank`, ...) must start on their own line. Attributes named `code`, `template`, `starter`, `solution`, `badCode`, `goodCode`, `query`, `ddl`, `before`, `after` accept `./relative/file` references.
