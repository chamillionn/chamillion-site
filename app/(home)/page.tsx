"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { V, steelA, bgCardA } from "@/lib/theme";

// Scroll-triggered reveal
function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, visible };
}

// Responsive hook
function useMediaQuery(maxWidth: number) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${maxWidth}px)`);
    setMatches(mql.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [maxWidth]);
  return matches;
}

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
function PulseDot({ color = V.steel }: { color?: string }) {
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

// Daily portfolio data (mock — 7 days)
interface DailyData {
  day: string;
  total: number;
  platforms: Record<string, number>;
}

const DAILY_DATA: DailyData[] = [
  { day: "Lun", total: 500.00, platforms: { Aerodrome: 135, Aave: 110, Marinade: 100, Hyperliquid: 80, Polymarket: 75 } },
  { day: "Mar", total: 508.30, platforms: { Aerodrome: 137, Aave: 112, Marinade: 101, Hyperliquid: 84, Polymarket: 74.3 } },
  { day: "Mié", total: 503.20, platforms: { Aerodrome: 134, Aave: 113, Marinade: 99, Hyperliquid: 83, Polymarket: 74.2 } },
  { day: "Jue", total: 515.80, platforms: { Aerodrome: 139, Aave: 115, Marinade: 102, Hyperliquid: 86, Polymarket: 73.8 } },
  { day: "Vie", total: 521.40, platforms: { Aerodrome: 140, Aave: 116, Marinade: 103, Hyperliquid: 88, Polymarket: 74.4 } },
  { day: "Sáb", total: 518.90, platforms: { Aerodrome: 138, Aave: 117, Marinade: 103.5, Hyperliquid: 87, Polymarket: 73.4 } },
  { day: "Dom", total: 527.43, platforms: { Aerodrome: 142.58, Aave: 118.2, Marinade: 104.65, Hyperliquid: 89.5, Polymarket: 72.5 } },
];

// SVG Donut chart
function DonutChart({ platforms, total, hoveredPlatform, onHover }: { platforms: Platform[]; total: number; hoveredPlatform: string | null; onHover: (name: string | null) => void }) {
  const size = 185;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Track whether the intro animation has finished so we never re-trigger it
  const [introDone, setIntroDone] = useState(false);
  useEffect(() => {
    // Last segment delay (200 + 4*120 = 680ms) + animation duration (800ms) + buffer
    const timer = setTimeout(() => setIntroDone(true), 1600);
    return () => clearTimeout(timer);
  }, []);

  let cumulativeOffset = 0;

  const activePlatform = hoveredPlatform ? platforms.find(p => p.name === hoveredPlatform) : null;

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: "rotate(-90deg)", cursor: "pointer" }}
        onMouseLeave={() => onHover(null)}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={V.border}
          strokeWidth={strokeWidth}
        />
        {platforms.map((platform, i) => {
          const fraction = platform.value / total;
          const segmentLength = fraction * circumference;
          const gap = 3;
          const visibleLength = Math.max(segmentLength - gap, 1);
          const offset = circumference - cumulativeOffset;
          cumulativeOffset += segmentLength;
          const isHovered = hoveredPlatform === platform.name;
          const isDimmed = hoveredPlatform !== null && !isHovered;

          // During intro: use CSS animation. After intro: always explicit values.
          const useAnimation = !introDone && !hoveredPlatform;

          return (
            <circle
              key={platform.name}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={platform.color}
              strokeLinecap="round"
              onMouseEnter={() => onHover(platform.name)}
              style={{
                "--circ": circumference,
                "--vis": visibleLength,
                "--gap": circumference - visibleLength,
                strokeWidth: isHovered ? strokeWidth + 4 : strokeWidth,
                strokeDasharray: useAnimation ? undefined : `${visibleLength} ${circumference - visibleLength}`,
                strokeDashoffset: offset,
                opacity: isDimmed ? 0.3 : 1,
                animation: useAnimation ? `donut-fill 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${200 + i * 120}ms forwards` : undefined,
                transition: "opacity 0.2s ease, stroke-width 0.2s ease",
                filter: isHovered ? `drop-shadow(0 0 6px ${platform.color}40)` : "none",
              } as React.CSSProperties}
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
          transition: "all 0.2s ease",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-jetbrains), monospace",
            fontSize: activePlatform ? 16 : 18,
            fontWeight: 600,
            color: activePlatform ? activePlatform.color : V.textPrimary,
            letterSpacing: "-0.02em",
            transition: "all 0.2s ease",
          }}
        >
          {activePlatform ? `${activePlatform.value.toFixed(0)}€` : `${total.toFixed(0)}€`}
        </div>
        <div
          style={{
            fontFamily: "var(--font-jetbrains), monospace",
            fontSize: 9,
            color: V.textSecondary,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            transition: "color 0.2s ease",
          }}
        >
          {activePlatform ? activePlatform.name : "TOTAL"}
        </div>
      </div>
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
              color: isPrimary ? V.steel : V.textPrimary,
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
                color: V.steel,
                background: `${steelA(0.08)}`,
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
          <div style={{ color: V.textMuted, fontSize: 12, marginTop: 4 }}>
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
          stroke={isPrimary ? V.steel : V.textSecondary}
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
    border: isPrimary ? `1px solid ${steelA(0.25)}` : `1px solid ${V.border}`,
    background: hovered
      ? isPrimary
        ? `${steelA(0.07)}`
        : V.bgCardHover
      : isPrimary
        ? `${steelA(0.03)}`
        : V.bgCard,
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
        color: hovered ? V.textPrimary : V.textSecondary,
        textDecoration: "none",
        fontSize: 13,
        fontFamily: "var(--font-jetbrains), monospace",
        letterSpacing: "-0.01em",
        transition: "color 0.2s ease",
        padding: "6px 0",
      }}
    >
      <span style={{ opacity: hovered ? 0.8 : 0.5, transform: hovered ? "translateX(1px) scale(1.1)" : "none", transition: "opacity 0.2s ease, transform 0.2s ease", display: "flex", alignItems: "center" }}>
        {icon === "X" ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        ) : icon === "@" ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M22 7L13.03 12.7a1.94 1.94 0 01-2.06 0L2 7" />
          </svg>
        ) : (
          icon
        )}
      </span>
      <span
        style={{
          backgroundImage: `linear-gradient(${V.steel}, ${V.steel})`,
          backgroundSize: hovered ? "100% 1px" : "0% 1px",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "left bottom",
          transition: "background-size 0.3s ease",
          paddingBottom: 1,
        }}
      >
        {label}
      </span>
    </a>
  );
}

// Post preview card with hover effects
function PostCard({ loaded }: { loaded: boolean }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{
        opacity: loaded ? 1 : 0,
        transform: loaded ? "translateY(0)" : "translateY(20px)",
        transition: "all 1s cubic-bezier(0.16, 1, 0.3, 1) 0.5s",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-jetbrains), monospace",
          fontSize: 9,
          color: V.textMuted,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          marginBottom: 10,
        }}
      >
        Último post
      </div>
      <Link
        href="/newsletter/navegar-las-finanzas-modernas-el-augurio-de-una-odisea"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: "block",
          textDecoration: "none",
          borderRadius: 12,
          overflow: "hidden",
          border: `1px solid ${V.border}`,
          background: V.bgCard,
          transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease",
          transform: hovered ? "translateY(-2px)" : "translateY(0)",
          boxShadow: hovered ? `inset 0 0 0 1px ${steelA(0.25)}, 0 4px 24px ${steelA(0.03)}` : "inset 0 0 0 0px transparent",
        }}
      >
        <div style={{ position: "relative", width: "100%", aspectRatio: "2.4/1", overflow: "hidden" }}>
          <Image
            src="/assets/newsletter/wanderer-post-01.png"
            alt="Navegar las finanzas modernas"
            fill
            style={{
              objectFit: "cover",
              transition: "transform 0.6s ease",
              transform: hovered ? "scale(1.05)" : "scale(1.01)",
            }}
            sizes="(max-width: 1100px) 50vw, 526px"
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
        <div style={{ padding: "14px 14px 14px", position: "relative", marginTop: -2, background: V.bgCard }}>
          <div
            style={{
              fontFamily: "var(--font-jetbrains), monospace",
              fontSize: 9,
              color: V.steel,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: 6,
            }}
          >
            21 Feb 2026
          </div>
          <div
            style={{
              fontFamily: "var(--font-playfair), serif",
              fontSize: 19,
              lineHeight: 1.3,
              color: V.textPrimary,
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
              color: V.textSecondary,
              fontWeight: 300,
            }}
          >
            Un viaje con dinero real por los mercados que están reemplazando al sistema.
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
              <path d="M6 3L11 8L6 13" stroke={V.steel} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </Link>
    </div>
  );
}

// Chameleon face peeking from the corner — eye tracks the cursor
function ChameleonPeek({ mobile }: { mobile: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let cleanup: (() => void) | undefined;

    fetch("/assets/face-vector.svg")
      .then((r) => r.text())
      .then((svgText) => {
        el.innerHTML = svgText;
        const svg = el.querySelector("svg");
        if (!svg) return;

        svg.removeAttribute("width");
        svg.removeAttribute("height");
        svg.style.width = "100%";
        svg.style.height = "100%";
        svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

        // Recolor to match dark theme
        const bodyLight = svg.querySelector("#path897") as SVGPathElement | null;
        const bodyDark = svg.querySelector("#path895") as SVGPathElement | null;
        const eyeSocket = svg.querySelector("#rect1005") as SVGRectElement | null;
        const pupil = svg.querySelector("#path4481") as SVGCircleElement;
        const highlight = svg.querySelector("#path5055") as SVGEllipseElement;

        if (bodyLight) { bodyLight.style.fill = V.steel; bodyLight.style.opacity = "0.15"; }
        if (bodyDark) { bodyDark.style.fill = V.steel; bodyDark.style.opacity = "0.10"; }
        if (eyeSocket) { eyeSocket.style.fill = "#ffffff"; eyeSocket.style.opacity = "0.14"; }
        if (!pupil || !highlight) return;

        // Bigger eye
        pupil.setAttribute("r", "85");
        pupil.style.fill = "#0a0a0a";
        pupil.style.opacity = "0.18";

        highlight.setAttribute("rx", "26");
        highlight.setAttribute("ry", "18");
        highlight.style.fill = "#ffffff";
        highlight.style.opacity = "0.22";

        // ── Eye tracking ──
        const SVG_W = 1696, SVG_H = 2528;
        const eyeCx = 1050, eyeCy = 1125;
        const hlDx = 1049 - eyeCx, hlDy = 1095 - eyeCy;
        const maxR = 85;

        let targetX = eyeCx, targetY = eyeCy;
        let currentX = eyeCx, currentY = eyeCy;
        let hasInput = false;
        let animId: number;

        function updateEye(px: number, py: number) {
          pupil.setAttribute("cx", String(px));
          pupil.setAttribute("cy", String(py));
          highlight.setAttribute("cx", String(px + hlDx));
          highlight.setAttribute("cy", String(py + hlDy));
        }

        // Organic jitter
        let jX = 0, jY = 0, jGX = 0, jGY = 0;
        let nextJ = performance.now() + 500 + Math.random() * 1500;

        // Idle saccades
        let idleGX = eyeCx, idleGY = eyeCy;
        let nextS = performance.now() + 300 + Math.random() * 800;

        function animate() {
          const now = performance.now();
          // Jitter
          if (now >= nextJ) {
            const a = Math.random() * Math.PI * 2;
            const d = Math.random() * 28;
            jGX = Math.cos(a) * d; jGY = Math.sin(a) * d;
            nextJ = now + 150 + Math.random() * 600;
          }
          jX += (jGX - jX) * 0.06;
          jY += (jGY - jY) * 0.06;

          // Idle saccade
          if (!hasInput) {
            if (now >= nextS) {
              const a = Math.random() * Math.PI * 2;
              const d = (Math.random() * 0.3 + 0.65) * maxR;
              idleGX = eyeCx + Math.cos(a) * d;
              idleGY = eyeCy + Math.sin(a) * d;
              nextS = now + 250 + Math.random() * 1000;
            }
            targetX = idleGX; targetY = idleGY;
          }

          const lerp = hasInput ? 0.15 : 0.08;
          currentX += (targetX - currentX) * lerp;
          currentY += (targetY - currentY) * lerp;

          let fx = currentX + jX, fy = currentY + jY;
          const dx = fx - eyeCx, dy = fy - eyeCy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > maxR) { const c = maxR / dist; fx = eyeCx + dx * c; fy = eyeCy + dy * c; }

          updateEye(fx, fy);
          animId = requestAnimationFrame(animate);
        }

        animId = requestAnimationFrame(animate);

        function screenToSvg(cx: number, cy: number) {
          const r = svg!.getBoundingClientRect();
          const s = Math.min(SVG_W / r.width, SVG_H / r.height);
          const ox = (SVG_W - r.width * s) / 2;
          const oy = (SVG_H - r.height * s) / 2;
          const lx = (cx - r.left) * s + ox;
          const ly = (cy - r.top) * s + oy;
          const ddx = lx - eyeCx, ddy = ly - eyeCy;
          const d = Math.sqrt(ddx * ddx + ddy * ddy);
          const c = Math.min(d, maxR) / (d || 1);
          return { x: eyeCx + ddx * c, y: eyeCy + ddy * c };
        }

        const onMM = (e: MouseEvent) => { hasInput = true; const p = screenToSvg(e.clientX, e.clientY); targetX = p.x; targetY = p.y; };
        const onTM = (e: TouchEvent) => { hasInput = true; const p = screenToSvg(e.touches[0].clientX, e.touches[0].clientY); targetX = p.x; targetY = p.y; };
        const onEnd = () => { hasInput = false; };

        document.addEventListener("mousemove", onMM);
        document.addEventListener("mouseleave", onEnd);
        document.addEventListener("touchmove", onTM);
        document.addEventListener("touchend", onEnd);

        cleanup = () => {
          cancelAnimationFrame(animId);
          document.removeEventListener("mousemove", onMM);
          document.removeEventListener("mouseleave", onEnd);
          document.removeEventListener("touchmove", onTM);
          document.removeEventListener("touchend", onEnd);
        };
      });

    return () => cleanup?.();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        position: "fixed",
        bottom: mobile ? -30 : -40,
        right: mobile ? -20 : -10,
        width: mobile ? 200 : 280,
        height: mobile ? 298 : 417,
        pointerEvents: "none",
        zIndex: 2,
        opacity: 0,
        animation: "fadeIn 2s ease 1.5s forwards",
        filter: mobile ? "opacity(0.35)" : "opacity(0.7)",
      }}
    />
  );
}

// Platform legend item (next to donut)
function PlatformLegendItem({
  platform,
  total,
  delay,
  isHovered,
  isDimmed,
  onHover,
}: {
  platform: Platform;
  total: number;
  delay: number;
  isHovered: boolean;
  isDimmed: boolean;
  onHover: (name: string | null) => void;
}) {
  const pct = ((platform.value / total) * 100).toFixed(1);
  return (
    <div
      onMouseEnter={() => onHover(platform.name)}
      onMouseLeave={() => onHover(null)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "7px 0",
        opacity: 0,
        animation: `fade-slide-up 0.5s ease ${delay}ms forwards`,
        transition: "opacity 0.2s ease",
        cursor: "default",
        ...(isDimmed ? { opacity: 0.3 } : {}),
      }}
    >
      <div
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          backgroundColor: platform.color,
          flexShrink: 0,
          transition: "transform 0.2s ease",
          transform: isHovered ? "scale(1.4)" : "scale(1)",
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: isHovered ? platform.color : V.textPrimary,
            transition: "color 0.2s ease",
          }}
        >
          {platform.name}
        </div>
        <div
          style={{
            fontSize: 10,
            color: V.textMuted,
            fontFamily: "var(--font-jetbrains), monospace",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          {platform.chain}
        </div>
      </div>
      <div
        style={{
          fontFamily: "var(--font-jetbrains), monospace",
          fontSize: 12,
          color: isHovered ? platform.color : V.textSecondary,
          flexShrink: 0,
          transition: "color 0.2s ease",
        }}
      >
        {pct}%
      </div>
    </div>
  );
}

// Portfolio area chart with interactive tooltip
function PortfolioChart() {
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(600);

  useEffect(() => {
    const el = chartRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setChartWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Chart dimensions
  const W = chartWidth;
  const H = 180;
  const padX = 0;
  const padTop = 10;
  const padBottom = 24;
  const chartH = H - padTop - padBottom;

  // Calculate Y range with 5% padding
  const totals = DAILY_DATA.map(d => d.total);
  const minVal = Math.min(...totals);
  const maxVal = Math.max(...totals);
  const yRange = maxVal - minVal || 1;
  const yPad = yRange * 0.15;
  const yMin = minVal - yPad;
  const yMax = maxVal + yPad;

  // Map data to pixel coordinates
  const points = DAILY_DATA.map((d, i) => ({
    x: padX + (i / (DAILY_DATA.length - 1)) * (W - padX * 2),
    y: padTop + chartH - ((d.total - yMin) / (yMax - yMin)) * chartH,
  }));

  // Build SVG path
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padTop + chartH} L ${points[0].x} ${padTop + chartH} Z`;

  // Approximate line length for draw animation
  const lineLength = points.reduce((sum, p, i) => {
    if (i === 0) return 0;
    const dx = p.x - points[i - 1].x;
    const dy = p.y - points[i - 1].y;
    return sum + Math.sqrt(dx * dx + dy * dy);
  }, 0);

  // Grid lines (3 horizontal)
  const gridValues = [yMin + (yMax - yMin) * 0.25, yMin + (yMax - yMin) * 0.5, yMin + (yMax - yMin) * 0.75];

  // Hover data
  const hoveredData = hoveredDay !== null ? DAILY_DATA[hoveredDay] : null;
  const hoveredPoint = hoveredDay !== null ? points[hoveredDay] : null;
  const prevTotal = hoveredDay !== null && hoveredDay > 0 ? DAILY_DATA[hoveredDay - 1].total : null;

  return (
    <div style={{ marginTop: 28, paddingTop: 20, backgroundImage: `linear-gradient(to right, transparent, ${V.border}, transparent)`, backgroundSize: "100% 1px", backgroundRepeat: "no-repeat", backgroundPosition: "top" }}>
      {/* Header: label + tabs */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-jetbrains), monospace",
            fontSize: 10,
            color: V.textMuted,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          Rendimiento
        </div>
        <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
          {["7d", "30d", "All"].map((tab, i) => (
            <span
              key={tab}
              title={i > 0 ? "Próximamente" : undefined}
              style={{
                fontFamily: "var(--font-jetbrains), monospace",
                fontSize: 10,
                color: i === 0 ? V.steel : V.textMuted,
                background: i === 0 ? `${steelA(0.08)}` : "transparent",
                borderRadius: 4,
                padding: "3px 8px",
                cursor: "default",
                opacity: i > 0 ? 0.5 : 1,
                transition: "color 0.2s ease",
              }}
            >
              {tab}
            </span>
          ))}
        </div>
      </div>

      {/* SVG Area Chart */}
      <div
        ref={chartRef}
        style={{
          position: "relative",
          width: "100%",
          opacity: 0,
          animation: "fade-slide-up 0.8s ease 300ms forwards",
        }}
      >
        <svg
          width="100%"
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          style={{ display: "block", overflow: "visible" }}
          onMouseLeave={() => setHoveredDay(null)}
        >
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={V.steel} stopOpacity="0.20" />
              <stop offset="100%" stopColor={V.steel} stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Grid lines + Y-axis labels */}
          {gridValues.map((val, i) => {
            const y = padTop + chartH - ((val - yMin) / (yMax - yMin)) * chartH;
            return (
              <g key={i}>
                <line
                  x1={0}
                  y1={y}
                  x2={W}
                  y2={y}
                  stroke={V.border}
                  strokeWidth="1"
                  opacity="0.4"
                />
                <text
                  x={W - 2}
                  y={y - 5}
                  textAnchor="end"
                  fill={V.textMuted}
                  fontSize="9"
                  fontFamily="var(--font-jetbrains), monospace"
                  opacity="0.7"
                >
                  {Math.round(val)}€
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          <path d={areaPath} fill="url(#areaGrad)" style={{ opacity: 0, animation: "area-fade 0.8s ease 0.8s forwards" }} />

          {/* Line stroke — draws itself */}
          <path
            d={linePath}
            fill="none"
            stroke={V.steel}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              "--line-length": `${lineLength}`,
              strokeDasharray: lineLength,
              strokeDashoffset: lineLength,
              animation: `draw-line 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards`,
            } as React.CSSProperties}
          />

          {/* Data point dots */}
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={hoveredDay === i ? 4.5 : 2.5}
              fill={hoveredDay === i ? V.steel : V.bgDark}
              stroke={V.steel}
              strokeWidth={hoveredDay === i ? 2 : 1.5}
              style={{ transition: "r 0.15s ease, fill 0.15s ease" }}
            />
          ))}

          {/* Hover vertical line */}
          {hoveredPoint && (
            <line
              x1={hoveredPoint.x}
              y1={padTop}
              x2={hoveredPoint.x}
              y2={padTop + chartH}
              stroke={V.steel}
              strokeWidth="1"
              opacity="0.3"
              strokeDasharray="3 3"
            />
          )}

          {/* Invisible hover zones */}
          {DAILY_DATA.map((_, i) => {
            const zoneW = W / DAILY_DATA.length;
            return (
              <rect
                key={i}
                x={i * zoneW}
                y={0}
                width={zoneW}
                height={H}
                fill="transparent"
                onMouseEnter={() => setHoveredDay(i)}
                style={{ cursor: "crosshair" }}
              />
            );
          })}

          {/* X-axis labels */}
          {DAILY_DATA.map((d, i) => (
            <text
              key={i}
              x={points[i].x}
              y={H - 4}
              textAnchor="middle"
              fill={hoveredDay === i ? V.textSecondary : V.textMuted}
              fontSize="10"
              fontFamily="var(--font-jetbrains), monospace"
              style={{ transition: "fill 0.15s ease" }}
            >
              {d.day}
            </text>
          ))}
        </svg>

        {/* Tooltip */}
        {hoveredData && hoveredPoint && (
          <div
            style={{
              position: "absolute",
              left: Math.min(Math.max(hoveredPoint.x - 50, 0), W - 110),
              top: Math.max(hoveredPoint.y - 56, 0),
              background: V.bgCard,
              border: `1px solid ${V.border}`,
              borderRadius: 6,
              padding: "6px 10px",
              pointerEvents: "none",
              zIndex: 10,
              fontFamily: "var(--font-jetbrains), monospace",
              whiteSpace: "nowrap",
            }}
          >
            <div style={{ fontSize: 10, color: V.textMuted, marginBottom: 2 }}>{hoveredData.day}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: V.textPrimary }}>{hoveredData.total.toFixed(2)} €</div>
            {prevTotal !== null && (
              <div style={{ fontSize: 10, color: hoveredData.total >= prevTotal ? "#5BAA7C" : "#C7555A" }}>
                {hoveredData.total >= prevTotal ? "+" : ""}{(hoveredData.total - prevTotal).toFixed(2)} €
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}

export default function Home() {
  const [loaded, setLoaded] = useState(false);
  const [hoveredPlatform, setHoveredPlatform] = useState<string | null>(null);
  const mobile = useMediaQuery(768);
  const portfolio = useScrollReveal(0.1);
  const ctas = useScrollReveal(0.1);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: V.bgDark,
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
          background: `radial-gradient(circle, ${steelA(0.04)} 0%, transparent 70%)`,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Chameleon peek — hidden on mobile */}
      <ChameleonPeek mobile={mobile} />


      {/* Main content */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 1100,
          margin: "0 auto",
          padding: mobile ? "0 16px" : "0 24px",
        }}
      >
        {/* Nav */}
        <nav
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "28px 0",
            borderBottom: "none",
            backgroundImage: `linear-gradient(to right, transparent, ${V.border}, transparent)`,
            backgroundSize: "100% 1px",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "bottom",
          }}
        >
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            opacity: loaded ? 1 : 0,
            transform: loaded ? "translateY(0)" : "translateY(-8px)",
            transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0s",
          }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background: `linear-gradient(135deg, ${steelA(0.19)}, ${steelA(0.06)})`,
                border: `1px solid ${steelA(0.15)}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "rotate(8deg) scale(1.05)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "rotate(0deg) scale(1)")}
            >
              <Image
                src="/assets/newsletter/logo.jpg"
                alt="Chamillion"
                width={24}
                height={24}
                style={{ borderRadius: 5, objectFit: "cover" }}
              />
            </div>
            <span
              style={{
                fontFamily: "var(--font-jetbrains), monospace",
                fontWeight: 600,
                fontSize: 14,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                color: V.textPrimary,
              }}
            >
              Chamillion
            </span>
          </div>
          <div style={{
            display: "flex",
            gap: 24,
            alignItems: "center",
            opacity: loaded ? 1 : 0,
            transform: loaded ? "translateY(0)" : "translateY(-8px)",
            transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s",
          }}>
            <a
              href="https://chamillion.substack.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: V.textSecondary,
                textDecoration: "none",
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: "-0.01em",
                transition: "color 0.2s ease",
                position: "relative" as const,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = V.textPrimary)}
              onMouseLeave={(e) => (e.currentTarget.style.color = V.textSecondary)}
            >
              Newsletter
            </a>
            <Link
              href="/hub"
              style={{
                color: V.textMuted,
                textDecoration: "none",
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: "-0.01em",
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = V.textSecondary)}
              onMouseLeave={(e) => (e.currentTarget.style.color = V.textMuted)}
            >
              Hub
            </Link>
          </div>
        </nav>

        {/* Hero — asymmetric split */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: mobile ? "1fr" : "1fr 1fr",
            gap: mobile ? 32 : 48,
            paddingTop: mobile ? 40 : 80,
            paddingBottom: mobile ? 32 : 64,
            alignItems: "start",
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
                color: V.steel,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                marginBottom: 14,
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
                fontSize: mobile ? 42 : 64,
                fontWeight: 400,
                lineHeight: 0.95,
                letterSpacing: "-0.03em",
                color: V.textPrimary,
                marginBottom: 16,
              }}
            >
              Chamillion
            </h1>

            <p
              style={{
                fontSize: 16,
                lineHeight: 1.65,
                color: V.textSecondary,
                maxWidth: "48ch",
                fontWeight: 300,
              }}
            >
              Explorando los mercados descentralizados con dinero real. 500 € de
              inicio, 100 € al mes. Todo público, todo verificable on-chain.
            </p>

            {/* Navigation links */}
            <div
              style={{
                marginTop: 28,
                display: "flex",
                alignItems: "center",
                gap: 24,
              }}
            >
              <a
                href="#portfolio"
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: V.textSecondary,
                  textDecoration: "none",
                  transition: "color 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = V.textPrimary)}
                onMouseLeave={(e) => (e.currentTarget.style.color = V.textSecondary)}
              >
                Ver cartera
                <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                  <path d="M8 3L8 13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  <path d="M3 8L8 13L13 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
              <a
                href="#newsletter-hub"
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: V.textSecondary,
                  textDecoration: "none",
                  transition: "color 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = V.textPrimary)}
                onMouseLeave={(e) => (e.currentTarget.style.color = V.textSecondary)}
              >
                Leer newsletter
              </a>
            </div>

          </div>

          {/* Right: Latest post preview */}
          <PostCard loaded={loaded} />
        </div>

        {/* Divider */}
        <div
          style={{
            height: 1,
            background: `linear-gradient(to right, transparent, ${V.border}, transparent)`,
            margin: "0 0 16px",
          }}
        />

        {/* Portfolio Section */}
        <section
          ref={portfolio.ref}
          id="portfolio"
          style={{
            paddingTop: 48,
            paddingBottom: 32,
            opacity: portfolio.visible ? 1 : 0,
            transform: portfolio.visible ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
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
                color: V.textMuted,
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
                color: V.textMuted,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Semana #1
            </div>
          </div>

          {/* Summary + Donut + Legend */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: mobile ? "1fr" : "1fr auto 1fr",
              gap: mobile ? 24 : 48,
              alignItems: "center",
              justifyItems: mobile ? "center" : undefined,
            }}
          >
            {/* Value + meta */}
            <div style={{ width: mobile ? "100%" : undefined }}>
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 600,
                  fontFamily: "var(--font-jetbrains), monospace",
                  color: V.textPrimary,
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
                +<AnimatedNumber target={27.43} suffix=" €" decimals={2} duration={2000} /> (5.49%)
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
                  <div style={{ fontSize: 10, color: V.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "var(--font-jetbrains), monospace", marginBottom: 2 }}>
                    Depositado
                  </div>
                  <div style={{ fontSize: 13, fontFamily: "var(--font-jetbrains), monospace", color: V.textSecondary }}>
                    500.00 €
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: V.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "var(--font-jetbrains), monospace", marginBottom: 2 }}>
                    Sig. Depósito
                  </div>
                  <div style={{ fontSize: 13, fontFamily: "var(--font-jetbrains), monospace", color: V.textSecondary }}>
                    +100€ en 12 días
                  </div>
                </div>
              </div>

              {/* On-chain inline */}
              <div
                style={{
                  marginTop: 14,
                  fontFamily: "var(--font-jetbrains), monospace",
                  fontSize: 10,
                  color: V.steel,
                  opacity: 0.7,
                }}
              >
                <a href="https://etherscan.io/address/0x7a3fc8d2" target="_blank" rel="noopener noreferrer" style={{ color: V.steel, textDecoration: "none", borderBottom: `1px solid transparent`, transition: "border-color 0.2s ease" }} onMouseEnter={(e) => e.currentTarget.style.borderColor = V.steel} onMouseLeave={(e) => e.currentTarget.style.borderColor = "transparent"}>0x7a3f...c8d2</a>
                {" · "}
                <a href="https://basescan.org/address/0x91b4f6e1" target="_blank" rel="noopener noreferrer" style={{ color: V.steel, textDecoration: "none", borderBottom: `1px solid transparent`, transition: "border-color 0.2s ease" }} onMouseEnter={(e) => e.currentTarget.style.borderColor = V.steel} onMouseLeave={(e) => e.currentTarget.style.borderColor = "transparent"}>0x91b4...f6e1</a>
              </div>
            </div>

            {/* Donut */}
            <DonutChart platforms={PLATFORMS} total={TOTAL_VALUE} hoveredPlatform={hoveredPlatform} onHover={setHoveredPlatform} />

            {/* Legend — desktop: vertical list / mobile: compact pills */}
            {!mobile ? (
              <div>
                {PLATFORMS.map((platform, i) => (
                  <PlatformLegendItem
                    key={platform.name}
                    platform={platform}
                    total={TOTAL_VALUE}
                    delay={300 + i * 80}
                    isHovered={hoveredPlatform === platform.name}
                    isDimmed={hoveredPlatform !== null && hoveredPlatform !== platform.name}
                    onHover={setHoveredPlatform}
                  />
                ))}
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  justifyContent: "center",
                  marginTop: 4,
                }}
              >
                {PLATFORMS.map((platform, i) => {
                  const isHovered = hoveredPlatform === platform.name;
                  const isDimmed = hoveredPlatform !== null && !isHovered;
                  return (
                    <div
                      key={platform.name}
                      onTouchStart={() => setHoveredPlatform(isHovered ? null : platform.name)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        padding: "4px 10px",
                        borderRadius: 20,
                        background: isHovered ? `${platform.color}15` : `${V.bgCard}`,
                        border: `1px solid ${isHovered ? `${platform.color}40` : V.border}`,
                        ...(isDimmed ? { opacity: 0.4 } : {}),
                        transition: "all 0.2s ease",
                        cursor: "default",
                        animation: `fade-slide-up 0.4s ease ${200 + i * 60}ms forwards`,
                      }}
                    >
                      <div
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          backgroundColor: platform.color,
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          fontSize: 11,
                          color: isHovered ? platform.color : V.textSecondary,
                          fontWeight: 500,
                          transition: "color 0.2s ease",
                        }}
                      >
                        {platform.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Portfolio chart + sparklines */}
          <PortfolioChart />

          {/* Disclaimer */}
          <div
            style={{
              marginTop: 16,
              fontFamily: "var(--font-jetbrains), monospace",
              fontSize: 10,
              color: V.textMuted,
              display: "flex",
              alignItems: "center",
              gap: 8,
              opacity: 0.6,
            }}
          >
            Datos de ejemplo — en desarrollo
            <span style={{ color: V.steel, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Alpha
            </span>
          </div>
        </section>

        {/* Divider */}
        <div
          style={{
            height: 1,
            background: `linear-gradient(to right, transparent, ${V.border}, transparent)`,
            margin: "16px 0 56px",
          }}
        />

        {/* CTAs Section */}
        <section
          ref={ctas.ref}
          id="newsletter-hub"
          style={{
            paddingBottom: 32,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: mobile ? "1fr" : "1fr 1fr",
              gap: mobile ? 40 : 48,
            }}
          >
            {/* Newsletter CTAs */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              opacity: ctas.visible ? 1 : 0,
              transform: ctas.visible ? "translateY(0)" : "translateY(20px)",
              transition: "all 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0s",
            }}>
              <div
                style={{
                  fontFamily: "var(--font-playfair), serif",
                  fontSize: 28,
                  letterSpacing: "-0.02em",
                  color: V.textPrimary,
                  marginBottom: 6,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 448 511.471" fill="none" style={{ opacity: 0.5, flexShrink: 0 }}>
                  <path fill={V.steel} d="M0 0h448v62.804H0V0zm0 229.083h448v282.388L223.954 385.808 0 511.471V229.083zm0-114.542h448v62.804H0v-62.804z"/>
                </svg>
                Newsletter
              </div>
              <p
                style={{
                  fontSize: 14,
                  color: V.textMuted,
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
                  sublabel="Edición estándar — gratis"
                  href="https://chamillion.substack.com"
                  variant="primary"
                  tag="free"
                />
                <CTAButton
                  label="Web"
                  sublabel="Edición extendida con interactivos"
                  href="/newsletter"
                  variant="secondary"
                  tag="extended"
                  internal
                />
              </div>
            </div>

            {/* Hub CTA */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              opacity: ctas.visible ? 1 : 0,
              transform: ctas.visible ? "translateY(0)" : "translateY(20px)",
              transition: "all 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.12s",
            }}>
              <div
                style={{
                  fontFamily: "var(--font-playfair), serif",
                  fontSize: 28,
                  letterSpacing: "-0.02em",
                  color: V.textPrimary,
                  marginBottom: 6,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.35, flexShrink: 0 }}>
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke={V.steel} strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M2 17L12 22L22 17" stroke={V.steel} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
                  <path d="M2 12L12 17L22 12" stroke={V.steel} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
                </svg>
                Hub
              </div>
              <p
                style={{
                  fontSize: 14,
                  color: V.textMuted,
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
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "28px 24px",
                  borderRadius: 14,
                  border: `1px dashed ${V.border}`,
                  background: `${bgCardA(0.5)}`,
                  boxShadow: `inset 0 0 40px ${steelA(0.02)}`,
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: `${steelA(0.06)}`,
                    border: `1px solid ${steelA(0.13)}`,
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
                      stroke={V.steel}
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M2 17L12 22L22 17"
                      stroke={V.steel}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity="0.5"
                    />
                    <path
                      d="M2 12L12 17L22 12"
                      stroke={V.steel}
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
                    color: V.steel,
                    marginBottom: 6,
                  }}
                >
                  En Construcción
                </div>
                <div
                  style={{ fontSize: 13, color: V.textMuted, lineHeight: 1.5 }}
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
            marginTop: mobile ? 40 : 48,
            paddingTop: 32,
            paddingBottom: 48,
            borderTop: "none",
            backgroundImage: `linear-gradient(to right, transparent, ${V.border}, transparent)`,
            backgroundSize: "100% 1px",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "top",
            display: "grid",
            gridTemplateColumns: mobile ? "1fr" : "1fr auto",
            gap: mobile ? 24 : 32,
            alignItems: "start",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "var(--font-jetbrains), monospace",
                fontSize: 12,
                fontWeight: 600,
                color: V.textSecondary,
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
            <div
              style={{
                fontFamily: "var(--font-jetbrains), monospace",
                fontSize: 10,
                color: V.textMuted,
                marginTop: 16,
                letterSpacing: "0.02em",
              }}
            >
              &copy; 2026 Chamillion
            </div>
          </div>

          <div
            style={{
              textAlign: mobile ? "left" : "right",
              fontFamily: "var(--font-jetbrains), monospace",
              fontSize: 10,
              color: V.textMuted,
              lineHeight: 1.8,
              maxWidth: mobile ? undefined : 320,
              letterSpacing: "0.01em",
            }}
          >
            Nada constituye asesoramiento financiero. Contenido educativo e
            informativo. Las inversiones conllevan riesgos incluyendo pérdida
            total del capital.
          </div>
        </footer>
      </div>
    </div>
  );
}
