import type { Node, SchemaAttribute } from '@markdoc/markdoc';

export type Fields = Record<string, unknown>;

/** What a kind builder can use to turn a tag node into a plain step object. */
export interface BuildContext {
  readonly node: Node;
  /** Attributes of the node, with `./file` references already resolved. */
  readonly attrs: Readonly<Record<string, unknown>>;
  /** Markdown of the node's non-tag content. */
  body(): string;
  /** Direct child tags with the given name, in order. */
  kids(name: string): readonly Node[];
  /** Build context for a child node (attributes resolved, same rules). */
  child(node: Node): BuildContext;
}

export interface TagSpec {
  readonly attributes: Record<string, SchemaAttribute>;
  /** Names of tags allowed directly inside this one. Empty means none. */
  readonly children: readonly string[];
  readonly build: (c: BuildContext) => Fields;
}
