import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/auth";
import { createPostsClient } from "@/lib/supabase/posts-client";

export const dynamic = "force-dynamic";

/**
 * GET /api/posts/drafts
 * Returns unpublished posts. Admin only.
 */
export async function GET() {
  const ctx = await requireUser();
  if (!ctx || ctx.profile.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createPostsClient();
  const { data, error } = await db
    .from("posts")
    .select("*")
    .eq("published", false)
    .order("date", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
