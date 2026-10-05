import { describe, expect, it } from 'vitest';
import { splitTitle } from './title';

describe('splitTitle', () => {
  it('splits around the highlighted phrase', () => {
    expect(splitTitle('Why your JOIN lied', ['JOIN'])).toEqual({
      before: 'Why your ',
      mark: 'JOIN',
      after: ' lied',
    });
  });
  it('returns the whole title when there is no usable highlight', () => {
    expect(splitTitle('Plain title', undefined)).toEqual({ before: 'Plain title', after: '' });
    expect(splitTitle('Plain title', ['missing'])).toEqual({ before: 'Plain title', after: '' });
  });
});
