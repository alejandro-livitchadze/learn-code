import type { Metadata } from 'next';
import localFont from 'next/font/local';
import type { ReactNode } from 'react';
import '@learn-code/widgets/widgets.css';
import './globals.css';

const body = localFont({
  src: '../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2',
  variable: '--font-body',
  display: 'swap',
});
const mono = localFont({
  src: '../node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2',
  variable: '--font-mono',
  display: 'swap',
});
const hand = localFont({
  src: '../node_modules/@fontsource/caveat/files/caveat-latin-400-normal.woff2',
  variable: '--font-hand',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Learn fullstack',
  description: 'Interactive lessons that take a frontend developer to fullstack.',
};

export default function RootLayout({ children }: { readonly children: ReactNode }) {
  return (
    <html lang="en" className={`${body.variable} ${mono.variable} ${hand.variable}`}>
      <body>{children}</body>
    </html>
  );
}
