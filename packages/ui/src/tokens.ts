/** Typed mirror of `tokens.css`. A test keeps the two in sync. */

export const colors = {
  paper: '#f7f3ea',
  rule: '#e4dccb',
  ink: '#1e1b16',
  'ink-muted': '#5b5446',
  'ink-faint': '#8a8270',
  card: '#ffffff',
  'margin-rule': '#b9ae97',
  author: '#2346a0',
  'author-strong': '#16306f',
  highlight: '#ffe45c',
  sticky: '#fff3a8',
  danger: '#c2410c',
  'danger-strong': '#9a3412',
  'danger-bg': '#fff7f0',
  bug: '#e8590c',
  success: '#1e6b34',
  'success-bg': '#e6f4ea',
  'disabled-bg': '#cfc6b3',
  'disabled-ink': '#4a4436',
} as const;

export type ColorToken = keyof typeof colors;

export const spacing = [4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 32, 40, 48] as const;
export type Spacing = (typeof spacing)[number];

export const radii = { card: 10, chip: 8, bubble: 18, label: 4 } as const;

export const shadows = {
  hard: '4px 4px 0 var(--ink)',
  primary: '4px 4px 0 var(--bug)',
  soft: '0 6px 14px rgba(30, 27, 22, 0.18)',
} as const;

export const borders = { width: 2.5, thin: 2 } as const;

export const layout = { pageMax: 1344, marginWidth: 280, minViewport: 1024 } as const;

/** CSS custom property reference for a color token, for inline styles. */
export function color(token: ColorToken): string {
  return `var(--${token})`;
}

/** Exactly four families (E08 section 2). */
export const fontRoles = {
  display: 'Bricolage Grotesque',
  body: 'Atkinson Hyperlegible',
  hand: 'Caveat',
  mono: 'JetBrains Mono',
} as const;
export type FontRole = keyof typeof fontRoles;
