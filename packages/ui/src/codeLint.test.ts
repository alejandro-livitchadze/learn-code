import { describe, expect, it } from 'vitest';
import { lintFile } from './codeLint';

const rules = (path: string, text: string) => lintFile(path, text).map((v) => v.rule);

describe('CL1', () => {
  it.each([
    'a { color: #fff; }',
    'a { color: #1E1B16; }',
    'a { color: #12345678; }',
    'a { color: rgb(1, 2, 3); }',
    'a { color: RGBA(1, 2, 3, 0.5); }',
    'a { color: hsl(10 20% 30%); }',
    'a { font-family: serif; }',
    'a { box-shadow: none; }',
    "const s = { fontFamily: 'x' };",
    "const s = { boxShadow: 'x' };",
  ])('flags %s outside packages/ui', (text) => {
    expect(rules('apps/web/app/x.css', text)).toEqual(['CL1']);
  });

  it('allows anchors, ids and token references', () => {
    expect(rules('apps/web/a.tsx', "href={`#${id}`} id={`c-${x}`} href='#predict-idle'")).toEqual(
      [],
    );
    expect(rules('apps/web/a.tsx', "'#c-intro'")).toEqual([]);
    expect(
      rules('apps/web/a.css', 'a { color: var(--ink); font: 18px var(--font-mono); }'),
    ).toEqual([]);
  });

  it('reports file and line', () => {
    expect(lintFile('apps/web/a.css', 'a {}\nb { color: #abc; }')).toEqual([
      {
        rule: 'CL1',
        file: 'apps/web/a.css',
        line: 2,
        message: 'hex color literal outside packages/ui',
      },
    ]);
  });

  it('passes everything inside packages/ui and ignores other file types', () => {
    expect(rules('packages/ui/src/tokens.css', ':root { --a: #fff; font-family: x; }')).toEqual([]);
    expect(rules('docs/x.md', '#fff rgb(')).toEqual([]);
  });
});

describe('CL2', () => {
  it.each([
    "import localFont from 'next/font/local';",
    "import { Inter } from 'next/font/google';",
    "import '@fontsource/caveat/500.css';",
    "import '@fontsource-variable/inter';",
    "import f from './a.woff2';",
    "const m = await import('@fontsource/x');",
    '@font-face { src: url(a.woff2); }',
    "@import url('https://fonts.googleapis.com/css2?family=X');",
  ])('flags %s', (text) => {
    expect(rules('apps/web/app/x.tsx', text)).toContain('CL2');
  });

  it('allows importing the ui package and unrelated imports', () => {
    expect(
      rules('apps/web/a.tsx', "import { fontClassName } from '@learn-code/ui/fonts';"),
    ).toEqual([]);
    expect(rules('apps/web/a.tsx', "import next from 'next/link';")).toEqual([]);
  });

  it('passes inside packages/ui', () => {
    expect(rules('packages/ui/src/fonts.ts', "import localFont from 'next/font/local';")).toEqual(
      [],
    );
  });
});
