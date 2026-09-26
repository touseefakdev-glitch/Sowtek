import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

// Resolved authoritatively in middleware, which issues a real HTTP redirect
// carrying a Location header. A redirect() inside a prerendered page is
// emitted as a 307 with no Location and only resolves through the client-side
// router, so this exists purely as a fallback. Kept dynamic to guarantee it is
// never prerendered.
export const dynamic = 'force-dynamic';

export default async function RootPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  redirect(user ? '/inbox' : '/login');
}
