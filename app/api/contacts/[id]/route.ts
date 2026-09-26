import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { apiSuccess, apiError, handleApiError } from '@/lib/api/response';

const updateRestaurantSchema = z.object({
  name: z.string().min(1).optional(),
  name_ar: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  whatsapp_number: z.string().min(6).optional(),
  email: z.string().email().optional().nullable(),
  address: z.string().optional().nullable(),
  delivery_zone: z.string().optional().nullable(),
  credit_limit: z.number().min(0).optional(),
  payment_terms: z.string().optional().nullable(),
  assigned_agent: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
});

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient();
    const { id: restaurantId } = params;

    // 1. Fetch restaurant core info
    const { data: restaurant, error: restError } = await supabase
      .from('restaurants')
      .select(
        `
        *,
        agent:profiles!restaurants_assigned_agent_fkey(id, full_name, avatar_url, role)
      `
      )
      .eq('id', restaurantId)
      .single();

    if (restError || !restaurant) {
      return apiError('Restaurant not found', 404, restError, 'RESTAURANT_NOT_FOUND');
    }

    // 2. Fetch contacts
    const { data: contacts } = await supabase
      .from('restaurant_contacts')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('is_primary', { ascending: false });

    // 3. Fetch recent orders
    const { data: recentOrders } = await supabase
      .from('orders')
      .select('id, order_number, status, total_amount, delivery_date, created_at')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false })
      .limit(10);

    // 4. Fetch open and recent tickets
    const { data: tickets } = await supabase
      .from('tickets')
      .select('id, ticket_number, type, status, priority, description, created_at')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });

    // 5. Payment history summary & spend analytics
    const { data: allOrders } = await supabase
      .from('orders')
      .select('id, status, total_amount, subtotal, vat_amount')
      .eq('restaurant_id', restaurantId);

    const lifetimeSpend = (allOrders || [])
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

    const paidOrders = (allOrders || []).filter((o) => o.status === 'paid');
    const totalPaid = paidOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
    const outstandingBalance = Number((lifetimeSpend - totalPaid).toFixed(2));

    const profile360 = {
      restaurant,
      contacts: contacts || [],
      recent_orders: recentOrders || [],
      tickets: tickets || [],
      payment_summary: {
        lifetime_spend: Number(lifetimeSpend.toFixed(2)),
        total_paid: Number(totalPaid.toFixed(2)),
        outstanding_balance: Math.max(0, outstandingBalance),
        credit_limit: restaurant.credit_limit,
        available_credit: Math.max(0, Number((restaurant.credit_limit - Math.max(0, outstandingBalance)).toFixed(2))),
        payment_terms: restaurant.payment_terms || 'Net 30',
      },
    };

    return apiSuccess(profile360);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient();
    const { id: restaurantId } = params;
    const body = await request.json();
    const parsed = updateRestaurantSchema.parse(body);

    const updatePayload: Record<string, unknown> = {
      ...parsed,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedRestaurant, error } = await supabase
      .from('restaurants')
      .update(updatePayload)
      .eq('id', restaurantId)
      .select(
        `
        *,
        agent:profiles!restaurants_assigned_agent_fkey(id, full_name, avatar_url)
      `
      )
      .single();

    if (error) {
      return apiError(error.message, 400, error, 'RESTAURANT_UPDATE_FAILED');
    }

    return apiSuccess(updatedRestaurant);
  } catch (error) {
    return handleApiError(error);
  }
}
