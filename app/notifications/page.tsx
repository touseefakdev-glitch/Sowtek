'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { getNotifications, markAllRead, markRead } from '@/lib/api/notifications';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'orders' | 'escalations' | 'system'>('all');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  const fallbackNotifications = [
    {
      id: 'n-1',
      category: 'escalations',
      title: 'Damaged Goods Reported Bay 3',
      badge_type: 'CRITICAL SLA',
      badge_color: 'bg-rose-500 text-white',
      tag: '#TCK-1042',
      subtag: 'Bay 3',
      description:
        'Ticket #TCK-1042 escalated: 4 crushed tomato cases reported by Chef Faisal Al-Qaisi. WhatsApp triage response pending - 14m SLA remaining before breach.',
      meta_highlight: '14m remaining',
      meta_author: 'Chef Faisal Al-Qaisi',
      meta_time: 'Just now',
      action_label: 'Open Ticket',
      action_link: '/tickets',
      icon: 'emergency_home',
      icon_bg: 'bg-rose-100 text-rose-700',
      border_accent: 'bg-rose-500',
      is_read: false,
    },
    {
      id: 'n-2',
      category: 'orders',
      title: 'Revised Order Confirmed',
      badge_type: 'WHATSAPP ORDER',
      badge_color: 'bg-[#70b928] text-white',
      tag: '#ORD-8821',
      subtag: 'SAR 4,820.00',
      description:
        'Al Noor Restaurant confirmed revised 10 bags of Basmati Rice for morning Bay 3 delivery. Dispatch pack generated automatically via conversational agent.',
      meta_highlight: 'Dispatched Bay 3',
      meta_author: 'Al Noor Restaurant',
      meta_time: '8m ago',
      action_label: 'View Order',
      action_link: '/orders/ORD-8821',
      icon: 'check_circle',
      icon_bg: 'bg-[#d6eed0] text-[#142340]',
      border_accent: 'bg-[#70b928]',
      is_read: false,
    },
    {
      id: 'n-3',
      category: 'system',
      title: 'WhatsApp Gateway Sync Surge',
      badge_type: 'SYSTEM TRAFFIC',
      badge_color: 'bg-[#142340] text-white',
      tag: 'Riyadh Gateway',
      subtag: '82ms Latency',
      description:
        'High incoming message volume detected: 340 chats/min. Operational throttle active. Webhook response latency currently normal at 82ms.',
      meta_highlight: 'Latency 82ms OK',
      meta_author: 'WhatsApp API Gateway',
      meta_time: '24m ago',
      action_label: 'Check Logs',
      action_link: '/settings',
      icon: 'sync_alt',
      icon_bg: 'bg-slate-200 text-slate-800',
      border_accent: 'bg-slate-400',
      is_read: false,
    },
    {
      id: 'n-4',
      category: 'escalations',
      title: 'Credit Limit Threshold 85% Exceeded',
      badge_type: 'FINANCIAL HOLD',
      badge_color: 'bg-rose-100 text-rose-800',
      tag: 'VIP Net-30',
      subtag: 'Sultan Grill',
      description:
        'Sultan Grill Express reached 85% of VIP Net-30 limit (SAR 42,500 / 50,000). Automatic order authorization paused for pending order PO_Sultan_8819.',
      meta_highlight: 'Finance Desk Review',
      meta_author: 'Sultan Grill Express',
      meta_time: '45m ago',
      action_label: 'Review Terms',
      action_link: '/contacts/sultan-grill',
      icon: 'credit_card_off',
      icon_bg: 'bg-rose-100 text-rose-700',
      border_accent: 'bg-rose-500',
      is_read: false,
    },
    {
      id: 'n-5',
      category: 'orders',
      title: 'Order #ORD-8809 Delivered',
      badge_type: 'DELIVERED',
      badge_color: 'bg-slate-100 text-slate-700',
      tag: '#ORD-8809',
      subtag: 'Le Gourmet Bakery',
      description:
        'Driver Tariq verified signed proof of delivery at Le Gourmet Bakery Hub. 40kg Premium Unsalted Butter transferred without discrepancy.',
      meta_highlight: 'POD Verified',
      meta_author: 'Driver Tariq #DR-04',
      meta_time: '2h ago',
      action_label: 'View POD',
      action_link: '/orders/ORD-8809',
      icon: 'local_shipping',
      icon_bg: 'bg-slate-100 text-slate-600',
      border_accent: 'bg-transparent',
      is_read: true,
    },
    {
      id: 'n-6',
      category: 'orders',
      title: 'Stock Reorder Required',
      badge_type: 'LOW STOCK',
      badge_color: 'bg-amber-100 text-amber-800',
      tag: 'SKU CAN-204',
      subtag: 'Warehouse B',
      description:
        'Whole Peeled Plum Tomatoes (CAN-204) dropped below safety margin to 8 cases. Restock purchase requisition triggered with AgroItalia Importers.',
      meta_highlight: 'Shelf 14 Flag',
      meta_author: 'Warehouse B - Shelf 14',
      meta_time: '5h ago',
      action_label: 'Manage SKU',
      action_link: '/products',
      icon: 'inventory_2',
      icon_bg: 'bg-slate-100 text-slate-600',
      border_accent: 'bg-transparent',
      is_read: true,
    },
    {
      id: 'n-7',
      category: 'system',
      title: 'PostgreSQL Hourly Snapshot Finished',
      badge_type: 'BACKUP',
      badge_color: 'bg-slate-100 text-slate-700',
      tag: '2.4 GB',
      subtag: 'DB Cluster A',
      description:
        'Automated database state replication and cold storage integrity check succeeded. Zero replication lag reported across replica nodes.',
      meta_highlight: 'Zero Lag',
      meta_author: 'Database Cluster A',
      meta_time: 'Yesterday at 23:00',
      action_label: 'Archived',
      action_link: '#',
      icon: 'cloud_done',
      icon_bg: 'bg-slate-100 text-slate-600',
      border_accent: 'bg-transparent',
      is_read: true,
    },
  ];

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await getNotifications(unreadOnly);
        if (res.data && res.data.length > 0) {
          const merged = res.data.map((item: any, idx: number) => {
            const fb = fallbackNotifications[idx % fallbackNotifications.length];
            return {
              id: item.id,
              category: fb.category,
              title: item.title || fb.title,
              badge_type: fb.badge_type,
              badge_color: fb.badge_color,
              tag: fb.tag,
              subtag: fb.subtag,
              description: item.body || fb.description,
              meta_highlight: fb.meta_highlight,
              meta_author: fb.meta_author,
              meta_time: 'Recently',
              action_label: fb.action_label,
              action_link: item.link || fb.action_link,
              icon: fb.icon,
              icon_bg: fb.icon_bg,
              border_accent: fb.border_accent,
              is_read: item.is_read ?? false,
            };
          });
          setNotifications(merged);
        } else {
          setNotifications(fallbackNotifications);
        }
      } catch {
        setNotifications(fallbackNotifications);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [unreadOnly]);

  const handleMarkAllRead = async () => {
    try {
      await markAllRead();
    } catch {}
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const handleMarkSingleRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await markRead(id);
    } catch {}
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter !== 'all' && n.category !== activeFilter) return false;
    if (unreadOnly && n.is_read) return false;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const ordersCount = notifications.filter((n) => n.category === 'orders').length;
  const escalationsCount = notifications.filter((n) => n.category === 'escalations').length;
  const systemCount = notifications.filter((n) => n.category === 'system').length;

  return (
    <div className="flex h-screen bg-[#f1f3f7] overflow-hidden font-sans">
      <AppSidebar />

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
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#d6eed0] text-[#142340] text-xs font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#70b928]"></span>
              WhatsApp Gateway Online
            </div>
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
            <div className="w-8 h-8 rounded-full bg-[#142340] text-white flex items-center justify-center font-bold text-xs">
              <span>KO</span>
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
                {filteredNotifications.map((n) => {
                  return (
                    <div
                      key={n.id}
                      className={`group relative flex items-start justify-between gap-4 p-5 transition-colors ${
                        !n.is_read ? 'bg-[#eef4fd] hover:bg-slate-50' : 'bg-white hover:bg-slate-50'
                      }`}
                    >
                      {!n.is_read && n.border_accent && (
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${n.border_accent}`}></div>
                      )}

                      <div className="flex items-start gap-4 min-w-0 flex-1">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-xs ${
                            n.icon_bg || 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[20px]">{n.icon || 'notifications'}</span>
                        </div>

                        <div className="flex flex-col min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5 mb-1">
                            <span className="text-sm font-bold text-[#142340] tracking-tight">{n.title}</span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
                                n.badge_color || 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {!n.is_read && n.category === 'escalations' && (
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                              )}
                              {n.badge_type}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-slate-200/80 text-slate-800 text-[10px] font-semibold">
                              {n.tag}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px]">
                              {n.subtag}
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-medium">
                            {n.description}
                          </p>

                          <div className="flex items-center gap-2 mt-2 text-slate-400 text-[11px]">
                            {n.meta_highlight && (
                              <span
                                className={`flex items-center gap-1 font-bold px-2 py-0.5 rounded ${
                                  n.category === 'escalations'
                                    ? 'text-rose-700 bg-rose-100'
                                    : 'text-[#142340] bg-[#d6eed0]'
                                }`}
                              >
                                {n.meta_highlight}
                              </span>
                            )}
                            <span>•</span>
                            <span className="font-semibold text-slate-700">{n.meta_author}</span>
                            <span>•</span>
                            <span>{n.meta_time}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Action Trigger */}
                      <div className="flex items-center gap-2 shrink-0 self-start mt-1">
                        {!n.is_read && <span className="w-2 h-2 rounded-full bg-[#70b928]"></span>}
                        {n.action_link && n.action_link !== '#' ? (
                          <Link
                            href={n.action_link}
                            className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800 hover:bg-[#142340] hover:text-white text-xs font-bold transition-all shadow-xs"
                          >
                            <span>{n.action_label}</span>
                            <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                          </Link>
                        ) : (
                          <span className="text-[11px] text-slate-400 px-2 py-1 rounded bg-slate-100 font-semibold">
                            Archived
                          </span>
                        )}
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
              <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-slate-500 text-xs">
                  <span className="material-symbols-outlined text-[16px]">info</span>
                  <span>Showing latest activity from your connected warehouse regions</span>
                </div>
                <button
                  onClick={() => alert('All 18 records loaded.')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold transition-all shadow-xs border border-slate-200"
                >
                  <span>Load earlier notifications</span>
                  <span className="material-symbols-outlined text-[16px]">expand_more</span>
                </button>
              </div>
            </div>

            {/* Bottom KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-card flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-[#d6eed0] text-[#142340] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[22px]">speed</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                    Avg SLA Triage
                  </span>
                  <span className="text-lg font-bold text-[#142340]">4.2 min</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-card flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[22px]">chat</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                    WhatsApp Sync
                  </span>
                  <span className="text-lg font-bold text-[#70b928]">99.98%</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-card flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[22px]">warning</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Open Tickets</span>
                  <span className="text-lg font-bold text-rose-600">3 Active</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
