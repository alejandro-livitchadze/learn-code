import type { Config } from '@markdoc/markdoc';
import { CHILD_TAGS, KIND_TAGS } from './kinds';

export { CHILD_TAGS, FILE_ATTRIBUTES, KIND_TAGS } from './kinds';
export type { BuildContext, Fields, TagSpec } from './types';

/** Markdoc validation config: every step tag and every nested helper tag. */
export const markdocConfig: Config = {
  tags: Object.fromEntries(
    Object.entries({ ...KIND_TAGS, ...CHILD_TAGS }).map(([name, spec]) => [
      name,
      { attributes: spec.attributes },
    ]),
  ),
};
