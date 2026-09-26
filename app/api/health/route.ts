import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const base = {
    status: 'ok',
    service: 'Sowtek OrderFlow API',
    timestamp: new Date().toISOString(),
  };

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { ...base, status: 'degraded', database: 'not_configured' },
      { status: 503 }
    );
  }

  try {
    // A no-session read. RLS returns zero rows, so this only proves that the
    // deployment can reach Supabase with valid credentials. No data is exposed.
    const { error } = await createClient().from('profiles').select('id').limit(1);

    if (error) {
      return NextResponse.json(
        { ...base, status: 'degraded', database: 'unreachable' },
        { status: 503 }
      );
    }

    return NextResponse.json({ ...base, status: 'ok', database: 'reachable' });
  } catch {
    return NextResponse.json(
      { ...base, status: 'degraded', database: 'unreachable' },
      { status: 503 }
    );
  }
}
