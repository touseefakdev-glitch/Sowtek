import { createClient } from '@/lib/supabase/server';
import type { OrderStatus } from '@/lib/domain/status';

/**
 * Server-side data access for orders.
 *
 * Server Components read through here instead of fetching the app's own
 * /api routes, which avoids a pointless HTTP round trip to itself and lets the
 * first paint include real data. The API routes import the same column
 * selection so the HTTP and RSC paths cannot drift apart.
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

export const ORDER_DETAIL_SELECT = `
  *,
  restaurant:restaurants(*, contacts:restaurant_contacts(*)),
  agent:profiles!orders_assigned_agent_fkey(id, full_name, avatar_url, role),
  items:order_items(*, product:products(id, name, sku)),
  status_history:order_status_history(*)
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

/** Aggregate order metrics for the operations dashboard. */
export interface OrderMetrics {
  total: number;
  open: number;
  warehouse: number;
  outForDelivery: number;
  atRisk: number;
  openValue: number;
  unassigned: number;
  statusCounts: Record<string, number>;
  workload: { id: string; name: string; count: number }[];
}

export async function fetchOrderMetrics(slaWindowHours = 24): Promise<OrderMetrics> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('orders')
    .select('id, status, total_amount, assigned_agent, created_at, agent:profiles!orders_assigned_agent_fkey(full_name)');

  if (error) throw new Error(error.message);

  // Same PostgREST embed caveat as fetchOrders above.
  const rows = (data ?? []) as unknown as Array<{
    id: string;
    status: string;
    total_amount: number | null;
    assigned_agent: string | null;
    created_at: string;
    agent: { full_name: string } | null;
  }>;

  // Imported here to keep this module's public surface focused on data access.
  const { isTerminalOrderStatus, isWarehouseStatus } = await import('@/lib/domain/status');

  const statusCounts: Record<string, number> = {};
  for (const row of rows) {
    statusCounts[row.status] = (statusCounts[row.status] ?? 0) + 1;
  }

  const cutoff = Date.now() - slaWindowHours * 60 * 60 * 1000;
  const openRows = rows.filter((row) => !isTerminalOrderStatus(row.status));

  const workload = new Map<string, { id: string; name: string; count: number }>();
  let unassigned = 0;

  for (const row of openRows) {
    if (!row.assigned_agent) {
      unassigned += 1;
      continue;
    }
    const name = row.agent?.full_name ?? 'Unnamed agent';
    const existing = workload.get(row.assigned_agent);
    if (existing) existing.count += 1;
    else
      workload.set(row.assigned_agent, {
        id: row.assigned_agent,
        name,
        count: 1,
      });
  }

  return {
    total: rows.length,
    open: openRows.length,
    warehouse: rows.filter((row) => isWarehouseStatus(row.status)).length,
    outForDelivery: statusCounts.out_for_delivery ?? 0,
    atRisk: openRows.filter((row) => new Date(row.created_at).getTime() < cutoff).length,
    openValue: openRows.reduce((sum, row) => sum + Number(row.total_amount ?? 0), 0),
    unassigned,
    statusCounts,
    workload: [...workload.values()].sort((a, b) => b.count - a.count),
  };
}
