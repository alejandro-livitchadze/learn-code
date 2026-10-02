# Tasks to insert into docs/backlog.md right before P9

## V1. UI package: tokens, fonts, page shell
- Status: todo
- Depends on: P8b
- Paths: `packages/ui/**`, `apps/web/**`, root
- Epic: E08 sections 2, 3, 7 and component Button, InkCard, StepTag, Highlight
- Done when: `packages/ui` exports tokens (CSS and typed), the four fonts via `next/font`, page shell (header, main, margin, footer) and the listed components; the dark theme is removed; the lesson page uses the shell; code lint CL1 and CL2 run in CI; catalogue shows each component; Playwright screenshots at 1280 and 1440 px are committed.

## V2. Margin schema, Markdoc tags, design lint
- Status: todo
- Depends on: V1
- Paths: `packages/lesson-schema/**`, `packages/lesson-compiler/**`, `content/**`
- Epic: E08 sections 5, 8 (lesson design lint) and 9
- Done when: `margin` and the title highlight are in the schema; Markdoc tags compile into them; rules DL1 to DL8 exist as pure functions with one failing fixture each; the sample lesson passes.

## V3. Characters and margin components
- Status: todo
- Depends on: V2
- Paths: `packages/ui/**`, `packages/widgets/**`, `apps/web/**`
- Epic: E08 sections 4 and 5
- Done when: The Bug, Olha and Mr. Runtime exist as SVG components; StickyNote, SpeechBubble, Gotcha, StopAndThink, FeedbackBanner, Annotation, MiniDiagram, ReviewCard, Cliffhanger, HintLadder are built and in the catalogue; the player renders `margin` items and the hook's left character column.

## V4. Restyle every existing widget and the sample lesson
- Status: todo
- Depends on: V3
- Paths: `packages/widgets/**`, `content/**`, `apps/web/**`
- Epic: E08 whole file; mockups A1 to A4
- Done when: every implemented widget, including `sqlLab`, uses only `packages/ui`; StepTag text follows section 6; no internal names are visible; the sample lesson is rewritten to use margin items and covers the situations in mockups A1 to A4; the reviewer's visual check against the mockups lists no deviation.

## Also change
- P9: `Depends on: V4`.
- Add to P9 and P10 "Done when": "built only from `packages/ui` components and tokens, following E08".
