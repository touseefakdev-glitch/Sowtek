'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  getMessages,
  sendMessage,
  updateConversation,
} from '@/lib/api/conversations';
import type { ConversationRow, MessageRow } from '@/lib/data/conversations';
import { assessSla } from '@/lib/domain/sla';
import { CONVERSATION_STATUSES, lifecycleMeta, toneClasses } from '@/lib/domain/status';
import { formatClock, formatDayLabel } from '@/lib/format';
import { Button, EmptyState, ErrorState, LoadingState, Textarea } from '@/components/ui';
import { useRealtime } from '@/components/providers/RealtimeProvider';
import type { ConversationStatus } from '@/lib/domain/status';

const CHANNEL_ICON: Record<string, string> = {
  whatsapp: 'chat',
  email: 'mail',
  sms: 'sms',
  facebook: 'public',
  instagram: 'photo_camera',
};

const STATUS_LABELS: Record<ConversationStatus, string> = {
  active: 'Active',
  in_process: 'In Process',
  completed: 'Completed',
  archived: 'Archived',
};

function SlaChip({ deadline }: { deadline: string | null }) {
  const sla = assessSla(deadline);
  if (!sla) return null;
  return (
    <span className={`rounded-pill px-2 py-0.5 text-xs font-semibold ${toneClasses(sla.tone)}`}>
      SLA {sla.label}
    </span>
  );
}

export function InboxView({
  initialConversations,
  initialCounts,
  initialMessages,
  initialSelectedId,
  search,
  status,
}: {
  initialConversations: ConversationRow[];
  initialCounts: Record<ConversationStatus, number>;
  initialMessages: MessageRow[];
  initialSelectedId: string | null;
  search: string;
  status: ConversationStatus;
}) {
  const router = useRouter();
  const { addToast } = useRealtime();

  const [conversations, setConversations] = useState<ConversationRow[]>(initialConversations);
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId);
  const [messages, setMessages] = useState<MessageRow[]>(initialMessages);
  const [threadLoading, setThreadLoading] = useState(false);
  const [threadError, setThreadError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const threadEnd = useRef<HTMLDivElement | null>(null);

  const selected = useMemo(
    () => conversations.find((item) => item.id === selectedId) ?? null,
    [conversations, selectedId]
  );

  // A chat must open at the newest message, otherwise the reply box sits above
  // a wall of history and the conversation reads as empty.
  useEffect(() => {
    threadEnd.current?.scrollIntoView({ block: 'end' });
  }, [messages.length, selectedId]);

  const loadMessages = useCallback(async (conversationId: string) => {
    setThreadError(null);
    setThreadLoading(true);
    try {
      const response = await getMessages(conversationId, 1, 100);
      setMessages((response.data ?? []) as MessageRow[]);
    } catch (err) {
      setMessages([]);
      setThreadError(
        err instanceof Error ? err.message : 'Unable to load this conversation thread.'
      );
    } finally {
      setThreadLoading(false);
    }
  }, []);

  const select = useCallback(
    async (conversation: ConversationRow) => {
      setSelectedId(conversation.id);
      setActionError(null);
      setMessages([]);
      await loadMessages(conversation.id);

      if ((conversation.unread_count ?? 0) > 0) {
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
    },
    [loadMessages]
  );

  const applyFilter = (next: ConversationStatus) => {
    const params = new URLSearchParams();
    if (next !== 'active') params.set('status', next);
    if (search) params.set('q', search);
    router.replace(`/inbox?${params.toString()}`);
  };

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body || !selectedId || sending) return;

    setSending(true);
    setActionError(null);
    try {
      const response = await sendMessage(selectedId, { body });
      const created = response.data as MessageRow | null;
      if (created) setMessages((prev) => [...prev, created]);
      setDraft('');
      router.refresh();
      // The composer clearing is the only confirmation of a sent message, and
      // it is invisible to a screen reader user. Announce the send itself.
      addToast({ title: 'Message sent', body: 'Your reply was added to the thread.' });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'The message could not be dispatched.');
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (next: ConversationStatus) => {
    if (!selectedId) return;
    setActionError(null);
    try {
      await updateConversation(selectedId, { status: next });
      setConversations((prev) =>
        prev.map((item) => (item.id === selectedId ? { ...item, status: next } : item))
      );
      addToast({
        title: 'Thread status updated',
        body: `This conversation is now ${lifecycleMeta(next).label}.`,
      });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not update the thread status.');
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col md:flex-row">
      {/* Conversation list. Below md this and the thread take turns, because the
          thread panel used to be `hidden md:flex` outright, which meant tapping
          a conversation on a phone did nothing visible at all. */}
      <section
        aria-label="Conversations"
        className={`${selected ? 'hidden md:flex' : 'flex'} w-full flex-col border-r border-line bg-surface md:w-96 md:shrink-0`}
      >
        <header className="flex flex-col gap-3 border-b border-line px-5 py-4">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-xl font-bold text-ink">Unified inbox</h1>
            <Button icon="refresh" onClick={() => router.refresh()}>
              Refresh
            </Button>
          </div>

          <form role="search" action="/inbox" className="flex items-center gap-2">
            {status !== 'active' ? <input type="hidden" name="status" value={status} /> : null}
            <input
              type="search"
              name="q"
              defaultValue={search}
              placeholder="Search number or last message"
              aria-label="Search conversations"
              className="w-full rounded-control border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-subtle transition-colors hover:border-line-strong focus:border-sky focus:outline-none focus:ring-2 focus:ring-sky/35"
            />
            <button
              type="submit"
              className="shrink-0 rounded-control border border-line bg-surface px-3 py-2 text-sm font-semibold text-ink transition-colors hover:bg-surface-hover"
            >
              Search
            </button>
          </form>

          <div className="flex flex-wrap gap-1.5">
            {CONVERSATION_STATUSES.map((key) => {
              const isActive = key === status;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => applyFilter(key)}
                  aria-pressed={isActive}
                  className={
                    isActive
                      ? 'rounded-control bg-navy px-2.5 py-1 text-xs font-bold text-ink-inverse'
                      : 'rounded-control bg-surface-hover px-2.5 py-1 text-xs font-bold text-ink-muted transition-colors hover:bg-line'
                  }
                >
                  {STATUS_LABELS[key]}
                  <span className={`ml-1 ${isActive ? 'text-ink-inverse/70' : 'text-ink-subtle'}`}>
                    {initialCounts[key] ?? 0}
                  </span>
                </button>
              );
            })}
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <EmptyState
              icon="inbox"
              title="No conversations"
              description={
                search
                  ? `No ${status.replace('_', ' ')} threads match "${search}".`
                  : `There are no ${status.replace('_', ' ')} threads yet. Threads appear here once a customer message is received.`
              }
              className="border-0"
            />
          ) : (
            conversations.map((conversation) => {
              const isSelected = conversation.id === selectedId;
              const displayName =
                conversation.restaurant?.name ||
                conversation.restaurant?.name_ar ||
                conversation.whatsapp_number ||
                'Unknown contact';

              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => void select(conversation)}
                  aria-current={isSelected ? 'true' : undefined}
                  className={`flex w-full flex-col gap-1.5 border-b border-line px-5 py-3.5 text-left transition-colors ${
                    isSelected ? 'bg-lime-tint' : 'hover:bg-surface-hover'
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span
                        aria-hidden
                        className={`material-symbols-outlined text-[0.9375rem] ${
                          conversation.channel === 'whatsapp' ? 'text-status-success' : 'text-ink-subtle'
                        }`}
                      >
                        {CHANNEL_ICON[conversation.channel] ?? 'chat'}
                      </span>
                      <span className="truncate text-sm font-bold text-ink">{displayName}</span>
                    </span>
                    <span className="shrink-0 text-xs text-ink-subtle">
                      {formatDayLabel(conversation.last_message_at)}
                    </span>
                  </span>

                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs text-ink-muted">
                      {conversation.last_message || 'No messages yet'}
                    </span>
                    {(conversation.unread_count ?? 0) > 0 ? (
                      <span className="shrink-0 rounded-pill bg-lime px-2 py-0.5 text-xs font-bold text-ink-inverse">
                        {conversation.unread_count}
                        <span className="sr-only"> unread messages</span>
                      </span>
                    ) : null}
                  </span>

                  <span className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-pill bg-surface-hover px-2 py-0.5 text-xs font-semibold capitalize text-ink-secondary">
                      {conversation.channel}
                    </span>
                    <span
                      className={`rounded-pill px-2 py-0.5 text-xs font-semibold ${toneClasses(
                        lifecycleMeta(conversation.status).tone
                      )}`}
                    >
                      {lifecycleMeta(conversation.status).label}
                    </span>
                    <SlaChip deadline={conversation.sla_deadline} />
                  </span>
                </button>
              );
            })
          )}
        </div>
      </section>

      {/* Thread panel */}
      <section
        aria-label="Message thread"
        className={`${selected ? 'flex' : 'hidden md:flex'} min-w-0 flex-1 flex-col bg-surface-sunken`}
      >
        {!selected ? (
          <EmptyState
            icon="forum"
            title="No thread selected"
            description="Select a conversation to read its message history and reply."
            className="border-0"
          />
        ) : (
          <>
            <header className="flex flex-col gap-3 border-b border-line bg-surface px-6 py-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      icon="arrow_back"
                      onClick={() => setSelectedId(null)}
                      className="md:hidden"
                    >
                      Back
                    </Button>
                    <h2 className="truncate text-xl font-bold text-ink">
                      {selected.restaurant?.name ||
                        selected.restaurant?.name_ar ||
                        selected.whatsapp_number}
                    </h2>
                  </div>
                  {selected.whatsapp_number ? (
                    <p className="mt-0.5 font-mono text-xs text-ink-muted">
                      {selected.whatsapp_number}
                    </p>
                  ) : null}
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <span className="rounded-pill bg-surface-hover px-2 py-0.5 text-xs font-semibold capitalize text-ink-secondary">
                      {selected.channel}
                    </span>
                    <span
                      className={`rounded-pill px-2 py-0.5 text-xs font-semibold ${toneClasses(
                        lifecycleMeta(selected.status).tone
                      )}`}
                    >
                      {lifecycleMeta(selected.status).label}
                    </span>
                    {selected.agent ? (
                      <span className="rounded-pill bg-surface-hover px-2 py-0.5 text-xs font-semibold text-ink-secondary">
                        {selected.agent.full_name}
                      </span>
                    ) : null}
                    <SlaChip deadline={selected.sla_deadline} />
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-2">
                  <div
                    role="group"
                    aria-label="Thread status"
                    className="flex flex-wrap justify-end gap-1.5"
                  >
                    {CONVERSATION_STATUSES.filter((key) => key !== 'archived').map((key) => (
                      <Button
                        key={key}
                        variant={selected.status === key ? 'primary' : 'secondary'}
                        disabled={selected.status === key}
                        onClick={() => void handleStatusChange(key)}
                        aria-current={selected.status === key ? 'true' : undefined}
                      >
                        {STATUS_LABELS[key]}
                      </Button>
                    ))}
                  </div>
                  {selected.restaurant_id ? (
                    <Link
                      href={`/contacts/${selected.restaurant_id}`}
                      className="rounded-control border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-surface-hover"
                    >
                      View customer
                    </Link>
                  ) : null}
                </div>
              </div>

              {actionError ? <ErrorState message={actionError} /> : null}
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              {threadError ? (
                <ErrorState
                  title="Could not load the thread"
                  message={threadError}
                  onRetry={() => void loadMessages(selected.id)}
                />
              ) : null}

              {threadLoading ? <LoadingState label="Loading messages" /> : null}

              {!threadError && !threadLoading && messages.length === 0 ? (
                <EmptyState
                  icon="chat_bubble"
                  title="No messages yet"
                  description="This thread has no stored messages. Send the first reply below."
                  className="border-0"
                />
              ) : null}

              {!threadError &&
                !threadLoading &&
                messages.map((message) => {
                  const isOutbound = message.direction === 'outbound';
                  return (
                    <div
                      key={message.id}
                      className={`mb-3 flex ${isOutbound ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-card px-4 py-2.5 text-sm shadow-subtle ${
                          isOutbound ? 'bg-navy text-ink-inverse' : 'border border-line bg-surface text-ink'
                        }`}
                      >
                        {message.body ? (
                          <p className="whitespace-pre-wrap">{message.body}</p>
                        ) : null}
                        {message.media_url ? (
                          <a
                            href={message.media_url}
                            target="_blank"
                            rel="noreferrer"
                            className={`mt-1.5 block text-xs font-semibold underline ${
                              isOutbound ? 'text-lime-300' : 'text-lime-800'
                            }`}
                          >
                            {message.media_type || 'attachment'}
                          </a>
                        ) : null}
                        <div
                          className={`mt-1.5 flex items-center justify-end gap-2 text-xs ${
                            isOutbound ? 'text-ink-inverse/70' : 'text-ink-subtle'
                          }`}
                        >
                          <span>{formatClock(message.created_at)}</span>
                          {isOutbound && message.status ? (
                            <span className="capitalize">{message.status}</span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}

              <div ref={threadEnd} aria-hidden />
            </div>

            <form onSubmit={handleSend} className="border-t border-line bg-surface px-6 py-4">
              <div className="flex items-end gap-3">
                <Textarea
                  id="inbox-reply"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      event.currentTarget.form?.requestSubmit();
                    }
                  }}
                  rows={2}
                  placeholder={`Reply over ${selected.channel}`}
                  aria-label={`Reply over ${selected.channel}`}
                  className="flex-1 resize-none"
                />
                <Button
                  type="submit"
                  variant="primary"
                  icon="send"
                  loading={sending}
                  disabled={draft.trim().length === 0}
                >
                  Send
                </Button>
              </div>
              <p className="mt-2 text-xs text-ink-subtle">
                Enter sends, Shift + Enter starts a new line. Delivery is confirmed by the
                channel provider response.
              </p>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
