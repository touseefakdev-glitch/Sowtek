import type { Metadata, Viewport } from 'next';
import React from 'react';
import { Plus_Jakarta_Sans } from 'next/font/google';
import localFont from 'next/font/local';
import './globals.css';

/**
 * Self-hosted through next/font: the font is downloaded at build time, so
 * there is no render-blocking request to Google and no layout shift. The
 * previously loaded but unused Inter family has been removed.
 */
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
});

/**
 * Material Symbols, self-hosted and subsetted to the 37 ligatures this app
 * actually uses (see app/fonts/material-symbols-subset.txt).
 *
 * This font was previously never loaded at all. globals.css declared
 * `font-family: 'Material Symbols Outlined'` and nothing registered that
 * family, so the browser fell back to the body font and every icon rendered as
 * its own name: "mail", "lock", "arrow_forward", "trending_up" and so on,
 * scattered through the UI as stray words.
 *
 * Subsetting matters for more than size. A full Material Symbols Outlined
 * variable font is around 3.5 MB, which would have made the icon font the
 * heaviest asset in the product. `display: 'block'` is deliberate: with
 * `swap` the browser paints the ligature *text* first and then swaps in the
 * glyph, so a visitor on a slow connection sees "mail" appear and then turn
 * into an envelope. Blocking hides that instead.
 */
const materialSymbols = localFont({
  src: './fonts/MaterialSymbolsOutlined-Subset.woff2',
  variable: '--font-material-symbols',
  display: 'block',
  weight: '100 700',
  style: 'normal',
  // No automatic fallback metrics: this is a ligature font, not text, and the
  // ascender/descender overrides would only misalign the glyphs.
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: {
    default: 'Sowtek OrderFlow',
    template: '%s · Sowtek OrderFlow',
  },
  description: 'WhatsApp-first order management system for restaurant supply',
  applicationName: 'Sowtek OrderFlow',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#142340',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // RealtimeProvider is deliberately NOT here. It pulls the Supabase browser
  // SDK, which made the unauthenticated /login route carry ~77 kB of realtime
  // and auth code it can never use, since there is no session to subscribe with.
  // It lives in the (app) layout instead, which only renders once a user is
  // signed in.
  return (
    <html lang="en" className={`${jakarta.variable} ${materialSymbols.variable} h-full`}>
      <body className="h-full bg-canvas font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
