import { createPostsClient } from "@/lib/supabase/posts-client";
import type { Post } from "@/lib/supabase/types";
import NewsletterClient from "./newsletter-client";

export const revalidate = 300; // ISR: revalidate every 5 min

export default async function NewsletterIndex() {
  let posts: Post[] = [];
  let fetchError = false;

  try {
    const postsDb = createPostsClient();
    const { data } = await postsDb
      .from("posts")
      .select("*")
      .eq("published", true)
      .order("date", { ascending: false });
    posts = (data ?? []) as Post[];
  } catch (e) {
    console.error("Newsletter fetch failed:", e);
    fetchError = true;
  }

  return <NewsletterClient posts={posts} error={fetchError} />;
}
