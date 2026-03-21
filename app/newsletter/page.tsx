import { createClient } from "@/lib/supabase/server";
import { getOptionalUser } from "@/lib/supabase/auth";
import type { Post } from "@/lib/supabase/types";
import NewsletterClient from "./newsletter-client";

export const revalidate = 60;

export default async function NewsletterIndex() {
  let posts: Post[] = [];
  let fetchError = false;
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("posts")
      .select("*")
      .eq("published", true)
      .order("date", { ascending: false });
    posts = (data ?? []) as Post[];
  } catch (e) {
    console.error("Newsletter fetch failed:", e);
    fetchError = true;
  }

  let hideUpgrade = false;
  try {
    const ctx = await getOptionalUser();
    hideUpgrade = ctx?.profile.role === "member" || ctx?.profile.role === "admin";
  } catch {
    // Supabase unreachable — default to showing upgrade CTA
  }

  return <NewsletterClient posts={posts} error={fetchError} hideUpgrade={hideUpgrade} />;
}
