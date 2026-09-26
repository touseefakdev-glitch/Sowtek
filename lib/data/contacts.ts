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

/* ------------------------------------------------------------------ */
/* 360 degree restaurant profile                                       */
/* ------------------------------------------------------------------ */

export interface ProfileContact {
  id: string;
  full_name: string;
  role: string | null;
  phone: string | null;
  is_primary: boolean | null;
}

export interface ProfileOrder {
  id: string;
  order_number: string | null;
  status: string;
  total_amount: number | null;
  delivery_date: string | null;
  created_at: string;
}

export interface ProfileTicket {
  id: string;
  ticket_number: string | null;
  type: string;
  status: string;
  priority: string;
  description: string | null;
  created_at: string;
}

export interface Profile360 {
  restaurant: ContactListItem;
  contacts: ProfileContact[];
  recentOrders: ProfileOrder[];
  tickets: ProfileTicket[];
  payment: {
    lifetimeSpend: number;
    totalPaid: number;
    outstandingBalance: number;
    creditLimit: number;
    availableCredit: number;
    paymentTerms: string;
  };
}

/**
 * Loads the whole profile in one server-side pass. The client version of this
 * page issued five sequential fetches before it could render anything.
 * Returns null when the restaurant does not exist.
 */
export async function fetchProfile360(id: string): Promise<Profile360 | null> {
  const supabase = createClient();

  const { data: restaurant, error: restaurantError } = await supabase
    .from('restaurants')
    .select(
      `
      *,
      agent:profiles!restaurants_assigned_agent_fkey(id, full_name, avatar_url, role)
    `
    )
    .eq('id', id)
    .maybeSingle();

  if (restaurantError) throw new Error(restaurantError.message);
  if (!restaurant) return null;

  const [contactsResult, ordersResult, ticketsResult, allOrdersResult] = await Promise.all([
    supabase
      .from('restaurant_contacts')
      .select('id, full_name, role, phone, is_primary')
      .eq('restaurant_id', id)
      .order('is_primary', { ascending: false }),
    supabase
      .from('orders')
      .select('id, order_number, status, total_amount, delivery_date, created_at')
      .eq('restaurant_id', id)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('tickets')
      .select('id, ticket_number, type, status, priority, description, created_at')
      .eq('restaurant_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('orders')
      .select('id, status, total_amount')
      .eq('restaurant_id', id),
  ]);

  const allOrders = (allOrdersResult.data ?? []) as {
    status: string;
    total_amount: number | null;
  }[];

  // Cancelled orders are excluded from spend; only paid orders reduce the
  // balance. Kept identical to the API route's calculation.
  const lifetimeSpend = allOrders
    .filter((order) => order.status !== 'cancelled')
    .reduce((sum, order) => sum + Number(order.total_amount ?? 0), 0);

  const totalPaid = allOrders
    .filter((order) => order.status === 'paid')
    .reduce((sum, order) => sum + Number(order.total_amount ?? 0), 0);

  const outstanding = Math.max(0, Number((lifetimeSpend - totalPaid).toFixed(2)));
  const creditLimit = Number(restaurant.credit_limit ?? 0);

  return {
    // PostgREST embed caveat, as in fetchContacts.
    restaurant: restaurant as unknown as ContactListItem,
    contacts: (contactsResult.data ?? []) as ProfileContact[],
    recentOrders: (ordersResult.data ?? []) as ProfileOrder[],
    tickets: (ticketsResult.data ?? []) as ProfileTicket[],
    payment: {
      lifetimeSpend: Number(lifetimeSpend.toFixed(2)),
      totalPaid: Number(totalPaid.toFixed(2)),
      outstandingBalance: outstanding,
      creditLimit,
      availableCredit: Math.max(0, Number((creditLimit - outstanding).toFixed(2))),
      paymentTerms: restaurant.payment_terms || 'Net 30',
    },
  };
}
