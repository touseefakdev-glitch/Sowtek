'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { updateTicketStatus } from '@/lib/api/tickets';
import { sendMessage } from '@/lib/api/conversations';
import type { TicketRow } from '@/lib/data/tickets';
import {
  TICKET_QUEUE_STATUSES,
  TICKET_TYPES,
  orderStatusMeta,
  ticketPriorityMeta,
  ticketStatusMeta,
  ticketTransitions,
  ticketTypeMeta,
  toneClasses,
  type TicketStatus,
} from '@/lib/domain/status';
import { formatCurrency, formatDateTime, formatDuration, initials } from '@/lib/format';
import { Button, EmptyState, ErrorState, PriorityBadge, TicketStatusBadge, Textarea } from '@/components/ui';

const CRITICAL_PRIORITIES = new Set(['high', 'urgent']);

export function TicketConsole({ initialTickets }: { initialTickets: TicketRow[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const statusFilter = searchParams.get('status') ?? 'all';
  const typeFilter = searchParams.get('type') ?? 'all';

  const [selectedId, setSelectedId] = useState<string | null>(initialTickets[0]?.id ?? null);
  const [actionNote, setActionNote] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [updating, setUpdating] = useState(false);

  const selected = useMemo(
    () => initialTickets.find((ticket) => ticket.id === selectedId) ?? null,
    [initialTickets, selectedId]
  );

  // A filter change can leave the selection pointing at a row that is no longer
  // in the result set, which rendered an empty detail pane.
  useEffect(() => {
    if (selectedId && !initialTickets.some((ticket) => ticket.id === selectedId)) {
      setSelectedId(initialTickets[0]?.id ?? null);
    }
  }, [initialTickets, selectedId]);

  const criticalCount = useMemo(
    () => initialTickets.filter((ticket) => CRITICAL_PRIORITIES.has(ticket.priority)).length,
    [initialTickets]
  );

  const statusCounts = useMemo(() => {
    const counts: Partial<Record<TicketStatus, number>> = {};
    for (const ticket of initialTickets) {
      counts[ticket.status] = (counts[ticket.status] ?? 0) + 1;
    }
    return counts;
  }, [initialTickets]);

  const applyFilter = (key: 'status' | 'type', value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value === 'all') next.delete(key);
    else next.set(key, value);
    router.replace(`/tickets?${next.toString()}`);
  };

  const handleStatusChange = async (next: string) => {
    if (!selected || updating) return;
    setUpdating(true);
    setActionError(null);
    try {
      await updateTicketStatus(selected.id, next, actionNote.trim() || undefined);
      setActionNote('');
      router.refresh();
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
      router.refresh();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'The WhatsApp message could not be dispatched.'
      );
    } finally {
      setSending(false);
    }
  };

  const transitions = selected ? ticketTransitions(selected.status) : [];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4 lg:flex-row">
      {/* Triage feed. On narrow screens this and the detail pane take turns:
          showing a fixed 320px feed beside the detail left both unusable. */}
      <aside
        aria-label="Ticket triage feed"
        className={`${selected ? 'hidden lg:flex' : 'flex'} w-full shrink-0 flex-col overflow-hidden rounded-card border border-line bg-surface shadow-card lg:w-80`}
      >
        <div className="flex flex-wrap items-center gap-1 border-b border-line px-3 py-2 text-xs">
          <span className="sr-only" id="ticket-status-filter-label">
            Filter by status
          </span>
          {[{ id: 'all' as const, label: 'All' }, ...TICKET_QUEUE_STATUSES.map((s) => ({ id: s, label: ticketStatusMeta(s).label })), { id: 'resolved' as const, label: 'Resolved' }].map(
            (tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => applyFilter('status', tab.id)}
                aria-pressed={statusFilter === tab.id}
                className={
                  statusFilter === tab.id
                    ? 'shrink-0 whitespace-nowrap rounded-control bg-navy px-2.5 py-1 font-bold text-ink-inverse'
                    : 'shrink-0 whitespace-nowrap rounded-control px-2.5 py-1 font-bold text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink'
                }
              >
                {tab.label}
                {tab.id !== 'all' && statusCounts[tab.id as TicketStatus] ? (
                  <span className="ml-1 opacity-70">{statusCounts[tab.id as TicketStatus]}</span>
                ) : null}
              </button>
            )
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1 border-b border-line bg-surface-sunken px-3 py-1.5 text-xs">
          <span className="sr-only" id="ticket-type-filter-label">
            Filter by type
          </span>
          {[{ id: 'all' as const, label: 'All' }, ...TICKET_TYPES.map((t) => ({ id: t, label: ticketTypeMeta(t).label }))].map(
            (tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => applyFilter('type', tab.id)}
                aria-pressed={typeFilter === tab.id}
                className={
                  typeFilter === tab.id
                    ? 'shrink-0 whitespace-nowrap rounded-pill border border-line bg-surface px-2 py-0.5 font-bold text-ink'
                    : 'shrink-0 whitespace-nowrap rounded-pill px-2 py-0.5 text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink'
                }
              >
                {tab.label}
              </button>
            )
          )}
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto p-2.5">
          {initialTickets.length === 0 ? (
            <EmptyState
              icon="support_agent"
              title="No tickets match these filters"
              description="Tickets are raised from the support workflow."
              className="border-0 px-0 py-8"
            />
          ) : (
            initialTickets.map((ticket) => {
              const isSelected = ticket.id === selectedId;
              const priority = ticketPriorityMeta(ticket.priority);
              return (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => setSelectedId(ticket.id)}
                  aria-current={isSelected ? 'true' : undefined}
                  className={
                    isSelected
                      ? 'w-full rounded-control border-2 border-lime bg-lime-tint/60 p-3 text-left'
                      : 'w-full rounded-control border border-line bg-surface p-3 text-left transition-colors hover:border-line-strong'
                  }
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5">
                      <span className="rounded-control bg-navy px-1.5 py-0.5 font-mono text-xs font-bold text-ink-inverse">
                        #{ticket.ticket_number || ticket.id.slice(0, 8)}
                      </span>
                      <span
                        className={`text-xs font-extrabold uppercase tracking-wide ${toneClasses(priority.tone)}`}
                      >
                        {priority.label}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-ink-subtle">
                      {formatDuration(ticket.created_at)}
                    </span>
                  </span>

                  <span className="mt-1.5 block truncate text-sm font-bold text-ink">
                    {ticket.restaurant?.name || 'Unknown restaurant'}
                  </span>

                  <span className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span className="rounded-pill bg-surface-hover px-2 py-0.5 text-xs font-semibold text-ink-secondary">
                      {ticketTypeMeta(ticket.type).label}
                    </span>
                    <TicketStatusBadge status={ticket.status} />
                  </span>

                  <span className="mt-1 line-clamp-2 block text-xs leading-relaxed text-ink-muted">
                    {ticket.description}
                  </span>

                  <span className="mt-2 flex items-center justify-between gap-2 border-t border-line pt-2 text-xs">
                    <span className="truncate text-ink-muted">
                      {ticket.agent?.full_name || 'Unassigned'}
                    </span>
                    {ticket.order?.order_number ? (
                      <span className="shrink-0 font-mono text-xs text-ink-subtle">
                        {ticket.order.order_number}
                      </span>
                    ) : null}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* Detail */}
      <section
        aria-label="Ticket detail"
        className={`${selected ? 'flex' : 'hidden lg:flex'} min-w-0 flex-1 flex-col overflow-hidden rounded-card border border-line bg-surface shadow-card`}
      >
        {!selected ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
            <span
              className="material-symbols-outlined text-[1.75rem] text-ink-subtle"
              aria-hidden
            >
              support_agent
            </span>
            <p className="text-sm font-bold text-ink">No ticket selected</p>
            <p className="max-w-xs text-xs text-ink-muted">
              Choose a ticket from the triage feed to review the incident and update the
              customer.
            </p>
          </div>
        ) : (
          <>
            <div className="flex shrink-0 flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-3.5">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedId(null)}
                    className="inline-flex items-center gap-1 rounded-control border border-line px-2 py-1 text-xs font-semibold text-ink-muted transition-colors hover:bg-surface-hover lg:hidden"
                  >
                    <span className="material-symbols-outlined text-[1rem]" aria-hidden>
                      arrow_back
                    </span>
                    Back
                  </button>
                  <span className="text-base font-extrabold text-ink">
                    #{selected.ticket_number || selected.id.slice(0, 8)}
                  </span>
                  <TicketStatusBadge status={selected.status} />
                  <PriorityBadge priority={selected.priority} />
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-ink-muted">
                  <span>{ticketTypeMeta(selected.type).label}</span>
                  <span aria-hidden>&bull;</span>
                  <span>Opened {formatDateTime(selected.created_at)}</span>
                  {selected.order ? (
                    <>
                      <span aria-hidden>&bull;</span>
                      <Link
                        href={`/orders/${selected.order.id}`}
                        className="inline-flex items-center gap-1 font-semibold text-ink underline underline-offset-2 hover:text-ink-secondary"
                      >
                        <span className="material-symbols-outlined text-[0.8125rem]" aria-hidden>
                          receipt_long
                        </span>
                        {selected.order.order_number || selected.order.id.slice(0, 8)} (
                        {orderStatusMeta(selected.order.status).label})
                      </Link>
                    </>
                  ) : null}
                </div>
              </div>

              <div
                role="group"
                aria-label="Available status transitions"
                className="flex shrink-0 flex-wrap items-center gap-2"
              >
                {transitions.length === 0 ? (
                  <p className="text-xs text-ink-subtle">This ticket is resolved.</p>
                ) : (
                  transitions.map((next) => (
                    <Button
                      key={next}
                      variant={next === 'escalated' ? 'danger' : next === 'resolved' ? 'primary' : 'secondary'}
                      loading={updating}
                      onClick={() => void handleStatusChange(next)}
                    >
                      {next === 'resolved'
                        ? 'Mark resolved'
                        : next === 'escalated'
                        ? 'Escalate'
                        : ticketStatusMeta(next).label}
                    </Button>
                  ))
                )}
              </div>
            </div>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
              {actionError ? <ErrorState message={actionError} /> : null}

              <div className="rounded-control border border-line bg-surface-sunken p-4">
                <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-secondary">
                  Customer incident report
                </h2>
                <p className="text-sm font-medium leading-relaxed text-ink">
                  {selected.description}
                </p>
                {selected.resolution ? (
                  <>
                    <h2 className="mb-2 mt-4 text-xs font-bold uppercase tracking-wider text-ink-secondary">
                      Resolution
                    </h2>
                    <p className="text-sm leading-relaxed text-ink-secondary">
                      {selected.resolution}
                    </p>
                  </>
                ) : null}
              </div>

              <div className="rounded-control border border-line p-4">
                <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-secondary">
                  Reply on the customer WhatsApp thread
                </h2>
                {selected.conversation_id ? (
                  <>
                    <Textarea
                      id="ticket-reply"
                      value={actionNote}
                      onChange={(event) => setActionNote(event.target.value)}
                      placeholder="Type the official update to send to the customer"
                      aria-label="Reply to send on the customer WhatsApp thread"
                    />
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs text-ink-subtle">
                        Delivered through the WhatsApp Cloud API. Dispatch failures are reported
                        by the API.
                      </p>
                      <Button
                        variant="primary"
                        icon="send"
                        loading={sending}
                        disabled={actionNote.trim().length === 0}
                        onClick={() => void handleSendWhatsApp()}
                      >
                        Send
                      </Button>
                    </div>
                  </>
                ) : (
                  <EmptyState
                    icon="forum"
                    title="No WhatsApp thread"
                    description="This ticket is not linked to a conversation, so no thread is available."
                    className="border-0 px-0 py-4"
                  />
                )}
              </div>
            </div>
          </>
        )}
      </section>

      {/* Customer snapshot. Desktop only; the detail pane already links out. */}
      {selected ? (
        <aside
          aria-label="Customer snapshot"
          className="hidden w-72 shrink-0 flex-col space-y-4 overflow-y-auto rounded-card border border-line bg-surface p-4 shadow-card xl:flex"
        >
          <h2 className="text-xs font-bold uppercase tracking-wider text-ink-secondary">
            Restaurant profile
          </h2>

          {selected.restaurant ? (
            <div className="space-y-2 rounded-control border border-line bg-surface-sunken p-3">
              <p className="text-sm font-bold text-ink">{selected.restaurant.name}</p>
              {selected.restaurant.name_ar ? (
                <p dir="rtl" lang="ar" className="font-arabic text-xs text-ink-muted">
                  {selected.restaurant.name_ar}
                </p>
              ) : null}
              <div className="space-y-1 border-t border-line pt-2 text-xs">
                {selected.restaurant.phone ? (
                  <div className="flex justify-between gap-2 text-ink-muted">
                    <span>Phone</span>
                    <span className="font-mono font-bold text-ink">
                      {selected.restaurant.phone}
                    </span>
                  </div>
                ) : null}
                {selected.restaurant.whatsapp_number ? (
                  <div className="flex justify-between gap-2 text-ink-muted">
                    <span>WhatsApp</span>
                    <span className="font-mono font-bold text-ink">
                      {selected.restaurant.whatsapp_number}
                    </span>
                  </div>
                ) : null}
              </div>
              <Link
                href={`/contacts/${selected.restaurant.id}`}
                className="mt-1 inline-block text-xs font-semibold text-ink underline underline-offset-2 hover:text-ink-secondary"
              >
                View 360° profile
              </Link>
            </div>
          ) : (
            <p className="rounded-control border border-dashed border-line-strong p-4 text-center text-xs text-ink-subtle">
              No restaurant linked.
            </p>
          )}

          {selected.order ? (
            <div className="space-y-2 rounded-control border border-line bg-surface-sunken p-3 text-xs">
              <p className="font-bold text-ink">Linked order</p>
              <div className="flex justify-between gap-2 text-ink-secondary">
                <span>Ref</span>
                <Link
                  href={`/orders/${selected.order.id}`}
                  className="font-bold text-ink underline underline-offset-2"
                >
                  {selected.order.order_number || selected.order.id.slice(0, 8)}
                </Link>
              </div>
              <div className="flex justify-between gap-2 text-ink-secondary">
                <span>Total</span>
                <span className="font-bold text-ink">
                  {formatCurrency(selected.order.total_amount)}
                </span>
              </div>
              <div className="flex justify-between gap-2 text-ink-secondary">
                <span>Status</span>
                <TicketStatusBadge status={selected.order.status} />
              </div>
            </div>
          ) : null}

          {selected.agent ? (
            <div className="space-y-2 rounded-control border border-line bg-surface-sunken p-3">
              <p className="text-xs font-bold text-ink">Assigned agent</p>
              <div className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="flex h-7 w-7 items-center justify-center rounded-pill bg-navy text-xs font-bold text-ink-inverse"
                >
                  {initials(selected.agent.full_name)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-xs font-semibold text-ink">
                    {selected.agent.full_name}
                  </span>
                  {selected.agent.role ? (
                    <span className="block text-xs capitalize text-ink-subtle">
                      {selected.agent.role}
                    </span>
                  ) : null}
                </span>
              </div>
            </div>
          ) : null}
        </aside>
      ) : null}

      {criticalCount > 0 ? (
        <p className="sr-only" role="status">
          {criticalCount} tickets are high or urgent priority.
        </p>
      ) : null}
    </div>
  );
}
