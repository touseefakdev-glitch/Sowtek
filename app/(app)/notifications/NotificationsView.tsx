'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { markAllRead, markRead } from '@/lib/api/notifications';
import {
  NOTIFICATION_FILTERS,
  notificationPresentation,
  type NotificationRow,
} from '@/lib/data/notifications';
import { toneClasses, toneDot } from '@/lib/domain/status';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
} from '@/components/ui';
import { formatRelative } from '@/lib/format';

type FilterId = (typeof NOTIFICATION_FILTERS)[number]['id'];

export function NotificationsView({
  initialNotifications,
  initialUnread,
}: {
  initialNotifications: NotificationRow[];
  initialUnread: number;
}) {
  const [notifications, setNotifications] = useState<NotificationRow[]>(initialNotifications);
  const [filter, setFilter] = useState<FilterId>('all');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const counts = useMemo(() => {
    const result: Record<string, number> = { all: notifications.length };
    for (const notification of notifications) {
      const { category } = notificationPresentation(notification.type);
      result[category] = (result[category] ?? 0) + 1;
    }
    return result;
  }, [notifications]);

  const visible = useMemo(
    () =>
      notifications.filter((notification) => {
        if (unreadOnly && notification.is_read) return false;
        if (filter === 'all') return true;
        return notificationPresentation(notification.type).category === filter;
      }),
    [notifications, filter, unreadOnly]
  );

  const unread = notifications.filter((n) => !n.is_read).length;

  const handleMarkAllRead = async () => {
    setBusy(true);
    setError(null);
    try {
      await markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to mark notifications as read.');
    } finally {
      setBusy(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    setError(null);
    // Optimistic: the row updates immediately and reverts by refetching if the
    // write fails, so marking read never feels laggy.
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    try {
      await markRead(id);
    } catch (err) {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: false } : n)));
      setError(err instanceof Error ? err.message : 'Unable to mark the notification as read.');
    }
  };

  return (
    <>
      <PageHeader
        title="Activity and notifications"
        description="Orders, escalations, billing and system alerts across wholesale hubs"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex cursor-pointer items-center gap-2 rounded-control border border-line bg-surface px-3 py-2 text-xs font-semibold text-ink-muted">
              <input
                type="checkbox"
                checked={unreadOnly}
                onChange={(event) => setUnreadOnly(event.target.checked)}
                className="h-4 w-4 cursor-pointer rounded accent-lime"
              />
              Unread only
            </label>
            <Button icon="mark_email_read" onClick={handleMarkAllRead} disabled={busy || unread === 0}>
              Mark all read
            </Button>
          </div>
        }
      />

      <div className="w-full max-w-content flex-1 px-6 py-6">
        <div role="tablist" aria-label="Notification categories" className="mb-4 flex flex-wrap gap-2">
          {NOTIFICATION_FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={filter === item.id}
              onClick={() => setFilter(item.id)}
              className={
                filter === item.id
                  ? 'rounded-control bg-ink px-3 py-1.5 text-xs font-bold text-white transition'
                  : 'rounded-control border border-line bg-surface px-3 py-1.5 text-xs font-bold text-ink-muted transition hover:bg-surface-sunken hover:text-ink'
              }
            >
              {item.label}
              <span className="ml-1.5 opacity-70">{counts[item.id] ?? 0}</span>
            </button>
          ))}
        </div>

        {error ? <ErrorState message={error} className="mb-4" /> : null}

        {visible.length === 0 ? (
          <EmptyState
            icon="notifications"
            title={unreadOnly || filter !== 'all' ? 'Nothing matches these filters' : 'You are all caught up'}
            description={
              unreadOnly || filter !== 'all'
                ? 'Try a different category, or turn off the unread filter.'
                : 'New orders, escalations and system alerts will appear here.'
            }
            className="border-0"
          />
        ) : (
          <ul className="space-y-3">
            {visible.map((notification) => {
              const { icon, tone } = notificationPresentation(notification.type);
              const body = (
                <>
                  <span
                    aria-hidden
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-control ${toneClasses(tone)}`}
                  >
                    <span className="material-symbols-outlined text-[20px]">{icon}</span>
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-ink">{notification.title}</span>
                      {!notification.is_read ? (
                        <span className="sr-only">(unread)</span>
                      ) : null}
                    </span>
                    {notification.body ? (
                      <span className="mt-0.5 block text-xs leading-relaxed text-ink-muted">
                        {notification.body}
                      </span>
                    ) : null}
                    <span className="mt-1 block text-[11px] text-ink-subtle">
                      {formatRelative(notification.created_at)}
                    </span>
                  </span>
                </>
              );

              return (
                <li key={notification.id}>
                  <Card
                    className={
                      notification.is_read
                        ? 'flex items-start gap-3 p-4'
                        : 'flex items-start gap-3 border-l-4 border-l-lime p-4'
                    }
                  >
                    {notification.link ? (
                      <Link href={notification.link} className="flex min-w-0 flex-1 items-start gap-3">
                        {body}
                      </Link>
                    ) : (
                      <span className="flex min-w-0 flex-1 items-start gap-3">{body}</span>
                    )}

                    {!notification.is_read ? (
                      <Button
                        icon="done"
                        onClick={() => void handleMarkRead(notification.id)}
                        aria-label={`Mark "${notification.title}" as read`}
                      >
                        Mark read
                      </Button>
                    ) : (
                      <Badge tone="neutral" dot>
                        Read
                      </Badge>
                    )}
                  </Card>
                </li>
              );
            })}
          </ul>
        )}

        <p className="mt-4 flex items-center gap-2 border-t border-line pt-3 text-xs text-ink-muted">
          <span aria-hidden className={`h-1.5 w-1.5 rounded-pill ${toneDot('info')}`} />
          {unread} unread of {notifications.length} shown
        </p>
      </div>
    </>
  );
}
