import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { apiSuccess, apiError, handleApiError } from '@/lib/api/response';

const createTicketSchema = z.object({
  restaurant_id: z.string().uuid('Restaurant ID is required'),
  order_id: z.string().uuid().optional().nullable(),
  conversation_id: z.string().uuid().optional().nullable(),
  assigned_agent: z.string().uuid().optional().nullable(),
  type: z.enum(['missing_item', 'wrong_item', 'quality', 'delivery', 'payment', 'other']),
  status: z
    .enum(['new', 'investigating', 'waiting_for_information', 'resolution_offered', 'resolved', 'escalated'])
    .default('new'),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  description: z.string().min(1, 'Ticket description is required'),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const searchParams = request.nextUrl.searchParams;

    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const type = searchParams.get('type');
    const agent = searchParams.get('agent');
    const restaurantId = searchParams.get('restaurant_id');
    const search = searchParams.get('search');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const offset = (page - 1) * limit;

    let query = supabase
      .from('tickets')
      .select(
        `
        *,
        restaurant:restaurants(id, name, name_ar, phone, whatsapp_number),
        agent:profiles!tickets_assigned_agent_fkey(id, full_name, avatar_url, role),
        order:orders(id, order_number, status, total_amount)
      `,
        { count: 'exact' }
      );

    if (status) {
      query = query.eq('status', status);
    }
    if (priority) {
      query = query.eq('priority', priority);
    }
    if (type) {
      query = query.eq('type', type);
    }
    if (agent) {
      query = query.eq('assigned_agent', agent);
    }
    if (restaurantId) {
      query = query.eq('restaurant_id', restaurantId);
    }
    if (search) {
      query = query.or(`ticket_number.ilike.%${search}%,description.ilike.%${search}%`);
    }

    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data: tickets, error, count } = await query;

    if (error) {
      return apiError(error.message, 400, error, 'TICKETS_QUERY_ERROR');
    }

    return apiSuccess(tickets, {
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
    const parsed = createTicketSchema.parse(body);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiError('Unauthorized', 401, null, 'AUTH_REQUIRED');
    }

    // Default assigned agent
    const assignedAgent = parsed.assigned_agent || user.id;

    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .insert({
        restaurant_id: parsed.restaurant_id,
        order_id: parsed.order_id || null,
        conversation_id: parsed.conversation_id || null,
        assigned_agent: assignedAgent,
        type: parsed.type,
        status: parsed.status,
        priority: parsed.priority,
        description: parsed.description,
      })
      .select(
        `
        *,
        restaurant:restaurants(id, name, name_ar),
        agent:profiles!tickets_assigned_agent_fkey(id, full_name)
      `
      )
      .single();

    if (ticketError || !ticket) {
      return apiError(ticketError?.message || 'Failed to create ticket', 400, ticketError, 'TICKET_CREATE_FAILED');
    }

    // Auto-create notification for supervisor + assigned agent
    const { data: supervisors } = await supabase
      .from('profiles')
      .select('id')
      .in('role', ['supervisor', 'admin']);

    const targetUserIds = new Set<string>();
    if (assignedAgent) targetUserIds.add(assignedAgent);
    (supervisors || []).forEach((s) => targetUserIds.add(s.id));

    const notifications = Array.from(targetUserIds).map((userId) => ({
      user_id: userId,
      type: 'ticket_created',
      title: `New Ticket ${ticket.ticket_number || ''} [${parsed.priority.toUpperCase()}]`,
      body: `${ticket.restaurant?.name || 'Restaurant'}: ${parsed.type.replace(/_/g, ' ')} - ${parsed.description.substring(0, 80)}`,
      link: `/tickets`,
    }));

    if (notifications.length > 0) {
      await supabase.from('notifications').insert(notifications);
    }

    return apiSuccess(ticket, null, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
