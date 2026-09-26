import { NextRequest } from 'next/server';
import { apiSuccess, handleApiError } from '@/lib/api/response';

export async function GET(_request: NextRequest) {
  try {
    return apiSuccess({
      whatsapp_token_configured: Boolean(process.env.WHATSAPP_TOKEN),
      whatsapp_phone_number_id_configured: Boolean(process.env.WHATSAPP_PHONE_NUMBER_ID),
      webhook_verify_token_configured: Boolean(process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
