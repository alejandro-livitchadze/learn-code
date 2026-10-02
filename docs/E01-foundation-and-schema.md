# E01. Foundation and Lesson Schema

Read `00-context.md` first.

## Goal

A monorepo where a lesson written in Markdoc compiles into a validated JSON step tree, and CI rejects lessons that break the schema or the pedagogy rules.

## Why it comes first

Every other epic consumes the step tree: the player renders it, widgets receive one step each, agents produce it. Its types are the contract of the whole project.

## Why Markdoc

Markdoc is a Markdown-based authoring format with custom tags. It is declarative, never executes content, parses to an AST, and validates tag attributes against a schema with file and line in the error. That suits content written by agents. It replaces the custom MDX parser from the earlier version of this epic.

Before starting, confirm that `@markdoc/markdoc` is still maintained (recent releases, open issues answered). If it is not, record that in `inbox/for-author.md` and stop.

## Scope

In scope: repository scaffold, `lesson-schema`, `lesson-compiler` (compile, lint, verify samples), CLI, CI, one sample lesson.

Out of scope: UI, widgets, running code in the browser.

## Tasks

### 1. Scaffold

- pnpm workspaces and Turborepo with the layout from `00-context.md`.
- Shared `tsconfig.base.json`: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`.
- ESLint with `@typescript-eslint/no-explicit-any` set to error. Prettier. Vitest.
- GitHub Actions on Node.js 26: install, typecheck, lint, test, `lesson check` on every pull request.

### 2. `packages/lesson-schema`

Zod schemas are the source of truth for the step tree. Types are inferred with `z.infer`.

```ts
import { z } from 'zod';

const stepBase = z.object({
  id: z.string().min(1),
  estSeconds: z.number().int().positive(),
  concepts: z.array(z.string()).readonly(),
});

const predictOption = z.object({
  output: z.string(),
  isCorrect: z.boolean(),
  feedback: z.string().min(1),
  misconception: z.string().optional(),
});

export const predictStep = stepBase.extend({
  kind: z.literal('predict'),
  code: z.string(),
  language: z.enum(['ts', 'js', 'sql', 'http']),
  options: z.array(predictOption).min(2).readonly(),
});

export const explainStep = stepBase.extend({
  kind: z.literal('explain'),
  body: z.string(), // markdown
  code: z.string().optional(),
  annotations: z
    .array(z.object({ line: z.number().int().positive(), text: z.string() }))
    .readonly(),
});

// one schema per kind listed in 00-context.md

export const step = z.discriminatedUnion('kind', [predictStep, explainStep /* ... */]);
export type Step = z.infer<typeof step>;

export const lesson = z.object({
  schemaVersion: z.literal(1),
  id: z.string(),
  courseId: z.string(),
  locale: z.string().default('en'),
  title: z.string(),
  concepts: z.array(z.string()).readonly(),
  steps: z.array(step).min(8).readonly(),
});
export type Lesson = z.infer<typeof lesson>;
```

Also export:

- `PASSIVE_KINDS` and `isActive(step)`.
- Schemas for `concepts.json`, `misconceptions.json`, `roadmap.json`, `status.json`.

### 3. `packages/lesson-compiler`

A thin layer over Markdoc. Do not write a parser.

**Source format.** One file per lesson, `lesson.mdoc`:

```
---
id: joins-01
courseId: fullstack
title: "Why your JOIN returned 400 rows"
concepts: [inner-join, row-multiplication]
---

{% hook character="bug" id="h1" estSeconds=40 %}
Friday, 18:40. The sales report shows revenue four times higher than the bank does.
{% /hook %}

{% predict id="p1" estSeconds=60 code="./samples/join.sql" language="sql" concepts=["row-multiplication"] %}
{% option output="100 rows" misconception="join-keeps-row-count" %}
A join can return more rows than either table has.
{% /option %}
{% option output="400 rows" correct=true %}
Each order matched four items.
{% /option %}
{% /predict %}
```

**Tag definitions.** One Markdoc tag schema per step kind, in `tags/`. Declare attribute types and `required` there, so Markdoc reports missing or mistyped attributes with a line number.

**Compile.**

1. `Markdoc.parse(source)` to get the AST. Parse the frontmatter YAML.
2. `Markdoc.validate(ast, config)`. Any error stops the build.
3. Walk the top-level tag nodes. Each becomes one step: tag name to `kind`, attributes to fields, nested tags (`option`) to arrays.
4. Markdown inside a tag stays markdown: serialize the child nodes back to text for `body` and `feedback`.
5. Resolve `code="./samples/x.sql"` by reading the file.
6. Parse the result with the Zod `lesson` schema. Zod is the final gate; Markdoc's validation only gives earlier and better-located errors.

Text outside any tag is an error: every piece of content must belong to a step.

**Lint.** Implement rules 1 to 7 from section 3 of `00-context.md` as separate pure functions:

```ts
interface LintIssue {
  readonly rule: string;
  readonly stepId?: string;
  readonly message: string;
  readonly severity: 'error' | 'warning';
}

type LintRule = (lesson: Lesson, registries: Registries) => readonly LintIssue[];
```

**Verify samples.** For each code sample with a declared output, run it and compare exactly:

- SQL samples run against PGlite in Node.js with the step's seed.
- JavaScript and TypeScript samples run in Node.js with a timeout.

For exercises, the reference solution must pass and the starter must fail.

### 4. CLI

- `pnpm lesson build <path>` writes `dist/lessons/<course>/<lesson>.json`.
- `pnpm lesson check <path>` runs compile, lint and verify, and exits non-zero on any error.
- `pnpm lesson new <course> <lesson-id>` scaffolds a lesson folder from a template.

### 5. Sample lesson

Write `content/fullstack/joins-01/lesson.mdoc` with at least one step of each implemented kind. It is the fixture for tests in E02 and E03.

## Acceptance criteria

- `pnpm lesson check` passes on the sample lesson and fails with a clear message, including file and line, on each of seven deliberately broken fixtures (one per lint rule).
- A missing required attribute is reported by Markdoc validation with a line number.
- A wrong declared output in a sample fails the check.
- No `any` in the codebase; CI enforces it.
- Unit test coverage of lint rules and the compiler layer is at least 90%.
- `README.md` explains how to add a new step kind in five steps or fewer.

## Pitfalls

- Markdoc's attribute validation is its own schema format, not Zod. Keep the two in sync by generating the Markdoc tag attributes from the Zod schema where practical, or by a test that compares them.
- Line numbers for annotations refer to the sample file, so the linter must check they exist.
- Keep markdown in `body` as markdown. Rendering is the player's job.
- Schema changes are breaking for agents. Bump `schemaVersion` on any breaking change.
