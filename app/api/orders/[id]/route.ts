import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { apiSuccess, apiError, handleApiError } from '@/lib/api/response';

const updateOrderSchema = z.object({
  delivery_date: z.string().optional().nullable(),
  delivery_address: z.string().optional().nullable(),
  payment_terms: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  assigned_agent: z.string().uuid().optional().nullable(),
  sla_deadline: z.string().datetime().optional().nullable(),
});

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient();
    const { id } = params;

    const { data: order, error } = await supabase
      .from('orders')
      .select(
        `
        *,
        restaurant:restaurants(
          id, name, name_ar, phone, whatsapp_number, email, address, delivery_zone, credit_limit, payment_terms
        ),
        agent:profiles!orders_assigned_agent_fkey(
          id, full_name, avatar_url, role, is_online
        ),
        items:order_items(
          id, product_id, name, unit, quantity, unit_price, total_price
        ),
        history:order_status_history(
          id, from_status, to_status, note, created_at,
          changed_by_user:profiles!order_status_history_changed_by_fkey(id, full_name, role)
        )
      `
      )
      .eq('id', id)
      .single();

    if (error || !order) {
      return apiError('Order not found', 404, error, 'NOT_FOUND');
    }

    return apiSuccess(order);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient();
    const { id } = params;
    const body = await request.json();
    const parsed = updateOrderSchema.parse(body);

    const updatePayload: Record<string, unknown> = {
      ...parsed,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedOrder, error } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', id)
      .select(
        `
        *,
        restaurant:restaurants(id, name, name_ar, phone),
        agent:profiles!orders_assigned_agent_fkey(id, full_name)
      `
      )
      .single();

    if (error) {
      return apiError(error.message, 400, error, 'ORDER_UPDATE_FAILED');
    }

    return apiSuccess(updatedOrder);
  } catch (error) {
    return handleApiError(error);
  }
}
