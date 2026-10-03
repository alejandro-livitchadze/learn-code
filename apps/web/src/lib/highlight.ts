import { codeToTokens, createCssVariablesTheme } from 'shiki';
import type { Lesson, Step } from '@learn-code/lesson-schema';
import type { HighlightedLines, HighlightMap } from '@learn-code/widgets';

export type { HighlightedLines, HighlightedToken, HighlightMap } from '@learn-code/widgets';

interface Block {
  readonly key: string;
  readonly code: string;
  readonly lang: 'ts' | 'js' | 'sql' | 'http';
}

function blocks(step: Step): readonly Block[] {
  switch (step.kind) {
    case 'explain':
      return step.code === undefined
        ? []
        : [{ key: `${step.id}:code`, code: step.code, lang: 'ts' as const }];
    case 'predict':
      return [{ key: `${step.id}:code`, code: step.code, lang: step.language }];
    case 'beTheRuntime':
      return [{ key: `${step.id}:code`, code: step.code, lang: step.language }];
    case 'fillBlanks':
      return [{ key: `${step.id}:template`, code: step.template, lang: step.language }];
    case 'pitfall': {
      const lang = step.language ?? ('ts' as const);
      return [
        ...(step.badCode === undefined
          ? []
          : [{ key: `${step.id}:badCode`, code: step.badCode, lang }]),
        ...(step.goodCode === undefined
          ? []
          : [{ key: `${step.id}:goodCode`, code: step.goodCode, lang }]),
      ];
    }
    default:
      return [];
  }
}

/**
 * Tokens carry `var(--shiki-token-*)` colors, never literal colors. The notebook maps those
 * variables to its own tokens in `packages/widgets/src/widgets.css` (light only, D15).
 */
const theme = createCssVariablesTheme({
  name: 'notebook',
  variablePrefix: '--shiki-',
  variableDefaults: {},
  fontStyle: true,
});

const KEYWORD = 'var(--shiki-token-keyword)';

/** Highlights every code block of a lesson once, at build time, on the server. */
export async function highlightLesson(l: Lesson): Promise<HighlightMap> {
  const entries = await Promise.all(
    l.steps.flatMap(blocks).map(async (b) => {
      const { tokens } = await codeToTokens(b.code, { lang: b.lang, theme });
      const lines: HighlightedLines = tokens.map((line) =>
        line.map((t) => {
          const word = t.color === KEYWORD && /[a-z]/i.test(t.content);
          // Word keywords are bold in the author's ink; operators stay plain ink.
          const color = t.color === KEYWORD && !word ? 'var(--shiki-foreground)' : t.color;
          return {
            content: t.content,
            style: {
              ...(color === undefined ? {} : { color }),
              ...(word ? { fontWeight: '600' } : {}),
            },
          };
        }),
      );
      return [b.key, lines] as const;
    }),
  );
  return Object.fromEntries(entries);
}
