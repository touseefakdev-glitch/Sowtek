import type { Metadata } from 'next';
import React from 'react';
import './globals.css';
import { RealtimeProvider } from '@/components/providers/RealtimeProvider';

export const metadata: Metadata = {
  title: 'Sowtek OrderFlow',
  description: 'WhatsApp-first order management system for restaurant supply',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-[#f1f3f7]">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body className="h-full text-slate-800 antialiased font-sans bg-[#f1f3f7]" style={{ margin: 0 }}>
        <RealtimeProvider>{children}</RealtimeProvider>
      </body>
    </html>
  );
}
