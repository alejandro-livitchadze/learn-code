# E02. Lesson Player

Read `00-context.md` first. Depends on E01 (step tree and types).

## Goal

A Next.js site that plays a compiled lesson one step at a time, on a desktop browser, and remembers progress.

## Scope

In scope: routes, the player shell, navigation and gating, progress persistence, event log, theme and typography, annotated code rendering.

Out of scope: the widgets themselves (E03), running code (E04), accounts.

## Design

### Routes

- `/` lists courses and lessons with progress.
- `/[course]/[lesson]` plays a lesson. A server component loads the compiled JSON and passes it to a client `LessonPlayer`.
- `/dev/widgets` is a catalogue page used in E03.

Lessons are static: use `generateStaticParams` over `dist/lessons`.

### Player state

A reducer, pure and unit-tested.

```ts
type StepResult =
  | { readonly status: 'viewed' }
  | { readonly status: 'answered'; readonly correct: boolean; readonly attempts: number; readonly payload: unknown };

interface PlayerState {
  readonly lessonId: string;
  readonly index: number;
  readonly results: Readonly<Record<string, StepResult>>;
}

type PlayerAction =
  | { readonly type: 'complete'; readonly stepId: string; readonly result: StepResult }
  | { readonly type: 'next' }
  | { readonly type: 'back' }
  | { readonly type: 'restore'; readonly state: PlayerState };
```

Rules:

- `next` is ignored while the current step is active and has no result.
- Passive steps complete on view.
- `back` is always allowed. Returning to a completed step shows it in its answered state.

`payload` is `unknown` on purpose: each widget validates its own payload with Zod when restoring.

### Progress

```ts
interface ProgressStore {
  load(lessonId: string): Promise<PlayerState | null>;
  save(state: PlayerState): Promise<void>;
  listCompleted(courseId: string): Promise<readonly string[]>;
}
```

Milestone 1 ships `LocalStorageProgressStore`. All reads and writes are wrapped in `try/catch`, and corrupted data is discarded. A server-backed implementation replaces it later without touching the player.

### Event log

Every transition emits a typed event (`step_viewed`, `step_answered`, `hint_used`, `lesson_completed`) to an `EventSink` interface. Milestone 1 uses a console sink. The log exists now so that per-step drop-off analytics can be added without changing widgets.

### Step rendering

The player looks up a component by `step.kind` in a registry exported by `packages/widgets`:

```ts
interface StepComponentProps<TStep extends Step> {
  readonly step: TStep;
  readonly restored: StepResult | undefined;
  readonly onComplete: (result: StepResult) => void;
}
```

Until E03 delivers real widgets, a placeholder renders the step JSON.

### Layout and navigation

- Desktop only (D11): below 1024 px the page shows a short notice instead of the player.
- One step per screen, a progress bar with one segment per step, and a single primary button.
- Keyboard: Enter for the primary action, arrow keys for back and next.
- Transitions under 200 ms. Respect `prefers-reduced-motion`.
- Focus moves to the new step heading on every transition.

### Look

- Three font roles: body, monospace, handwritten (for annotations and character speech). Load with `next/font`.
- Light and dark themes through CSS variables.
- Syntax highlighting with Shiki at build time on the server.
- Annotated code: each annotation is anchored to a line and drawn as a handwritten note with an arrow in the margin.

## Tasks

1. Create `apps/web` with the routes above and the static lesson loader.
2. Implement the reducer and its tests.
3. Implement `ProgressStore` and `EventSink` with their first implementations.
4. Build the shell: progress bar, primary button, keyboard handling, focus management.
5. Implement `AnnotatedCode`.
6. Set up theme, fonts and base styles.
7. Add a Playwright smoke test that plays the sample lesson to the end at 1280 px width.

## Acceptance criteria

- The sample lesson from E01 plays from first step to last at 1024 px and 1440 px width.
- Reloading the page restores the exact step and earlier answers.
- An active step cannot be skipped by button, keyboard or URL.
- Lighthouse performance and accessibility are both at least 90 on the lesson page.
- The reducer has full branch coverage.

## Pitfalls

- Later, lesson pages that run code need cross-origin isolation headers (see E04). Keep header configuration per route, so the home page and future embeds are not affected.
- Do not store the lesson JSON in `localStorage`, only results.
- Server components cannot touch `localStorage`. Keep the player a client boundary and everything above it on the server.
