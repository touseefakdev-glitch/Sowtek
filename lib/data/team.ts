import { createClient } from '@/lib/supabase/server';

/**
 * Server-side data access for the team roster shown in Settings.
 */

export interface AgentProfile {
  id: string;
  full_name: string;
  role: string | null;
  avatar_url: string | null;
  is_online: boolean | null;
  last_seen_at: string | null;
}

export async function fetchAgents(): Promise<AgentProfile[]> {
  const { data, error } = await createClient()
    .from('profiles')
    .select('id, full_name, role, avatar_url, is_online, last_seen_at')
    .order('full_name', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as AgentProfile[];
}

export interface WhatsAppConfigStatus {
  whatsappToken: boolean;
  whatsappPhoneNumberId: boolean;
  webhookVerifyToken: boolean;
}

/**
 * Reports only whether each credential is present. The values stay on the
 * server and are never serialised to the browser.
 */
export function getWhatsAppConfigStatus(): WhatsAppConfigStatus {
  return {
    whatsappToken: Boolean(process.env.WHATSAPP_TOKEN),
    whatsappPhoneNumberId: Boolean(process.env.WHATSAPP_PHONE_NUMBER_ID),
    webhookVerifyToken: Boolean(process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN),
  };
}
