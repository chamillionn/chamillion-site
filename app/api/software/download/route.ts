import { NextResponse } from "next/server";
import { requireMember } from "@/lib/supabase/auth";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * POST /api/software/download
 * Body: { versionId: string }
 * Returns: { url: string } — signed URL (60s expiry)
 */
export async function POST(request: Request) {
  const ctx = await requireMember();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { versionId } = await request.json();
  if (!versionId || typeof versionId !== "string") {
    return NextResponse.json({ error: "Missing versionId" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Get file path from version
  const { data: version, error: vErr } = await supabase
    .from("software_versions")
    .select("file_path, software_id")
    .eq("id", versionId)
    .single();

  if (vErr || !version?.file_path) {
    return NextResponse.json({ error: "Version not found" }, { status: 404 });
  }

  // Generate signed URL (60s expiry)
  const { data: signed, error: sErr } = await supabase.storage
    .from("software-releases")
    .createSignedUrl(version.file_path, 60);

  if (sErr || !signed?.signedUrl) {
    return NextResponse.json(
      { error: "Could not generate download URL" },
      { status: 500 },
    );
  }

  // Track download
  await supabase.from("downloads").insert({
    user_id: ctx.user.id,
    version_id: versionId,
  });

  return NextResponse.json({ url: signed.signedUrl });
}
