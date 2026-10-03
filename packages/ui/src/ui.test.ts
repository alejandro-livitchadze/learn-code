import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { Highlight, MAX_HIGHLIGHT_WORDS, wordCount } from './Highlight';
import { STEP_TAGS, stepTagText } from './StepTag';
import { colors, spacing } from './tokens';

const css = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8');

describe('tokens', () => {
  it('every typed color equals its CSS custom property', () => {
    for (const [name, value] of Object.entries(colors)) {
      const m = new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6});`).exec(css);
      expect(m?.[1]?.toLowerCase(), name).toBe(value);
    }
  });

  it('every CSS color custom property has a typed twin', () => {
    const declared = [...css.matchAll(/--([a-z-]+):\s*#[0-9a-fA-F]{6};/g)].map((m) => m[1]);
    expect(declared.sort()).toEqual(Object.keys(colors).sort());
  });

  it('the spacing scale matches the CSS spacing variables', () => {
    const declared = [...css.matchAll(/--space-(\d+):\s*(\d+)px;/g)].map((m) => Number(m[2]));
    expect(declared).toEqual([...spacing]);
  });

  it('defines no dark theme', () => {
    expect(css).not.toContain('prefers-color-scheme');
    expect(css).toContain('color-scheme: light;');
  });
});

describe('StepTag vocabulary', () => {
  it('has no tag for hook, cliffhanger or unknown kinds', () => {
    expect(stepTagText('hook')).toBeNull();
    expect(stepTagText('cliffhanger')).toBeNull();
    expect(stepTagText('toString')).toBeNull();
  });

  it('uses the fixed texts', () => {
    expect(stepTagText('predict')).toBe('Predict');
    expect(stepTagText('sqlLab')).toBe('Your turn');
    expect(stepTagText('beTheDatabase')).toBe('You are the machine');
    expect(Object.keys(STEP_TAGS)).toHaveLength(15);
  });
});

describe('Highlight', () => {
  it('counts words', () => {
    expect(wordCount('  one  two\nthree ')).toBe(3);
    expect(wordCount('')).toBe(0);
    expect(MAX_HIGHLIGHT_WORDS).toBe(6);
  });
});

describe('Highlight component', () => {
  it('drops the stroke for phrases over six words', () => {
    expect(Highlight({ children: 'one two three four five six seven' })).toBe(
      'one two three four five six seven',
    );
    expect(Highlight({ children: 'two words' })).toMatchObject({ type: 'mark' });
  });
});
