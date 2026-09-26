import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { apiSuccess, apiError, handleApiError } from '@/lib/api/response';

const statusSchema = z.object({
  is_online: z.boolean(),
});

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiError('Unauthorized', 401, null, 'AUTH_REQUIRED');
    }

    const body = await request.json();
    const parsed = statusSchema.parse(body);

    const now = new Date().toISOString();

    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        is_online: parsed.is_online,
        last_seen_at: now,
      })
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      return apiError(updateError.message, 400, updateError, 'PROFILE_UPDATE_FAILED');
    }

    return apiSuccess(updatedProfile);
  } catch (error) {
    return handleApiError(error);
  }
}
