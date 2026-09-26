'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { getTickets, updateTicketStatus } from '@/lib/api/tickets';
import { sendMessage } from '@/lib/api/conversations';

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'New' },
  { key: 'investigating', label: 'Investigating' },
  { key: 'escalated', label: 'Escalated' },
  { key: 'resolved', label: 'Resolved' },
] as const;

const TYPE_TABS = [
  { key: 'all', label: 'All' },
  { key: 'quality', label: 'Quality' },
  { key: 'delivery', label: 'Delivery' },
  { key: 'missing_item', label: 'Missing item' },
  { key: 'wrong_item', label: 'Wrong item' },
  { key: 'payment', label: 'Payment' },
  { key: 'other', label: 'Other' },
] as const;

interface Ticket {
  id: string;
  ticket_number: string | null;
  type: string;
  status: string;
  priority: string;
  description: string;
  resolution: string | null;
  created_at: string;
  resolved_at: string | null;
  conversation_id: string | null;
  restaurant: {
    id: string;
    name: string;
    name_ar: string | null;
    phone: string | null;
    whatsapp_number: string | null;
  } | null;
  agent: { id: string; full_name: string; role: string } | null;
  order: { id: string; order_number: string | null; status: string; total_amount: number } | null;
}

function formatAge(iso: string): string {
  const elapsed = Date.now() - new Date(iso).getTime();
  const totalMinutes = Math.max(0, Math.floor(elapsed / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${totalMinutes % 60}m`;
  return `${totalMinutes}m`;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString([], {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function initialsOf(name: string | null | undefined): string {
  if (!name) return '--';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [actionNote, setActionNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [updating, setUpdating] = useState(false);

  const loadTickets = useCallback(async () => {
    setError(null);
    try {
      const res = await getTickets({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined,
        search: search || undefined,
        limit: 50,
      });
      const list = (res.data ?? []) as Ticket[];
      setTickets(list);
      setSelectedId((current) =>
        current && list.some((t) => t.id === current) ? current : (list[0]?.id ?? null)
      );
    } catch (err) {
      setTickets([]);
      setSelectedId(null);
      setError(err instanceof Error ? err.message : 'Unable to load tickets.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, search]);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => void loadTickets(), search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [loadTickets, search]);

  const selected = useMemo(
    () => tickets.find((t) => t.id === selectedId) ?? null,
    [tickets, selectedId]
  );

  const criticalCount = useMemo(
    () => tickets.filter((t) => t.priority === 'urgent' || t.priority === 'high').length,
    [tickets]
  );

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const ticket of tickets) {
      counts[ticket.status] = (counts[ticket.status] ?? 0) + 1;
    }
    return counts;
  }, [tickets]);

  const handleStatusChange = async (newStatus: string) => {
    if (!selected || updating) return;
    setUpdating(true);
    setActionError(null);
    try {
      await updateTicketStatus(selected.id, newStatus, actionNote || undefined);
      await loadTickets();
      setActionNote('');
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'The status update was rejected by the API.'
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleSendWhatsApp = async () => {
    const body = actionNote.trim();
    if (!selected?.conversation_id || !body) {
      setActionError('This ticket is not linked to a WhatsApp conversation thread.');
      return;
    }
    setSending(true);
    setActionError(null);
    try {
      await sendMessage(selected.conversation_id, { body });
      setActionNote('');
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'The WhatsApp message could not be dispatched.'
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f1f3f7] font-sans text-slate-800">
      <AppSidebar />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 shadow-xs">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-[#142340]">Tickets &amp; Escalations</h1>
            {criticalCount > 0 && (
              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700">
                {criticalCount} high severity
              </span>
            )}
          </div>

          <div className="hidden items-center gap-6 text-xs lg:flex">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-slate-400">
                confirmation_number
              </span>
              <div className="leading-tight">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Loaded
                </span>
                <span className="font-bold text-slate-900">{tickets.length}</span>
              </div>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-rose-600">warning</span>
              <div className="leading-tight">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  High severity
                </span>
                <span className="font-bold text-rose-600">{criticalCount}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="flex flex-1 gap-4 overflow-hidden p-4">
          {/* Triage feed */}
          <aside className="flex w-80 shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
            <div className="border-b border-slate-100 p-3">
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-lg text-slate-400">
                  search
                </span>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#70b928]"
                  placeholder="Search ticket # or description..."
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-100 px-3 py-2 text-xs">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setStatusFilter(tab.key)}
                  className={`flex shrink-0 items-center gap-1 whitespace-nowrap rounded-lg px-2.5 py-1 font-bold transition ${
                    statusFilter === tab.key
                      ? 'bg-[#142340] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.key !== 'all' && statusCounts[tab.key] ? (
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                        statusFilter === tab.key ? 'bg-white/20' : 'bg-slate-200 text-slate-800'
                      }`}
                    >
                      {statusCounts[tab.key]}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-100 bg-slate-50 px-3 py-1.5 text-[11px] text-slate-600">
              {TYPE_TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setTypeFilter(tab.key)}
                  className={`shrink-0 whitespace-nowrap rounded-md px-2 py-0.5 transition ${
                    typeFilter === tab.key
                      ? 'border border-slate-200 bg-white font-bold text-slate-900 shadow-2xs'
                      : 'hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto p-2.5">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-700">
                  {error}
                </div>
              )}

              {loading && tickets.length === 0 && (
                <p className="py-10 text-center text-[11px] text-slate-400">Loading tickets...</p>
              )}

              {!loading && !error && tickets.length === 0 && (
                <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-[11px] leading-relaxed text-slate-400">
                  No tickets match these filters.
                  <br />
                  Tickets are created from the support workflow.
                </p>
              )}

              {tickets.map((ticket) => {
                const isSelected = ticket.id === selectedId;
                return (
                  <button
                    key={ticket.id}
                    type="button"
                    onClick={() => setSelectedId(ticket.id)}
                    className={`w-full rounded-xl p-3 text-left shadow-2xs transition ${
                      isSelected
                        ? 'border-2 border-[#70b928] bg-[#edf8e7]/70'
                        : 'border border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white">
                          #{ticket.ticket_number || ticket.id.slice(0, 8)}
                        </span>
                        <span
                          className={`text-[10px] font-extrabold uppercase tracking-wider ${
                            ticket.priority === 'urgent' || ticket.priority === 'high'
                              ? 'text-rose-700'
                              : 'text-slate-500'
                          }`}
                        >
                          {ticket.priority}
                        </span>
                      </div>
                      <span className="text-[11px] font-medium text-slate-400">
                        {formatAge(ticket.created_at)}
                      </span>
                    </div>

                    <h4 className="mt-1.5 truncate text-xs font-bold text-slate-900">
                      {ticket.restaurant?.name || 'Unknown restaurant'}
                    </h4>

                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold capitalize text-slate-600">
                        {ticket.type.replace(/_/g, ' ')}
                      </span>
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold capitalize text-slate-600">
                        {ticket.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-600">
                      {ticket.description}
                    </p>

                    <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px]">
                      <span className="truncate text-slate-500">
                        {ticket.agent?.full_name || 'Unassigned'}
                      </span>
                      {ticket.order?.order_number && (
                        <span className="font-mono text-[10px] text-slate-400">
                          {ticket.order.order_number}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Detail */}
          <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
            {!selected ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <span className="material-symbols-outlined text-[24px]">support_agent</span>
                </div>
                <p className="text-sm font-bold text-slate-700">No ticket selected</p>
                <p className="max-w-xs text-xs text-slate-400">
                  Choose a ticket from the triage feed to review the incident and update the
                  customer.
                </p>
              </div>
            ) : (
              <>
                <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-3.5">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-extrabold text-[#142340]">
                        #{selected.ticket_number || selected.id.slice(0, 8)}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold capitalize text-slate-700">
                        {selected.type.replace(/_/g, ' ')}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                          selected.priority === 'urgent' || selected.priority === 'high'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {selected.priority} priority
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span>Opened {formatDateTime(selected.created_at)}</span>
                      {selected.order && (
                        <>
                          <span>&bull;</span>
                          <Link
                            href={`/orders/${selected.order.id}`}
                            className="inline-flex items-center gap-1 font-semibold text-[#70b928] hover:underline"
                          >
                            <span className="material-symbols-outlined text-[13px]">
                              receipt_long
                            </span>
                            <span>
                              {selected.order.order_number || selected.order.id.slice(0, 8)} (
                              {selected.order.status.replace(/_/g, ' ')})
                            </span>
                          </Link>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      disabled={updating}
                      onClick={() => void handleStatusChange('resolved')}
                      className="flex items-center gap-1 rounded-xl bg-[#70b928] px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#5da01f] disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      <span>Mark resolved</span>
                    </button>
                    <button
                      type="button"
                      disabled={updating}
                      onClick={() => void handleStatusChange('escalated')}
                      className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                    >
                      Escalate
                    </button>
                  </div>
                </div>

                <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
                  {actionError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-700">
                      {actionError}
                    </div>
                  )}

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-900">
                      Customer incident report
                    </h3>
                    <p className="text-xs font-medium leading-relaxed text-slate-800">
                      {selected.description}
                    </p>
                    {selected.resolution && (
                      <>
                        <h3 className="mb-2 mt-4 text-xs font-bold uppercase tracking-wider text-slate-900">
                          Resolution
                        </h3>
                        <p className="text-xs leading-relaxed text-slate-700">
                          {selected.resolution}
                        </p>
                      </>
                    )}
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4">
                    <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-900">
                      Reply on the customer WhatsApp thread
                    </h3>
                    {selected.conversation_id ? (
                      <>
                        <textarea
                          value={actionNote}
                          onChange={(e) => setActionNote(e.target.value)}
                          placeholder="Type the official update to send to the customer..."
                          className="h-20 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#70b928]"
                        />
                        <div className="mt-2 flex items-center justify-between">
                          <p className="text-[10px] text-slate-400">
                            Delivered through the WhatsApp Cloud API. Dispatch failures are reported
                            by the API.
                          </p>
                          <button
                            type="button"
                            disabled={sending || actionNote.trim().length === 0}
                            onClick={() => void handleSendWhatsApp()}
                            className="flex items-center gap-1.5 rounded-xl bg-[#142340] px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {sending ? (
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            ) : (
                              <span className="material-symbols-outlined text-sm">send</span>
                            )}
                            <span>Send</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <p className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-[11px] text-slate-400">
                        This ticket is not linked to a conversation, so no WhatsApp thread is
                        available.
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}
          </section>

          {/* Customer snapshot */}
          <aside className="hidden w-72 shrink-0 flex-col space-y-4 overflow-y-auto rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card xl:flex">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Restaurant profile
            </h3>

            {selected?.restaurant ? (
              <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-sm font-bold text-slate-900">{selected.restaurant.name}</div>
                {selected.restaurant.name_ar && (
                  <div className="font-arabic text-[11px] text-slate-500">
                    {selected.restaurant.name_ar}
                  </div>
                )}
                <div className="space-y-1 border-t border-slate-200 pt-2 text-xs">
                  {selected.restaurant.phone && (
                    <div className="flex justify-between text-slate-600">
                      <span>Phone</span>
                      <span className="font-mono font-bold text-slate-800">
                        {selected.restaurant.phone}
                      </span>
                    </div>
                  )}
                  {selected.restaurant.whatsapp_number && (
                    <div className="flex justify-between text-slate-600">
                      <span>WhatsApp</span>
                      <span className="font-mono font-bold text-emerald-700">
                        {selected.restaurant.whatsapp_number}
                      </span>
                    </div>
                  )}
                </div>
                <Link
                  href={`/contacts/${selected.restaurant.id}`}
                  className="mt-1 inline-block rounded-lg bg-slate-100 px-3 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-200"
                >
                  View 360° profile
                </Link>
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-[11px] text-slate-400">
                No restaurant linked.
              </p>
            )}

            {selected?.order && (
              <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-xs font-bold text-slate-900">Linked order</div>
                <div className="flex justify-between text-xs text-slate-700">
                  <span>Ref</span>
                  <Link
                    href={`/orders/${selected.order.id}`}
                    className="font-bold text-[#70b928] hover:underline"
                  >
                    {selected.order.order_number || selected.order.id.slice(0, 8)}
                  </Link>
                </div>
                <div className="flex justify-between text-xs text-slate-700">
                  <span>Total</span>
                  <span className="font-bold text-slate-900">
                    SAR {Number(selected.order.total_amount).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-slate-700">
                  <span>Status</span>
                  <span className="font-bold capitalize text-slate-900">
                    {selected.order.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            )}

            {selected?.agent && (
              <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-xs font-bold text-slate-900">Assigned agent</div>
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#142340] text-[10px] font-bold text-white">
                    {initialsOf(selected.agent.full_name)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-semibold text-slate-800">
                      {selected.agent.full_name}
                    </span>
                    <span className="block text-[10px] capitalize text-slate-400">
                      {selected.agent.role}
                    </span>
                  </span>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
