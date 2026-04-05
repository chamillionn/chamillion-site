import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const service = createServiceClient();
  const { data, error } = await service
    .from("pending_logins")
    .select("token_hash, verified_at, expires_at")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ status: "not_found" }, { status: 404 });
  }

  if (new Date(data.expires_at) < new Date()) {
    await service.from("pending_logins").delete().eq("id", id);
    return NextResponse.json({ status: "expired" }, { status: 410 });
  }

  if (!data.verified_at || !data.token_hash) {
    return NextResponse.json({ status: "pending" });
  }

  // Verified — return transfer token and clean up the row
  const tokenHash = data.token_hash;
  await service.from("pending_logins").delete().eq("id", id);
  return NextResponse.json({ status: "verified", token_hash: tokenHash });
}
