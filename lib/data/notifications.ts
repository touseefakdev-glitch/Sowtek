import { createClient } from '@/lib/supabase/server';
import type { NotificationRow } from '@/lib/domain/notifications';

export type { NotificationRow } from '@/lib/domain/notifications';

export interface NotificationFeed {
  notifications: NotificationRow[];
  unreadCount: number;
  total: number;
}

/**
 * Server-side data access for the notification feed.
 *
 * Notifications are scoped to the signed-in agent: the server client reads the
 * session cookie, and RLS on `notifications` scopes rows to the current user
 * as a second line of defence.
 *
 * This module is server-only. Import the classification helpers from
 * lib/domain/notifications instead; importing them from here pulls next/headers
 * into the client bundle.
 */
export async function fetchNotifications(limit = 50): Promise<NotificationFeed> {
  const supabase = createClient();

  const { data, error, count } = await supabase
    .from('notifications')
    .select('id, type, title, body, link, is_read, created_at')
    .order('is_read', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  const notifications = (data ?? []) as NotificationRow[];

  return {
    notifications,
    unreadCount: notifications.filter((n) => !n.is_read).length,
    total: count ?? notifications.length,
  };
}
