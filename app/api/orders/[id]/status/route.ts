import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { apiSuccess, apiError, handleApiError } from '@/lib/api/response';
import { sendWhatsAppMessage } from '@/lib/whatsapp/send';

const updateStatusSchema = z.object({
  status: z.enum([
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
  ]),
  note: z.string().optional(),
});

interface RouteParams {
  params: {
    id: string;
  };
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient();
    const { id: orderId } = params;
    const body = await request.json();
    const parsed = updateStatusSchema.parse(body);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiError('Unauthorized', 401, null, 'AUTH_REQUIRED');
    }

    // 1. Fetch current order
    const { data: currentOrder, error: fetchError } = await supabase
      .from('orders')
      .select('id, order_number, status, assigned_agent, restaurant_id, restaurant:restaurants(name, whatsapp_number)')
      .eq('id', orderId)
      .single();

    if (fetchError || !currentOrder) {
      return apiError('Order not found', 404, fetchError, 'ORDER_NOT_FOUND');
    }

    const previousStatus = currentOrder.status;

    // 2. Update order status
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        status: parsed.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) {
      return apiError(updateError.message, 400, updateError, 'STATUS_UPDATE_FAILED');
    }

    // 3. Record status transition in audit history
    await supabase.from('order_status_history').insert({
      order_id: orderId,
      from_status: previousStatus,
      to_status: parsed.status,
      changed_by: user.id,
      note: parsed.note || `Status changed from ${previousStatus} to ${parsed.status}`,
    });

    // 4. Create notification for assigned agent (if updated by someone else)
    if (currentOrder.assigned_agent && currentOrder.assigned_agent !== user.id) {
      await supabase.from('notifications').insert({
        user_id: currentOrder.assigned_agent,
        type: 'order_status_changed',
        title: `Order ${currentOrder.order_number} Status Updated`,
        body: `Order status moved to ${parsed.status.replace(/_/g, ' ')}`,
        link: `/orders/${orderId}`,
      });
    }

    // 5. If status = 'delivered', trigger WhatsApp customer feedback request
    const restaurant = (
      Array.isArray(currentOrder.restaurant)
        ? currentOrder.restaurant[0]
        : currentOrder.restaurant
    ) as { name?: string; whatsapp_number?: string } | null;

    if (parsed.status === 'delivered' && restaurant?.whatsapp_number) {
      await sendWhatsAppMessage({
        to: restaurant.whatsapp_number,
        body: `Your Sowtek order ${currentOrder.order_number || ''} has been delivered! How was your delivery experience today? Please reply with a rating from 1-5 or let us know if anything needs attention.`,
      });
    }

    return apiSuccess({
      order: updatedOrder,
      previous_status: previousStatus,
      current_status: parsed.status,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
