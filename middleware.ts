import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/** Routes reachable without a session. */
const PUBLIC_PAGE_ROUTES = new Set(['/login']);

function isPublicApiRoute(pathname: string): boolean {
  return (
    pathname.startsWith('/api/webhooks') ||
    pathname.startsWith('/api/webhook') ||
    pathname === '/api/auth/callback' ||
    pathname === '/api/health'
  );
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If credentials are missing the app cannot authenticate anyone. Fail loudly
  // on API routes and send pages to the login screen, which reports the
  // misconfiguration instead of rendering a broken shell.
  if (!supabaseUrl || !supabaseAnonKey) {
    if (pathname.startsWith('/api') && !isPublicApiRoute(pathname)) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Authentication required. Supabase credentials missing in environment.',
        },
        { status: 401 }
      );
    }
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isApiRoute = pathname.startsWith('/api');

  /* ---------------------------------------------------------------- */
  /* Pages                                                            */
  /* ---------------------------------------------------------------- */

  // The root path is resolved here rather than in a page component so the
  // browser receives a real HTTP redirect with a Location header. A redirect()
  // call inside a prerendered page is emitted as a 307 with no Location and
  // only resolves via the client-side router.
  if (!isApiRoute && pathname === '/') {
    return NextResponse.redirect(new URL(user ? '/inbox' : '/login', request.url));
  }

  // Signed-in users have no reason to see the login screen.
  if (!isApiRoute && pathname === '/login' && user) {
    return NextResponse.redirect(new URL('/inbox', request.url));
  }

  // Protect every page route. Previously only /api/* was guarded, so an
  // unauthenticated visitor could load /orders and receive a fully rendered
  // shell whose every data request failed with 401.
  if (!isApiRoute && !PUBLIC_PAGE_ROUTES.has(pathname) && !user) {
    const loginUrl = new URL('/login', request.url);
    if (search) loginUrl.search = search;
    return NextResponse.redirect(loginUrl);
  }

  /* ---------------------------------------------------------------- */
  /* API                                                              */
  /* ---------------------------------------------------------------- */

  if (isApiRoute && !isPublicApiRoute(pathname)) {
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Valid authentication session required' },
        { status: 401 }
      );
    }

    // Attach user identity to request headers for downstream handlers.
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
      request: { headers: requestHeaders },
    });

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
     * Match all request paths except for static assets and image files.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)',
  ],
};
