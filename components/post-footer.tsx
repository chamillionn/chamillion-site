import Link from "next/link";
import { createPostsClient } from "@/lib/supabase/posts-client";
import ShareButtons from "./share-buttons";

interface Props {
  slug: string;
  title: string;
}

interface AdjacentPost {
  slug: string;
  title: string;
}

async function getAdjacentPosts(slug: string): Promise<{ prev: AdjacentPost | null; next: AdjacentPost | null }> {
  try {
    const db = createPostsClient();
    const { data: posts } = await db
      .from("posts")
      .select("slug, title, date")
      .eq("published", true)
      .order("date", { ascending: true });

    if (!posts) return { prev: null, next: null };

    const idx = posts.findIndex((p) => p.slug === slug);
    if (idx === -1) return { prev: null, next: null };

    return {
      prev: idx > 0 ? { slug: posts[idx - 1].slug, title: posts[idx - 1].title } : null,
      next: idx < posts.length - 1 ? { slug: posts[idx + 1].slug, title: posts[idx + 1].title } : null,
    };
  } catch {
    return { prev: null, next: null };
  }
}

export default async function PostFooter({ slug, title }: Props) {
  const { prev, next } = await getAdjacentPosts(slug);

  return (
    <div style={{ marginTop: 40, borderTop: "1px solid var(--border)", paddingTop: 24 }}>
      {/* Share */}
      <ShareButtons slug={slug} title={title} />

      {/* Navigation */}
      {(prev || next) && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: prev && next ? "1fr 1fr" : "1fr",
            gap: 16,
            padding: "16px 0",
          }}
        >
          {prev && (
            <Link
              href={`/newsletter/${prev.slug}`}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                padding: "12px 14px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                textDecoration: "none",
                transition: "all 0.2s ease",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-dm-mono), monospace",
                  fontSize: 9,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "var(--text-muted)",
                }}
              >
                &larr; Anterior
              </span>
              <span
                style={{
                  fontFamily: "var(--font-playfair), serif",
                  fontSize: 13,
                  color: "var(--text-secondary)",
                  lineHeight: 1.3,
                }}
              >
                {prev.title}
              </span>
            </Link>
          )}
          {next && (
            <Link
              href={`/newsletter/${next.slug}`}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                padding: "12px 14px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                textDecoration: "none",
                textAlign: "right",
                transition: "all 0.2s ease",
                gridColumn: !prev ? "1" : undefined,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-dm-mono), monospace",
                  fontSize: 9,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "var(--text-muted)",
                }}
              >
                Siguiente &rarr;
              </span>
              <span
                style={{
                  fontFamily: "var(--font-playfair), serif",
                  fontSize: 13,
                  color: "var(--text-secondary)",
                  lineHeight: 1.3,
                }}
              >
                {next.title}
              </span>
            </Link>
          )}
        </div>
      )}

      {/* Back to archive */}
      <div style={{ textAlign: "center", padding: "20px 0 0" }}>
        <Link
          href="/newsletter"
          style={{
            fontFamily: "var(--font-dm-mono), monospace",
            fontSize: 13,
            color: "var(--text-secondary)",
            textDecoration: "none",
            letterSpacing: "0.02em",
            transition: "color 0.2s",
          }}
        >
          &larr; Volver al archivo
        </Link>
      </div>
    </div>
  );
}
