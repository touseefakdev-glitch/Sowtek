import type { Metadata, Viewport } from 'next';
import React from 'react';
import { Plus_Jakarta_Sans } from 'next/font/google';
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
    <html lang="en" className={`${jakarta.variable} h-full`}>
      <body className="h-full bg-canvas font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
