"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { V, steelA } from "@/lib/theme";
import type { Post } from "@/lib/supabase/types";

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDate();
  const month = d
    .toLocaleDateString("es-ES", { month: "short" })
    .replace(".", "")
    .toUpperCase();
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

// ── Post card ──
function PostCard({ post, delay }: { post: Post; delay: number }) {
  const [hovered, setHovered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: `all 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
      }}
    >
      <Link
        href={`/newsletter/${post.slug}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: "block",
          textDecoration: "none",
          borderRadius: 12,
          overflow: "hidden",
          border: `1px solid ${V.border}`,
          background: V.bgCard,
          transition:
            "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease",
          transform: hovered ? "translateY(-2px)" : "translateY(0)",
          boxShadow: hovered
            ? `inset 0 0 0 1px ${steelA(0.25)}, 0 4px 24px ${steelA(0.03)}`
            : "inset 0 0 0 0px transparent",
        }}
      >
        {/* Image */}
        {post.banner_path && (
          <div
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "2.4/1",
              overflow: "hidden",
            }}
          >
            <Image
              src={post.banner_path}
              alt={post.title}
              fill
              style={{
                objectFit: "cover",
                transition: "transform 0.6s ease",
                transform: hovered ? "scale(1.05)" : "scale(1.01)",
              }}
              sizes="(max-width: 768px) 100vw, 526px"
            />
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "60%",
                background: `linear-gradient(to top, ${V.bgCard}, transparent)`,
                pointerEvents: "none",
              }}
            />
          </div>
        )}

        {/* Text */}
        <div
          style={{
            padding: "14px 14px 14px",
            position: "relative",
            marginTop: -2,
            background: V.bgCard,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 6,
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-jetbrains), monospace",
                fontSize: 9,
                color: V.steel,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              {formatDate(post.date)}
            </span>
            {post.premium && (
              <span
                style={{
                  fontFamily: "var(--font-dm-mono), monospace",
                  fontSize: 8,
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  padding: "2px 6px",
                  borderRadius: 4,
                  background: steelA(0.1),
                  color: V.steel,
                }}
              >
                Premium
              </span>
            )}
          </div>
          <div
            style={{
              fontFamily: "var(--font-playfair), serif",
              fontSize: 16,
              lineHeight: 1.3,
              color: V.textPrimary,
              letterSpacing: "-0.01em",
              marginBottom: 4,
            }}
          >
            {post.title}
          </div>
          <div
            style={{
              fontSize: 12,
              lineHeight: 1.5,
              color: V.textSecondary,
              fontWeight: 300,
            }}
          >
            {post.subtitle}
          </div>
          <div
            style={{
              marginTop: 10,
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontFamily: "var(--font-jetbrains), monospace",
              fontSize: 9,
              color: V.steel,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Leer
            <svg
              width="9"
              height="9"
              viewBox="0 0 16 16"
              fill="none"
              style={{
                transition: "transform 0.3s ease",
                transform: hovered ? "translateX(3px)" : "translateX(0)",
              }}
            >
              <path
                d="M6 3L11 8L6 13"
                stroke={V.steel}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </Link>
    </div>
  );
}

// ── Newsletter index ──
export default function NewsletterClient({ posts }: { posts: Post[] }) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: "0 24px",
      }}
    >
      {/* Section label */}
      <div
        style={{
          fontFamily: "var(--font-jetbrains), monospace",
          fontSize: 9,
          color: V.textMuted,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          paddingTop: 48,
          marginBottom: 14,
          opacity: loaded ? 1 : 0,
          transform: loaded ? "translateY(0)" : "translateY(6px)",
          transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0s",
        }}
      >
        Archivo
      </div>

      {/* Heading */}
      <h1
        style={{
          fontFamily: "var(--font-playfair), serif",
          fontSize: 48,
          fontWeight: 400,
          lineHeight: 1,
          letterSpacing: "-0.03em",
          color: V.textPrimary,
          margin: "0 0 12px",
          opacity: loaded ? 1 : 0,
          transform: loaded ? "translateY(0)" : "translateY(12px)",
          transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.05s",
        }}
      >
        Newsletter
      </h1>

      {/* Intro */}
      <p
        style={{
          fontSize: 16,
          lineHeight: 1.65,
          color: V.textSecondary,
          fontWeight: 300,
          maxWidth: "55ch",
          margin: "0 0 40px",
          opacity: loaded ? 1 : 0,
          transform: loaded ? "translateY(0)" : "translateY(12px)",
          transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s",
        }}
      >
        Un viaje con dinero real por la vanguardia de los mercados financieros.
        Documentado, y verificable.
      </p>

      {/* Gradient divider */}
      <div
        style={{
          height: 1,
          background: `linear-gradient(to right, transparent, ${V.border}, transparent)`,
          marginBottom: 40,
        }}
      />

      {/* Post grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
          gap: 24,
          paddingBottom: 80,
        }}
      >
        {posts.map((post, i) => (
          <PostCard key={post.slug} post={post} delay={i * 100} />
        ))}
      </div>
    </div>
  );
}
