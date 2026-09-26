import { createClient } from '@/lib/supabase/server';
import type { ConversationStatus } from '@/lib/domain/status';

/**
 * Server-side data access for the unified inbox.
 *
 * The client used to fire five requests to render one screen: four
 * single-row queries just to read the per-status tab counts, plus the list
 * itself. Reading server-side turns that into one round trip, because
 * Supabase returns an exact total for the list query and the four counts are
 * derived from four cheap head-only reads issued in parallel.
 */

export interface ConversationRow {
  id: string;
  restaurant_id: string | null;
  whatsapp_number: string | null;
  channel: string;
  status: ConversationStatus;
  assigned_agent: string | null;
  last_message: string | null;
  last_message_at: string;
  unread_count: number | null;
  sla_deadline: string | null;
  restaurant: { id: string; name: string; name_ar: string | null } | null;
  agent: { id: string; full_name: string; avatar_url: string | null } | null;
}

export interface MessageRow {
  id: string;
  conversation_id: string;
  direction: 'inbound' | 'outbound';
  body: string | null;
  media_url: string | null;
  media_type: string | null;
  status: string | null;
  created_at: string;
  sender: { id: string; full_name: string; avatar_url: string | null } | null;
}

export interface ConversationFilters {
  status?: ConversationStatus;
  search?: string;
  limit?: number;
}

/** Same projection as the /api/conversations route, so the two cannot drift. */
const CONVERSATION_SELECT = `
  *,
  restaurant:restaurants(id, name, name_ar),
  agent:profiles!conversations_assigned_agent_fkey(id, full_name, avatar_url, role)
`;

const MESSAGE_SELECT = `
  *,
  sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url, role)
`;

export async function fetchConversations(
  filters: ConversationFilters = {}
): Promise<{ conversations: ConversationRow[]; total: number }> {
  let query = createClient().from('conversations').select(CONVERSATION_SELECT, { count: 'exact' });

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.search) {
    const term = filters.search.trim();
    if (term) query = query.or(`last_message.ilike.%${term}%,whatsapp_number.ilike.%${term}%`);
  }

  const { data, error, count } = await query
    .order('last_message_at', { ascending: false })
    .limit(Math.min(100, Math.max(1, filters.limit ?? 50)));

  if (error) throw new Error(error.message);

  // PostgREST embed caveat, as in lib/data/orders.ts.
  return { conversations: (data ?? []) as unknown as ConversationRow[], total: count ?? 0 };
}

/** Head-only counts for the status tabs, respecting the active search. */
export async function fetchStatusCounts(
  search?: string
): Promise<Record<ConversationStatus, number>> {
  const supabase = createClient();
  const statuses: ConversationStatus[] = ['active', 'in_process', 'completed', 'archived'];

  const results = await Promise.all(
    statuses.map(async (status) => {
      let query = supabase
        .from('conversations')
        .select('id', { count: 'exact', head: true })
        .eq('status', status);

      if (search) {
        const term = search.trim();
        if (term) query = query.or(`last_message.ilike.%${term}%,whatsapp_number.ilike.%${term}%`);
      }

      const { count, error } = await query;
      return [status, error ? 0 : (count ?? 0)] as const;
    })
  );

  return Object.fromEntries(results) as Record<ConversationStatus, number>;
}

/** Oldest-first message history for a thread. */
export async function fetchMessages(
  conversationId: string,
  limit = 100
): Promise<MessageRow[]> {
  const { data, error } = await createClient()
    .from('messages')
    .select(MESSAGE_SELECT)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) throw new Error(error.message);

  // PostgREST embed caveat, as in lib/data/orders.ts.
  return (data ?? []) as unknown as MessageRow[];
}
