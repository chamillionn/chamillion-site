"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "@/components/theme-toggle";
import { V, steelA } from "@/lib/theme";
import styles from "./verify.module.css";

/* ─── Types ─── */

export interface ExplorerOption {
  name: string;
  url: string;
  domain: string;
}

export interface VerifyPlatform {
  name: string;
  type: string;
  value: number;
  positionCount: number;
  allocationPct: number;
  walletAddress: string | null;
  explorers: ExplorerOption[];
  color: string;
  icon: string;
  iconViewBox: string;
  iconFillRule?: "evenodd" | "nonzero";
}

interface DailyData {
  day: string;
  total: number;
  cost?: number;
}

interface VerifyProps {
  platforms: VerifyPlatform[];
  totalValue: number;
  dailyData: DailyData[];
  capitalInvested: number | null;
  summary: {
    totalValue: number;
    totalCost: number;
    totalPnl: number;
    totalRoiPct: number;
  } | null;
  isDemo?: boolean;
  platformColorsLight?: string[];
}

/* ─── Hooks ─── */

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

function useTheme() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  useEffect(() => {
    const read = () => {
      const t = document.documentElement.getAttribute("data-theme");
      setTheme(t === "light" ? "light" : "dark");
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);
  return theme;
}

/* ─── Shared components ─── */

function AnimatedNumber({
  target, prefix = "", suffix = "", duration = 1800, decimals = 2,
}: {
  target: number; prefix?: string; suffix?: string; duration?: number; decimals?: number;
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
      {prefix}{value.toFixed(decimals)}{suffix}
    </span>
  );
}

function PulseDot({ color = V.steel }: { color?: string }) {
  return (
    <span style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 8, height: 8 }}>
      <span style={{ position: "absolute", width: 8, height: 8, borderRadius: "50%", backgroundColor: color, opacity: 0.4, animation: "pulse-ring 2s ease-out infinite" }} />
      <span style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: color }} />
    </span>
  );
}

/* ─── Donut Chart ─── */

function DonutChart({ platforms, total, hoveredPlatform, onHover }: { platforms: VerifyPlatform[]; total: number; hoveredPlatform: string | null; onHover: (name: string | null) => void }) {
  const size = 185;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const [introDone, setIntroDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIntroDone(true), 1600);
    return () => clearTimeout(timer);
  }, []);

  let cumulativeOffset = 0;
  const activePlatform = hoveredPlatform ? platforms.find(p => p.name === hoveredPlatform) : null;

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} overflow="visible" style={{ transform: "rotate(-90deg)", cursor: "pointer" }} onMouseLeave={() => onHover(null)}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={V.border} strokeWidth={strokeWidth} />
        {platforms.map((platform, i) => {
          const fraction = platform.value / total;
          const segmentLength = fraction * circumference;
          const gap = 3;
          const visibleLength = Math.max(segmentLength - gap, 1);
          const offset = circumference - cumulativeOffset;
          cumulativeOffset += segmentLength;
          const isHovered = hoveredPlatform === platform.name;
          const isDimmed = hoveredPlatform !== null && !isHovered;
          const useAnimation = !introDone && !hoveredPlatform;
          return (
            <circle
              key={platform.name}
              cx={size / 2} cy={size / 2} r={radius} fill="none"
              stroke={platform.color} strokeLinecap="round"
              onMouseEnter={() => onHover(platform.name)}
              onTouchStart={(e) => { e.preventDefault(); onHover(hoveredPlatform === platform.name ? null : platform.name); }}
              style={{
                "--circ": circumference, "--vis": visibleLength, "--gap": circumference - visibleLength,
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
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center", pointerEvents: "none", transition: "all 0.2s ease" }}>
        <div style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: activePlatform ? 16 : 18, fontWeight: 600, color: activePlatform ? activePlatform.color : V.textPrimary, letterSpacing: "-0.02em", transition: "all 0.2s ease" }}>
          {activePlatform ? `${activePlatform.value.toFixed(0)}€` : `${total.toFixed(0)}€`}
        </div>
        <div style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 9, color: V.textSecondary, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          {activePlatform ? activePlatform.name : "TOTAL"}
        </div>
      </div>
    </div>
  );
}

/* ─── Portfolio Chart ─── */

function PortfolioChart({ dailyData }: { dailyData: DailyData[] }) {
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

  const W = chartWidth;
  const H = 180;
  const padX = 0;
  const padTop = 10;
  const padBottom = 24;
  const chartH = H - padTop - padBottom;

  const hasCostBasis = dailyData.some((d) => d.cost != null && d.cost > 0);

  const totals = dailyData.map(d => d.total);
  const allValues = hasCostBasis
    ? [...totals, ...dailyData.filter((d) => d.cost != null && d.cost > 0).map((d) => d.cost!)]
    : totals;
  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);
  const yRange = maxVal - minVal || 1;
  const yPad = yRange * 0.15;
  const yMin = minVal - yPad;
  const yMax = maxVal + yPad;

  const points = dailyData.map((d, i) => ({
    x: padX + (i / (dailyData.length - 1)) * (W - padX * 2),
    y: padTop + chartH - ((d.total - yMin) / (yMax - yMin)) * chartH,
  }));

  const costBasisPath = hasCostBasis
    ? dailyData
        .map((d, i) => {
          if (d.cost == null || d.cost <= 0) return null;
          const x = padX + (i / (dailyData.length - 1)) * (W - padX * 2);
          const y = padTop + chartH - ((d.cost - yMin) / (yMax - yMin)) * chartH;
          return { x, y };
        })
        .filter((p): p is { x: number; y: number } => p !== null)
        .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
        .join(" ")
    : null;

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padTop + chartH} L ${points[0].x} ${padTop + chartH} Z`;
  const lineLength = points.reduce((sum, p, i) => {
    if (i === 0) return 0;
    const dx = p.x - points[i - 1].x;
    const dy = p.y - points[i - 1].y;
    return sum + Math.sqrt(dx * dx + dy * dy);
  }, 0);
  const gridValues = [yMin + (yMax - yMin) * 0.25, yMin + (yMax - yMin) * 0.5, yMin + (yMax - yMin) * 0.75];
  const hoveredData = hoveredDay !== null ? dailyData[hoveredDay] : null;
  const hoveredPoint = hoveredDay !== null ? points[hoveredDay] : null;
  const prevTotal = hoveredDay !== null && hoveredDay > 0 ? dailyData[hoveredDay - 1].total : null;

  return (
    <div style={{ marginTop: 20, paddingTop: 14, backgroundImage: `linear-gradient(to right, transparent, ${V.border}, transparent)`, backgroundSize: "100% 1px", backgroundRepeat: "no-repeat", backgroundPosition: "top" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 10, color: V.textMuted, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Rendimiento 30d
        </div>
      </div>
      <div ref={chartRef} style={{ position: "relative", width: "100%", opacity: 0, animation: "fade-slide-up 0.8s ease 300ms forwards" }}>
        <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: "block", overflow: "visible" }} onMouseLeave={() => setHoveredDay(null)}>
          <defs>
            <linearGradient id="verifyAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={V.steel} stopOpacity="0.20" />
              <stop offset="100%" stopColor={V.steel} stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {gridValues.map((val, i) => {
            const y = padTop + chartH - ((val - yMin) / (yMax - yMin)) * chartH;
            return (
              <g key={i}>
                <line x1={0} y1={y} x2={W} y2={y} stroke={V.border} strokeWidth="1" opacity="0.4" />
                <text x={W - 2} y={y - 5} textAnchor="end" fill={V.textMuted} fontSize="9" fontFamily="var(--font-jetbrains), monospace" opacity="0.7">{Math.round(val)}€</text>
              </g>
            );
          })}
          <path d={areaPath} fill="url(#verifyAreaGrad)" style={{ opacity: 0, animation: "area-fade 0.8s ease 0.8s forwards" }} />
          {costBasisPath && (
            <path
              d={costBasisPath}
              fill="none"
              stroke={V.gold}
              strokeWidth="1"
              strokeDasharray="4 4"
              strokeLinecap="round"
              opacity="0.45"
              style={{ animation: "area-fade 0.8s ease 1s forwards", opacity: 0 }}
            />
          )}
          <path d={linePath} fill="none" stroke={V.steel} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ "--line-length": `${lineLength}`, strokeDasharray: lineLength, strokeDashoffset: lineLength, animation: `draw-line 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards` } as React.CSSProperties} />
          {points.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={hoveredDay === i ? 4.5 : 2.5} fill={hoveredDay === i ? V.steel : V.bgDark} stroke={V.steel} strokeWidth={hoveredDay === i ? 2 : 1.5} style={{ transition: "r 0.15s ease, fill 0.15s ease" }} />
          ))}
          {hoveredPoint && <line x1={hoveredPoint.x} y1={padTop} x2={hoveredPoint.x} y2={padTop + chartH} stroke={V.steel} strokeWidth="1" opacity="0.3" strokeDasharray="3 3" />}
          {dailyData.map((_, i) => {
            const zoneW = W / dailyData.length;
            return <rect key={i} x={i * zoneW} y={0} width={zoneW} height={H} fill="transparent" onMouseEnter={() => setHoveredDay(i)} onTouchStart={() => setHoveredDay(i)} onTouchEnd={() => setHoveredDay(null)} style={{ cursor: "crosshair" }} />;
          })}
          {(() => {
            const labelStep = W < 400 ? 7 : W < 600 ? 4 : 2;
            return dailyData.map((d, i) => {
              if (i % labelStep !== 0 && i !== dailyData.length - 1) return null;
              return <text key={i} x={points[i].x} y={H - 4} textAnchor="middle" fill={hoveredDay === i ? V.textSecondary : V.textMuted} fontSize="10" fontFamily="var(--font-jetbrains), monospace" style={{ transition: "fill 0.15s ease" }}>{d.day}</text>;
            });
          })()}
        </svg>
        {hoveredData && hoveredPoint && (
          <div style={{ position: "absolute", left: Math.min(Math.max(hoveredPoint.x - 50, 0), W - 110), top: Math.max(hoveredPoint.y - 56, 0), background: V.bgCard, border: `1px solid ${V.border}`, borderRadius: 6, padding: "6px 10px", pointerEvents: "none", zIndex: 10, fontFamily: "var(--font-jetbrains), monospace", whiteSpace: "nowrap" }}>
            <div style={{ fontSize: 10, color: V.textMuted, marginBottom: 2 }}>{hoveredData.day}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: V.textPrimary }}>{hoveredData.total.toFixed(2)} €</div>
            {prevTotal !== null && (
              <div style={{ fontSize: 10, color: hoveredData.total >= prevTotal ? V.green : V.red }}>
                {hoveredData.total >= prevTotal ? "+" : ""}{(hoveredData.total - prevTotal).toFixed(2)} €
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Platform Card (expandable) ─── */

function PlatformCard({ platform, index, isDemo, isExpanded, onToggle, onHover }: {
  platform: VerifyPlatform; index: number; isDemo?: boolean;
  isExpanded: boolean; onToggle: () => void; onHover: (name: string | null) => void;
}) {
  const hasWallet = !!platform.walletAddress;
  const hasExplorers = platform.explorers.length > 0 && platform.explorers.some(e => e.url !== "#");
  const truncatedWallet = platform.walletAddress
    ? `${platform.walletAddress.slice(0, 6)}...${platform.walletAddress.slice(-4)}`
    : null;
  const [copied, setCopied] = useState(false);

  const fmt = (n: number) => n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (platform.walletAddress) {
      navigator.clipboard.writeText(platform.walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div
      className={styles.platformCard}
      style={{
        borderLeft: `3px solid ${platform.color}`,
        opacity: 0,
        animation: `fade-slide-up 0.5s ease ${200 + index * 80}ms forwards`,
      }}
      onMouseEnter={() => onHover(platform.name)}
      onMouseLeave={() => { if (!isExpanded) onHover(null); }}
      onClick={onToggle}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Icon */}
        {platform.icon && (
          <div style={{
            width: 28, height: 28, borderRadius: 7, flexShrink: 0,
            background: `${platform.color}12`, border: `1px solid ${platform.color}25`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="15" height="15" viewBox={platform.iconViewBox} fill={platform.color} fillRule={platform.iconFillRule || undefined}>
              <path d={platform.icon} />
            </svg>
          </div>
        )}

        {/* Name + type */}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: V.textPrimary }}>{platform.name}</div>
          <div style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 9, color: V.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>{platform.type}</div>
        </div>

        {/* Value + allocation + badge + chevron — push right */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 14, fontWeight: 600, color: V.textPrimary }}>{fmt(platform.value)}€</div>
            <div style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 10, color: V.textMuted }}>{platform.allocationPct.toFixed(1)}%</div>
          </div>

          {hasWallet ? (
            <span className={styles.onChainBadge}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: V.green, display: "inline-block" }} />
              ON-CHAIN
            </span>
          ) : (
            <span className={styles.offChainBadge}>OFF-CHAIN</span>
          )}

          {/* Chevron */}
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className={`${styles.chevron} ${isExpanded ? styles.chevronOpen : ""}`}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>

      {/* Expand panel */}
      <div className={`${styles.expandPanel} ${isExpanded ? styles.expandPanelOpen : ""}`}>
        <div style={{ paddingTop: 14, paddingLeft: 40 }}>
          {hasWallet && !isDemo ? (
            <>
              {/* Wallet address + copy */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 12, color: V.textSecondary }}>
                  {truncatedWallet}
                </span>
                <button className={styles.copyButton} onClick={handleCopy}>
                  {copied ? "Copiado" : "Copiar"}
                </button>
              </div>

              {/* Explorer pills */}
              {hasExplorers && (
                <>
                  <div style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 10, color: V.textMuted, marginBottom: 8 }}>
                    Verifica el balance en cualquier explorador:
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {platform.explorers.map((ex) => (
                      <a
                        key={ex.name}
                        href={ex.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.explorerPill}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {ex.name}
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.explorerPillArrow}>
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </a>
                    ))}
                  </div>
                </>
              )}
            </>
          ) : hasWallet && isDemo ? (
            <>
              <div style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 10, color: V.textMuted, marginBottom: 8 }}>
                Verifica el balance en cualquier explorador:
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", opacity: 0.4, pointerEvents: "none" }}>
                {platform.explorers.map((ex) => (
                  <span key={ex.name} className={styles.explorerPill}>
                    {ex.name}
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </span>
                ))}
              </div>
            </>
          ) : (
            <span style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 11, color: V.textMuted }}>
              Datos sincronizados via API
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main ─── */

export default function VerifyClient({ platforms, totalValue, dailyData, capitalInvested, summary, isDemo, platformColorsLight }: VerifyProps) {
  const [loaded, setLoaded] = useState(false);
  const [hoveredPlatform, setHoveredPlatform] = useState<string | null>(null);
  const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null);
  const mobile = useMediaQuery(768);
  const theme = useTheme();

  const themedPlatforms = useMemo(() => {
    if (theme !== "light" || !platformColorsLight) return platforms;
    return platforms.map((p, i) => ({
      ...p,
      color: platformColorsLight[i % platformColorsLight.length],
    }));
  }, [platforms, theme, platformColorsLight]);

  const hasSummary = summary && summary.totalValue != null;
  const invested = capitalInvested ?? 0;
  const adjustedPnl = hasSummary ? summary.totalValue - invested : 0;
  const adjustedRoiPct =
    hasSummary && invested > 0 ? (adjustedPnl / invested) * 100 : 0;
  const pnlPositive = adjustedPnl >= 0;
  const effectiveCost = invested;

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(t);
  }, []);

  const positionCount = platforms.reduce((sum, p) => sum + p.positionCount, 0);

  const fmt = (n: number) => n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Donut highlights: hovered row takes priority, then expanded platform
  const activeDonutPlatform = hoveredPlatform ?? expandedPlatform;

  return (
    <div style={{ minHeight: "100dvh", background: V.bgDark, fontFamily: "var(--font-outfit), sans-serif", position: "relative" }}>
      {/* Grain overlay */}
      <div style={{ position: "fixed", inset: 0, zIndex: 50, pointerEvents: "none", opacity: 0.03, background: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`, animation: "grain 8s steps(10) infinite" }} />

      {/* Gradient orb */}
      <div style={{ position: "fixed", top: "-20%", right: "-10%", width: "60vw", height: "60vw", borderRadius: "50%", background: `radial-gradient(circle, ${steelA(0.04)} 0%, transparent 70%)`, pointerEvents: "none", zIndex: 0 }} />

      {/* Content */}
      <div style={{ position: "relative", zIndex: 1, maxWidth: 760, margin: "0 auto", padding: mobile ? "0 16px 80px" : "0 24px 80px" }}>
        {/* Nav */}
        <nav style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "28px 0",
          backgroundImage: `linear-gradient(to right, transparent, ${V.border}, transparent)`,
          backgroundSize: "100% 1px", backgroundRepeat: "no-repeat", backgroundPosition: "bottom",
        }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", opacity: loaded ? 1 : 0, transform: loaded ? "translateY(0)" : "translateY(-8px)", transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0s" }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: `linear-gradient(135deg, ${steelA(0.19)}, ${steelA(0.06)})`, border: `1px solid ${steelA(0.15)}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Image src="/assets/newsletter/logo.jpg" alt="Chamillion" width={24} height={24} style={{ borderRadius: 5, objectFit: "cover" }} />
            </div>
            <span style={{ fontFamily: "var(--font-jetbrains), monospace", fontWeight: 600, fontSize: 14, letterSpacing: "0.04em", textTransform: "uppercase", color: V.textPrimary }}>Chamillion</span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 16, opacity: loaded ? 1 : 0, transform: loaded ? "translateY(0)" : "translateY(-8px)", transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s" }}>
            <ThemeToggle />
          </div>
        </nav>

        {/* ─── Badge ─── */}
        <section style={{ paddingTop: 40, paddingBottom: 16, opacity: loaded ? 1 : 0, transform: loaded ? "translateY(0)" : "translateY(12px)", transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <PulseDot color={V.green} />
            <span style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 10, color: V.steel, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Portfolio en vivo
            </span>
            <span style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 9, color: V.textMuted, letterSpacing: "0.04em" }}>
              · Actualizado cada 5 min
            </span>
            {isDemo && (
              <span style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: 10, color: V.gold, background: `rgba(${V.goldRgb}, 0.12)`, padding: "2px 8px", borderRadius: 4, marginLeft: 4 }}>Demo</span>
            )}
          </div>
        </section>

        {/* ─── Portfolio Snapshot ─── */}
        <section style={{ marginBottom: 36 }}>
          <div style={{
            display: "flex",
            flexDirection: mobile ? "column" : "row",
            alignItems: mobile ? "center" : "flex-start",
            gap: mobile ? 32 : 32,
          }}>
            {/* Left: Stats */}
            <div style={{ flex: 1, width: "100%", display: "flex", flexDirection: "column", gap: 20, alignItems: mobile ? "center" : "flex-start" }}>
              {/* Total value */}
              <div>
                <div style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 10, color: V.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Valor total</div>
                <div style={{ fontSize: mobile ? 28 : 32, fontWeight: 700, color: V.textPrimary, letterSpacing: "-0.02em" }}>
                  <AnimatedNumber target={totalValue} suffix=" €" decimals={2} duration={2000} />
                </div>
              </div>

              {/* PnL inline */}
              {hasSummary && (
                <div style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 13, color: pnlPositive ? V.green : V.red, marginTop: -12 }}>
                  {pnlPositive ? "+" : ""}{fmt(adjustedPnl)} € ({adjustedRoiPct.toFixed(1)}%)
                </div>
              )}

              {/* Mini stats */}
              <div style={{ display: "flex", gap: 24 }}>
                <div>
                  <div style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 10, color: V.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>
                    Invertido
                  </div>
                  <div style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 14, fontWeight: 600, color: V.textPrimary }}>
                    {fmt(effectiveCost)} €
                  </div>
                </div>
                <div>
                  <div style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 10, color: V.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>Posiciones</div>
                  <div style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 14, fontWeight: 600, color: V.textPrimary }}>{positionCount}</div>
                </div>
                <div>
                  <div style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 10, color: V.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>Plataformas</div>
                  <div style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 14, fontWeight: 600, color: V.textPrimary }}>{platforms.length}</div>
                </div>
              </div>
            </div>

            {/* Right: Donut */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
              <DonutChart platforms={themedPlatforms} total={totalValue} hoveredPlatform={activeDonutPlatform} onHover={setHoveredPlatform} />
              {/* Legend */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: mobile ? 8 : 6, justifyContent: "center" }}>
                {themedPlatforms.map((p) => {
                  const isActive = activeDonutPlatform === p.name;
                  return (
                    <div
                      key={p.name}
                      onMouseEnter={() => setHoveredPlatform(p.name)}
                      onMouseLeave={() => setHoveredPlatform(null)}
                      style={{
                        display: "flex", alignItems: "center", gap: 5,
                        padding: "3px 8px", borderRadius: 4, cursor: "default",
                        background: isActive ? steelA(0.06) : "transparent",
                        transition: "background 0.2s ease",
                      }}
                    >
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: p.color, display: "inline-block" }} />
                      <span style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 10, color: isActive ? p.color : V.textSecondary, transition: "color 0.2s ease" }}>
                        {p.name}
                      </span>
                      <span style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 10, color: V.textMuted }}>
                        {p.allocationPct.toFixed(0)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Chart */}
          {dailyData.length > 1 && <PortfolioChart dailyData={dailyData} />}
        </section>

        {/* ─── Plataformas ─── */}
        <section style={{ marginBottom: 0, paddingTop: 20, backgroundImage: `linear-gradient(to right, transparent, ${V.border}, transparent)`, backgroundSize: "100% 1px", backgroundRepeat: "no-repeat", backgroundPosition: "top" }}>
          <div style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 10, color: V.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
            Plataformas
          </div>
          <div>
            {themedPlatforms.map((p, i) => (
              <PlatformCard
                key={p.name}
                platform={p}
                index={i}
                isDemo={isDemo}
                isExpanded={expandedPlatform === p.name}
                onToggle={() => setExpandedPlatform(expandedPlatform === p.name ? null : p.name)}
                onHover={setHoveredPlatform}
              />
            ))}
          </div>
        </section>

        {/* ─── Newsletter closer ─── */}
        <div
          className={styles.newsletterCloser}
          style={{
            opacity: 0,
            animation: "fade-slide-up 0.5s ease 600ms forwards",
            backgroundImage: `linear-gradient(to right, transparent, ${V.border}, transparent)`,
            backgroundSize: "100% 1px", backgroundRepeat: "no-repeat", backgroundPosition: "top",
          }}
        >
          <Image
            src="/assets/newsletter/logo.jpg"
            alt="Chamillion"
            width={40}
            height={40}
            style={{ borderRadius: 10, objectFit: "cover", flexShrink: 0 }}
          />
          <div>
            <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: 16, color: V.textSecondary, lineHeight: 1.5, margin: 0 }}>
              Para seguir la evolución de esta cartera, publico actualizaciones semanales.
            </p>
            <a
              href="https://chamillion.substack.com"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.newsletterLink}
            >
              Suscribirme al newsletter
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.newsletterArrow}>
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
