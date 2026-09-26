import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiSuccess, handleApiError } from '@/lib/api/response';

export async function GET(_request: NextRequest) {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role, avatar_url, is_online, last_seen_at')
      .order('full_name', { ascending: true });

    if (error) {
      return handleApiError(error);
    }

    return apiSuccess(data ?? [], { count: data?.length ?? 0 });
  } catch (error) {
    return handleApiError(error);
  }
}
