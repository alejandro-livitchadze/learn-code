import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export const lessonTemplate = (course: string, id: string): string => `---
id: ${id}
courseId: ${course}
title: "TODO title"
concepts: [todo-concept]
---

{% hook id="h1" estSeconds=40 character="bug" concepts=["todo-concept"] %}
TODO: a short production story that creates the problem.
{% /hook %}

{% predict id="p1" estSeconds=60 language="sql" code="select 1" concepts=["todo-concept"] %}
{% option output="1" correct=true %}
TODO: why this is right.
{% /option %}
{% option output="0" misconception="todo-misconception" %}
TODO: why this is wrong.
{% /option %}
{% /predict %}

{% explain id="e1" estSeconds=45 code="select 1" concepts=["todo-concept"] %}
TODO: short text.

{% annotation line=1 %}
TODO: note.
{% /annotation %}
{% /explain %}

{% brainPower id="b1" estSeconds=60 question="TODO question?" concepts=["todo-concept"] %}
TODO: explanation shown after the learner answers.
{% /brainPower %}

{% matching id="m1" estSeconds=45 prompt="TODO" concepts=["todo-concept"] %}
{% pair left="TODO a" right="TODO b" /%}
{% pair left="TODO c" right="TODO d" /%}
{% /matching %}

{% fillBlanks id="f1" estSeconds=60 template="select ___x___" language="sql" concepts=["todo-concept"] %}
{% blank id="x" accepted=["1"] %}
TODO: feedback.
{% /blank %}
{% /fillBlanks %}

{% brainPower id="b2" estSeconds=60 question="TODO second question?" concepts=["todo-concept"] %}
TODO: explanation.
{% /brainPower %}

{% recap id="rc1" estSeconds=30 concepts=["todo-concept"] %}
{% point %}
TODO point one.
{% /point %}
{% point %}
TODO point two.
{% /point %}
{% point %}
TODO point three.
{% /point %}
{% /recap %}
`;

/** Create `<contentRoot>/<course>/<lessonId>/` from the template. Returns the lesson file path. */
export function scaffoldLesson(contentRoot: string, course: string, lessonId: string): string {
  for (const [label, value] of [
    ['course', course],
    ['lesson id', lessonId],
  ] as const) {
    if (!KEBAB.test(value)) throw new Error(`${label} "${value}" must be kebab-case`);
  }
  const lessonDir = join(contentRoot, course, lessonId);
  const file = join(lessonDir, 'lesson.mdoc');
  if (existsSync(file)) throw new Error(`${file} already exists`);
  mkdirSync(join(lessonDir, 'samples'), { recursive: true });
  mkdirSync(join(lessonDir, 'seeds'), { recursive: true });
  writeFileSync(join(lessonDir, 'samples', '.gitkeep'), '');
  writeFileSync(join(lessonDir, 'seeds', '.gitkeep'), '');
  writeFileSync(file, lessonTemplate(course, lessonId));
  const registry = join(contentRoot, course, 'registry');
  mkdirSync(registry, { recursive: true });
  for (const name of ['concepts.json', 'misconceptions.json']) {
    const f = join(registry, name);
    if (!existsSync(f)) writeFileSync(f, '[]\n');
  }
  return file;
}
