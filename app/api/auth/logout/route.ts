import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiSuccess, handleApiError } from '@/lib/api/response';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return apiSuccess({ signed_out: false, message: error.message });
    }

    return apiSuccess({ signed_out: true });
  } catch (error) {
    return handleApiError(error);
  }
}
