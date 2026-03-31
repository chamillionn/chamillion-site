import type { MetadataRoute } from "next";
import { createPostsClient } from "@/lib/supabase/posts-client";

const BASE = "https://chamillion.site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let postRoutes: MetadataRoute.Sitemap = [];
  let latestPostDate: Date | null = null;

  try {
    const db = createPostsClient();
    const { data: posts } = await db
      .from("posts")
      .select("slug, date")
      .eq("published", true)
      .order("date", { ascending: false });

    if (posts && posts.length > 0) {
      latestPostDate = new Date(posts[0].date);
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

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: latestPostDate ?? new Date("2025-03-01"), changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/newsletter`, lastModified: latestPostDate ?? new Date("2025-03-01"), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/suscribirse`, lastModified: new Date("2025-03-01"), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/widgets`, lastModified: new Date("2025-03-01"), changeFrequency: "monthly", priority: 0.5 },
  ];

  return [...staticRoutes, ...postRoutes];
}
