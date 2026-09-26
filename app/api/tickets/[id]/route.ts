import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { apiSuccess, apiError, handleApiError } from '@/lib/api/response';

const updateTicketSchema = z.object({
  type: z.enum(['missing_item', 'wrong_item', 'quality', 'delivery', 'payment', 'other']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  description: z.string().optional(),
  assigned_agent: z.string().uuid().optional().nullable(),
  order_id: z.string().uuid().optional().nullable(),
  conversation_id: z.string().uuid().optional().nullable(),
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

    const { data: ticket, error } = await supabase
      .from('tickets')
      .select(
        `
        *,
        restaurant:restaurants(id, name, name_ar, phone, whatsapp_number, address),
        agent:profiles!tickets_assigned_agent_fkey(id, full_name, avatar_url, role),
        order:orders(id, order_number, status, total_amount, delivery_date),
        conversation:conversations(id, last_message, whatsapp_number)
      `
      )
      .eq('id', id)
      .single();

    if (error || !ticket) {
      return apiError('Ticket not found', 404, error, 'TICKET_NOT_FOUND');
    }

    return apiSuccess(ticket);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient();
    const { id } = params;
    const body = await request.json();
    const parsed = updateTicketSchema.parse(body);

    const { data: updatedTicket, error } = await supabase
      .from('tickets')
      .update(parsed)
      .eq('id', id)
      .select(
        `
        *,
        restaurant:restaurants(id, name),
        agent:profiles!tickets_assigned_agent_fkey(id, full_name)
      `
      )
      .single();

    if (error) {
      return apiError(error.message, 400, error, 'TICKET_UPDATE_FAILED');
    }

    return apiSuccess(updatedTicket);
  } catch (error) {
    return handleApiError(error);
  }
}
