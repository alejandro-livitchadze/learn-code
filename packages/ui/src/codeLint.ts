/**
 * Code lint rules CL1 and CL2 (E08 section 8). Pure: they take a path and its text and
 * return violations. `scripts/code-lint.ts` runs them over the repository.
 *
 * - CL1: no hex, `rgb(`, `hsl(` literals, `font-family` or `box-shadow` outside `packages/ui`.
 * - CL2: no imports of fonts outside `packages/ui`.
 */

export interface Violation {
  readonly rule: 'CL1' | 'CL2';
  readonly file: string;
  readonly line: number;
  readonly message: string;
}

const SOURCE_EXT = /\.(?:css|ts|tsx|js|jsx|mjs|cjs|mts|cts)$/;

/**
 * Files outside `packages/ui` that still hold pre-notebook styles. Task V4 restyles the
 * widgets and must empty this list. Nothing else may be added to it.
 */
export const LEGACY_EXEMPT: readonly string[] = [
  'packages/widgets/src/widgets.css',
  'packages/widgets/src/sql-lab/styles.ts',
];

const CL1_PATTERNS: readonly { readonly re: RegExp; readonly what: string }[] = [
  {
    re: /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})(?![\w-])/,
    what: 'hex color literal',
  },
  { re: /\brgba?\(/i, what: 'rgb() color literal' },
  { re: /\bhsla?\(/i, what: 'hsl() color literal' },
  { re: /\bfont-family\b|\bfontFamily\b/, what: 'font-family declaration' },
  { re: /\bbox-shadow\b|\bboxShadow\b/, what: 'box-shadow declaration' },
];

const CL2_PATTERNS: readonly { readonly re: RegExp; readonly what: string }[] = [
  {
    re: /(?:from\s*|import\s*\(\s*|import\s+|require\s*\(\s*)['"](?:next\/font(?:\/[\w-]+)?|@fontsource(?:-variable)?\/[^'"]*)['"]/,
    what: 'font import',
  },
  { re: /@font-face\b/, what: '@font-face rule' },
  {
    re: /(?:from\s*|import\s*\(\s*|import\s+|require\s*\(\s*|@import\s+(?:url\()?)['"]?[^'")\s]*\.(?:woff2?|ttf|otf)\b/,
    what: 'font file import',
  },
  {
    re: /@import\s+(?:url\()?['"]?https?:\/\/fonts\.(?:googleapis|gstatic)\.com/,
    what: 'web font import',
  },
];

function normalize(path: string): string {
  return path.replaceAll('\\', '/').replace(/^\.\//, '');
}

export function isLinted(path: string): boolean {
  const p = normalize(path);
  return SOURCE_EXT.test(p) && !p.startsWith('packages/ui/') && !LEGACY_EXEMPT.includes(p);
}

/** Violations of CL1 and CL2 in one file. Files inside `packages/ui` and legacy files pass. */
export function lintFile(path: string, text: string): readonly Violation[] {
  const file = normalize(path);
  if (!isLinted(file)) return [];
  const found: Violation[] = [];
  text.split('\n').forEach((lineText, i) => {
    for (const { re, what } of CL1_PATTERNS) {
      if (re.test(lineText)) {
        found.push({ rule: 'CL1', file, line: i + 1, message: `${what} outside packages/ui` });
      }
    }
    for (const { re, what } of CL2_PATTERNS) {
      if (re.test(lineText)) {
        found.push({ rule: 'CL2', file, line: i + 1, message: `${what} outside packages/ui` });
      }
    }
  });
  return found;
}
