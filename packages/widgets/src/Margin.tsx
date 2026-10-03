import type { MarginItem, Step } from '@learn-code/lesson-schema';
import {
  Gotcha,
  MiniDiagram,
  Speaker,
  StickyNote,
  StopAndThink,
  type CharacterName,
} from '@learn-code/ui';
import { diagramFor } from './diagrams';
import { Markdown, renderInline } from './markdown';

function MarginEntry({ item }: { readonly item: MarginItem }) {
  switch (item.type) {
    case 'sticky':
      return (
        <StickyNote label={item.label === 'asks' ? 'Olha asks' : 'Olha says'}>
          {item.text}
        </StickyNote>
      );
    case 'bubble': {
      const who: CharacterName = item.who === 'bug' ? 'bug' : 'runtime';
      return <Speaker who={who}>{renderInline(item.text)}</Speaker>;
    }
    case 'gotcha':
      return <Gotcha>{renderInline(item.text)}</Gotcha>;
    case 'stopAndThink':
      return <StopAndThink>{renderInline(item.text)}</StopAndThink>;
    case 'diagram': {
      const elements = diagramFor(item.ref);
      // An unknown ref never shows its id to the learner; the caption alone is shown.
      return elements === undefined ? (
        <MiniDiagram elements={[]} caption={item.caption} />
      ) : (
        <MiniDiagram elements={elements} caption={item.caption} />
      );
    }
    default: {
      const never: never = item;
      return never;
    }
  }
}

/** The margin items of one step, in order. Renders nothing for an empty list. */
export function MarginItems({ items }: { readonly items: readonly MarginItem[] | undefined }) {
  if (items === undefined || items.length === 0) return null;
  return (
    <>
      {items.map((item, i) => (
        <MarginEntry key={i} item={item} />
      ))}
    </>
  );
}

/** The Bug (or another character) and its bubble, for the left column of a hook step. */
export function HookColumn({
  character,
  children,
}: {
  readonly character: 'bug' | 'olha' | 'mrRuntime' | undefined;
  readonly children: React.ReactNode;
}) {
  const who: CharacterName =
    character === 'olha' ? 'olha' : character === 'mrRuntime' ? 'runtime' : 'bug';
  return <Speaker who={who}>{children}</Speaker>;
}

/** Content of the player's left column for a `hook` step: the character saying the hook. */
export function HookLead({ step }: { readonly step: Extract<Step, { kind: 'hook' }> }) {
  return (
    <div data-kind="hook">
      <HookColumn character={step.character}>
        <Markdown text={step.body} />
      </HookColumn>
    </div>
  );
}
