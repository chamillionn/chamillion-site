import { createClient } from "@/lib/supabase/server";
import type { Post } from "@/lib/supabase/types";
import NewsletterClient from "./newsletter-client";

export const revalidate = 60;

export default async function NewsletterIndex() {
  let posts: Post[] = [];
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
  }

  return <NewsletterClient posts={posts} />;
}
