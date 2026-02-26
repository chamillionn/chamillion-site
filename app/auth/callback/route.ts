import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Only allow relative paths — blocks protocol-relative URLs and external redirects */
function safeRedirectPath(raw: string | null): string {
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/admin";
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeRedirectPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Auth failed — redirect to login
  return NextResponse.redirect(`${origin}/login`);
}
