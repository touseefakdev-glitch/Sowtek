import type { Tone } from './status';

/**
 * Notification classification, kept free of any server-only import.
 *
 * This started in lib/data/notifications.ts, which also holds the Supabase
 * query and therefore pulls in next/headers. The notification feed is a client
 * component, so importing the presentation helper from there dragged the
 * server Supabase client into the browser bundle and failed the build. Pure
 * domain logic lives here; only the query lives in lib/data.
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

export interface NotificationPresentation {
  category: NotificationCategory;
  icon: string;
  tone: Tone;
}

/**
 * Maps a notification type onto a category and a tone. Previously each page
 * re-derived its own colours from the type string, which is why the same event
 * rendered green in one place and amber in another.
 */
export function notificationPresentation(
  type: string | null
): NotificationPresentation {
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

export type NotificationFilterId = (typeof NOTIFICATION_FILTERS)[number]['id'];
