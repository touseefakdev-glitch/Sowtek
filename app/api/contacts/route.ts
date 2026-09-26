import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { isTerminalOrderStatus, isTerminalTicketStatus } from '@/lib/domain/status';
import { apiSuccess, apiError, handleApiError } from '@/lib/api/response';

const createRestaurantSchema = z.object({
  name: z.string().min(1, 'Restaurant name is required'),
  name_ar: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  whatsapp_number: z.string().min(6, 'Valid WhatsApp number is required'),
  email: z.string().email().optional().nullable(),
  address: z.string().optional().nullable(),
  delivery_zone: z.string().optional().nullable(),
  credit_limit: z.number().min(0).default(0),
  payment_terms: z.string().optional().nullable(),
  assigned_agent: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const searchParams = request.nextUrl.searchParams;

    const search = searchParams.get('search');
    const zone = searchParams.get('zone');
    const agent = searchParams.get('agent');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const offset = (page - 1) * limit;

    let query = supabase
      .from('restaurants')
      .select(
        `
        *,
        agent:profiles!restaurants_assigned_agent_fkey(id, full_name, avatar_url),
        orders:orders(id, status, total_amount),
        tickets:tickets(id, status)
      `,
        { count: 'exact' }
      );

    if (zone) {
      query = query.eq('delivery_zone', zone);
    }
    if (agent) {
      query = query.eq('assigned_agent', agent);
    }
    if (search) {
      query = query.or(
        `name.ilike.%${search}%,name_ar.ilike.%${search}%,whatsapp_number.ilike.%${search}%,phone.ilike.%${search}%`
      );
    }

    query = query.order('name', { ascending: true }).range(offset, offset + limit - 1);

    const { data: restaurants, error, count } = await query;

    if (error) {
      return apiError(error.message, 400, error, 'RESTAURANTS_QUERY_ERROR');
    }

    // Format results with computed aggregates. Terminal states come from the
    // domain module so this route and the Server Component agree: previously
    // this excluded only delivered/cancelled/paid while counting invoiced
    // orders as open, and treated resolution_offered as closed.
    const formatted = (restaurants || []).map((r) => {
      const orders = r.orders || [];
      const tickets = r.tickets || [];

      const openOrders = orders.filter(
        (o: { status: string }) => !isTerminalOrderStatus(o.status)
      );
      const totalSpend = orders
        .filter((o: { status: string }) => o.status !== 'cancelled')
        .reduce((sum: number, o: { total_amount: number }) => sum + Number(o.total_amount || 0), 0);
      const openTickets = tickets.filter(
        (t: { status: string }) => !isTerminalTicketStatus(t.status)
      );

      return {
        id: r.id,
        name: r.name,
        name_ar: r.name_ar,
        phone: r.phone,
        whatsapp_number: r.whatsapp_number,
        email: r.email,
        address: r.address,
        delivery_zone: r.delivery_zone,
        credit_limit: r.credit_limit,
        payment_terms: r.payment_terms,
        assigned_agent: r.assigned_agent,
        agent: r.agent,
        notes: r.notes,
        created_at: r.created_at,
        open_orders_count: openOrders.length,
        total_spend: Number(totalSpend.toFixed(2)),
        open_tickets_count: openTickets.length,
      };
    });

    return apiSuccess(formatted, {
      count: count || 0,
      page,
      limit,
      totalPages: count ? Math.ceil(count / limit) : 0,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();
    const parsed = createRestaurantSchema.parse(body);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const assignedAgent = parsed.assigned_agent || user?.id || null;

    const { data: restaurant, error } = await supabase
      .from('restaurants')
      .insert({
        name: parsed.name,
        name_ar: parsed.name_ar || null,
        phone: parsed.phone || null,
        whatsapp_number: parsed.whatsapp_number,
        email: parsed.email || null,
        address: parsed.address || null,
        delivery_zone: parsed.delivery_zone || null,
        credit_limit: parsed.credit_limit,
        payment_terms: parsed.payment_terms || null,
        assigned_agent: assignedAgent,
        notes: parsed.notes || null,
      })
      .select(
        `
        *,
        agent:profiles!restaurants_assigned_agent_fkey(id, full_name, avatar_url)
      `
      )
      .single();

    if (error) {
      return apiError(error.message, 400, error, 'RESTAURANT_CREATE_FAILED');
    }

    return apiSuccess(restaurant, null, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
