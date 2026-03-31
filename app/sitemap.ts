import type { MetadataRoute } from "next";
import { createPostsClient } from "@/lib/supabase/posts-client";

const BASE = "https://chamillion.site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/newsletter`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/suscribirse`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/widgets`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];

  let postRoutes: MetadataRoute.Sitemap = [];
  try {
    const db = createPostsClient();
    const { data: posts } = await db
      .from("posts")
      .select("slug, date")
      .eq("published", true)
      .order("date", { ascending: false });

    if (posts) {
      postRoutes = posts.map((p) => ({
        url: `${BASE}/newsletter/${p.slug}`,
        lastModified: new Date(p.date),
        changeFrequency: "monthly" as const,
        priority: 0.7,
      }));
    }
  } catch {
    // Supabase unreachable — fall back to static routes only
  }

  return [...staticRoutes, ...postRoutes];
}
