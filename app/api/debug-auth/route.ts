import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const sbCookies = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .filter((c) => c.startsWith("sb-"));

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  let profile = null;
  let profileError = null;

  if (user) {
    const res = await supabase
      .from("profiles")
      .select("id, email, role")
      .eq("id", user.id)
      .single();
    profile = res.data;
    profileError = res.error?.message ?? null;
  }

  return NextResponse.json({
    sbCookieCount: sbCookies.length,
    sbCookieNames: sbCookies.map((c) => c.split("=")[0]),
    user: user ? { id: user.id, email: user.email } : null,
    userError: userError?.message ?? null,
    profile,
    profileError,
    env: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 30) + "...",
      keyType: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.startsWith("eyJ")
        ? "legacy-jwt"
        : "publishable",
    },
  });
}
