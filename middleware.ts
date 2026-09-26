import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Fallback if environment variables are not yet populated during initial setup
  if (!supabaseUrl || !supabaseAnonKey) {
    if (request.nextUrl.pathname.startsWith('/api') && !request.nextUrl.pathname.startsWith('/api/health')) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required. Supabase credentials missing in environment.' },
        { status: 401 }
      );
    }
    return supabaseResponse;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Authenticate user via Supabase Auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isApiRoute = pathname.startsWith('/api');
  
  // Public webhook/auth endpoints that should bypass cookie authentication
  const isPublicRoute =
    pathname.startsWith('/api/webhooks') ||
    pathname.startsWith('/api/webhook') ||
    pathname.startsWith('/api/auth/callback') ||
    pathname === '/api/health';

  // Protect all /api/* routes
  if (isApiRoute && !isPublicRoute) {
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Valid authentication session required' },
        { status: 401 }
      );
    }

    // Attach user profile + role to request headers for downstream API handlers
    const requestHeaders = new Headers(request.headers);
    const role =
      (user.app_metadata?.role as string) ||
      (user.user_metadata?.role as string) ||
      'authenticated';

    requestHeaders.set('x-user-id', user.id);
    requestHeaders.set('x-user-email', user.email ?? '');
    requestHeaders.set('x-user-role', role);

    if (user.user_metadata?.full_name || user.user_metadata?.name) {
      requestHeaders.set(
        'x-user-name',
        encodeURIComponent(user.user_metadata.full_name || user.user_metadata.name)
      );
    }

    const authenticatedResponse = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    // Forward any refreshed cookies
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      authenticatedResponse.cookies.set(cookie.name, cookie.value, cookie);
    });

    return authenticatedResponse;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for static assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
