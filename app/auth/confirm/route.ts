import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { EmailOtpType } from "@supabase/supabase-js";

/** Only allow relative paths — blocks protocol-relative URLs and external redirects */
function safeRedirectPath(raw: string | null): string {
  if (!raw) return "/";
  // RedirectTo from Supabase templates may be URL-encoded
  const decoded = decodeURIComponent(raw);
  if (decoded.startsWith("/") && !decoded.startsWith("//")) return decoded;
  // May contain a full URL with our origin — extract the path
  try {
    const url = new URL(decoded);
    if (url.pathname.startsWith("/") && !url.pathname.startsWith("//")) {
      return url.pathname + url.search;
    }
  } catch {}
  return "/";
}

/**
 * Server-side OTP verification for magic links and signup confirmations.
 * This route receives token_hash + type directly (no PKCE code verifier needed),
 * so it works regardless of which browser/app opens the email link.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeRedirectPath(searchParams.get("next"));

  if (!tokenHash || !type) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  // Ensure profile exists (fallback if DB trigger hasn't run)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      const service = createServiceClient();
      await service.from("profiles").insert({
        id: user.id,
        email: user.email!,
        role: "free",
      });
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
