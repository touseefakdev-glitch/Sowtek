import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type UnsubscribeFn = () => void;

/**
 * Subscribes to realtime updates for conversations assigned to a specific agent
 */
export function subscribeToConversations(
  agentId: string,
  onUpdate: (payload: any) => void
): UnsubscribeFn {
  const supabase = createClient();
  const channelName = `realtime-conversations-${agentId}-${Date.now()}`;

  const channel: RealtimeChannel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'conversations',
        filter: `assigned_agent=eq.${agentId}`,
      },
      (payload) => {
        onUpdate(payload);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribes to realtime notifications for a specific user
 */
export function subscribeToNotifications(
  userId: string,
  onNew: (notification: any) => void
): UnsubscribeFn {
  const supabase = createClient();
  const channelName = `realtime-notifications-${userId}-${Date.now()}`;

  const channel: RealtimeChannel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        onNew(payload.new);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribes to all order changes (for supervisor dashboard & live tracking)
 */
export function subscribeToOrders(
  onUpdate: (payload: any) => void
): UnsubscribeFn {
  const supabase = createClient();
  const channelName = `realtime-orders-${Date.now()}`;

  const channel: RealtimeChannel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'orders',
      },
      (payload) => {
        onUpdate(payload);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
