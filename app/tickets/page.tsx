'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { getTickets, updateTicketStatus, createTicket } from '@/lib/api/tickets';

export default function TicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [actionNote, setActionNote] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const fallbackTickets = [
    {
      id: 'tkt-1',
      ticket_number: 'TCK-1042',
      restaurant_name: 'Al Noor Restaurant',
      restaurant_ar: 'مطعم النور',
      channel: 'WhatsApp',
      type: 'Quality/Damage',
      priority: 'high',
      status: 'investigating',
      time: '10:42 AM',
      sla_left: '14m left',
      sla_status: 'critical',
      agent_name: 'Kenneth O.',
      agent_initials: 'KO',
      title: 'Damaged Goods (Crushed Cans)',
      description:
        'Chef Faisal: "4 crates of San Marzano tomatoes arrived dented and leaked during dock delivery. Unusable for lunch prep."',
      linked_order: 'ORD-8821',
      linked_order_amount: 'SAR 4,820.00',
      contact_person: 'Chef Faisal Al-Otaibi',
      contact_phone: '+966 50 123 4567',
      credit_limit: 'SAR 50,000',
      credit_used: 'SAR 14,250',
    },
    {
      id: 'tkt-2',
      ticket_number: 'TCK-1039',
      restaurant_name: 'Sultan Grill Express',
      restaurant_ar: 'سلطان جريل إكسبريس',
      channel: 'WhatsApp',
      type: 'Late Van',
      priority: 'medium',
      status: 'new',
      time: '09:55 AM',
      sla_left: '42m left',
      sla_status: 'normal',
      agent_name: 'Tariq M.',
      agent_initials: 'TM',
      title: 'Delivery Delay • Fleet Van #04',
      description:
        'Driver caught in heavy road closure near Kingdom Tower corridor. ETA push requested to 11:30 AM.',
      linked_order: 'ORD-8819',
      linked_order_amount: 'SAR 2,150.00',
      contact_person: 'Manager Tariq',
      contact_phone: '+966 55 987 6543',
      credit_limit: 'SAR 30,000',
      credit_used: 'SAR 8,900',
    },
    {
      id: 'tkt-3',
      ticket_number: 'TCK-1035',
      restaurant_name: 'Bella Roma Bistro',
      restaurant_ar: 'بيلا روما بيسترو',
      channel: 'WhatsApp',
      type: 'Missing SKU',
      priority: 'high',
      status: 'escalated',
      time: '09:12 AM',
      sla_left: 'Breached (5m ago)',
      sla_status: 'breached',
      agent_name: 'Manager Review',
      agent_initials: 'MR',
      title: 'Wrong SKU Delivered (Olive Oil Discrepancy)',
      description:
        'Received 5L Canola Oil instead of requested 5L Extra Virgin Cold Pressed Olive Oil. Urgent replacement required.',
      linked_order: 'ORD-8814',
      linked_order_amount: 'SAR 3,400.00',
      contact_person: 'Head Chef Marco',
      contact_phone: '+966 54 443 2211',
      credit_limit: 'SAR 40,000',
      credit_used: 'SAR 22,100',
    },
    {
      id: 'tkt-4',
      ticket_number: 'TCK-1028',
      restaurant_name: 'Mama Noura Express',
      restaurant_ar: 'ماما نورة إكسبريس',
      channel: 'WhatsApp',
      type: 'Quality/Damage',
      priority: 'normal',
      status: 'resolved',
      time: 'Yesterday',
      sla_left: 'Resolved in 18m',
      sla_status: 'resolved',
      agent_name: 'Sarah K.',
      agent_initials: 'SK',
      title: 'VAT Invoice Breakdown Resend',
      description:
        'Requested official ZATCA QR-code PDF breakdown for accounting reconciliation. PDF dispatched successfully.',
      linked_order: 'ORD-8742',
      linked_order_amount: 'SAR 5,890.00',
      contact_person: 'Finance Dept',
      contact_phone: '+966 50 555 1212',
      credit_limit: 'SAR 100,000',
      credit_used: 'SAR 45,000',
    },
  ];

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await getTickets({
          status: statusFilter !== 'all' ? statusFilter : undefined,
        });
        if (res.data && res.data.length > 0) {
          const merged = res.data.map((item: any, idx: number) => {
            const fb = fallbackTickets[idx % fallbackTickets.length];
            return {
              id: item.id,
              ticket_number: item.ticket_number || `TCK-${1040 + idx}`,
              restaurant_name: item.restaurant?.name || fb.restaurant_name,
              restaurant_ar: item.restaurant?.name_ar || fb.restaurant_ar,
              channel: 'WhatsApp',
              type: item.type || fb.type,
              priority: item.priority || fb.priority,
              status: item.status || fb.status,
              time: 'Just now',
              sla_left: fb.sla_left,
              sla_status: fb.sla_status,
              agent_name: fb.agent_name,
              agent_initials: fb.agent_initials,
              title: item.title || fb.title,
              description: item.description || fb.description,
              linked_order: fb.linked_order,
              linked_order_amount: fb.linked_order_amount,
              contact_person: fb.contact_person,
              contact_phone: fb.contact_phone,
              credit_limit: fb.credit_limit,
              credit_used: fb.credit_used,
            };
          });
          setTickets(merged);
          setSelectedTicket(merged[0]);
        } else {
          setTickets(fallbackTickets);
          setSelectedTicket(fallbackTickets[0]);
        }
      } catch {
        setTickets(fallbackTickets);
        setSelectedTicket(fallbackTickets[0]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [statusFilter]);

  const filteredTickets = tickets.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && t.type !== categoryFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const match =
        t.ticket_number.toLowerCase().includes(q) ||
        t.restaurant_name.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedTicket) return;
    try {
      await updateTicketStatus(selectedTicket.id, newStatus as any, actionNote || undefined);
    } catch {
      // update local
    }
    const updated = { ...selectedTicket, status: newStatus };
    setSelectedTicket(updated);
    setTickets((prev) => prev.map((t) => (t.id === selectedTicket.id ? updated : t)));
    setActionNote('');
  };

  const current = selectedTicket || fallbackTickets[0];

  return (
    <div className="flex h-screen bg-[#f1f3f7] overflow-hidden font-sans">
      <AppSidebar />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header with Live KPIs */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-xs z-20">
          <div className="flex items-center space-x-3">
            <h1 className="text-lg font-bold text-[#142340]">Tickets & Escalations</h1>
            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-xs font-bold">
              2 Critical SLA
            </span>
          </div>

          {/* Live Performance KPIs */}
          <div className="hidden lg:flex items-center space-x-6 text-xs">
            <div className="flex items-center space-x-2">
              <span className="material-symbols-outlined text-slate-400 text-base">confirmation_number</span>
              <div className="leading-tight">
                <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Open Tickets</span>
                <span className="font-bold text-slate-900">{tickets.length} active</span>
              </div>
            </div>
            <div className="w-px h-6 bg-slate-200"></div>
            <div className="flex items-center space-x-2">
              <span className="material-symbols-outlined text-rose-600 text-base">warning</span>
              <div className="leading-tight">
                <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">High Severity</span>
                <span className="font-bold text-rose-600">2 critical</span>
              </div>
            </div>
            <div className="w-px h-6 bg-slate-200"></div>
            <div className="flex items-center space-x-2">
              <span className="material-symbols-outlined text-slate-400 text-base">timelapse</span>
              <div className="leading-tight">
                <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Avg Resolution</span>
                <span className="font-bold text-slate-900">24m</span>
              </div>
            </div>
            <div className="w-px h-6 bg-slate-200"></div>
            <div className="flex items-center space-x-2">
              <span className="material-symbols-outlined text-[#70b928] text-base">verified</span>
              <div className="leading-tight">
                <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">SLA Compliance</span>
                <span className="font-bold text-[#70b928]">98.4% On-Track</span>
              </div>
            </div>
          </div>
        </header>

        {/* 3-COLUMN WORKSPACE CANVAS */}
        <div className="flex-1 flex overflow-hidden p-4 gap-4 bg-[#f1f3f7]">
          {/* COLUMN 1: Ticket Triage Feed (~320px) */}
          <aside className="w-80 shrink-0 flex flex-col bg-white rounded-2xl shadow-card border border-slate-200/80 overflow-hidden">
            {/* Search Box */}
            <div className="p-3 border-b border-slate-100">
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-slate-400 text-lg">search</span>
                <input
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs pl-9 pr-3 py-2 rounded-xl focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#70b928]"
                  placeholder="Search ticket #, restaurant..."
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Status Segmented Pills */}
            <div className="px-3 py-2 flex items-center space-x-1 border-b border-slate-100 overflow-x-auto text-xs">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition ${
                  statusFilter === 'all' ? 'bg-[#142340] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('new')}
                className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition flex items-center space-x-1 ${
                  statusFilter === 'new' ? 'bg-[#142340] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>New</span>
                <span className="px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-800 text-[10px]">1</span>
              </button>
              <button
                onClick={() => setStatusFilter('investigating')}
                className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition flex items-center space-x-1 ${
                  statusFilter === 'investigating'
                    ? 'bg-[#142340] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>Investigating</span>
                <span className="px-1.5 py-0.2 rounded-full bg-[#d6eed0] text-[#142340] text-[10px]">1</span>
              </button>
              <button
                onClick={() => setStatusFilter('escalated')}
                className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition flex items-center space-x-1 ${
                  statusFilter === 'escalated'
                    ? 'bg-[#142340] text-white shadow-xs'
                    : 'text-rose-600 hover:bg-rose-50'
                }`}
              >
                <span>Escalated</span>
                <span className="px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800 text-[10px]">1</span>
              </button>
              <button
                onClick={() => setStatusFilter('resolved')}
                className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition ${
                  statusFilter === 'resolved' ? 'bg-[#142340] text-white shadow-xs' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                Resolved
              </button>
            </div>

            {/* Category Tag Filters */}
            <div className="px-3 py-1.5 flex items-center space-x-1.5 overflow-x-auto bg-slate-50 border-b border-slate-100 text-[11px] text-slate-600">
              <span
                onClick={() => setCategoryFilter('all')}
                className={`px-2 py-0.5 rounded-md cursor-pointer whitespace-nowrap ${
                  categoryFilter === 'all'
                    ? 'bg-white border border-slate-200 text-slate-900 font-bold shadow-2xs'
                    : 'hover:bg-slate-200'
                }`}
              >
                All
              </span>
              <span
                onClick={() => setCategoryFilter('Quality/Damage')}
                className={`px-2 py-0.5 rounded-md cursor-pointer whitespace-nowrap ${
                  categoryFilter === 'Quality/Damage'
                    ? 'bg-white border border-slate-200 text-slate-900 font-bold shadow-2xs'
                    : 'hover:bg-slate-200'
                }`}
              >
                Quality/Damage
              </span>
              <span
                onClick={() => setCategoryFilter('Late Van')}
                className={`px-2 py-0.5 rounded-md cursor-pointer whitespace-nowrap ${
                  categoryFilter === 'Late Van'
                    ? 'bg-white border border-slate-200 text-slate-900 font-bold shadow-2xs'
                    : 'hover:bg-slate-200'
                }`}
              >
                Late Van
              </span>
              <span
                onClick={() => setCategoryFilter('Missing SKU')}
                className={`px-2 py-0.5 rounded-md cursor-pointer whitespace-nowrap ${
                  categoryFilter === 'Missing SKU'
                    ? 'bg-white border border-slate-200 text-slate-900 font-bold shadow-2xs'
                    : 'hover:bg-slate-200'
                }`}
              >
                Missing SKU
              </span>
            </div>

            {/* Scrollable Feed */}
            <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
              {filteredTickets.map((t) => {
                const isSelected = selectedTicket?.id === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className={`p-3 rounded-xl cursor-pointer transition shadow-2xs ${
                      isSelected
                        ? 'bg-[#edf8e7]/70 border-2 border-[#70b928]'
                        : 'bg-white border border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold tracking-wide">
                          #{t.ticket_number}
                        </span>
                        <span className="text-[10px] font-extrabold uppercase text-rose-700 tracking-wider">
                          {t.priority} Priority
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">{t.time}</span>
                    </div>
                    <div className="mt-1.5 flex items-baseline justify-between">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{t.restaurant_name}</h4>
                      <span className="inline-flex items-center space-x-0.5 text-[10px] font-bold text-[#142340] bg-[#d6eed0] px-1.5 py-0.2 rounded">
                        <span className="material-symbols-outlined text-[11px]">chat</span>
                        <span>{t.channel}</span>
                      </span>
                    </div>
                    <p className="text-[11px] font-semibold text-slate-800 mt-1 flex items-center space-x-1">
                      <span className="material-symbols-outlined text-rose-600 text-[14px]">broken_image</span>
                      <span className="truncate">{t.title}</span>
                    </p>
                    <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                      {t.description}
                    </p>
                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <div className="flex items-center space-x-1 text-rose-700 font-bold">
                        <span className="material-symbols-outlined text-[13px]">timer</span>
                        <span>{t.sla_left}</span>
                      </div>
                      <div className="flex items-center space-x-1.5 text-slate-600">
                        <span className="w-4 h-4 rounded-full bg-[#142340] text-white flex items-center justify-center text-[9px] font-bold">
                          {t.agent_initials}
                        </span>
                        <span>{t.agent_name}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>

          {/* COLUMN 2: Ticket Detail, Evidence & Hotshot Dispatch (Center Column) */}
          <section className="flex-1 flex flex-col bg-white rounded-2xl shadow-card border border-slate-200/80 overflow-hidden min-w-0">
            {/* Ticket Detail Header */}
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-base font-extrabold text-[#142340]">#{current.ticket_number}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 tracking-wide uppercase">
                      CRITICAL SLA
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                      {current.type}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-slate-500">
                    <span>Origin: Bay 3 Dock Inbound</span>
                    <span>•</span>
                    <Link
                      href={`/orders/${current.linked_order}`}
                      className="inline-flex items-center space-x-1 text-[#70b928] hover:underline font-semibold"
                    >
                      <span className="material-symbols-outlined text-[13px]">receipt_long</span>
                      <span>
                        Linked Order #{current.linked_order} ({current.linked_order_amount})
                      </span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Action Controls */}
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={() => handleStatusChange('resolved')}
                  className="px-3 py-1.5 rounded-xl bg-[#70b928] hover:bg-[#5da01f] text-white text-xs font-bold flex items-center space-x-1 shadow-sm transition"
                >
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  <span>Mark Resolved</span>
                </button>
                <button
                  onClick={() => handleStatusChange('escalated')}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition"
                >
                  Escalate Lead
                </button>
              </div>
            </div>

            {/* SLA Alert Countdown Banner */}
            <div className="bg-rose-50 border-b border-rose-200 px-5 py-2.5 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2 text-xs text-rose-800">
                <span className="material-symbols-outlined text-rose-600 text-base">alarm</span>
                <span className="font-semibold">Hotshot Resolution Target: 30 minutes</span>
                <span>•</span>
                <span className="font-bold text-rose-900">Remaining: {current.sla_left}</span>
              </div>
              <span className="text-[11px] font-bold text-rose-700 underline cursor-pointer">
                View SLA Protocol
              </span>
            </div>

            {/* Scrollable Center Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Incident Summary Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                  Customer Incident Report
                </h3>
                <p className="text-xs text-slate-800 leading-relaxed font-medium">{current.description}</p>
              </div>

              {/* Rapid Resolution Actions Grid */}
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                  Hotshot Resolution Actions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    onClick={() =>
                      alert('Hotshot Replacement Dispatched! Assigned to Courier Express Van #09 (ETA 25 mins).')
                    }
                    className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-[#70b928] hover:shadow-sm text-left transition group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#edf8e7] text-[#70b928] flex items-center justify-center mb-2 group-hover:scale-105 transition">
                      <span className="material-symbols-outlined text-lg">local_shipping</span>
                    </div>
                    <div className="font-bold text-xs text-slate-900">Hotshot Dispatch</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Send immediate replacement van</div>
                  </button>

                  <button
                    onClick={() =>
                      alert(
                        `SAR Credit Memo Issued! Refund of SAR 472.00 applied to ${current.restaurant_name} credit balance.`
                      )
                    }
                    className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-sm text-left transition group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-105 transition">
                      <span className="material-symbols-outlined text-lg">credit_card</span>
                    </div>
                    <div className="font-bold text-xs text-slate-900">Issue Credit Memo</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Apply SAR refund to ledger</div>
                  </button>

                  <button
                    onClick={() =>
                      alert(
                        `Escalation Notice sent to Warehouse Supervisor & Procurement QA for SKU batch inspection.`
                      )
                    }
                    className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-sm text-left transition group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-2 group-hover:scale-105 transition">
                      <span className="material-symbols-outlined text-lg">report_problem</span>
                    </div>
                    <div className="font-bold text-xs text-slate-900">QA Warehouse Alert</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Flag pallet batch for inspection</div>
                  </button>
                </div>
              </div>

              {/* Action Log / WhatsApp Update */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Post Resolution Update to WhatsApp
                </h3>
                <textarea
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  placeholder="Type official ticket update or resolution note to send directly to customer WhatsApp thread..."
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#70b928] h-20"
                ></textarea>
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      if (!actionNote) return;
                      alert(`Message posted to WhatsApp: "${actionNote}"`);
                      setActionNote('');
                    }}
                    className="px-4 py-2 bg-[#142340] hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 transition"
                  >
                    <span className="material-symbols-outlined text-sm">send</span>
                    <span>Send Customer WhatsApp Update</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* COLUMN 3: Restaurant Snapshot & Order Link (~300px) */}
          <aside className="w-72 shrink-0 hidden xl:flex flex-col bg-white rounded-2xl shadow-card border border-slate-200/80 overflow-hidden p-4 space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Restaurant Profile</h3>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="font-bold text-slate-900 text-sm">{current.restaurant_name}</div>
              <div className="text-[11px] text-slate-500">{current.restaurant_ar}</div>
              <div className="pt-2 border-t border-slate-200 space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Contact:</span>
                  <span className="font-bold text-slate-800">{current.contact_person}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Phone:</span>
                  <span className="font-mono text-emerald-700 font-bold">{current.contact_phone}</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#edf8e7] rounded-xl border border-[#d6eed0] space-y-2">
              <div className="text-xs font-bold text-[#142340]">Credit & Standing</div>
              <div className="flex justify-between text-xs text-slate-700">
                <span>Credit Limit:</span>
                <span className="font-bold text-slate-900">{current.credit_limit}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-700">
                <span>Current Utilized:</span>
                <span className="font-bold text-slate-900">{current.credit_used}</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                <div className="bg-[#70b928] h-full w-[28%]"></div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="text-xs font-bold text-slate-900">Linked Order Summary</div>
              <div className="flex justify-between text-xs text-slate-700">
                <span>Order Ref:</span>
                <Link href={`/orders/${current.linked_order}`} className="font-bold text-[#70b928] hover:underline">
                  #{current.linked_order}
                </Link>
              </div>
              <div className="flex justify-between text-xs text-slate-700">
                <span>Order Total:</span>
                <span className="font-bold text-slate-900">{current.linked_order_amount}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-700">
                <span>Status:</span>
                <span className="font-bold text-amber-700">In Delivery</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
