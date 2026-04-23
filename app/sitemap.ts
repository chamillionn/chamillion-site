import type { MetadataRoute } from "next";
import { createPostsClient } from "@/lib/supabase/posts-client";
import { createAnalysesClient } from "@/lib/supabase/analyses-client";

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

  let analysisRoutes: MetadataRoute.Sitemap = [];
  let latestAnalysisDate: Date | null = null;
  try {
    const db = createAnalysesClient();
    const { data: analyses } = await db
      .from("analyses")
      .select("slug,updated_at,published_at")
      .eq("visibility", "public")
      .order("published_at", { ascending: false });

    if (analyses && analyses.length > 0) {
      const first = analyses[0];
      latestAnalysisDate = new Date(first.published_at ?? first.updated_at);
      analysisRoutes = analyses.map((a) => ({
        url: `${BASE}/analisis/${a.slug}`,
        lastModified: new Date(a.updated_at ?? a.published_at ?? Date.now()),
        changeFrequency: "monthly" as const,
        priority: 0.7,
      }));
    }
  } catch {
    // Ignore — static routes still ship.
  }

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: latestPostDate ?? new Date("2025-03-01"), changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/newsletter`, lastModified: latestPostDate ?? new Date("2025-03-01"), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/analisis`, lastModified: latestAnalysisDate ?? new Date("2026-04-01"), changeFrequency: "weekly", priority: 0.75 },
    { url: `${BASE}/suscribirse`, lastModified: new Date("2025-03-01"), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/widgets`, lastModified: new Date("2025-03-01"), changeFrequency: "monthly", priority: 0.5 },
  ];

  return [...staticRoutes, ...postRoutes, ...analysisRoutes];
}
