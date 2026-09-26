import { createClient } from '@/lib/supabase/server';
import type { Tone } from '@/lib/domain/status';

/**
 * Server-side data access for the notification feed.
 *
 * Notifications are always scoped to the signed-in agent: the server client
 * reads the session cookie, and RLS on `notifications` scopes rows to the
 * current user as a second line of defence.
 */

export interface NotificationRow {
  id: string;
  type: string | null;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export type NotificationCategory = 'orders' | 'escalations' | 'billing' | 'inventory' | 'system';

export interface NotificationFeed {
  notifications: NotificationRow[];
  unreadCount: number;
  total: number;
}

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

/**
 * Maps a notification type onto a category and a tone. Previously each page
 * re-derived its own colours from the type string, which is why the same
 * event rendered green in one place and amber in another.
 */
export function notificationPresentation(type: string | null): {
  category: NotificationCategory;
  icon: string;
  tone: Tone;
} {
  const value = (type ?? '').toLowerCase();

  if (value.includes('ticket') || value.includes('escalation') || value.includes('complaint')) {
    return { category: 'escalations', icon: 'support_agent', tone: 'danger' };
  }
  if (value.includes('credit') || value.includes('invoice') || value.includes('payment')) {
    return { category: 'billing', icon: 'account_balance_wallet', tone: 'warning' };
  }
  if (value.includes('stock') || value.includes('inventory') || value.includes('product')) {
    return { category: 'inventory', icon: 'inventory_2', tone: 'neutral' };
  }
  if (value.includes('order') || value.includes('conversation')) {
    return { category: 'orders', icon: 'receipt_long', tone: 'info' };
  }
  return { category: 'system', icon: 'notifications', tone: 'neutral' };
}

export const NOTIFICATION_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'orders', label: 'Orders' },
  { id: 'escalations', label: 'Escalations' },
  { id: 'billing', label: 'Billing' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'system', label: 'System' },
] as const;
