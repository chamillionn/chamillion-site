import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Skip Supabase if env vars are not configured
  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const pathname = request.nextUrl.pathname;
  const isProtectedRoute =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/hub") ||
    pathname.startsWith("/cuenta") ||
    pathname.startsWith("/auth");

  // Only call getUser() (HTTP round-trip to Supabase Auth) when needed:
  // - Protected routes always need auth verification
  // - Public routes only need session refresh if auth cookies exist
  const hasAuthCookies = request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-"));

  if (!isProtectedRoute && !hasAuthCookies) {
    return supabaseResponse;
  }

  // Refresh the session — validates JWT and refreshes tokens if needed.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes — require authenticated session
  // /admin/* (role checked in admin layout via requireAdmin), /hub/*, /cuenta
  const PROTECTED = ["/admin", "/hub", "/cuenta"];
  if (PROTECTED.some((p) => pathname.startsWith(p)) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
