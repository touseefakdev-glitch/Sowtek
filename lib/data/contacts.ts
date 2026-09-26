import { createClient } from '@/lib/supabase/server';
import { isTerminalOrderStatus, isTerminalTicketStatus } from '@/lib/domain/status';

/**
 * Server-side data access for restaurant accounts (contacts).
 *
 * Aggregates are computed here with the shared terminal-status helpers rather
 * than the hardcoded status lists the API route used, so a status that gains a
 * new terminal value cannot silently start counting as "open".
 */

const CONTACT_SELECT = `
  id,
  name,
  name_ar,
  phone,
  whatsapp_number,
  email,
  address,
  delivery_zone,
  credit_limit,
  payment_terms,
  notes,
  created_at,
  agent:profiles!restaurants_assigned_agent_fkey(id, full_name, avatar_url),
  orders:orders(id, status, total_amount),
  tickets:tickets(id, status)
`;

export interface ContactListItem {
  id: string;
  name: string;
  name_ar: string | null;
  phone: string | null;
  whatsapp_number: string | null;
  email: string | null;
  address: string | null;
  delivery_zone: string | null;
  credit_limit: number | null;
  payment_terms: string | null;
  created_at: string;
  agent: { id: string; full_name: string; avatar_url: string | null } | null;
  open_orders_count: number;
  open_tickets_count: number;
  total_spend: number;
}

export interface ContactFilters {
  search?: string;
  zone?: string;
  agent?: string;
  limit?: number;
}

export async function fetchContacts(filters: ContactFilters = {}): Promise<ContactListItem[]> {
  let query = createClient().from('restaurants').select(CONTACT_SELECT);

  if (filters.zone) query = query.eq('delivery_zone', filters.zone);
  if (filters.agent) query = query.eq('assigned_agent', filters.agent);
  if (filters.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,name_ar.ilike.%${filters.search}%,whatsapp_number.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query
    .order('name', { ascending: true })
    .limit(Math.min(100, Math.max(1, filters.limit ?? 60)));

  if (error) throw new Error(error.message);

  // PostgREST embed caveat, as in lib/data/orders.ts.
  const rows = (data ?? []) as unknown as Array<
    Omit<ContactListItem, 'open_orders_count' | 'open_tickets_count' | 'total_spend'> & {
      orders: { id: string; status: string; total_amount: number | null }[] | null;
      tickets: { id: string; status: string }[] | null;
    }
  >;

  return rows.map((row) => {
    const orders = row.orders ?? [];
    const tickets = row.tickets ?? [];

    return {
      ...row,
      open_orders_count: orders.filter((order) => !isTerminalOrderStatus(order.status)).length,
      open_tickets_count: tickets.filter((ticket) => !isTerminalTicketStatus(ticket.status)).length,
      total_spend: orders.reduce((sum, order) => sum + Number(order.total_amount ?? 0), 0),
    };
  });
}
