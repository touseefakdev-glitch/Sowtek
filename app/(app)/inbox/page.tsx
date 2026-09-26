'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getConversations,
  getMessages,
  sendMessage,
  updateConversation,
  type ConversationFilters,
} from '@/lib/api/conversations';

type Channel = 'whatsapp' | 'email' | 'sms' | 'facebook' | 'instagram';
type ConversationStatus = 'active' | 'in_process' | 'completed' | 'archived';

interface Conversation {
  id: string;
  restaurant_id: string | null;
  whatsapp_number: string;
  channel: Channel;
  status: ConversationStatus;
  assigned_agent: string | null;
  last_message: string | null;
  last_message_at: string;
  unread_count: number;
  sla_deadline: string | null;
  restaurant: { id: string; name: string; name_ar: string | null } | null;
  agent: { id: string; full_name: string; avatar_url: string | null } | null;
}

interface Message {
  id: string;
  conversation_id: string;
  direction: 'inbound' | 'outbound';
  body: string | null;
  media_url: string | null;
  media_type: string | null;
  status: string;
  created_at: string;
  sender: { id: string; full_name: string; avatar_url: string | null } | null;
}

const STATUS_TABS: Array<{ key: ConversationStatus; label: string }> = [
  { key: 'active', label: 'Active' },
  { key: 'in_process', label: 'In Process' },
  { key: 'completed', label: 'Completed' },
  { key: 'archived', label: 'Archived' },
];

const CHANNEL_ICON: Record<Channel, string> = {
  whatsapp: 'chat',
  email: 'mail',
  sms: 'sms',
  facebook: 'public',
  instagram: 'photo_camera',
};

function formatClock(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDayLabel(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  if (isToday) return formatClock(iso);

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

  return date.toLocaleDateString([], { day: '2-digit', month: 'short' });
}

function slaLabel(iso: string | null): { text: string; breached: boolean } | null {
  if (!iso) return null;
  const remainingMs = new Date(iso).getTime() - Date.now();
  if (Number.isNaN(remainingMs)) return null;

  const totalMinutes = Math.floor(Math.abs(remainingMs) / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const text = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  return remainingMs < 0
    ? { text: `Breached ${text} ago`, breached: true }
    : { text, breached: false };
}

function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
      <span className="material-symbols-outlined text-[18px] text-red-500">error</span>
      <div className="flex-1">
        <p className="font-semibold">Could not load live data</p>
        <p className="mt-0.5 break-words text-red-600">{message}</p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 rounded-lg border border-red-300 px-2.5 py-1 font-semibold text-red-700 transition hover:bg-red-100"
        >
          Retry
        </button>
      )}
    </div>
  );
}

function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <span className="material-symbols-outlined text-[24px]">inbox</span>
      </div>
      <p className="text-sm font-bold text-slate-700">{title}</p>
      <p className="max-w-xs text-xs leading-relaxed text-slate-400">{hint}</p>
    </div>
  );
}

export default function InboxPage() {
  const router = useRouter();

  const [statusFilter, setStatusFilter] = useState<ConversationStatus>('active');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [counts, setCounts] = useState<Record<ConversationStatus, number> | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [threadError, setThreadError] = useState<string | null>(null);

  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendingStatus, setSendingStatus] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadConversations = useCallback(
    async (signal?: AbortSignal) => {
      setListError(null);
      try {
        const filters: ConversationFilters = { status: statusFilter, limit: 50 };
        if (debouncedSearch) filters.search = debouncedSearch;

        const [activeRes, inProcessRes, completedRes, archivedRes] = await Promise.all([
          getConversations({ status: 'active', limit: 1, search: debouncedSearch || undefined }),
          getConversations({ status: 'in_process', limit: 1, search: debouncedSearch || undefined }),
          getConversations({ status: 'completed', limit: 1, search: debouncedSearch || undefined }),
          getConversations({ status: 'archived', limit: 1, search: debouncedSearch || undefined }),
        ]);

        setCounts({
          active: activeRes.meta?.count ?? 0,
          in_process: inProcessRes.meta?.count ?? 0,
          completed: completedRes.meta?.count ?? 0,
          archived: archivedRes.meta?.count ?? 0,
        });

        const listResponse = await getConversations(filters);
        if (signal?.aborted) return;

        const list = (listResponse.data ?? []) as Conversation[];
        setConversations(list);
        setSelectedId((current) => {
          if (current && list.some((item) => item.id === current)) return current;
          return list[0]?.id ?? null;
        });
      } catch (err) {
        if (signal?.aborted) return;
        setConversations([]);
        setCounts(null);
        setListError(
          err instanceof Error ? err.message : 'Unable to reach the conversations API.'
        );
      } finally {
        if (!signal?.aborted) setListLoading(false);
      }
    },
    [statusFilter, debouncedSearch]
  );

  useEffect(() => {
    const controller = new AbortController();
    setListLoading(true);
    loadConversations(controller.signal);
    return () => controller.abort();
  }, [loadConversations]);

  const selected = useMemo(
    () => conversations.find((item) => item.id === selectedId) ?? null,
    [conversations, selectedId]
  );

  const loadMessages = useCallback(async (conversationId: string) => {
    setThreadError(null);
    setThreadLoading(true);
    try {
      const response = await getMessages(conversationId, 1, 100);
      setMessages((response.data ?? []) as Message[]);
    } catch (err) {
      setMessages([]);
      setThreadError(
        err instanceof Error ? err.message : 'Unable to load this conversation thread.'
      );
    } finally {
      setThreadLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return;
    }
    loadMessages(selectedId);
  }, [selectedId, loadMessages]);

  const handleSelect = async (conversation: Conversation) => {
    setSelectedId(conversation.id);
    setActionError(null);
    setSendingStatus(null);

    if (conversation.unread_count > 0) {
      try {
        await updateConversation(conversation.id, { unread_count: 0 });
        setConversations((prev) =>
          prev.map((item) =>
            item.id === conversation.id ? { ...item, unread_count: 0 } : item
          )
        );
      } catch (err) {
        setActionError(
          err instanceof Error ? err.message : 'Could not clear the unread badge.'
        );
      }
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body || !selectedId || sending) return;

    setSending(true);
    setActionError(null);
    setSendingStatus('Sending via WhatsApp Cloud API...');

    try {
      const response = await sendMessage(selectedId, { body });
      const created = response.data as Message | null;
      if (created) {
        setMessages((prev) => [...prev, created]);
      }
      setDraft('');
      setSendingStatus('Sent.');
      void loadConversations();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'The message could not be dispatched.'
      );
      setSendingStatus(null);
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (status: ConversationStatus) => {
    if (!selectedId) return;
    setActionError(null);
    setSendingStatus('Updating thread status...');
    try {
      await updateConversation(selectedId, { status });
      setConversations((prev) =>
        prev.map((item) => (item.id === selectedId ? { ...item, status } : item))
      );
      setSendingStatus('Thread status updated.');
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Could not update the thread status.'
      );
      setSendingStatus(null);
    }
  };

  const handleResolve = async () => {
    if (!selected) return;
    const next: ConversationStatus = selected.status === 'completed' ? 'active' : 'completed';
    await handleStatusChange(next);
  };

  const selectedSla = selected ? slaLabel(selected.sla_deadline) : null;

  return (
    <>
      <div className="flex min-w-0 flex-1">
        {/* Conversation list */}
        <section className="flex w-full max-w-[400px] flex-col border-r border-slate-200 bg-white md:w-[360px]">
          <header className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-sm font-black text-[#142340]">Unified Inbox</h1>
              <button
                type="button"
                onClick={() => void loadConversations()}
                className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Refresh
              </button>
            </div>

            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <span className="material-symbols-outlined text-[18px]">search</span>
              </div>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search number or last message"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#142340] focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {STATUS_TABS.map((tab) => {
                const isActive = tab.key === statusFilter;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setStatusFilter(tab.key)}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                      isActive
                        ? 'bg-[#142340] text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {tab.label}
                    {counts ? (
                      <span className={`ml-1 ${isActive ? 'text-white/70' : 'text-slate-400'}`}>
                        {counts[tab.key]}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {listError && (
              <div className="p-4">
                <ErrorBanner message={listError} onRetry={() => void loadConversations()} />
              </div>
            )}

            {!listError && listLoading && (
              <div className="flex items-center justify-center gap-2 py-16 text-xs text-slate-400">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-transparent" />
                Loading conversations...
              </div>
            )}

            {!listError && !listLoading && conversations.length === 0 && (
              <EmptyState
                title="No conversations"
                hint={
                  debouncedSearch
                    ? `No ${statusFilter.replace('_', ' ')} threads match "${debouncedSearch}".`
                    : `There are no ${statusFilter.replace('_', ' ')} threads yet. Threads appear here once a customer message is received.`
                }
              />
            )}

            {!listError &&
              conversations.map((conversation) => {
                const isSelected = conversation.id === selectedId;
                const displayName =
                  conversation.restaurant?.name ||
                  conversation.restaurant?.name_ar ||
                  conversation.whatsapp_number;
                const sla = slaLabel(conversation.sla_deadline);

                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => void handleSelect(conversation)}
                    className={`flex w-full flex-col gap-1.5 border-b border-slate-100 px-5 py-3.5 text-left transition ${
                      isSelected ? 'bg-[#eef8eb]' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span
                          className={`material-symbols-outlined text-[15px] ${
                            conversation.channel === 'whatsapp' ? 'text-emerald-600' : 'text-slate-400'
                          }`}
                        >
                          {CHANNEL_ICON[conversation.channel]}
                        </span>
                        <span className="truncate text-xs font-bold text-slate-900">
                          {displayName}
                        </span>
                      </span>
                      <span className="shrink-0 text-[10px] font-medium text-slate-400">
                        {formatDayLabel(conversation.last_message_at)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[11px] text-slate-500">
                        {conversation.last_message || 'No messages yet'}
                      </p>
                      {conversation.unread_count > 0 && (
                        <span className="shrink-0 rounded-full bg-[#70b928] px-1.5 py-0.5 text-[10px] font-bold text-white">
                          {conversation.unread_count}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold capitalize text-slate-600">
                        {conversation.channel}
                      </span>
                      <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold capitalize text-slate-600">
                        {conversation.status.replace('_', ' ')}
                      </span>
                      {sla && (
                        <span
                          className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                            sla.breached
                              ? 'bg-red-50 text-red-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          SLA {sla.text}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
          </div>
        </section>

        {/* Thread panel */}
        <section className="hidden min-w-0 flex-1 flex-col bg-[#f4f6f9] md:flex">
          {!selected ? (
            <EmptyState
              title="No thread selected"
              hint="Select a conversation on the left to read its message history and reply."
            />
          ) : (
            <>
              <header className="flex flex-col gap-3 border-b border-slate-200 bg-white px-6 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-black text-[#142340]">
                      {selected.restaurant?.name ||
                        selected.restaurant?.name_ar ||
                        selected.whatsapp_number}
                    </h2>
                    <p className="mt-0.5 font-mono text-[11px] text-slate-500">
                      {selected.whatsapp_number}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold capitalize text-slate-600">
                        {selected.channel}
                      </span>
                      <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold capitalize text-slate-600">
                        {selected.status.replace('_', ' ')}
                      </span>
                      {selected.agent && (
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                          {selected.agent.full_name}
                        </span>
                      )}
                      {selectedSla && (
                        <span
                          className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                            selectedSla.breached
                              ? 'bg-red-50 text-red-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          SLA {selectedSla.text}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <div className="flex flex-wrap justify-end gap-1.5">
                      {STATUS_TABS.filter((tab) => tab.key !== 'archived').map((tab) => (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => void handleStatusChange(tab.key)}
                          disabled={selected.status === tab.key}
                          className={`rounded-lg px-2.5 py-1 text-[11px] font-bold capitalize transition ${
                            selected.status === tab.key
                              ? 'bg-[#142340] text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                    {selected.restaurant_id && (
                      <button
                        type="button"
                        onClick={() => router.push(`/contacts/${selected.restaurant_id}`)}
                        className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50"
                      >
                        View customer
                      </button>
                    )}
                  </div>
                </div>

                {(actionError || sendingStatus) && (
                  <div
                    className={`rounded-lg px-3 py-2 text-[11px] font-semibold ${
                      actionError
                        ? 'border border-red-200 bg-red-50 text-red-700'
                        : 'bg-slate-50 text-slate-600'
                    }`}
                  >
                    {actionError || sendingStatus}
                  </div>
                )}
              </header>

              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                {threadError && (
                  <ErrorBanner
                    message={threadError}
                    onRetry={() => void loadMessages(selected.id)}
                  />
                )}

                {!threadError && threadLoading && (
                  <div className="flex items-center justify-center gap-2 py-16 text-xs text-slate-400">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-transparent" />
                    Loading messages...
                  </div>
                )}

                {!threadError && !threadLoading && messages.length === 0 && (
                  <EmptyState
                    title="No messages yet"
                    hint="This thread has no stored messages. Send the first reply below."
                  />
                )}

                {!threadError &&
                  messages.map((message) => {
                    const isOutbound = message.direction === 'outbound';
                    return (
                      <div
                        key={message.id}
                        className={`mb-3 flex ${isOutbound ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs shadow-sm ${
                            isOutbound
                              ? 'bg-[#142340] text-white'
                              : 'border border-slate-200 bg-white text-slate-800'
                          }`}
                        >
                          {message.body && <p className="whitespace-pre-wrap">{message.body}</p>}
                          {message.media_url && (
                            <a
                              href={message.media_url}
                              target="_blank"
                              rel="noreferrer"
                              className={`mt-1.5 block text-[10px] font-semibold underline ${
                                isOutbound ? 'text-emerald-200' : 'text-[#2c771c]'
                              }`}
                            >
                              {message.media_type || 'attachment'}
                            </a>
                          )}
                          <div
                            className={`mt-1.5 flex items-center justify-end gap-2 text-[10px] ${
                              isOutbound ? 'text-white/60' : 'text-slate-400'
                            }`}
                          >
                            <span>{formatClock(message.created_at)}</span>
                            {isOutbound && (
                              <span className="capitalize">{message.status}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>

              <form
                onSubmit={handleSend}
                className="border-t border-slate-200 bg-white px-6 py-4"
              >
                <div className="flex items-end gap-3">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        e.currentTarget.form?.requestSubmit();
                      }
                    }}
                    rows={2}
                    placeholder={`Reply over ${selected.channel}...`}
                    className="flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#142340] focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={sending || draft.trim().length === 0}
                    className="flex items-center gap-2 rounded-xl bg-[#142340] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {sending ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <span className="material-symbols-outlined text-[16px]">send</span>
                    )}
                    Send
                  </button>
                </div>
                <p className="mt-2 text-[10px] text-slate-400">
                  Delivery is confirmed by the WhatsApp Cloud API response. Messages that fail to
                  dispatch are recorded as failed.
                </p>
              </form>
            </>
          )}
        </section>
      </div>
    </>
  );
}
