import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { apiSuccess, apiError, handleApiError } from '@/lib/api/response';
import { addHours } from 'date-fns';

const orderItemSchema = z.object({
  product_id: z.string().uuid().optional().nullable(),
  name: z.string().min(1, 'Product name is required'),
  unit: z.string().min(1, 'Unit is required'),
  quantity: z.number().positive('Quantity must be positive'),
  unit_price: z.number().min(0, 'Unit price must be non-negative'),
});

const createOrderSchema = z.object({
  restaurant_id: z.string().uuid('Valid restaurant ID is required'),
  conversation_id: z.string().uuid().optional().nullable(),
  assigned_agent: z.string().uuid().optional().nullable(),
  delivery_date: z.string().optional().nullable(),
  delivery_address: z.string().optional().nullable(),
  payment_terms: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  items: z.array(orderItemSchema).min(1, 'Order must contain at least one item'),
  status: z
    .enum([
      'draft',
      'pending_confirmation',
      'confirmed',
      'sent_to_warehouse',
      'picking',
      'packed',
      'ready_for_delivery',
      'out_for_delivery',
      'delivered',
      'invoiced',
      'paid',
      'cancelled',
    ])
    .default('pending_confirmation'),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const searchParams = request.nextUrl.searchParams;

    const status = searchParams.get('status');
    const agent = searchParams.get('agent');
    const restaurantId = searchParams.get('restaurant_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const search = searchParams.get('search');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const offset = (page - 1) * limit;

    let query = supabase
      .from('orders')
      .select(
        `
        *,
        restaurant:restaurants(id, name, name_ar, phone, whatsapp_number, delivery_zone),
        agent:profiles!orders_assigned_agent_fkey(id, full_name, avatar_url, role),
        items:order_items(id, name, unit, quantity, unit_price, total_price)
      `,
        { count: 'exact' }
      );

    if (status) {
      query = query.eq('status', status);
    }
    if (agent) {
      query = query.eq('assigned_agent', agent);
    }
    if (restaurantId) {
      query = query.eq('restaurant_id', restaurantId);
    }
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }
    if (search) {
      query = query.or(`order_number.ilike.%${search}%,notes.ilike.%${search}%`);
    }

    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data: orders, error, count } = await query;

    if (error) {
      return apiError(error.message, 400, error, 'ORDERS_QUERY_ERROR');
    }

    // Fetch aggregate status counts for dashboard
    const { data: statusSummary } = await supabase
      .from('orders')
      .select('status');

    const statusCounts: Record<string, number> = {};
    if (statusSummary) {
      statusSummary.forEach((row) => {
        statusCounts[row.status] = (statusCounts[row.status] || 0) + 1;
      });
    }

    return apiSuccess(orders, {
      count: count || 0,
      page,
      limit,
      totalPages: count ? Math.ceil(count / limit) : 0,
      status_counts: statusCounts,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();
    const parsed = createOrderSchema.parse(body);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiError('Unauthorized', 401, null, 'AUTH_REQUIRED');
    }

    // 1. Calculate pricing: subtotal, 15% VAT, total
    const subtotal = parsed.items.reduce(
      (sum, item) => sum + item.quantity * item.unit_price,
      0
    );
    const vatAmount = Number((subtotal * 0.15).toFixed(2));
    const totalAmount = Number((subtotal + vatAmount).toFixed(2));

    // Default SLA deadline: 4 hours from now
    const slaDeadline = addHours(new Date(), 4).toISOString();
    const assignedAgent = parsed.assigned_agent || user.id;

    // 2. Insert order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        restaurant_id: parsed.restaurant_id,
        conversation_id: parsed.conversation_id || null,
        assigned_agent: assignedAgent,
        status: parsed.status,
        delivery_date: parsed.delivery_date || null,
        delivery_address: parsed.delivery_address || null,
        payment_terms: parsed.payment_terms || null,
        subtotal,
        vat_amount: vatAmount,
        total_amount: totalAmount,
        notes: parsed.notes || null,
        sla_deadline: slaDeadline,
      })
      .select(
        `
        *,
        restaurant:restaurants(id, name, name_ar, phone, whatsapp_number),
        agent:profiles!orders_assigned_agent_fkey(id, full_name, avatar_url)
      `
      )
      .single();

    if (orderError || !order) {
      return apiError(orderError?.message || 'Failed to create order', 400, orderError, 'ORDER_CREATION_FAILED');
    }

    // 3. Insert order items
    const itemsToInsert = parsed.items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id || null,
      name: item.name,
      unit: item.unit,
      quantity: item.quantity,
      unit_price: item.unit_price,
    }));

    const { data: insertedItems, error: itemsError } = await supabase
      .from('order_items')
      .insert(itemsToInsert)
      .select();

    if (itemsError) {
      return apiError(itemsError.message, 400, itemsError, 'ORDER_ITEMS_INSERT_FAILED');
    }

    // 4. Insert initial status history
    await supabase.from('order_status_history').insert({
      order_id: order.id,
      from_status: null,
      to_status: order.status,
      changed_by: user.id,
      note: 'Initial order creation',
    });

    // 5. Notify supervisors
    const { data: supervisors } = await supabase
      .from('profiles')
      .select('id')
      .in('role', ['supervisor', 'admin']);

    if (supervisors && supervisors.length > 0) {
      const notifications = supervisors.map((s) => ({
        user_id: s.id,
        type: 'order_created',
        title: `New Order: ${order.order_number || 'Order Created'}`,
        body: `Order received for ${order.restaurant?.name || 'Restaurant'} totaling SAR ${totalAmount}`,
        link: `/orders/${order.id}`,
      }));

      await supabase.from('notifications').insert(notifications);
    }

    return apiSuccess(
      {
        ...order,
        items: insertedItems,
      },
      null,
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
