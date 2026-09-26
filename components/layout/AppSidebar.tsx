'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';
import { PRIMARY_NAV, isNavItemActive } from '@/lib/navigation';
import { cn } from '@/lib/utils/cn';

interface UserProfile {
  id: string;
  full_name: string;
  role: string;
  avatar_url?: string | null;
  is_online?: boolean;
}

export function AppSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled && json.data) setProfile(json.data);
      } catch {
        // A failed profile lookup must not break navigation; the sidebar
        // simply falls back to neutral placeholders.
      }
    }

    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSignOut = useCallback(async () => {
    setSigningOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Local navigation proceeds regardless of the server response.
    }
    setSigningOut(false);
    router.push('/login');
    router.refresh();
  }, [router]);

  return (
    <aside
      className="flex h-full w-60 shrink-0 flex-col justify-between border-r border-line bg-surface"
      data-purpose="primary-navigation"
    >
      <div>
        <div className="flex h-16 items-center border-b border-line px-5">
          <Link
            href="/inbox"
            onClick={onNavigate}
            className="flex items-center gap-2.5 rounded-control"
          >
            <span
              className="flex h-8 w-8 items-center justify-center rounded-control bg-navy text-sm font-bold text-ink-inverse"
              aria-hidden
            >
              S
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-lg font-extrabold tracking-tight text-ink">sowtek</span>
              <span className="mt-0.5 text-xs font-bold uppercase tracking-widest text-lime-600">
                Orderflow
              </span>
            </span>
          </Link>
        </div>

        <nav aria-label="Primary" className="space-y-1 p-3.5">
          {PRIMARY_NAV.map((item) => {
            const isActive = isNavItemActive(pathname, item);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-control px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-lime-tint font-semibold text-lime-800 ring-1 ring-lime-tint-border'
                    : 'text-ink-secondary hover:bg-surface-hover hover:text-ink'
                )}
              >
                <Icon
                  name={item.icon}
                  size="sm"
                  filled={isActive}
                  className={isActive ? 'text-lime-700' : 'text-ink-subtle'}
                />
                {item.label}
              </Link>
            );
          })}

          <div className="pt-2">
            <Link
              href="/orders/new"
              onClick={onNavigate}
              className="flex w-full items-center justify-center gap-1.5 rounded-control bg-sky-tint px-3 py-2 text-xs font-bold text-status-info ring-1 ring-sky-tint-border transition-colors hover:bg-sky-tint-border"
            >
              <Icon name="add" size="sm" />
              New Order
            </Link>
          </div>
        </nav>
      </div>

      <div className="space-y-2 border-t border-line p-3.5">
        <div className="flex items-center justify-between gap-2 rounded-card border border-line bg-surface-sunken p-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-pill bg-line-strong ring-1 ring-line-strong">
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <span
                  className="flex h-full w-full items-center justify-center bg-navy text-xs font-bold uppercase text-ink-inverse"
                  aria-hidden
                >
                  {profile?.full_name ? profile.full_name.slice(0, 2) : '—'}
                </span>
              )}
              <span
                className={cn(
                  'absolute bottom-0 right-0 h-2.5 w-2.5 rounded-pill ring-2 ring-surface',
                  profile?.is_online ? 'bg-status-success' : 'bg-line-strong'
                )}
                aria-hidden
              />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold leading-tight text-ink">
                {profile?.full_name || 'Signed in'}
              </p>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-muted">
                <span
                  className={cn(
                    'h-1.5 w-1.5 rounded-pill',
                    profile?.is_online ? 'bg-status-success' : 'bg-line-strong'
                  )}
                  aria-hidden
                />
                {profile?.is_online ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="rounded-control p-1.5 text-ink-subtle transition-colors hover:bg-surface-hover hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Icon name="logout" size="sm" label="Sign out" />
          </button>
        </div>
      </div>
    </aside>
  );
}
