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

  // /admin/* — require authenticated session + admin role
  if (pathname.startsWith("/admin")) {
    if (!user) {
      console.warn("[middleware] /admin: no user session, redirecting to /login");
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    console.info(`[middleware] /admin: user=${user.id}, profile=${JSON.stringify(profile)}, error=${profileError?.message ?? "none"}`);

    if (!profile || profile.role !== "admin") {
      console.warn(`[middleware] /admin: access denied — role=${profile?.role ?? "null"}`);
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  // /hub/* — require authenticated session (any role, page handles access)
  if (pathname.startsWith("/hub")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  // /cuenta — require authenticated session (any role)
  if (pathname.startsWith("/cuenta")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
