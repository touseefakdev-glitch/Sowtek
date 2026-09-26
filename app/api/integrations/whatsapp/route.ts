import { NextRequest } from 'next/server';
import { apiSuccess, handleApiError } from '@/lib/api/response';
import { getWhatsAppConfigStatus } from '@/lib/data/team';

export async function GET(_request: NextRequest) {
  try {
    const status = getWhatsAppConfigStatus();

    return apiSuccess({
      whatsapp_token_configured: status.whatsappToken,
      whatsapp_phone_number_id_configured: status.whatsappPhoneNumberId,
      webhook_verify_token_configured: status.webhookVerifyToken,
    });
  } catch (error) {
    return handleApiError(error);
  }
}