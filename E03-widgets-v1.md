# E03. Widget Library v1

Read `00-context.md` first. Depends on E01 (types) and E02 (`StepComponentProps`, player shell).

## Goal

One React component per step kind, each restorable from saved progress, and listed in a catalogue page.

## Scope

In scope: all step kinds that need no code execution.

Out of scope: `sqlLab` (E04, part A), `bugHunt` and `apiLab` (E04, part B, postponed), `reveal` and `beTheRuntime` visualizations (a later epic).

## Common rules

- Every widget implements `StepComponentProps<TStep>` from E02.
- Widgets are controlled by their step data. No widget fetches anything.
- A widget calls `onComplete` exactly once per successful completion and can render itself from `restored`.
- A wrong answer never ends the step. The learner sees the feedback for that option and tries again. `attempts` is counted.
- Everything works with a keyboard and with a mouse. Drag-and-drop always has a keyboard alternative. Touch is out of scope (D11).
- Registry with a compile-time completeness check:

```ts
type StepOfKind<K extends Step['kind']> = Extract<Step, { kind: K }>;

type WidgetRegistry = {
  readonly [K in Step['kind']]: React.ComponentType<StepComponentProps<StepOfKind<K>>>;
};
```

Adding a step kind to the schema without a widget must fail type checking.

## Widgets

Ordered by value for effort. Build in this order.

### 1. `Hook`, `Explain`, `Recap`, `Cliffhanger`, `Pitfall` (passive)

- Character avatar with a speech bubble for `hook` and `pitfall`.
- `Explain` uses `AnnotatedCode` from E02. Annotations appear one by one on click or key press.
- `Recap` bullets appear one at a time.

### 2. `Predict`

- Shows code and two to four possible outputs.
- On selection: show that option's feedback. A wrong option also names the misconception in plain words.
- After the correct answer, offer "Run it" which reveals the real output (precomputed in the step data).

### 3. `Parsons`

- Shuffled lines on the left, the solution area on the right.
- Supports distractor lines that do not belong, and optional indentation levels.
- Use `dnd-kit` with its keyboard sensor. Use this widget for ordering the stages of a process, not for ordinary code: the audience is experienced and prefers typing.
- Check order and indentation. Feedback highlights the first wrong line only, so the learner still has to think.

### 4. `FillBlanks`

- Code with gaps. Each gap is either a short text input or a choice from options.
- Comparison ignores whitespace. Each gap may list several accepted answers.

### 5. `FiresideChat`

- A messenger-style thread between two concepts, each with an avatar.
- Messages appear one by one. At marked points the learner chooses who is right or what the next reply should be.

### 6. `BrainPower`

- An open question and a text area. The explanation stays hidden until the learner writes at least a minimum number of characters.
- Milestone 1 has no AI grading. After submitting, the learner sees a model answer and marks their own as "got it", "partly" or "missed it". That self-rating is the result.

### 7. `Matching`

- Two columns. Click one item on each side to connect them. Wrong pairs shake and separate.

### 8. `Recall`

- Two or three quick questions (single choice or `FillBlanks`-style) taken from earlier lessons. Reuses the components above.

## Catalogue page

`/dev/widgets` renders every widget with two or three fixture steps: a normal case, a long-content case and a restored case. It is the review surface for the author and the target of visual tests.

## Tasks

1. Implement the registry and the completeness type.
2. Build widgets in the order above, each with fixtures and unit tests for its checking logic.
3. Keep checking logic in pure functions separate from components (`checkParsons(step, answer)`), so the linter in E01 can reuse them to verify that the reference answer is accepted.
4. Add Playwright tests for the catalogue at 1024 px and 1440 px width.

## Acceptance criteria

- Every non-execution step kind renders in the catalogue and in the sample lesson.
- Every active widget can be completed using only the keyboard.
- Restoring a completed step shows the answered state without calling `onComplete` again.
- Checking functions have unit tests including whitespace and alternative-answer cases.
- No layout overflow at 1024 px width.

## Pitfalls

- Shuffle deterministically from the step id, so a reload does not reorder a half-finished Parsons problem.
- Long code lines: scroll inside the code block, never the page.
- Do not put the correct answer in a DOM attribute where it is trivially visible. It will still be in the JSON, which is acceptable for a free course.
