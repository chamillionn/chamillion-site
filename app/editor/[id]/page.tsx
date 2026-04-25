import { notFound } from "next/navigation";
import { list } from "@vercel/blob";
import { createPostsClient } from "@/lib/supabase/posts-client";
import { requireAdmin } from "@/lib/supabase/admin";
import type { Post } from "@/lib/supabase/types";
import Editor from "../_components/editor";

export const metadata = { title: "Editor — Borrador" };

interface PageProps {
  params: Promise<{ id: string }>;
}

/** Lista los banners disponibles en Vercel Blob (`newsletter/banner-*`). */
async function listBannerOptions(): Promise<string[]> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return [];
  try {
    const res = await list({ prefix: "newsletter/banner-" });
    return res.blobs.map((b) => b.url).sort();
  } catch {
    return [];
  }
}

// Auth is enforced by app/editor/layout.tsx; requireAdmin() is cached so
// calling it here is a no-op on the second invocation.
export default async function EditarPage({ params }: PageProps) {
  const admin = await requireAdmin();
  const { id } = await params;

  const postsDb = createPostsClient();
  const [{ data }, bannerOptions] = await Promise.all([
    postsDb.from("posts").select("*").eq("id", id).single(),
    listBannerOptions(),
  ]);
  if (!data) notFound();
  const post = data as Post;

  return (
    <Editor
      post={post}
      readOnly={admin?.isRemote ?? true}
      bannerOptions={bannerOptions}
    />
  );
}
