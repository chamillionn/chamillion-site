import { requireAdmin } from "@/lib/supabase/admin";
import { createPostsClient } from "@/lib/supabase/posts-client";
import { redirect } from "next/navigation";
import type { Post } from "@/lib/supabase/types";
import NewsletterTable from "./newsletter-table";

export const metadata = { title: "Admin — Newsletter" };

export default async function AdminNewsletter() {
  const admin = await requireAdmin();
  if (!admin) redirect("/login");

  const postsDb = createPostsClient();
  const { data } = await postsDb
    .from("posts")
    .select("*")
    .order("date", { ascending: false });

  const posts = (data ?? []) as Post[];

  return <NewsletterTable posts={posts} />;
}
