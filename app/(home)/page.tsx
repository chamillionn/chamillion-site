"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

const STEEL_BLUE = "#6B8EA0";
const BG_DARK = "#0C0E11";
const BG_CARD = "#13161B";
const BG_CARD_HOVER = "#191D24";
const BORDER = "#1E2229";
const TEXT_PRIMARY = "#E8EAED";
const TEXT_SECONDARY = "#8B9099";
const TEXT_MUTED = "#5A5F6A";

// Animated number counter
function AnimatedNumber({
  target,
  prefix = "",
  suffix = "",
  duration = 1800,
  decimals = 2,
}: {
  target: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  decimals?: number;
}) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const start = performance.now();
          const animate = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(target * eased);
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return (
    <span ref={ref} style={{ fontFamily: "var(--font-jetbrains), monospace" }}>
      {prefix}
      {value.toFixed(decimals)}
      {suffix}
    </span>
  );
}

// Subtle pulse dot for "live" indicator
function PulseDot({ color = STEEL_BLUE }: { color?: string }) {
  return (
    <span
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 8,
        height: 8,
      }}
    >
      <span
        style={{
          position: "absolute",
          width: 8,
          height: 8,
          borderRadius: "50%",
          backgroundColor: color,
          opacity: 0.4,
          animation: "pulse-ring 2s ease-out infinite",
        }}
      />
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          backgroundColor: color,
        }}
      />
    </span>
  );
}

// Platform data
interface Position {
  name: string;
  value: number;
  pnl: number;
  pnlPercent: string;
}

interface Platform {
  name: string;
  chain: string;
  value: number;
  color: string;
  positions: Position[];
}

const PLATFORMS: Platform[] = [
  {
    name: "Aerodrome",
    chain: "Base",
    value: 142.58,
    color: "#5BAA7C",
    positions: [{ name: "USDC/USDT LP", value: 142.58, pnl: 4.58, pnlPercent: "3.32" }],
  },
  {
    name: "Aave",
    chain: "Ethereum",
    value: 118.2,
    color: "#6B8EA0",
    positions: [{ name: "ETH Lending", value: 118.2, pnl: 8.2, pnlPercent: "7.45" }],
  },
  {
    name: "Marinade",
    chain: "Solana",
    value: 104.65,
    color: "#C9A84C",
    positions: [{ name: "SOL Staking", value: 104.65, pnl: 4.65, pnlPercent: "4.65" }],
  },
  {
    name: "Hyperliquid",
    chain: "L1",
    value: 89.5,
    color: "#8B6BBF",
    positions: [{ name: "BTC-ETH Perp", value: 89.5, pnl: 9.5, pnlPercent: "11.87" }],
  },
  {
    name: "Polymarket",
    chain: "Polygon",
    value: 72.5,
    color: "#C7555A",
    positions: [{ name: "ARB Prediction", value: 72.5, pnl: 0.5, pnlPercent: "0.69" }],
  },
];

const TOTAL_VALUE = PLATFORMS.reduce((sum, p) => sum + p.value, 0);

// SVG Donut chart
function DonutChart({ platforms, total }: { platforms: Platform[]; total: number }) {
  const size = 160;
  const strokeWidth = 22;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativeOffset = 0;

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: "rotate(-90deg)" }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={BORDER}
          strokeWidth={strokeWidth}
        />
        {platforms.map((platform, i) => {
          const fraction = platform.value / total;
          const segmentLength = fraction * circumference;
          const gap = 3;
          const visibleLength = Math.max(segmentLength - gap, 1);
          const offset = circumference - cumulativeOffset;
          cumulativeOffset += segmentLength;

          return (
            <circle
              key={platform.name}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={platform.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${visibleLength} ${circumference - visibleLength}`}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{
                opacity: 0,
                animation: `fade-slide-up 0.6s ease forwards`,
                animationDelay: `${200 + i * 100}ms`,
              }}
            />
          );
        })}
      </svg>
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-jetbrains), monospace",
            fontSize: 18,
            fontWeight: 600,
            color: TEXT_PRIMARY,
            letterSpacing: "-0.02em",
          }}
        >
          {total.toFixed(0)}€
        </div>
        <div
          style={{
            fontFamily: "var(--font-jetbrains), monospace",
            fontSize: 8,
            color: TEXT_MUTED,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          TOTAL
        </div>
      </div>
    </div>
  );
}

// Expandable platform legend item
function PlatformLegendItem({
  platform,
  total,
  delay = 0,
}: {
  platform: Platform;
  total: number;
  delay?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const percentage = ((platform.value / total) * 100).toFixed(1);

  return (
    <div
      style={{
        opacity: 0,
        animation: `fade-slide-up 0.6s ease ${delay}ms forwards`,
      }}
    >
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "7px 0",
          borderBottom: `1px solid ${BORDER}`,
          cursor: "pointer",
        }}
      >
        <div
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            backgroundColor: platform.color,
            flexShrink: 0,
          }}
        />
        <div style={{ color: TEXT_PRIMARY, fontSize: 13, fontWeight: 500, flex: 1 }}>
          {platform.name}
          <span style={{ color: TEXT_MUTED, fontSize: 10, fontFamily: "var(--font-jetbrains), monospace", marginLeft: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            {platform.chain}
          </span>
        </div>
        <span
          style={{
            fontFamily: "var(--font-jetbrains), monospace",
            fontSize: 11,
            color: TEXT_SECONDARY,
          }}
        >
          {percentage}%
        </span>
        <svg
          width="9"
          height="9"
          viewBox="0 0 10 10"
          fill="none"
          style={{
            transition: "transform 0.2s ease",
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            flexShrink: 0,
          }}
        >
          <path
            d="M2 4L5 7L8 4"
            stroke={TEXT_MUTED}
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {expanded && (
        <div
          style={{
            paddingLeft: 15,
            borderBottom: `1px solid ${BORDER}`,
            background: `${platform.color}05`,
          }}
        >
          {platform.positions.map((pos) => {
            const isPositive = pos.pnl >= 0;
            return (
              <div
                key={pos.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  padding: "6px 0",
                }}
              >
                <div style={{ color: TEXT_SECONDARY, fontSize: 12 }}>
                  {pos.name}
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span
                    style={{
                      fontFamily: "var(--font-jetbrains), monospace",
                      fontSize: 11,
                      color: TEXT_SECONDARY,
                    }}
                  >
                    {pos.value.toFixed(2)} €
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-jetbrains), monospace",
                      fontSize: 11,
                      color: isPositive ? "#5BAA7C" : "#C7555A",
                    }}
                  >
                    {isPositive ? "+" : ""}{pos.pnl.toFixed(2)}€
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// CTA Button
function CTAButton({
  label,
  sublabel,
  href,
  variant = "primary",
  tag,
  internal = false,
}: {
  label: string;
  sublabel?: string;
  href: string;
  variant?: "primary" | "secondary";
  tag?: string;
  internal?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const isPrimary = variant === "primary";

  const content = (
    <>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              color: isPrimary ? STEEL_BLUE : TEXT_PRIMARY,
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: "-0.01em",
            }}
          >
            {label}
          </span>
          {tag && (
            <span
              style={{
                fontSize: 9,
                fontFamily: "var(--font-jetbrains), monospace",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: STEEL_BLUE,
                background: `${STEEL_BLUE}15`,
                padding: "3px 7px",
                borderRadius: 4,
                fontWeight: 600,
              }}
            >
              {tag}
            </span>
          )}
        </div>
        {sublabel && (
          <div style={{ color: TEXT_MUTED, fontSize: 12, marginTop: 4 }}>
            {sublabel}
          </div>
        )}
      </div>
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        style={{
          transition: "transform 0.3s ease",
          transform: hovered ? "translateX(3px)" : "translateX(0)",
        }}
      >
        <path
          d="M6 3L11 8L6 13"
          stroke={isPrimary ? STEEL_BLUE : TEXT_MUTED}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </>
  );

  const style: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "18px 22px",
    borderRadius: 14,
    border: isPrimary ? `1px solid ${STEEL_BLUE}40` : `1px solid ${BORDER}`,
    background: hovered
      ? isPrimary
        ? `${STEEL_BLUE}12`
        : BG_CARD_HOVER
      : isPrimary
        ? `${STEEL_BLUE}08`
        : BG_CARD,
    cursor: "pointer",
    textDecoration: "none",
    transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
    transform: hovered ? "translateY(-2px)" : "translateY(0)",
    position: "relative",
    overflow: "hidden",
  };

  if (internal) {
    return (
      <Link
        href={href}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={style}
      >
        {content}
      </Link>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={style}
    >
      {content}
    </a>
  );
}

// Social link
function SocialLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: string;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        color: hovered ? TEXT_PRIMARY : TEXT_SECONDARY,
        textDecoration: "none",
        fontSize: 13,
        fontFamily: "var(--font-jetbrains), monospace",
        letterSpacing: "-0.01em",
        transition: "color 0.2s ease",
        padding: "6px 0",
      }}
    >
      <span style={{ opacity: 0.5 }}>{icon}</span>
      <span>{label}</span>
    </a>
  );
}

export default function Home() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: BG_DARK,
        fontFamily: "var(--font-outfit), sans-serif",
        position: "relative",
      }}
    >
      {/* Grain overlay */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 50,
          pointerEvents: "none",
          opacity: 0.03,
          background: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          animation: "grain 8s steps(10) infinite",
        }}
      />

      {/* Subtle gradient orb */}
      <div
        style={{
          position: "fixed",
          top: "-20%",
          right: "-10%",
          width: "60vw",
          height: "60vw",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${STEEL_BLUE}06 0%, transparent 70%)`,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Main content */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 1100,
          margin: "0 auto",
          padding: "0 24px",
        }}
      >
        {/* Nav */}
        <nav
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "28px 0",
            borderBottom: `1px solid ${BORDER}`,
            opacity: loaded ? 1 : 0,
            transform: loaded ? "translateY(0)" : "translateY(-10px)",
            transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background: `linear-gradient(135deg, ${STEEL_BLUE}30, ${STEEL_BLUE}10)`,
                border: `1px solid ${STEEL_BLUE}25`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="4" fill={STEEL_BLUE} opacity="0.6" />
                <circle
                  cx="12"
                  cy="12"
                  r="8"
                  stroke={STEEL_BLUE}
                  strokeWidth="1"
                  opacity="0.3"
                />
              </svg>
            </div>
            <span
              style={{
                fontFamily: "var(--font-jetbrains), monospace",
                fontWeight: 600,
                fontSize: 14,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                color: TEXT_PRIMARY,
              }}
            >
              Chamillion
            </span>
          </div>
          <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
            <a
              href="https://chamillion.substack.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: TEXT_SECONDARY,
                textDecoration: "none",
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: "-0.01em",
              }}
            >
              Newsletter
            </a>
            <Link
              href="/hub"
              style={{
                color: TEXT_MUTED,
                textDecoration: "none",
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: "-0.01em",
              }}
            >
              Hub
            </Link>
          </div>
        </nav>

        {/* Hero — asymmetric split */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 48,
            paddingTop: 80,
            paddingBottom: 64,
            alignItems: "center",
          }}
        >
          {/* Left: Identity */}
          <div
            style={{
              opacity: loaded ? 1 : 0,
              transform: loaded ? "translateY(0)" : "translateY(20px)",
              transition: "all 1s cubic-bezier(0.16, 1, 0.3, 1) 0.2s",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-jetbrains), monospace",
                fontSize: 11,
                color: STEEL_BLUE,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                marginBottom: 20,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <PulseDot /> Experimento en marcha
            </div>

            <h1
              style={{
                fontFamily: "var(--font-instrument-serif), serif",
                fontSize: 64,
                fontWeight: 400,
                lineHeight: 0.95,
                letterSpacing: "-0.03em",
                color: TEXT_PRIMARY,
                marginBottom: 24,
              }}
            >
              Chamillion
            </h1>

            <p
              style={{
                fontSize: 16,
                lineHeight: 1.65,
                color: TEXT_SECONDARY,
                maxWidth: "48ch",
                fontWeight: 300,
              }}
            >
              Explorando los mercados descentralizados con dinero real. 500 € de
              inicio, 100 € al mes. Todo público, todo verificable on-chain.
            </p>

          </div>

          {/* Right: Latest post preview */}
          <div
            style={{
              opacity: loaded ? 1 : 0,
              transform: loaded ? "translateY(0)" : "translateY(20px)",
              transition: "all 1s cubic-bezier(0.16, 1, 0.3, 1) 0.5s",
              maxWidth: 360,
              marginLeft: "auto",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-jetbrains), monospace",
                fontSize: 9,
                color: TEXT_MUTED,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: 10,
              }}
            >
              Ultimo post
            </div>
            <Link
              href="/newsletter/navegar-las-finanzas-modernas-el-augurio-de-una-odisea"
              style={{
                display: "block",
                textDecoration: "none",
                borderRadius: 8,
                overflow: "hidden",
                border: `1px solid ${BORDER}`,
                background: BG_CARD,
              }}
            >
              <div style={{ position: "relative", width: "100%", aspectRatio: "2.4/1", overflow: "hidden" }}>
                <Image
                  src="/assets/newsletter/wanderer-post-01.png"
                  alt="Navegar las finanzas modernas"
                  fill
                  style={{ objectFit: "cover" }}
                  sizes="360px"
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: "60%",
                    background: `linear-gradient(to top, ${BG_CARD}, transparent)`,
                    pointerEvents: "none",
                  }}
                />
              </div>
              <div style={{ padding: "12px 14px 14px" }}>
                <div
                  style={{
                    fontFamily: "var(--font-jetbrains), monospace",
                    fontSize: 9,
                    color: STEEL_BLUE,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    marginBottom: 6,
                  }}
                >
                  21 Feb 2026
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-instrument-serif), serif",
                    fontSize: 16,
                    lineHeight: 1.3,
                    color: TEXT_PRIMARY,
                    letterSpacing: "-0.01em",
                    marginBottom: 4,
                  }}
                >
                  Navegar las finanzas modernas: El augurio de una odisea
                </div>
                <div
                  style={{
                    fontSize: 12,
                    lineHeight: 1.5,
                    color: TEXT_SECONDARY,
                    fontWeight: 300,
                  }}
                >
                  Un viaje con dinero real por los mercados que estan reemplazando al sistema.
                </div>
                <div
                  style={{
                    marginTop: 10,
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    fontFamily: "var(--font-jetbrains), monospace",
                    fontSize: 9,
                    color: STEEL_BLUE,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Leer
                  <svg width="9" height="9" viewBox="0 0 16 16" fill="none">
                    <path d="M6 3L11 8L6 13" stroke={STEEL_BLUE} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Portfolio Section */}
        <section
          id="portfolio"
          style={{
            paddingTop: 48,
            paddingBottom: 32,
            opacity: loaded ? 1 : 0,
            transform: loaded ? "translateY(0)" : "translateY(16px)",
            transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.6s",
          }}
        >
          {/* Header row */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: 20,
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-jetbrains), monospace",
                fontSize: 10,
                color: TEXT_MUTED,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              Estado de la Cartera
            </div>
            <div
              style={{
                fontFamily: "var(--font-jetbrains), monospace",
                fontSize: 10,
                color: TEXT_MUTED,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Semana #1
            </div>
          </div>

          {/* 3-column layout: summary | donut | legend */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto 1fr",
              gap: 40,
              alignItems: "center",
            }}
          >
            {/* Col 1: Value + meta */}
            <div>
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 600,
                  fontFamily: "var(--font-jetbrains), monospace",
                  color: TEXT_PRIMARY,
                  letterSpacing: "-0.03em",
                  lineHeight: 1,
                }}
              >
                <AnimatedNumber target={527.43} suffix=" €" decimals={2} />
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  marginTop: 6,
                  fontFamily: "var(--font-jetbrains), monospace",
                  fontSize: 12,
                  color: "#5BAA7C",
                }}
              >
                <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                  <path d="M5 1L9 6H1L5 1Z" fill="#5BAA7C" />
                </svg>
                +27.43 € (5.49%)
              </div>

              {/* Meta stats — horizontal */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                  marginTop: 20,
                }}
              >
                <div>
                  <div style={{ fontSize: 9, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "var(--font-jetbrains), monospace", marginBottom: 2 }}>
                    Depositado
                  </div>
                  <div style={{ fontSize: 13, fontFamily: "var(--font-jetbrains), monospace", color: TEXT_SECONDARY }}>
                    500.00 €
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "var(--font-jetbrains), monospace", marginBottom: 2 }}>
                    Sig. Deposito
                  </div>
                  <div style={{ fontSize: 13, fontFamily: "var(--font-jetbrains), monospace", color: TEXT_SECONDARY }}>
                    +100€ en 12d
                  </div>
                </div>
              </div>

              {/* On-chain inline */}
              <div
                style={{
                  marginTop: 14,
                  fontFamily: "var(--font-jetbrains), monospace",
                  fontSize: 10,
                  color: STEEL_BLUE,
                  opacity: 0.7,
                }}
              >
                0x7a3f...c8d2 · 0x91b4...f6e1
              </div>
            </div>

            {/* Col 2: Donut */}
            <DonutChart platforms={PLATFORMS} total={TOTAL_VALUE} />

            {/* Col 3: Legend */}
            <div>
              {PLATFORMS.map((platform, i) => (
                <PlatformLegendItem
                  key={platform.name}
                  platform={platform}
                  total={TOTAL_VALUE}
                  delay={200 + i * 80}
                />
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <div
            style={{
              marginTop: 16,
              fontFamily: "var(--font-jetbrains), monospace",
              fontSize: 10,
              color: TEXT_MUTED,
              display: "flex",
              alignItems: "center",
              gap: 8,
              opacity: 0.6,
            }}
          >
            Datos de ejemplo — se conectara a Supabase en tiempo real
            <span style={{ color: STEEL_BLUE, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Boceto
            </span>
          </div>
        </section>

        {/* Divider */}
        <div
          style={{
            borderTop: `1px solid ${BORDER}`,
            margin: "16px 0 56px",
          }}
        />

        {/* CTAs Section */}
        <section>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 48,
            }}
          >
            {/* Newsletter CTAs */}
            <div>
              <div
                style={{
                  fontFamily: "var(--font-instrument-serif), serif",
                  fontSize: 28,
                  letterSpacing: "-0.02em",
                  color: TEXT_PRIMARY,
                  marginBottom: 6,
                }}
              >
                Newsletter
              </div>
              <p
                style={{
                  fontSize: 14,
                  color: TEXT_MUTED,
                  marginBottom: 24,
                  lineHeight: 1.6,
                  maxWidth: "45ch",
                }}
              >
                Actualizaciones semanales de la cartera y deep dives en
                estrategias, mercados y oportunidades.
              </p>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <CTAButton
                  label="Substack"
                  sublabel="Edicion estandar — gratis"
                  href="https://chamillion.substack.com"
                  variant="primary"
                  tag="free"
                />
                <CTAButton
                  label="Web"
                  sublabel="Edicion extendida con interactivos"
                  href="/newsletter"
                  variant="secondary"
                  tag="extended"
                  internal
                />
              </div>
            </div>

            {/* Hub CTA */}
            <div>
              <div
                style={{
                  fontFamily: "var(--font-instrument-serif), serif",
                  fontSize: 28,
                  letterSpacing: "-0.02em",
                  color: TEXT_PRIMARY,
                  marginBottom: 6,
                }}
              >
                Hub
              </div>
              <p
                style={{
                  fontSize: 14,
                  color: TEXT_MUTED,
                  marginBottom: 24,
                  lineHeight: 1.6,
                  maxWidth: "45ch",
                }}
              >
                Cartera en tiempo real, archivo completo, glosario, mapa de
                conocimientos y comunidad de miembros.
              </p>

              <div
                style={{
                  padding: "28px 24px",
                  borderRadius: 14,
                  border: `1px dashed ${BORDER}`,
                  background: `${BG_CARD}80`,
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: `${STEEL_BLUE}10`,
                    border: `1px solid ${STEEL_BLUE}20`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 14px",
                    animation: "subtle-float 3s ease-in-out infinite",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 2L2 7L12 12L22 7L12 2Z"
                      stroke={STEEL_BLUE}
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M2 17L12 22L22 17"
                      stroke={STEEL_BLUE}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity="0.5"
                    />
                    <path
                      d="M2 12L12 17L22 12"
                      stroke={STEEL_BLUE}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity="0.7"
                    />
                  </svg>
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-jetbrains), monospace",
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: STEEL_BLUE,
                    marginBottom: 6,
                  }}
                >
                  En Construccion
                </div>
                <div
                  style={{ fontSize: 13, color: TEXT_MUTED, lineHeight: 1.5 }}
                >
                  Portfolio tracker, base de datos y comunidad
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer
          style={{
            marginTop: 72,
            paddingTop: 32,
            paddingBottom: 48,
            borderTop: `1px solid ${BORDER}`,
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: 32,
            alignItems: "start",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "var(--font-jetbrains), monospace",
                fontSize: 12,
                fontWeight: 600,
                color: TEXT_SECONDARY,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                marginBottom: 16,
              }}
            >
              Chamillion
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <SocialLink
                href="https://x.com/chamillionnnnn"
                label="@chamillionnnnn"
                icon="X"
              />
              <SocialLink
                href="mailto:chamilli@pm.me"
                label="chamilli@pm.me"
                icon="@"
              />
            </div>
          </div>

          <div
            style={{
              textAlign: "right",
              fontFamily: "var(--font-jetbrains), monospace",
              fontSize: 10,
              color: TEXT_MUTED,
              lineHeight: 1.8,
              maxWidth: 320,
              letterSpacing: "0.01em",
            }}
          >
            Nada constituye asesoramiento financiero. Contenido educativo e
            informativo. Las inversiones conllevan riesgos incluyendo perdida
            total del capital.
          </div>
        </footer>
      </div>
    </div>
  );
}
