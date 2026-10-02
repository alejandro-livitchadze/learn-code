# E08. Visual System: Notebook

Read `00-context.md` first. Depends on P8b. P9 and later widget tasks depend on this epic.

## Goal

Every lesson page looks like a page from a smart, funny notebook: ruled paper, ink, a highlighter, handwritten notes in the margin, sticky notes, and a small cast of characters. The look must be produced by a fixed set of tokens and components with strict usage rules, so that agents writing lessons and widgets cannot improvise styles.

## Reference mockups

`docs/design/mockups/` holds four approved screens of one lesson:

- `A1-predict.dc.html`: a `predict` step with a hook bubble, annotated code, a sticky note and margin boxes.
- `A2-Reveal.dc.html`: the reveal after answering, with a feedback banner and a row-multiplication diagram.
- `A3-SqlLab.dc.html`: an `sqlLab` step with editor, result, expected result, difference, hints and a schema panel.
- `A4-Recap.dc.html`: the recap with review cards, The Bug, and the next-lesson teaser.

They are design files, not app code: they will not run in the browser. Read their markup for exact sizes, spacing, colors and SVG paths. Where this file and a mockup disagree, this file wins.

## Decisions

- **D15. Light only.** The notebook look has one theme. The dark theme from E02 is removed. Code blocks stay light as in the mockups.
- **D16. Every visual decision comes from `packages/ui`.** Widgets and pages never declare their own colors, fonts, font sizes, radii or shadows. A literal hex color, `font-family` or `box-shadow` outside `packages/ui` is a lint error.

## 1. Principles

1. **Paper, not app.** The page is a notebook page. No gradients, glass, glow, blur or animated backgrounds.
2. **Ink means interactive.** A white card with a thick ink border is something the learner can act on or must read closely. Decoration never uses that treatment.
3. **Handwriting is the author's voice, never an instruction.** What the learner must do is always in print. Handwriting adds asides, hints and jokes.
4. **One idea per screen.** Decoration supports the idea of the step or it is removed.
5. **Meaningful color.** Every color has one job (section 2). A color is never used just because it looks nice.

## 2. Tokens

Defined once as CSS custom properties in `packages/ui/src/tokens.css` and exported as a typed object in `packages/ui/src/tokens.ts`.

### Colors and their only jobs

- `--paper: #F7F3EA` page background.
- `--rule: #E4DCCB` ruled lines on the page background.
- `--ink: #1E1B16` text, borders, primary button fill, table header fill.
- `--ink-muted: #5B5446` secondary text, hints in handwriting.
- `--ink-faint: #8A8270` line numbers, rows out of focus. Never for text the learner needs.
- `--card: #FFFFFF` surface of interactive and close-reading elements.
- `--margin-rule: #B9AE97` dashed line separating the margin; inactive hint buttons.
- `--author: #2346A0` the author's voice: handwritten annotations, step counter, links, SQL and JS keywords.
- `--author-strong: #16306F` hover of `--author`.
- `--highlight: #FFE45C` the single most important phrase or value; the selected answer before checking.
- `--sticky: #FFF3A8` Olha's sticky notes; rows of focus in data tables.
- `--danger: #C2410C` mistakes, gotchas, wrong results (borders and large handwriting).
- `--danger-strong: #9A3412` danger labels and headers.
- `--danger-bg: #FFF7F0` background of danger boxes.
- `--bug: #E8590C` The Bug's body and the hard shadow of the primary button. Never text.
- `--success: #1E6B34` correct-answer icon and text.
- `--success-bg: #E6F4EA` correct-answer banner.
- `--disabled-bg: #CFC6B3`, `--disabled-ink: #4A4436` disabled controls.

### Typography roles

Exactly four families, loaded with `next/font`. No other family may appear.

- **Display: Bricolage Grotesque 800.** The lesson title (44 px, line height 1.05) and module titles on the home page. Nothing else.
- **Body: Atkinson Hyperlegible 400 and 700.** All prose, questions, buttons and labels.
  - Question or task: 21 to 24 px, 700.
  - Main prose: 19 to 22 px, line height 1.45 to 1.55, at most 72 characters per line.
  - Margin prose: 16 to 17 px.
  - Labels: 14 to 15 px, 700, uppercase, letter spacing 0.08 to 0.1 em.
- **Hand: Caveat 500 and 700.** Only the author's or a character's asides. Minimum 20 px. At most 25 words per piece. Never used for: instructions, answer options, feedback that decides progress, code, numbers the learner must read exactly.
- **Mono: JetBrains Mono 400 and 600.** Code (18 px, line height 1.85 to 1.9), table data (15 px), identifiers in prose, file names.

### Shape, space and depth

- Borders: `--border: 2.5px solid var(--ink)`; thin variant 2px for small chips and schema cards.
- Radii: cards 10 px, tables and small chips 8 px, speech bubbles 18 px, labels 4 px.
- Hard shadow: `4px 4px 0 var(--ink)` for lifted elements; `4px 4px 0 var(--bug)` only on the primary button.
- Soft shadow: `0 6px 14px rgba(30, 27, 22, 0.18)` only on sticky notes.
- Rotation: only sticky notes and the cliffhanger card, between −2° and 2°.
- Spacing scale: 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 32, 40, 48 px.

## 3. Page layout

- **Page:** ruled paper background over the full viewport; content max width 1344 px; padding 32 px top, 48 px sides and bottom. Minimum viewport 1024 px (D11).
- **Header:** module label (uppercase link), lesson title with at most one highlighted phrase, step counter in hand (`step N of M`) on the right. 3 px ink rule below.
- **Body:** a flex row with
  - **main column** (`flex: 999 1 640px`): the step's content;
  - **margin** (260 to 300 px, 2 px dashed `--margin-rule` on its left, 24 px padding): margin items only (section 5);
  - **left character column** (240 to 260 px): only on `hook` steps, holding The Bug and its bubble. On other steps characters live in the margin.
- **Footer:** 3 px ink rule above; secondary "Back" left; one primary button right, with an optional handwritten hint before it ("press Enter to lock it in").

## 4. Components

Each component lives in `packages/ui` with a story on the catalogue page. "Never" rules are lint or review blockers.

- **InkCard.** White, ink border, 10 px radius. States: default, lifted (hard shadow), selected (highlight fill and hard shadow). Use for answer options, editors, tables, review cards, schema cards. Never for decorative or passive text.
- **Button.** Primary: ink fill, paper text, 700, hard `--bug` shadow; exactly one per screen. Secondary: transparent with ink border. Disabled: disabled tokens, no shadow. Minimum height 44 px.
- **StepTag.** Ink label, paper text, uppercase. One per step, text from the fixed vocabulary in section 6.
- **Highlight.** Highlighter stroke behind text (55% to 90% of line height). At most one in a heading, at most two per step, never on more than six words.
- **Annotation.** Handwritten note in `--author` with a hand-drawn arrow pointing at one code line. At most 3 per code block, at most 8 words each, placed to the right of the code. Never repeats what the code says; it says why it matters.
- **StickyNote.** `--sticky` background, slight rotation, soft shadow, uppercase label ("OLHA ASKS" or "OLHA") and handwritten text. Only Olha speaks in sticky notes.
- **SpeechBubble.** White, ink border, 18 px radius, hard shadow, body font. Only The Bug and Mr. Runtime speak in bubbles, next to their drawing.
- **Gotcha.** Danger border and background, label "GOTCHA" in `--danger-strong`, body text. A common mistake and its consequence.
- **StopAndThink.** Lightbulb icon and label "STOP AND THINK", then one open question. Never contains the answer.
- **FeedbackBanner.** Full width of the main column, ink border and hard shadow. Correct: `--success-bg`, check icon, one bold sentence plus one explanation sentence. Wrong: `--danger-bg`, the feedback for the chosen option. Appears after an answer, at the top of the main column.
- **DataTable.** Ink header row with paper text, mono 15 px rows. Rows in focus: `--sticky` fill or Highlight on cells. Rows out of focus: `--ink-faint` text. Expected results use the danger border; mismatched column names get a wavy underline.
- **MiniDiagram.** Built from InkCards, mono chips and hand-drawn arrows, at most 8 elements, with one handwritten caption.
- **ReviewCard.** InkCard, lifted, question in body font, due time in hand ("in 3 days").
- **Cliffhanger.** Ink background, paper text, handwritten "Next time…" in `--highlight`, rotated −1.5°.
- **HintLadder.** Three stacked buttons: available hint as a secondary button, locked hints dashed in `--margin-rule`.

## 5. Margin items and characters

### Limits per step

- At most **3 margin items**.
- At most **1 character** speaking.
- At most **1 Gotcha** and at most **1 StopAndThink**.
- A margin item never repeats the main column; it adds a doubt, a warning, a hint, or a joke.

### The cast

- **The Bug.** Orange beetle (exact SVG paths in `A1-predict.dc.html`), proud mischief-maker, always the cause of the incident. Appears only in `hook`, `pitfall`, `recap` and `cliffhanger` steps, in a SpeechBubble. At most 20 words. Never explains a concept.
- **Olha.** Junior developer. Voices the learner's likely doubt or realization, in a StickyNote, in the margin. At most 20 words, written as a question or a short "oh" moment. At most every other step.
- **Mr. Runtime.** Grumpy clerk who executes rules literally. Appears only in `beTheRuntime`, `beTheDatabase` and steps showing an execution ledger, in a SpeechBubble. States a rule; never jokes about the learner.

Characters are React SVG components with an `aria-label`. Poses and expressions are added only by tasks that ask for them.

## 6. Copy rules

- **StepTag vocabulary** by step kind: `hook` none (the Bug's bubble opens the step), `predict` "Predict", `reveal` "What really happened", `explain` "Here's the thing", `fillBlanks` and `sqlLab` and `bugHunt` "Your turn", `parsons` "Put it in order", `firesideChat` "Who's right?", `brainPower` "Stop and think", `matching` "Match them up", `pitfall` "Gotcha", `recall` "Remember this?", `recap` "Pin this to your brain", `beTheRuntime` and `beTheDatabase` "You are the machine".
- **Buttons:** "Lock in answer" (choice steps), "Run · Ctrl+Enter" (code), "Reset database", "Continue", "Back", "Next lesson: <short title>".
- **Never shown to learners:** internal kind names, ids, "placeholder", "not built yet".
- **Humor** is situational (Friday deploys, finance panicking), never at the learner's expense.

## 7. Accessibility

- Text contrast at least 4.5:1, or 3:1 for text 24 px and larger. `--ink-faint` is never used for required text.
- Visible focus on every control: 3 px `--author` outline with 2 px offset.
- Real `button`, `a` and `input` elements; SVG characters and icons have `aria-label` or `aria-hidden`.
- Rotation and entrance animations respect `prefers-reduced-motion`.

## 8. Enforcement

### Lesson design lint (extends E01's linter)

- **DL1** at most 3 margin items per step.
- **DL2** at most 1 character per step.
- **DL3** The Bug only in `hook`, `pitfall`, `recap`, `cliffhanger`.
- **DL4** Mr. Runtime only in `beTheRuntime`, `beTheDatabase`.
- **DL5** word limits: sticky and bubble 20, gotcha 30, stop-and-think 25, annotation 8.
- **DL6** at most 3 annotations per code block.
- **DL7** highlights: at most 1 in the title, at most 2 per step, at most 6 words each.
- **DL8** at most 1 gotcha and 1 stop-and-think per step.

### Code lint

- **CL1** no hex, `rgb(`, `hsl(` literals, `font-family` or `box-shadow` outside `packages/ui`.
- **CL2** no imports of fonts outside `packages/ui`.

### Visual review

Playwright captures the catalogue page and the sample lesson at 1280 px and 1440 px. The reviewer compares them against the mockups and this file, item by item, and lists every deviation as a blocker.

## 9. Schema additions

Every step may carry `margin`:

```ts
type MarginItem =
  | { readonly type: 'sticky'; readonly who: 'olha'; readonly label: 'asks' | 'says'; readonly text: string }
  | { readonly type: 'bubble'; readonly who: 'bug' | 'runtime'; readonly text: string }
  | { readonly type: 'gotcha'; readonly text: string }
  | { readonly type: 'stopAndThink'; readonly text: string }
  | { readonly type: 'diagram'; readonly ref: string; readonly caption: string };
```

The lesson title may mark one phrase to highlight. Markdoc tags: `{% margin %}` containing `{% sticky %}`, `{% bubble %}`, `{% gotcha %}`, `{% stop %}`, `{% diagram %}`.
