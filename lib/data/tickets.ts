import { createClient } from '@/lib/supabase/server';
import type { TicketPriority, TicketStatus, TicketType } from '@/lib/domain/status';

/**
 * Server-side data access for the support ticket console.
 */

export interface TicketRow {
  id: string;
  ticket_number: string | null;
  type: TicketType;
  status: TicketStatus;
  priority: TicketPriority;
  description: string;
  resolution: string | null;
  created_at: string;
  resolved_at: string | null;
  conversation_id: string | null;
  restaurant: {
    id: string;
    name: string;
    name_ar: string | null;
    phone: string | null;
    whatsapp_number: string | null;
  } | null;
  agent: { id: string; full_name: string; avatar_url: string | null; role: string | null } | null;
  order: { id: string; order_number: string | null; status: string; total_amount: number | null } | null;
}

export interface TicketFilters {
  status?: string;
  type?: string;
  search?: string;
  limit?: number;
}

/** Same projection the /api/tickets route uses, so the two cannot drift. */
const TICKET_SELECT = `
  *,
  restaurant:restaurants(id, name, name_ar, phone, whatsapp_number),
  agent:profiles!tickets_assigned_agent_fkey(id, full_name, avatar_url, role),
  order:orders(id, order_number, status, total_amount)
`;

export async function fetchTickets(filters: TicketFilters = {}): Promise<TicketRow[]> {
  let query = createClient().from('tickets').select(TICKET_SELECT);

  if (filters.status && filters.status !== 'all') query = query.eq('status', filters.status);
  if (filters.type && filters.type !== 'all') query = query.eq('type', filters.type);
  if (filters.search) {
    const term = filters.search.trim();
    if (term) {
      // The ticket number is generated server-side and may be null, so search
      // the description and the number the same way the API route does.
      query = query.or(`description.ilike.%${term}%,ticket_number.ilike.%${term}%`);
    }
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(Math.min(100, Math.max(1, filters.limit ?? 50)));

  if (error) throw new Error(error.message);

  // PostgREST embed caveat, as in lib/data/orders.ts.
  return (data ?? []) as unknown as TicketRow[];
}
