# @learn-code/lesson-compiler

Compiles `lesson.mdoc` to a validated `Lesson` (see `@learn-code/lesson-schema`).

```ts
const result = compileLesson('content/fullstack/joins-01/lesson.mdoc');
if (!result.ok) result.errors.forEach((e) => console.error(formatError(e))); // file:line: message
```

## Markdoc maintenance status (checked 2026-10-02)

`@markdoc/markdoc` 0.5.10 was published 2026-09-16; releases 0.5.5 to 0.5.10 landed between March and September 2026. It is maintained, so the E01 stop condition does not apply.

## Adding a step kind

1. Add the Zod schema in `lesson-schema` and register it in the `step` union.
2. Add an entry to `KIND_TAGS` in `src/tags/kinds.ts` (attributes, allowed child tags, `build`).
3. Add any new nested helper tag to `CHILD_TAGS`.
4. Add the step to `src/__fixtures__/lesson.mdoc`. A test fails until every schema kind has a tag.

Nested tags (`option`, `blank`, ...) must start on their own line. Attributes named `code`, `template`, `starter`, `solution`, `badCode`, `goodCode`, `query`, `ddl`, `before`, `after` accept `./relative/file` references.
