import { createClient } from '@/lib/supabase/server';
import type { OrderStatus } from '@/lib/domain/status';

/**
 * Server-side data access for orders.
 *
 * Server Components read through here instead of fetching the app's own
 * /api routes, which avoids a pointless HTTP round trip to itself and lets the
 * first paint include real data.
 *
 * Note: the /api/orders route keeps its own wider projection because it also
 * serves clients that need notes and line items. This module owns the list
 * projection only, so the two cannot drift on the fields the list renders.
 */

export const ORDER_LIST_SELECT = `
  id,
  order_number,
  status,
  total_amount,
  delivery_date,
  created_at,
  restaurant:restaurants(id, name, name_ar, delivery_zone),
  agent:profiles!orders_assigned_agent_fkey(id, full_name, avatar_url, role)
`;

/**
 * Detail projection. Kept identical to the /api/orders/[id] select so the page
 * and the API cannot drift on which relations resolve.
 *
 * The embed key is `history` (not `status_history`) and `changed_by_user` needs
 * the explicit FK hint, otherwise PostgREST cannot join the profile that made
 * the transition.
 */
export const ORDER_DETAIL_SELECT = `
  *,
  restaurant:restaurants(
    id, name, name_ar, phone, whatsapp_number, email, address, delivery_zone
  ),
  agent:profiles!orders_assigned_agent_fkey(id, full_name, avatar_url, role),
  items:order_items(id, product_id, name, unit, quantity, unit_price, total_price),
  history:order_status_history(
    id, from_status, to_status, note, created_at,
    changed_by_user:profiles!order_status_history_changed_by_fkey(id, full_name, role)
  )
`;

export interface OrderListItem {
  id: string;
  order_number: string | null;
  status: OrderStatus;
  total_amount: number | null;
  delivery_date: string | null;
  created_at: string;
  restaurant: { id: string; name: string; name_ar?: string | null; delivery_zone?: string | null } | null;
  agent: { id: string; full_name: string; avatar_url?: string | null; role?: string } | null;
}

export interface OrderFilters {
  status?: string;
  agent?: string;
  restaurant_id?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface OrdersResult {
  orders: OrderListItem[];
  count: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function fetchOrders(filters: OrderFilters = {}): Promise<OrdersResult> {
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(100, Math.max(1, filters.limit ?? 20));
  const offset = (page - 1) * limit;

  let query = createClient()
    .from('orders')
    .select(ORDER_LIST_SELECT, { count: 'exact' });

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.agent) query = query.eq('assigned_agent', filters.agent);
  if (filters.restaurant_id) query = query.eq('restaurant_id', filters.restaurant_id);
  if (filters.start_date) query = query.gte('created_at', filters.start_date);
  if (filters.end_date) query = query.lte('created_at', filters.end_date);
  if (filters.search) {
    query = query.or(`order_number.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(error.message);

  return {
    // PostgREST infers embedded relations as arrays because the project has no
    // generated database types yet. The runtime shape for a many-to-one embed
    // is a single object, which OrderListItem describes. Replace this cast with
    // `createClient<Database>()` output once types are generated.
    orders: (data ?? []) as unknown as OrderListItem[],
    count: count ?? 0,
    page,
    limit,
    totalPages: count ? Math.ceil(count / limit) : 0,
  };
}

export const DASHBOARD_SELECT = `
  id,
  order_number,
  status,
  total_amount,
  created_at,
  sla_deadline,
  restaurant:restaurants(id, name),
  agent:profiles!orders_assigned_agent_fkey(id, full_name)
`;

export interface DashboardOrder {
  id: string;
  order_number: string | null;
  status: OrderStatus;
  total_amount: number | null;
  created_at: string;
  sla_deadline: string | null;
  restaurant: { id: string; name: string } | null;
  agent: { id: string; full_name: string } | null;
}

export interface DashboardData {
  orders: DashboardOrder[];
  total: number;
}

/**
 * Orders for the supervisor dashboard. Uses the real `sla_deadline` column
 * rather than inferring a deadline from age, so the breach queue reflects the
 * deadline that was actually recorded on the order.
 */
export async function fetchDashboardData(limit = 100): Promise<DashboardData> {
  const { data, error, count } = await createClient()
    .from('orders')
    .select(DASHBOARD_SELECT, { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  return {
    // PostgREST embed caveat, as in fetchOrders.
    orders: (data ?? []) as unknown as DashboardOrder[],
    total: count ?? 0,
  };
}

export interface OrderItemRow {
  id: string;
  product_id: string | null;
  name: string;
  unit: string | null;
  quantity: number;
  unit_price: number | null;
  total_price: number | null;
}

export interface OrderHistoryRow {
  id: string;
  from_status: string | null;
  to_status: string;
  note: string | null;
  created_at: string;
  changed_by_user: { id: string; full_name: string; role: string | null } | null;
}

export interface OrderDetail {
  id: string;
  order_number: string | null;
  status: OrderStatus;
  subtotal: number | null;
  vat_amount: number | null;
  total_amount: number | null;
  delivery_date: string | null;
  delivery_address: string | null;
  payment_terms: string | null;
  notes: string | null;
  sla_deadline: string | null;
  created_at: string;
  restaurant: {
    id: string;
    name: string;
    name_ar: string | null;
    phone: string | null;
    whatsapp_number: string | null;
    email: string | null;
    address: string | null;
    delivery_zone: string | null;
  } | null;
  agent: { id: string; full_name: string; avatar_url: string | null; role: string | null } | null;
  items: OrderItemRow[];
  history: OrderHistoryRow[];
}

/** Loads one order with its items and status history. Null when not found. */
export async function fetchOrderDetail(id: string): Promise<OrderDetail | null> {
  const { data, error } = await createClient()
    .from('orders')
    .select(ORDER_DETAIL_SELECT)
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  // PostgREST embed caveat, as in fetchOrders.
  const order = data as unknown as Omit<OrderDetail, 'items' | 'history'> & {
    items: OrderItemRow[] | null;
    history: OrderHistoryRow[] | null;
  };

  return { ...order, items: order.items ?? [], history: order.history ?? [] };
}
