import React from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { RealtimeProvider } from '@/components/providers/RealtimeProvider';

/**
 * Layout for the authenticated application.
 *
 * Owns the product chrome for every page inside the group, so no individual
 * page can forget the sidebar, the scroll container or the responsive drawer.
 * Previously this shell was duplicated across all 12 pages.
 *
 * RealtimeProvider also lives here rather than in the root layout: it pulls the
 * Supabase browser SDK, and a signed-out visitor on /login has no session to
 * subscribe with, so loading it there was ~77 kB of dead weight on the one page
 * that most needs to be fast.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RealtimeProvider>
      <AppShell>{children}</AppShell>
    </RealtimeProvider>
  );
}
