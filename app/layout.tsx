import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { Bebas_Neue, Barlow_Condensed } from 'next/font/google';

import './globals.css';

const bebasNeue = Bebas_Neue({
  subsets: ['latin'],
  variable: '--font-bebas',
  weight: '400'
});

const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  variable: '--font-barlow',
  weight: ['300', '400']
});

export const metadata: Metadata = {
  title: 'ATELOPHOBIA',
  description: 'Atelophobia streetwear showcase rebuilt in Next.js 14.'
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${bebasNeue.variable} ${barlowCondensed.variable}`}>{children}</body>
    </html>
  );
}
