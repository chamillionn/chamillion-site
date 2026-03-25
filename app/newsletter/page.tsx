import { getOptionalUser } from "@/lib/supabase/auth";
import { createPostsClient } from "@/lib/supabase/posts-client";
import type { Post } from "@/lib/supabase/types";
import NewsletterClient from "./newsletter-client";

export default async function NewsletterIndex() {
  let posts: Post[] = [];
  let fetchError = false;
  let isAdmin = false;

  try {
    const ctx = await getOptionalUser();
    const role = ctx?.profile.role;
    isAdmin = role === "admin";

    const postsDb = createPostsClient();
    let query = postsDb.from("posts").select("*");
    if (!isAdmin) query = query.eq("published", true);
    const { data } = await query.order("date", { ascending: false });
    posts = (data ?? []) as Post[];

    return (
      <NewsletterClient
        posts={posts}
        error={false}
        hideUpgrade={role === "member" || isAdmin}
        isAdmin={isAdmin}
      />
    );
  } catch (e) {
    console.error("Newsletter fetch failed:", e);
    fetchError = true;
  }

  return <NewsletterClient posts={posts} error={fetchError} hideUpgrade={false} isAdmin={false} />;
}
