import { createClient } from "@/lib/supabase/server";
import type { Post } from "@/lib/supabase/types";
import NewsletterClient from "./newsletter-client";

export const revalidate = 60;

export default async function NewsletterIndex() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select("*")
    .eq("published", true)
    .order("date", { ascending: false });

  const posts = (data ?? []) as Post[];

  return <NewsletterClient posts={posts} />;
}
