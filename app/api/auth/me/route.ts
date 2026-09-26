import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiSuccess, apiError, handleApiError } from '@/lib/api/response';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiError('Unauthorized', 401, null, 'AUTH_REQUIRED');
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      // Return basic auth info if profile record doesn't exist yet
      return apiSuccess({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        role: user.app_metadata?.role || user.user_metadata?.role || 'agent',
        avatar_url: user.user_metadata?.avatar_url || null,
        is_online: false,
        last_seen_at: null,
      });
    }

    return apiSuccess(profile);
  } catch (error) {
    return handleApiError(error);
  }
}
