import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { apiSuccess, apiError, handleApiError } from '@/lib/api/response';

const updateTicketStatusSchema = z.object({
  status: z.enum([
    'new',
    'investigating',
    'waiting_for_information',
    'resolution_offered',
    'resolved',
    'escalated',
  ]),
  resolution: z.string().optional().nullable(),
});

interface RouteParams {
  params: {
    id: string;
  };
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient();
    const { id: ticketId } = params;
    const body = await request.json();
    const parsed = updateTicketStatusSchema.parse(body);

    const isResolved = parsed.status === 'resolved';
    const now = new Date().toISOString();

    const updatePayload: Record<string, unknown> = {
      status: parsed.status,
      resolution: parsed.resolution !== undefined ? parsed.resolution : undefined,
      resolved_at: isResolved ? now : null,
    };

    const { data: updatedTicket, error } = await supabase
      .from('tickets')
      .update(updatePayload)
      .eq('id', ticketId)
      .select(
        `
        *,
        restaurant:restaurants(id, name),
        agent:profiles!tickets_assigned_agent_fkey(id, full_name)
      `
      )
      .single();

    if (error) {
      return apiError(error.message, 400, error, 'STATUS_UPDATE_FAILED');
    }

    // Notify assigned agent on escalation or resolution
    if (updatedTicket.assigned_agent) {
      await supabase.from('notifications').insert({
        user_id: updatedTicket.assigned_agent,
        type: 'ticket_status_changed',
        title: `Ticket ${updatedTicket.ticket_number || ''} ${parsed.status.toUpperCase()}`,
        body: `Ticket status is now ${parsed.status.replace(/_/g, ' ')}`,
        link: `/tickets`,
      });
    }

    return apiSuccess(updatedTicket);
  } catch (error) {
    return handleApiError(error);
  }
}
