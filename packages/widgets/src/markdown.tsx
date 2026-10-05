import type { ReactNode } from 'react';
import { Highlight } from '@learn-code/ui';

/**
 * The one Markdown contract (see packages/lesson-compiler/README.md, "Markdown subset").
 * Blocks: paragraphs, `- ` lists, fenced code. Inline: `code`, **bold**, *italic*,
 * [text](http or https url), ==highlight==. The lint rule `markdown-subset` rejects everything else.
 * No HTML is ever injected.
 */

const INLINE = /(`[^`]+`|==[^=\n]+==|\*\*[^*]+\*\*|\*[^*\s][^*]*\*|\[[^\]]+\]\([^)\s]+\))/g;
const LINK = /^\[([^\]]+)\]\(([^)\s]+)\)$/;

/** Only http and https links become anchors. Anything else is shown as its label. */
export function safeHref(url: string): string | undefined {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.href : undefined;
  } catch {
    return undefined;
  }
}

export function renderInline(text: string): readonly ReactNode[] {
  return text.split(INLINE).map((chunk, i) => {
    if (chunk.length > 2 && chunk.startsWith('`') && chunk.endsWith('`')) {
      return <code key={i}>{chunk.slice(1, -1)}</code>;
    }
    if (chunk.length > 4 && chunk.startsWith('==') && chunk.endsWith('==')) {
      return <Highlight key={i}>{chunk.slice(2, -2).trim()}</Highlight>;
    }
    if (chunk.length > 4 && chunk.startsWith('**') && chunk.endsWith('**')) {
      return <strong key={i}>{chunk.slice(2, -2)}</strong>;
    }
    if (chunk.length > 2 && chunk.startsWith('*') && chunk.endsWith('*')) {
      return <em key={i}>{chunk.slice(1, -1)}</em>;
    }
    const link = LINK.exec(chunk);
    if (link !== null) {
      const label = link[1] ?? '';
      const href = safeHref(link[2] ?? '');
      return href === undefined ? (
        label
      ) : (
        <a key={i} href={href} rel="noreferrer">
          {label}
        </a>
      );
    }
    return chunk;
  });
}

type Block =
  | { readonly kind: 'code'; readonly text: string }
  | { readonly kind: 'text'; readonly lines: readonly string[] };

const FENCE = /^\s*```/;

function parseBlocks(text: string): readonly Block[] {
  const blocks: Block[] = [];
  let para: string[] = [];
  const flush = (): void => {
    if (para.length > 0) blocks.push({ kind: 'text', lines: para });
    para = [];
  };
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';
    if (FENCE.test(line)) {
      flush();
      const body: string[] = [];
      i++;
      while (i < lines.length && !FENCE.test(lines[i] ?? '')) {
        body.push(lines[i] ?? '');
        i++;
      }
      blocks.push({ kind: 'code', text: body.join('\n') });
    } else if (line.trim() === '') {
      flush();
    } else {
      para.push(line.trim());
    }
  }
  flush();
  return blocks;
}

export function Markdown({ text }: { readonly text: string }) {
  return (
    <div className="w-prose">
      {parseBlocks(text).map((block, i) => {
        if (block.kind === 'code') {
          return (
            <pre key={i}>
              <code>{block.text}</code>
            </pre>
          );
        }
        const lines = block.lines;
        if (lines.every((l) => l.startsWith('- '))) {
          return (
            <ul key={i}>
              {lines.map((l, j) => (
                <li key={j}>{renderInline(l.slice(2))}</li>
              ))}
            </ul>
          );
        }
        return <p key={i}>{renderInline(lines.join(' '))}</p>;
      })}
    </div>
  );
}
