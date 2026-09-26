import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { apiSuccess, apiError, handleApiError } from '@/lib/api/response';
import { sendWhatsAppMessage } from '@/lib/whatsapp/send';

const sendMessageSchema = z.object({
  body: z.string().min(1, 'Message body is required'),
  media_url: z.string().url().optional().nullable(),
  media_type: z.string().optional().nullable(),
});

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient();
    const { id: conversationId } = params;
    const searchParams = request.nextUrl.searchParams;

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const offset = (page - 1) * limit;

    const { data: messages, error, count } = await supabase
      .from('messages')
      .select(
        `
        *,
        sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url, role)
      `,
        { count: 'exact' }
      )
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      return apiError(error.message, 400, error, 'MESSAGES_QUERY_ERROR');
    }

    return apiSuccess(messages, {
      count: count || 0,
      page,
      limit,
      totalPages: count ? Math.ceil(count / limit) : 0,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient();
    const { id: conversationId } = params;
    const body = await request.json();
    const parsed = sendMessageSchema.parse(body);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiError('Unauthorized', 401, null, 'AUTH_REQUIRED');
    }

    // 1. Fetch conversation details to get target WhatsApp number
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id, whatsapp_number, status')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return apiError('Conversation not found', 404, convError, 'CONVERSATION_NOT_FOUND');
    }

    // 2. Dispatch via WhatsApp Cloud API
    const waResult = await sendWhatsAppMessage({
      to: conversation.whatsapp_number,
      body: parsed.body,
      mediaUrl: parsed.media_url || undefined,
      mediaType: parsed.media_type || undefined,
    });

    const now = new Date().toISOString();

    // 3. Insert outbound message record
    const { data: message, error: msgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        direction: 'outbound',
        body: parsed.body,
        media_url: parsed.media_url || null,
        media_type: parsed.media_type || null,
        wa_message_id: waResult.waMessageId || null,
        sender_id: user.id,
        status: waResult.success ? 'sent' : 'failed',
      })
      .select(
        `
        *,
        sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url, role)
      `
      )
      .single();

    if (msgError) {
      return apiError(msgError.message, 400, msgError, 'MESSAGE_INSERT_FAILED');
    }

    // 4. Update conversation thread state
    await supabase
      .from('conversations')
      .update({
        last_message: parsed.body,
        last_message_at: now,
        unread_count: 0,
      })
      .eq('id', conversationId);

    return apiSuccess(message, null, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
