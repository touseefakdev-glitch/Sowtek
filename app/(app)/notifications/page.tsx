'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getNotifications, markAllRead, markRead } from '@/lib/api/notifications';

interface NotificationRow {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

type Category = 'orders' | 'escalations' | 'system';

function categoryFor(type: string): Category {
  if (type.includes('ticket')) return 'escalations';
  if (type.includes('order') || type.includes('conversation')) return 'orders';
  return 'system';
}

function presentationFor(type: string): {
  icon: string;
  iconBg: string;
  accent: string;
  badgeClass: string;
} {
  if (type.includes('ticket')) {
    return {
      icon: 'support_agent',
      iconBg: 'bg-rose-100 text-rose-700',
      accent: 'bg-rose-500',
      badgeClass: 'bg-rose-100 text-rose-800',
    };
  }
  if (type.includes('credit') || type.includes('invoice') || type.includes('payment')) {
    return {
      icon: 'account_balance_wallet',
      iconBg: 'bg-amber-100 text-amber-700',
      accent: 'bg-amber-500',
      badgeClass: 'bg-amber-100 text-amber-800',
    };
  }
  if (type.includes('stock') || type.includes('inventory') || type.includes('product')) {
    return {
      icon: 'inventory_2',
      iconBg: 'bg-slate-100 text-slate-600',
      accent: 'bg-transparent',
      badgeClass: 'bg-slate-100 text-slate-700',
    };
  }
  if (type.includes('order')) {
    return {
      icon: 'receipt_long',
      iconBg: 'bg-[#d6eed0] text-[#142340]',
      accent: 'bg-[#70b928]',
      badgeClass: 'bg-[#d6eed0] text-[#142340]',
    };
  }
  return {
    icon: 'notifications',
    iconBg: 'bg-slate-200 text-slate-800',
    accent: 'bg-slate-400',
    badgeClass: 'bg-slate-200 text-slate-800',
  };
}

function formatAge(iso: string): string {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'orders' | 'escalations' | 'system'>('all');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await getNotifications(unreadOnly);
        if (cancelled) return;
        setNotifications((res.data ?? []) as NotificationRow[]);
      } catch (err) {
        if (cancelled) return;
        setNotifications([]);
        setError(err instanceof Error ? err.message : 'Unable to load notifications.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();

    return () => {
      cancelled = true;
    };
  }, [unreadOnly]);

  const handleMarkAllRead = async () => {
    try {
      await markAllRead();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to mark notifications as read.');
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const handleMarkSingleRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await markRead(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to mark the notification as read.');
    }
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter !== 'all' && categoryFor(n.type) !== activeFilter) return false;
    if (unreadOnly && n.is_read) return false;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const ordersCount = notifications.filter((n) => categoryFor(n.type) === 'orders').length;
  const escalationsCount = notifications.filter(
    (n) => categoryFor(n.type) === 'escalations'
  ).length;
  const systemCount = notifications.filter((n) => categoryFor(n.type) === 'system').length;

  return (
    <>
      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="h-16 bg-white/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex items-center justify-between px-6 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-4 flex-1 max-w-lg">
            <div className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100">
              <span className="material-symbols-outlined text-slate-400 text-[18px]">search</span>
              <input
                className="bg-transparent border-none outline-none text-xs text-slate-800 placeholder:text-slate-400 w-full"
                placeholder="Search catalog, SKUs, restaurants, or orders..."
                type="text"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-slate-500">
              <button className="w-9 h-9 rounded-lg hover:bg-slate-100 hover:text-slate-800 flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined text-[20px]">tune</span>
              </button>
              <div className="w-9 h-9 rounded-lg bg-slate-100 text-[#142340] flex items-center justify-center relative">
                <span className="material-symbols-outlined text-[20px]">notifications</span>
                {unreadCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-[#70b928] absolute top-2 right-2"></span>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Centered Master Layout */}
        <main className="w-full p-6 flex-1">
          <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 text-slate-500 text-[11px] uppercase tracking-wider font-bold mb-1">
                  <span>Sowtek Operations</span>
                  <span>•</span>
                  <span className="text-[#70b928]">Dispatch Hub</span>
                </div>
                <h1 className="text-2xl font-bold text-[#142340] tracking-tight">Activity & Notifications</h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Stay updated on orders, critical SLA escalations, and system alerts across wholesale hubs.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center">
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors shadow-sm"
                >
                  <span className="material-symbols-outlined text-[18px] text-[#70b928]">done_all</span>
                  <span>Mark all as read</span>
                </button>
                <Link
                  href="/settings"
                  className="w-9 h-9 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors shadow-sm"
                  title="Notification Settings"
                >
                  <span className="material-symbols-outlined text-[18px]">settings</span>
                </Link>
              </div>
            </div>

            {/* Notification Master Card */}
            <div className="rounded-2xl bg-white shadow-card border border-slate-200/80 overflow-hidden flex flex-col">
              {/* Tab Filters Bar */}
              <div className="px-6 py-3.5 bg-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100">
                  <button
                    onClick={() => setActiveFilter('all')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeFilter === 'all'
                        ? 'bg-[#142340] text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>All</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-white text-[10px]">
                      {notifications.length}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveFilter('orders')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeFilter === 'orders'
                        ? 'bg-[#142340] text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>Orders</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 text-[10px]">
                      {ordersCount}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveFilter('escalations')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeFilter === 'escalations'
                        ? 'bg-[#142340] text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>Escalations</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                      {escalationsCount}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveFilter('system')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeFilter === 'system'
                        ? 'bg-[#142340] text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>System</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 text-[10px]">
                      {systemCount}
                    </span>
                  </button>
                </div>

                <div className="flex items-center gap-4 self-end sm:self-auto">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      className="w-4 h-4 rounded text-[#70b928] accent-[#70b928] focus:ring-0 cursor-pointer"
                      type="checkbox"
                      checked={unreadOnly}
                      onChange={(e) => setUnreadOnly(e.target.checked)}
                    />
                    <span className="text-xs font-bold text-slate-600">Unread only</span>
                  </label>
                  <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>
                  <span className="text-xs text-slate-500 hidden sm:inline-block">
                    <span className="font-bold text-slate-900">{unreadCount}</span> unread
                  </span>
                </div>
              </div>

              {/* Notifications Feed Rows */}
              <div className="flex flex-col divide-y divide-slate-100">
                {error && (
                  <div className="m-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-700">
                    {error}
                  </div>
                )}

                {loading && notifications.length === 0 && (
                  <p className="py-12 text-center text-[11px] text-slate-400">
                    Loading notifications...
                  </p>
                )}

                {!loading && !error && filteredNotifications.length === 0 && (
                  <p className="px-5 py-12 text-center text-[11px] leading-relaxed text-slate-400">
                    {notifications.length === 0
                      ? 'No notifications yet. Order, ticket, and system events appear here as they happen.'
                      : 'No notifications match the selected filters.'}
                  </p>
                )}

                {filteredNotifications.map((n) => {
                  const view = presentationFor(n.type);
                  const category = categoryFor(n.type);
                  return (
                    <div
                      key={n.id}
                      className={`group relative flex items-start justify-between gap-4 p-5 transition-colors ${
                        !n.is_read ? 'bg-[#eef4fd] hover:bg-slate-50' : 'bg-white hover:bg-slate-50'
                      }`}
                    >
                      {!n.is_read && (
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${view.accent}`} />
                      )}

                      <div className="flex items-start gap-4 min-w-0 flex-1">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-xs ${view.iconBg}`}
                        >
                          <span className="material-symbols-outlined text-[20px]">{view.icon}</span>
                        </div>

                        <div className="flex flex-col min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5 mb-1">
                            <span className="text-sm font-bold text-[#142340] tracking-tight">
                              {n.title}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide flex items-center gap-1 ${view.badgeClass}`}
                            >
                              {!n.is_read && category === 'escalations' && (
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                              )}
                              {n.type.replace(/_/g, ' ')}
                            </span>
                          </div>

                          {n.body && (
                            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-medium">
                              {n.body}
                            </p>
                          )}

                          <div className="flex items-center gap-2 mt-2 text-slate-400 text-[11px]">
                            <span>{formatAge(n.created_at)}</span>
                            <span>&bull;</span>
                            <span className="capitalize">{category}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-start mt-1">
                        {!n.is_read && <span className="w-2 h-2 rounded-full bg-[#70b928]" />}
                        {n.link ? (
                          <Link
                            href={n.link}
                            className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800 hover:bg-[#142340] hover:text-white text-xs font-bold transition-all shadow-xs"
                          >
                            <span>Open</span>
                            <span className="material-symbols-outlined text-[15px]">
                              arrow_forward
                            </span>
                          </Link>
                        ) : null}
                        {!n.is_read && (
                          <button
                            onClick={(e) => handleMarkSingleRead(n.id, e)}
                            className="w-8 h-8 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-800 flex items-center justify-center transition-colors"
                            title="Mark as read"
                          >
                            <span className="material-symbols-outlined text-[18px]">check</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Footer */}
              <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center gap-2 text-slate-500 text-xs">
                <span className="material-symbols-outlined text-[16px]">info</span>
                <span>
                  Showing {filteredNotifications.length} of {notifications.length} notifications
                </span>
              </div>
            </div>

            {/* Bottom KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-card flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-[#d6eed0] text-[#142340] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[22px]">notifications</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                    Total Loaded
                  </span>
                  <span className="text-lg font-bold text-[#142340]">{notifications.length}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-card flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[22px]">mark_email_unread</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                    Unread
                  </span>
                  <span className="text-lg font-bold text-[#142340]">{unreadCount}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-card flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[22px]">warning</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                    Escalations
                  </span>
                  <span className="text-lg font-bold text-rose-600">{escalationsCount}</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
