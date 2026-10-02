import type { ReactNode } from 'react';

/** Inline: `code` and **bold**. Everything else is plain text. No HTML is ever injected. */
export function renderInline(text: string): readonly ReactNode[] {
  return text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((chunk, i) => {
    if (chunk.length > 2 && chunk.startsWith('`') && chunk.endsWith('`')) {
      return <code key={i}>{chunk.slice(1, -1)}</code>;
    }
    if (chunk.length > 4 && chunk.startsWith('**') && chunk.endsWith('**')) {
      return <strong key={i}>{chunk.slice(2, -2)}</strong>;
    }
    return chunk;
  });
}

/** A deliberately small markdown subset: paragraphs, `- ` lists, inline code and bold. */
export function Markdown({ text }: { readonly text: string }) {
  const blocks = text
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter((b) => b !== '');
  return (
    <div className="w-prose">
      {blocks.map((block, i) => {
        const lines = block.split('\n');
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
