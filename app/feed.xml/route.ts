import { createPostsClient } from "@/lib/supabase/posts-client";

const BASE = "https://chamillion.site";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  let items = "";

  try {
    const db = createPostsClient();
    const { data: posts } = await db
      .from("posts")
      .select("slug, title, subtitle, date, banner_path")
      .eq("published", true)
      .order("date", { ascending: false });

    if (posts) {
      items = posts
        .map(
          (p) => `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${BASE}/newsletter/${p.slug}</link>
      <guid isPermaLink="true">${BASE}/newsletter/${p.slug}</guid>
      <pubDate>${new Date(p.date + "T12:00:00Z").toUTCString()}</pubDate>${
            p.subtitle
              ? `\n      <description>${escapeXml(p.subtitle)}</description>`
              : ""
          }${
            p.banner_path
              ? `\n      <enclosure url="${BASE}${p.banner_path}" type="image/jpeg" />`
              : ""
          }
    </item>`,
        )
        .join("\n");
    }
  } catch {
    // Supabase unreachable — return empty feed
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Chamillion</title>
    <link>${BASE}</link>
    <description>Documentando la vanguardia de los mercados financieros, y haciendo dinero.</description>
    <language>es</language>
    <atom:link href="${BASE}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600",
    },
  });
}
