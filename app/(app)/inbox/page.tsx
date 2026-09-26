import React from 'react';
import type { Metadata } from 'next';
import { fetchConversations, fetchMessages, fetchStatusCounts } from '@/lib/data/conversations';
import { CONVERSATION_STATUSES, type ConversationStatus } from '@/lib/domain/status';
import { ErrorState, PageHeader } from '@/components/ui';
import { InboxView } from './InboxView';

export const metadata: Metadata = { title: 'Inbox' };

/**
 * Must reject anything that is not literally a member of the list.
 *
 * An earlier version defaulted the value before checking it:
 *
 *   CONVERSATION_STATUSES.includes((value ?? 'active') as ConversationStatus)
 *
 * which returns true for `undefined` while the `value is ConversationStatus`
 * predicate then told TypeScript the value was a valid non-nullable status. The
 * caller reads `isConversationStatus(sp.status) ? sp.status : 'active'`, so on
 * `/inbox` with no `?status=` the true branch handed back the original
 * `undefined` and every downstream `status` was undefined. The empty-list copy
 * calls `status.replace(...)` and threw
 * "Cannot read properties of undefined", and `fetchConversations` skipped its
 * `.eq('status', ...)` filter, so the Active tab quietly returned every
 * conversation regardless of status. `tsc` could not catch it because the
 * predicate overclaimed.
 */
function isConversationStatus(value: string | undefined): value is ConversationStatus {
  return typeof value === 'string' && (CONVERSATION_STATUSES as readonly string[]).includes(value);
}

/**
 * Server Component. The status filter and search live in the URL, so the list
 * and its tab counts are read here and the first thread is opened with its
 * history already in the payload.
 *
 * The client previously fired five requests to paint this screen, four of them
 * single-row queries whose only purpose was to read a tab count.
 */
export default async function InboxPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string };
}) {
  const status = isConversationStatus(searchParams.status) ? searchParams.status : 'active';
  const search = searchParams.q?.trim() ?? '';

  const [listResult, counts] = await Promise.all([
    fetchConversations({ status, search, limit: 50 }).catch(() => null),
    fetchStatusCounts(search || undefined).catch(() => null),
  ]);

  if (listResult === null) {
    return (
      <>
        <PageHeader title="Unified inbox" description="WhatsApp and email conversations" />
        <ErrorState
          title="Could not load conversations"
          message="The conversation list could not be read from the database."
        />
      </>
    );
  }

  const { conversations } = listResult;
  const initialSelectedId = conversations[0]?.id ?? null;
  const messages = initialSelectedId
    ? await fetchMessages(initialSelectedId).catch(() => [])
    : [];

  return (
    <>
      <PageHeader
        title="Unified inbox"
        description="WhatsApp and email conversations with restaurant accounts"
      />
      <InboxView
        initialConversations={conversations}
        initialCounts={counts ?? { active: 0, in_process: 0, completed: 0, archived: 0 }}
        initialMessages={messages}
        initialSelectedId={initialSelectedId}
        search={search}
        status={status}
      />
    </>
  );
}
