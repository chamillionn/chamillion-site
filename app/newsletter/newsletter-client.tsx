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

// ── Section metadata ──
const SECTION_META: Record<string, { image: string; description: string }> = {
  "Reporte de la Cartera": {
    image: "/assets/newsletter/sections/reporte-de-la-cartera.jpeg",
    description:
      "Actualización al detalle de mis nuevas posiciones, y de cómo van las actuales. Novedades en los mercados, y cosas a esperar.",
  },
  "Punto de Mira": {
    image: "/assets/newsletter/sections/punto-de-mira.png",
    description: "La vanguardia de los mercados, al detalle.",
  },
};

// All known sections — always shown even if no posts exist yet
const ALL_SECTIONS = Object.keys(SECTION_META);

// ── Section cards ──
function SectionCards({
  active,
  onChange,
  loaded,
  postCounts,
}: {
  active: string | null;
  onChange: (s: string | null) => void;
  loaded: boolean;
  postCounts: Record<string, number>;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        marginBottom: 32,
        opacity: loaded ? 1 : 0,
        transform: loaded ? "translateY(0)" : "translateY(8px)",
        transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.18s",
      }}
    >
      {/* Label */}
      <div
        style={{
          fontFamily: "var(--font-jetbrains), monospace",
          fontSize: 9,
          color: V.textMuted,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
        }}
      >
        Filtrar por sección
      </div>

      {/* Section cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
        {ALL_SECTIONS.map((section) => {
          const meta = SECTION_META[section];
          const isActive = active === section;
          const count = postCounts[section] ?? 0;
          const isEmpty = count === 0;
          return (
            <button
              key={section}
              type="button"
              onClick={() => onChange(isActive ? null : section)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: 12,
                borderRadius: 10,
                border: `1px solid ${isActive ? steelA(0.35) : steelA(0.12)}`,
                background: isActive ? steelA(0.06) : "transparent",
                cursor: "pointer",
                transition: "all 0.25s ease",
                textAlign: "left",
                opacity: isEmpty && !isActive ? 0.55 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = steelA(0.25);
                  e.currentTarget.style.background = steelA(0.03);
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = steelA(0.12);
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              {meta?.image && (
                <Image
                  src={meta.image}
                  alt=""
                  width={52}
                  height={52}
                  style={{
                    borderRadius: 8,
                    objectFit: "cover",
                    flexShrink: 0,
                    opacity: isActive ? 1 : 0.75,
                    transition: "opacity 0.2s",
                  }}
                />
              )}
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      fontFamily: "var(--font-playfair), serif",
                      fontSize: 15,
                      fontWeight: 600,
                      color: isActive ? V.textPrimary : V.textSecondary,
                      lineHeight: 1.3,
                      transition: "color 0.2s",
                    }}
                  >
                    {section}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-dm-mono), monospace",
                      fontSize: 9,
                      color: V.textMuted,
                      letterSpacing: "0.04em",
                    }}
                  >
                    {isEmpty ? "Próximamente" : `${count}`}
                  </span>
                </div>
                {meta?.description && (
                  <div
                    style={{
                      fontSize: 11,
                      lineHeight: 1.45,
                      color: V.textMuted,
                      fontWeight: 300,
                      marginTop: 3,
                    }}
                  >
                    {meta.description}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Clear filter */}
      {active && (
        <button
          type="button"
          onClick={() => onChange(null)}
          style={{
            alignSelf: "flex-start",
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontFamily: "var(--font-dm-mono), monospace",
            fontSize: 9,
            textTransform: "uppercase",
            letterSpacing: "0.09em",
            padding: "4px 10px",
            borderRadius: 4,
            border: `1px solid ${steelA(0.15)}`,
            background: "transparent",
            color: V.textMuted,
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = steelA(0.3);
            e.currentTarget.style.color = V.textSecondary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = steelA(0.15);
            e.currentTarget.style.color = V.textMuted;
          }}
        >
          <svg width="8" height="8" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="3" x2="13" y2="13" /><line x1="13" y1="3" x2="3" y2="13" />
          </svg>
          Quitar filtro
        </button>
      )}
    </div>
  );
}

// ── Post card ──
function PostCard({ post, delay, isAdmin }: { post: Post; delay: number; isAdmin?: boolean }) {
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
          border: isAdmin && !post.published
            ? `1.5px dashed ${steelA(0.3)}`
            : `1px solid ${V.border}`,
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
              flexWrap: "wrap",
            }}
          >
            {/* Section badge */}
            {post.section && (
              <span
                style={{
                  fontFamily: "var(--font-dm-mono), monospace",
                  fontSize: 8,
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  padding: "2px 6px",
                  borderRadius: 4,
                  background: steelA(0.08),
                  color: V.steel,
                  border: `1px solid ${steelA(0.14)}`,
                }}
              >
                {post.section}
              </span>
            )}
            <span
              style={{
                fontFamily: "var(--font-jetbrains), monospace",
                fontSize: 9,
                color: V.steel,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                opacity: 0.6,
              }}
            >
              {formatDate(post.date)}
            </span>
            {isAdmin && !post.published && (
              <span
                style={{
                  fontFamily: "var(--font-dm-mono), monospace",
                  fontSize: 8,
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  padding: "2px 6px",
                  borderRadius: 4,
                  background: "rgba(232,168,64,0.15)",
                  color: "#e8a840",
                }}
              >
                Borrador
              </span>
            )}
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
interface Price {
  id: string;
  name: string;
  unitAmount: number;
  currency: string;
  interval: string | null;
}

const INTERVAL_LABELS: Record<string, string> = { month: "mes", year: "año" };

function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency }).format(cents / 100);
}

export default function NewsletterClient({ posts, error, hideUpgrade, isAdmin }: { posts: Post[]; error?: boolean; hideUpgrade?: boolean; isAdmin?: boolean }) {
  const [loaded, setLoaded] = useState(false);
  const [prices, setPrices] = useState<Price[]>([]);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 100);
    fetch("/api/stripe/prices")
      .then((r) => r.json())
      .then((data) => setPrices(data))
      .catch(() => {});
    return () => clearTimeout(t);
  }, []);

  // Count posts per section
  const postCounts: Record<string, number> = {};
  for (const p of posts) {
    if (p.section) postCounts[p.section] = (postCounts[p.section] ?? 0) + 1;
  }

  const visiblePosts = activeSection
    ? posts.filter((p) => p.section === activeSection)
    : posts;

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

      {/* Premium CTA — hidden for members/admins */}
      {!hideUpgrade && prices.length > 0 && (
        <Link
          href="/login?next=/cuenta"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontFamily: "var(--font-dm-mono), monospace",
            fontSize: 11,
            color: V.steel,
            letterSpacing: "0.03em",
            margin: "0 0 24px",
            padding: "8px 14px",
            borderRadius: 8,
            border: `1px solid ${steelA(0.15)}`,
            background: steelA(0.05),
            textDecoration: "none",
            transition: "all 0.25s ease",
            opacity: loaded ? 1 : 0,
            transform: loaded ? "translateY(0)" : "translateY(12px)",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = steelA(0.1); e.currentTarget.style.borderColor = steelA(0.25); }}
          onMouseLeave={(e) => { e.currentTarget.style.background = steelA(0.05); e.currentTarget.style.borderColor = steelA(0.15); }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          Articulos <span style={{ padding: "1px 5px", borderRadius: 3, background: steelA(0.1) }}>Premium</span> desde {formatPrice(prices[0].unitAmount, prices[0].currency)}/{INTERVAL_LABELS[prices[0].interval ?? ""] ?? prices[0].interval} →
        </Link>
      )}

      {/* Gradient divider */}
      <div
        style={{
          height: 1,
          background: `linear-gradient(to right, transparent, ${V.border}, transparent)`,
          marginBottom: 32,
        }}
      />

      {/* Section filter cards */}
      <SectionCards
        active={activeSection}
        onChange={setActiveSection}
        loaded={loaded}
        postCounts={postCounts}
      />

      {/* Post grid */}
      {error && posts.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 0" }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={V.textMuted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 12, opacity: 0.5 }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p style={{ color: V.textMuted, fontSize: 14, lineHeight: 1.5 }}>
            No se pudieron cargar los posts.<br />Intenta de nuevo mas tarde.
          </p>
        </div>
      ) : visiblePosts.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 0" }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={V.textMuted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 12, opacity: 0.5 }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          <p style={{ color: V.textMuted, fontSize: 14, lineHeight: 1.5 }}>
            {activeSection ? "Aún no hay posts en esta sección." : "Aún no hay posts publicados."}
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(340px, 100%), 1fr))",
            gap: 24,
            paddingBottom: 80,
          }}
        >
          {visiblePosts.map((post, i) => (
            <PostCard key={post.slug} post={post} delay={i * 100} isAdmin={isAdmin} />
          ))}
        </div>
      )}
    </div>
  );
}
