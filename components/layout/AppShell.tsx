'use client';

import React, { useEffect, useRef, useState } from 'react';
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
  const drawerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstRender = useRef(true);

  // Close the drawer whenever the route changes so navigation never leaves it
  // covering the new page.
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  /*
   * Move focus to the main region on client navigation. The App Router does not
   * do this, so after following a link the caret stays on the link that no
   * longer exists and the next Tab drops the user back into the sidebar. This
   * pairs with the skip link above, which targets the same element.
   *
   * Skipped on first render so a direct page load is not hijacked.
   */
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    document.getElementById('main-content')?.focus();
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

  /*
   * Drawer keyboard handling. The drawer is a modal overlay, so it needs Escape
   * to dismiss, focus moved inside on open, Tab kept within it, and focus handed
   * back to the trigger on close. Without this a keyboard user can open the
   * drawer and end up tabbing around the page behind it, which is invisible to
   * them because the drawer covers the content.
   */
  useEffect(() => {
    if (!drawerOpen) return;

    const panel = drawerRef.current;
    panel?.querySelector<HTMLElement>('button, a[href], input, select, textarea')?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        setDrawerOpen(false);
        return;
      }
      if (event.key !== 'Tab' || !panel) return;

      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((element) => !element.hasAttribute('disabled'));
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [drawerOpen]);

  // Hand focus back to the hamburger when the drawer closes.
  useEffect(() => {
    if (drawerOpen) return;
    if (triggerRef.current && document.activeElement === document.body) {
      triggerRef.current.focus();
    }
  }, [drawerOpen]);

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-canvas">
      {/*
        Skip link. Without it, a keyboard user lands on the sidebar and has to
        tab through every navigation item on every page load, because client
        navigation does not reset focus or the tab order. The anchor targets
        <main>, which carries tabIndex={-1} so it can actually receive focus.
      */}
      <a
        href="#main-content"
        className="sr-only z-[100] rounded-control bg-navy px-4 py-2 text-sm font-semibold text-ink-inverse focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:shadow-card-lg"
      >
        Skip to main content
      </a>

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
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="relative h-full w-64 max-w-[85vw] shadow-card-lg"
          >
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
            ref={triggerRef}
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-expanded={drawerOpen}
            aria-haspopup="dialog"
            className="rounded-control p-2 text-ink-secondary hover:bg-surface-hover"
          >
            <Icon name="menu" size="md" label="Open navigation" />
          </button>
          <span className="text-base font-extrabold tracking-tight text-ink">
            sowtek <span className="text-xs font-bold uppercase text-lime-600">Orderflow</span>
          </span>
        </div>

        <main
          id="main-content"
          tabIndex={-1}
          className={cn('flex min-h-0 flex-1 flex-col overflow-y-auto focus:outline-none')}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
