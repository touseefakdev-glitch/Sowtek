import React from 'react';
import type { Metadata } from 'next';
import { fetchNotifications } from '@/lib/data/notifications';
import { ErrorState, PageBody, PageHeader } from '@/components/ui';
import { NotificationsView } from './NotificationsView';

export const metadata: Metadata = { title: 'Notifications' };

/**
 * Server Component: the feed is scoped to the signed-in agent and resolved on
 * the server. Marking read is a mutation, so it stays in the client child.
 */
export default async function NotificationsPage() {
  const feed = await fetchNotifications().catch(() => null);

  if (feed === null) {
    return (
      <>
        <PageHeader title="Activity and notifications" description="Orders, escalations and system alerts" />
        <PageBody>
          <ErrorState message="Unable to load notifications." />
        </PageBody>
      </>
    );
  }

  return (
    <NotificationsView
      initialNotifications={feed.notifications}
      initialUnread={feed.unreadCount}
    />
  );
}
