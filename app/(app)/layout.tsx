import React from 'react';
import { AppShell } from '@/components/layout/AppShell';

/**
 * Layout for the authenticated application.
 *
 * Owns the product chrome for every page inside the group, so no individual
 * page can forget the sidebar, the scroll container or the responsive drawer.
 * Previously this shell was duplicated across all 12 pages.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
