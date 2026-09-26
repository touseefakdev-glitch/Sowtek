import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { apiSuccess, apiError, handleApiError } from '@/lib/api/response';

const updateConversationSchema = z.object({
  status: z.enum(['active', 'in_process', 'completed', 'archived']).optional(),
  assigned_agent: z.string().uuid().optional().nullable(),
  unread_count: z.number().int().min(0).optional(),
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

    const { data: conversation, error } = await supabase
      .from('conversations')
      .select(
        `
        *,
        restaurant:restaurants(
          id, name, name_ar, phone, whatsapp_number, email, address, delivery_zone, credit_limit, payment_terms, notes
        ),
        agent:profiles!conversations_assigned_agent_fkey(
          id, full_name, role, avatar_url, is_online
        )
      `
      )
      .eq('id', id)
      .single();

    if (error || !conversation) {
      return apiError('Conversation not found', 404, error, 'NOT_FOUND');
    }

    return apiSuccess(conversation);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient();
    const { id } = params;
    const body = await request.json();
    const parsed = updateConversationSchema.parse(body);

    const updatePayload: Record<string, unknown> = {
      ...parsed,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedConversation, error } = await supabase
      .from('conversations')
      .update(updatePayload)
      .eq('id', id)
      .select(
        `
        *,
        restaurant:restaurants(id, name, name_ar, phone),
        agent:profiles!conversations_assigned_agent_fkey(id, full_name, avatar_url)
      `
      )
      .single();

    if (error) {
      return apiError(error.message, 400, error, 'UPDATE_FAILED');
    }

    return apiSuccess(updatedConversation);
  } catch (error) {
    return handleApiError(error);
  }
}
