'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AppSidebar } from './AppSidebar';
import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/utils/cn';

/**
 * The authenticated application chrome: fixed sidebar beside a single
 * scrolling content column.
 *
 * This used to be copy-pasted into all 12 pages, which meant the shell, its
 * breakpoints and its spacing could drift per page. It is now defined once and
 * mounted by the (app) route-group layout.
 *
 * Responsive: on narrow viewports the sidebar becomes an overlay drawer
 * behind a top bar, because the product is WhatsApp-first and operators work
 * from phones.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();

  // Close the drawer whenever the route changes so navigation never leaves it
  // covering the new page.
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Prevent background scrolling while the drawer is open.
  useEffect(() => {
    if (!drawerOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [drawerOpen]);

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-canvas">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <AppSidebar />
      </div>

      {/* Mobile drawer */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 h-full w-full bg-navy/40"
          />
          <div className="relative h-full w-64 max-w-[85vw] shadow-card-lg">
            <AppSidebar onNavigate={() => setDrawerOpen(false)} />
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="absolute right-2 top-4 rounded-control p-2 text-ink-subtle hover:bg-surface-hover"
            >
              <Icon name="close" size="sm" label="Close navigation" />
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <div className="flex h-14 shrink-0 items-center gap-3 border-b border-line bg-surface px-4 md:hidden">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="rounded-control p-2 text-ink-secondary hover:bg-surface-hover"
          >
            <Icon name="menu" size="md" label="Open navigation" />
          </button>
          <span className="text-base font-extrabold tracking-tight text-ink">
            sowtek <span className="text-xs font-bold uppercase text-lime-600">Orderflow</span>
          </span>
        </div>

        <main className={cn('flex min-h-0 flex-1 flex-col overflow-y-auto')}>
          {children}
        </main>
      </div>
    </div>
  );
}
