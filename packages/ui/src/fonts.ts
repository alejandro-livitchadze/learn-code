import localFont from 'next/font/local';

/**
 * The four families of the notebook (E08 section 2), loaded from the bundled
 * fontsource files so builds need no network. Only this package may load fonts (CL2).
 */
const display = localFont({
  src: '../node_modules/@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2',
  weight: '800',
  variable: '--font-display-face',
  display: 'swap',
});

const body = localFont({
  src: [
    {
      path: '../node_modules/@fontsource/atkinson-hyperlegible/files/atkinson-hyperlegible-latin-400-normal.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../node_modules/@fontsource/atkinson-hyperlegible/files/atkinson-hyperlegible-latin-700-normal.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-body-face',
  display: 'swap',
});

const hand = localFont({
  src: [
    {
      path: '../node_modules/@fontsource/caveat/files/caveat-latin-500-normal.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../node_modules/@fontsource/caveat/files/caveat-latin-700-normal.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-hand-face',
  display: 'swap',
});

const mono = localFont({
  src: '../node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2',
  weight: '400 600',
  variable: '--font-mono-face',
  display: 'swap',
});

/** Put this on `<html>`. */
export const fontClassName = [display, body, hand, mono].map((f) => f.variable).join(' ');
