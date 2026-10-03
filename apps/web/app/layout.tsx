import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { fontClassName } from '@learn-code/ui/fonts';
import '@learn-code/ui/tokens.css';
import '@learn-code/ui/ui.css';
import '@learn-code/widgets/widgets.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'Learn fullstack',
  description: 'Interactive lessons that take a frontend developer to fullstack.',
};

export default function RootLayout({ children }: { readonly children: ReactNode }) {
  return (
    <html lang="en" className={fontClassName}>
      <body>{children}</body>
    </html>
  );
}
