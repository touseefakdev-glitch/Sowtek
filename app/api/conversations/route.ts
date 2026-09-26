import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { apiSuccess, apiError, handleApiError } from '@/lib/api/response';

const createConversationSchema = z.object({
  restaurant_id: z.string().uuid().optional().nullable(),
  whatsapp_number: z.string().min(6, 'WhatsApp phone number is required'),
  channel: z.enum(['whatsapp', 'email', 'sms', 'facebook', 'instagram']).default('whatsapp'),
  assigned_agent: z.string().uuid().optional().nullable(),
  initial_message: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const searchParams = request.nextUrl.searchParams;

    const status = searchParams.get('status');
    const agent = searchParams.get('agent');
    const channel = searchParams.get('channel');
    const search = searchParams.get('search');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const offset = (page - 1) * limit;

    let query = supabase
      .from('conversations')
      .select(
        `
        *,
        restaurant:restaurants(id, name, name_ar, phone, address),
        agent:profiles!conversations_assigned_agent_fkey(id, full_name, avatar_url, role)
      `,
        { count: 'exact' }
      );

    if (status) {
      query = query.eq('status', status);
    }
    if (agent) {
      query = query.eq('assigned_agent', agent);
    }
    if (channel) {
      query = query.eq('channel', channel);
    }
    if (search) {
      // Search in last_message or whatsapp_number
      query = query.or(`last_message.ilike.%${search}%,whatsapp_number.ilike.%${search}%`);
    }

    query = query.order('last_message_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data: conversations, error, count } = await query;

    if (error) {
      return apiError(error.message, 400, error, 'QUERY_ERROR');
    }

    return apiSuccess(conversations, {
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
    const parsed = createConversationSchema.parse(body);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Default assigned agent to current user if none provided
    const assignedAgentId = parsed.assigned_agent !== undefined ? parsed.assigned_agent : user?.id || null;

    const { data: conversation, error } = await supabase
      .from('conversations')
      .insert({
        restaurant_id: parsed.restaurant_id || null,
        whatsapp_number: parsed.whatsapp_number,
        channel: parsed.channel,
        assigned_agent: assignedAgentId,
        status: 'active',
        last_message: parsed.initial_message || null,
        last_message_at: new Date().toISOString(),
        unread_count: 0,
      })
      .select(
        `
        *,
        restaurant:restaurants(id, name, name_ar, phone),
        agent:profiles!conversations_assigned_agent_fkey(id, full_name, avatar_url)
      `
      )
      .single();

    if (error) {
      return apiError(error.message, 400, error, 'CONVERSATION_CREATE_FAILED');
    }

    return apiSuccess(conversation, null, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
