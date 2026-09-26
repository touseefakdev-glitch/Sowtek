/**
 * WhatsApp Business API Cloud Sender Utility
 * Handles outbound WhatsApp messaging via Meta Graph API.
 */

interface SendWhatsAppMessageParams {
  to: string;
  body: string;
  mediaUrl?: string;
  mediaType?: string;
}

interface SendWhatsAppResult {
  success: boolean;
  waMessageId?: string;
  error?: string;
}

export async function sendWhatsAppMessage({
  to,
  body,
  mediaUrl,
  mediaType,
}: SendWhatsAppMessageParams): Promise<SendWhatsAppResult> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  // Clean phone number (remove + or whitespace)
  const cleanedTo = to.replace(/\D/g, '');

  if (!token || !phoneNumberId) {
    const error = 'WhatsApp Cloud API is not configured: set WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID.';
    console.error('[WHATSAPP_NOT_CONFIGURED]', error);
    return { success: false, error };
  }

  try {
    const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;

    let payload: Record<string, unknown> = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: cleanedTo,
    };

    if (mediaUrl) {
      const type = mediaType?.startsWith('image')
        ? 'image'
        : mediaType?.startsWith('video')
        ? 'video'
        : mediaType?.startsWith('audio')
        ? 'audio'
        : 'document';

      payload = {
        ...payload,
        type,
        [type]: {
          link: mediaUrl,
          caption: body || undefined,
        },
      };
    } else {
      payload = {
        ...payload,
        type: 'text',
        text: {
          preview_url: false,
          body,
        },
      };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[WHATSAPP_API_ERROR]', data);
      return {
        success: false,
        error: data.error?.message || 'Failed to send WhatsApp message',
      };
    }

    const waMessageId = data.messages?.[0]?.id;
    return {
      success: true,
      waMessageId,
    };
  } catch (error) {
    console.error('[WHATSAPP_SEND_EXCEPTION]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown WhatsApp dispatch error',
    };
  }
}
