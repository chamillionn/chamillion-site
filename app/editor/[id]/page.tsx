import { notFound } from "next/navigation";
import { promises as fs } from "fs";
import path from "path";
import { createPostsClient } from "@/lib/supabase/posts-client";
import { requireAdmin } from "@/lib/supabase/admin";
import type { Post } from "@/lib/supabase/types";
import Editor from "../_components/editor";

export const metadata = { title: "Editor — Borrador" };

interface PageProps {
  params: Promise<{ id: string }>;
}

/** Lista los banners disponibles en /public/assets/newsletter/ (banner-*.jpeg|png|webp). */
async function listBannerOptions(): Promise<string[]> {
  try {
    const dir = path.join(process.cwd(), "public", "assets", "newsletter");
    const files = await fs.readdir(dir);
    return files
      .filter((f) => /^banner-.*\.(jpe?g|png|webp|avif)$/i.test(f))
      .sort()
      .map((f) => `/assets/newsletter/${f}`);
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
