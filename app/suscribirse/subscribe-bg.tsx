"use client";

import styles from "./subscribe-bg.module.css";

/* ── Flowing line charts ── */
const LINE_A = "M-40,520 C120,480 300,530 480,460 C660,390 840,430 1020,370 C1200,310 1380,350 1560,290 C1720,240 1840,270 1960,220";
const LINE_B = "M-40,750 C160,720 340,760 520,710 C700,660 880,700 1060,650 C1240,600 1420,640 1600,590 C1760,550 1880,570 1960,540";
const LINE_C = "M-40,300 C100,270 260,310 420,260 C580,220 740,250 900,210 C1060,180 1220,200 1380,170 C1540,140 1700,160 1960,120";
const LINE_D = "M-40,880 C200,850 400,890 600,840 C800,800 1000,830 1200,790 C1400,750 1600,780 1960,720";
const AREA_A = `${LINE_A} L1960,1080 L-40,1080 Z`;
const AREA_B = `${LINE_B} L1960,1080 L-40,1080 Z`;

/* ── Pie chart configs ── */
const PIES = [
  { cx: 260, cy: 220, r: 42, arcs: [0.45, 0.30, 0.25], delay: 0 },
  { cx: 1660, cy: 680, r: 32, arcs: [0.55, 0.25, 0.20], delay: 5 },
  { cx: 1050, cy: 140, r: 26, arcs: [0.40, 0.35, 0.25], delay: 10 },
  { cx: 700, cy: 880, r: 22, arcs: [0.60, 0.25, 0.15], delay: 7 },
  { cx: 1400, cy: 300, r: 18, arcs: [0.35, 0.40, 0.25], delay: 3 },
];

/* ── Ticker numbers ── */
const TICKERS = [
  { text: "+12.4%", x: 140, y: 480, size: 16, delay: 0 },
  { text: "$42,180", x: 1660, y: 320, size: 14, delay: 3 },
  { text: "TVL $4.2B", x: 1400, y: 840, size: 11, delay: 2 },
  { text: "-2.1%", x: 880, y: 120, size: 13, delay: 5 },
  { text: "1.08x", x: 280, y: 920, size: 14, delay: 8 },
  { text: "$0.998", x: 1780, y: 600, size: 12, delay: 4 },
  { text: "Vol 24h", x: 640, y: 440, size: 11, delay: 7 },
  { text: "+5.6%", x: 1200, y: 960, size: 13, delay: 1 },
  { text: "$2,310", x: 360, y: 160, size: 12, delay: 9 },
  { text: "Yield", x: 1540, y: 180, size: 10, delay: 4.5 },
  { text: "0.34x", x: 820, y: 560, size: 11, delay: 6.5 },
];

/* ── Flow streams ── */
const FLOWS = [
  { y: 200, x: 100, w: 220, delay: 0 },
  { y: 420, x: 1500, w: 180, delay: 2 },
  { y: 640, x: 600, w: 260, delay: 5 },
  { y: 860, x: 1200, w: 200, delay: 3 },
  { y: 300, x: 1700, w: 160, delay: 7 },
  { y: 740, x: 200, w: 200, delay: 4 },
  { y: 160, x: 900, w: 180, delay: 6 },
  { y: 540, x: 400, w: 140, delay: 1 },
  { y: 480, x: 1100, w: 200, delay: 8 },
  { y: 920, x: 500, w: 160, delay: 3.5 },
];

/* ── Dots ── */
const DOTS = [
  { cx: 140, cy: 340 }, { cx: 380, cy: 480 }, { cx: 620, cy: 260 },
  { cx: 860, cy: 600 }, { cx: 1100, cy: 400 }, { cx: 1340, cy: 540 },
  { cx: 1580, cy: 300 }, { cx: 300, cy: 760 }, { cx: 980, cy: 180 },
  { cx: 1700, cy: 680 }, { cx: 520, cy: 140 }, { cx: 1440, cy: 880 },
  { cx: 760, cy: 760 }, { cx: 1200, cy: 220 }, { cx: 420, cy: 580 },
  { cx: 1780, cy: 440 }, { cx: 160, cy: 900 }, { cx: 680, cy: 360 },
  { cx: 1300, cy: 720 }, { cx: 900, cy: 480 },
];

/* ── Horizontal bars ── */
const BARS = [
  { x: 1560, y: 460, w: 120, delay: 0 },
  { x: 1560, y: 478, w: 90, delay: 0.8 },
  { x: 1560, y: 496, w: 65, delay: 1.6 },
  { x: 1560, y: 514, w: 40, delay: 2.4 },
  { x: 100, y: 700, w: 100, delay: 5 },
  { x: 100, y: 718, w: 75, delay: 5.8 },
  { x: 100, y: 736, w: 50, delay: 6.6 },
  { x: 800, y: 980, w: 110, delay: 3 },
  { x: 800, y: 998, w: 80, delay: 3.8 },
  { x: 800, y: 1016, w: 55, delay: 4.6 },
];

/* ── Scan lines ── */
const SCANS = [
  { y: 350, delay: 0 },
  { y: 680, delay: 3.5 },
  { y: 150, delay: 6 },
  { y: 900, delay: 2 },
];

/* ── Crosshairs ── */
const CROSSHAIRS = [
  { cx: 480, cy: 320, r: 18, delay: 2 },
  { cx: 1400, cy: 600, r: 14, delay: 7 },
  { cx: 900, cy: 800, r: 12, delay: 4 },
  { cx: 200, cy: 500, r: 16, delay: 9 },
];

/* ── Sparklines — mini chart shapes ── */
const SPARKS = [
  { d: "M0,12 L8,6 L16,14 L24,4 L32,10 L40,2", x: 1620, y: 440, delay: 1 },
  { d: "M0,4 L7,10 L14,6 L21,14 L28,8 L35,12", x: 80, y: 800, delay: 4 },
  { d: "M0,10 L6,3 L12,12 L18,6 L24,2 L30,8", x: 1100, y: 800, delay: 7 },
  { d: "M0,8 L10,2 L20,11 L30,5 L40,9 L50,1", x: 340, y: 420, delay: 3 },
  { d: "M0,6 L5,12 L10,4 L15,10 L20,3 L25,9", x: 1300, y: 200, delay: 6 },
];

/* ── Connection lines between dots ── */
const CONNECTIONS = [
  { x1: 140, y1: 340, x2: 380, y2: 480, delay: 0 },
  { x1: 620, y1: 260, x2: 860, y2: 600, delay: 2 },
  { x1: 1100, y1: 400, x2: 1340, y2: 540, delay: 4 },
  { x1: 980, y1: 180, x2: 1200, y2: 220, delay: 6 },
  { x1: 1580, y1: 300, x2: 1700, y2: 680, delay: 3 },
  { x1: 300, y1: 760, x2: 520, y2: 140, delay: 5 },
  { x1: 680, y1: 360, x2: 900, y2: 480, delay: 7 },
];

/* ── Pulse rings ── */
const PULSES = [
  { cx: 480, cy: 650, delay: 0 },
  { cx: 1200, cy: 350, delay: 3 },
  { cx: 1700, cy: 900, delay: 6 },
  { cx: 300, cy: 500, delay: 9 },
  { cx: 950, cy: 100, delay: 2 },
];

/* ── Grid fragments ── */
const GRIDS = [
  { x: 1500, y: 100, w: 160, h: 120, delay: 1 },
  { x: 100, y: 350, w: 140, h: 100, delay: 5 },
  { x: 750, y: 600, w: 120, h: 90, delay: 8 },
];

/* ── Mini candle clusters (3-4 candles each) ── */
const CANDLE_CLUSTERS = [
  {
    x: 1700, y: 180, delay: 2,
    candles: [
      { dx: 0, o: 40, c: 20, h: 15, l: 48 },
      { dx: 16, o: 22, c: 35, h: 18, l: 42 },
      { dx: 32, o: 33, c: 15, h: 8, l: 40 },
    ],
  },
  {
    x: 160, y: 620, delay: 6,
    candles: [
      { dx: 0, o: 30, c: 45, h: 25, l: 50 },
      { dx: 14, o: 44, c: 28, h: 22, l: 52 },
      { dx: 28, o: 30, c: 18, h: 12, l: 38 },
      { dx: 42, o: 20, c: 35, h: 15, l: 42 },
    ],
  },
  {
    x: 1100, y: 920, delay: 4,
    candles: [
      { dx: 0, o: 35, c: 22, h: 16, l: 42 },
      { dx: 14, o: 24, c: 38, h: 20, l: 44 },
      { dx: 28, o: 36, c: 26, h: 20, l: 44 },
    ],
  },
];

/* ── Gauge arcs ── */
const GAUGES = [
  { cx: 1760, cy: 480, r: 22, fill: 0.72, delay: 3 },
  { cx: 200, cy: 180, r: 16, fill: 0.48, delay: 7 },
  { cx: 900, cy: 680, r: 18, fill: 0.85, delay: 1 },
];

/* ── Rising particles ── */
const PARTICLES = [
  { x: 320, startY: 900, delay: 0 },
  { x: 580, startY: 950, delay: 1.5 },
  { x: 840, startY: 980, delay: 3 },
  { x: 1100, startY: 920, delay: 4.5 },
  { x: 1360, startY: 960, delay: 2 },
  { x: 1620, startY: 940, delay: 5.5 },
  { x: 450, startY: 970, delay: 7 },
  { x: 1480, startY: 910, delay: 3.5 },
  { x: 720, startY: 990, delay: 6 },
  { x: 1200, startY: 930, delay: 1 },
  { x: 180, startY: 960, delay: 8 },
  { x: 1800, startY: 950, delay: 4 },
];

/* ── Orbit rings — concentric rotating ellipses ── */
const ORBITS = [
  { cx: 400, cy: 200, rx: 60, ry: 20, delay: 0 },
  { cx: 1500, cy: 800, rx: 45, ry: 15, delay: 4 },
  { cx: 950, cy: 500, rx: 35, ry: 12, delay: 8 },
];

/* ── Sine wave oscillators ── */
function sineWave(x0: number, y0: number, w: number, amp: number, freq: number): string {
  const pts: string[] = [];
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    const x = x0 + t * w;
    const y = y0 + Math.sin(t * Math.PI * freq) * amp;
    pts.push(`${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return pts.join(" ");
}

const WAVES = [
  { x: 60, y: 850, w: 200, amp: 12, freq: 3, delay: 1 },
  { x: 1600, y: 140, w: 180, amp: 10, freq: 4, delay: 5 },
  { x: 700, y: 380, w: 160, amp: 8, freq: 5, delay: 9 },
  { x: 1200, y: 700, w: 140, amp: 14, freq: 2.5, delay: 3 },
];

/* ── Data row tables — scrolling rows ── */
const TABLES = [
  {
    x: 1580, y: 560, delay: 2,
    rows: ["0xf3..a2  1,420", "0xb7..19    890", "0x1c..e8  3,200", "0x9a..4d    560"],
  },
  {
    x: 80, y: 440, delay: 6,
    rows: ["ETH   2,310  +4.2%", "BTC  42,180  -1.1%", "SOL    98.4  +8.7%"],
  },
];

/* ── Floating brackets/frames ── */
const FRAMES = [
  { x: 480, y: 120, w: 80, h: 50, delay: 3 },
  { x: 1300, y: 880, w: 60, h: 40, delay: 7 },
  { x: 160, y: 800, w: 70, h: 45, delay: 1 },
  { x: 1700, y: 380, w: 55, h: 35, delay: 5 },
];

/* ── Marquee tape — bottom-only scroll ── */
type MarqueeDir = "up" | "down";
type MarqueeItem = readonly [string, string, MarqueeDir];

const MARQUEE_BOTTOM: readonly MarqueeItem[] = [
  ["TX/s", "14,230", "up"],
  ["GAS", "32 gwei", "down"],
  ["VOL 24h", "$1.2B", "up"],
  ["OI", "$18.4B", "up"],
  ["FR", "0.012%", "down"],
  ["LIQ", "$42M", "down"],
  ["ADDR", "1.4M", "up"],
  ["DOM", "52.3%", "up"],
  ["FEAR", "72", "up"],
  ["STAKED", "28.1%", "up"],
  ["SUPPLY", "19.6M", "up"],
  ["HASH", "612 EH/s", "up"],
];

/* ── Radar sweeps ── */
const RADARS = [
  { cx: 180, cy: 870, r: 68, delay: 4 },
  { cx: 1770, cy: 210, r: 52, delay: 9 },
];

/* ── Heatmap cells ── */
const HEATMAPS = [
  {
    x: 80, y: 100, cols: 5, cell: 8, gap: 2, delay: 3, label: "VOL 5m",
    heats: [
      0.3, 0.7, 0.9, 0.5, 0.2,
      0.4, 0.85, 1.0, 0.7, 0.3,
      0.2, 0.6, 0.95, 0.8, 0.4,
      0.1, 0.3, 0.7, 0.5, 0.2,
      0.05, 0.2, 0.4, 0.3, 0.1,
    ],
  },
  {
    x: 1680, y: 880, cols: 5, cell: 7, gap: 1.5, delay: 8, label: "ACTIVITY",
    heats: [
      0.1, 0.4, 0.6, 0.3, 0.5,
      0.3, 0.8, 0.95, 0.7, 0.3,
      0.6, 0.9, 1.0, 0.85, 0.4,
      0.4, 0.7, 0.85, 0.6, 0.2,
      0.2, 0.4, 0.5, 0.3, 0.15,
    ],
  },
];


function Marquee({ items, y, alt, delay }: {
  items: readonly MarqueeItem[]; y: number; alt?: boolean; delay: number;
}) {
  return (
    <g className={styles.marquee} style={{ animationDelay: `${delay}s` }}>
      <text x={0} y={y} className={alt ? styles.marqueeTextAlt : styles.marqueeText}>
        {items.map(([sym, val, dir], i) => (
          <tspan key={i}>
            {i > 0 ? "    ·    " : ""}
            {sym} {val}{" "}
            <tspan className={dir === "up" ? styles.marqueeCaret : styles.marqueeCaretDown}>
              {dir === "up" ? "▲" : "▼"}
            </tspan>
          </tspan>
        ))}
      </text>
    </g>
  );
}

function Radar({ cx, cy, r, delay }: {
  cx: number; cy: number; r: number; delay: number;
}) {
  const pingX = cx + r * 0.58;
  const pingY = cy - r * 0.32;
  const fanEndX = cx + r * Math.cos(-Math.PI / 5);
  const fanEndY = cy + r * Math.sin(-Math.PI / 5);
  return (
    <g className={styles.radar} style={{ animationDelay: `${delay}s` }}>
      <circle cx={cx} cy={cy} r={r} className={styles.radarRingSolid} />
      <circle cx={cx} cy={cy} r={r * 0.66} className={styles.radarRing} />
      <circle cx={cx} cy={cy} r={r * 0.33} className={styles.radarRing} />
      <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} className={styles.radarRing} />
      <line x1={cx} y1={cy - r} x2={cx} y2={cy + r} className={styles.radarRing} />

      <g className={styles.radarSweepGroup} style={{ transformOrigin: `${cx}px ${cy}px` }}>
        <path
          d={`M${cx},${cy} L${cx + r},${cy} A${r},${r} 0 0,0 ${fanEndX.toFixed(2)},${fanEndY.toFixed(2)} Z`}
          className={styles.radarFan}
        />
        <line x1={cx} y1={cy} x2={cx + r} y2={cy} className={styles.radarLine} />
      </g>

      <circle cx={pingX} cy={pingY} r={2.5} className={styles.radarPing}
        style={{ animationDelay: `${delay + 0.5}s`, transformOrigin: `${pingX}px ${pingY}px` }} />
    </g>
  );
}

function Heatmap({ x, y, cols, cell, gap, delay, label, heats }: {
  x: number; y: number; cols: number; cell: number; gap: number;
  delay: number; label: string; heats: readonly number[];
}) {
  return (
    <g className={styles.heatmap} style={{ animationDelay: `${delay}s` }}>
      <text x={x} y={y - 6} className={styles.heatLabel}>{label}</text>
      {heats.map((heat, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        return (
          <rect
            key={i}
            x={x + col * (cell + gap)}
            y={y + row * (cell + gap)}
            width={cell}
            height={cell}
            rx={1}
            className={styles.heatCell}
            style={{
              animationDelay: `${delay + (i * 0.13) % 3.5}s`,
              ["--heat" as string]: heat,
            } as React.CSSProperties}
          />
        );
      })}
    </g>
  );
}

function PieChart({ cx, cy, r, arcs, delay }: {
  cx: number; cy: number; r: number; arcs: number[]; delay: number;
}) {
  const circ = 2 * Math.PI * r;
  let offset = 0;
  const arcStyles = [styles.pieArc, styles.pieArc2, styles.pieArc3];

  return (
    <g
      className={styles.pie}
      style={{ transformOrigin: `${cx}px ${cy}px`, animationDelay: `${delay}s` }}
    >
      <circle cx={cx} cy={cy} r={r} fill="none" className={styles.donutTrack} strokeWidth={r * 0.35} />
      {arcs.map((pct, i) => {
        const dashLen = circ * pct;
        const dashGap = circ - dashLen;
        const rotation = -90 + (offset / circ) * 360;
        offset += dashLen;
        return (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            strokeWidth={r * 0.35}
            strokeDasharray={`${dashLen} ${dashGap}`}
            className={arcStyles[i % arcStyles.length]}
            style={{
              transformOrigin: `${cx}px ${cy}px`,
              transform: `rotate(${rotation}deg)`,
              animationDelay: `${delay + i * 0.3}s`,
            }}
          />
        );
      })}
    </g>
  );
}

export default function SubscribeBg() {
  return (
    <div className={styles.root}>
      <svg
        className={styles.svg}
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Area fills */}
        <path className={styles.areaA} d={AREA_A} />
        <path className={styles.areaB} d={AREA_B} />

        {/* Heatmap cells */}
        {HEATMAPS.map((h, i) => (
          <Heatmap key={i} {...h} />
        ))}

        {/* Grid fragments */}
        {GRIDS.map((g, i) => (
          <g key={i} className={styles.grid} style={{ animationDelay: `${g.delay}s` }}>
            {[0, 1, 2, 3, 4].map(col => (
              <line key={`v${col}`} x1={g.x + col * (g.w / 4)} y1={g.y} x2={g.x + col * (g.w / 4)} y2={g.y + g.h} />
            ))}
            {[0, 1, 2, 3].map(row => (
              <line key={`h${row}`} x1={g.x} y1={g.y + row * (g.h / 3)} x2={g.x + g.w} y2={g.y + row * (g.h / 3)} />
            ))}
          </g>
        ))}

        {/* Line charts */}
        <path className={styles.lineA} d={LINE_A} />
        <path className={styles.lineB} d={LINE_B} />
        <path className={styles.lineC} d={LINE_C} />
        <path className={styles.lineD} d={LINE_D} />

        {/* Connection lines between nodes */}
        {CONNECTIONS.map((c, i) => (
          <line key={i} className={styles.connection}
            x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2}
            style={{ animationDelay: `${c.delay}s` }}
          />
        ))}

        {/* Flow streams */}
        {FLOWS.map((f, i) => (
          <line key={i} className={styles.flow}
            x1={f.x} y1={f.y} x2={f.x + f.w} y2={f.y}
            style={{ animationDelay: `${f.delay}s` }}
          />
        ))}

        {/* Horizontal bars */}
        {BARS.map((b, i) => (
          <rect key={i} className={styles.bar}
            x={b.x} y={b.y} width={b.w} height={10}
            style={{ animationDelay: `${b.delay}s`, transformOrigin: `${b.x}px ${b.y}px` }}
          />
        ))}

        {/* Sparklines */}
        {SPARKS.map((s, i) => (
          <g key={i} className={styles.spark} style={{ animationDelay: `${s.delay}s` }}>
            <path d={s.d} transform={`translate(${s.x},${s.y})`}  />
          </g>
        ))}

        {/* Pie charts */}
        {PIES.map((p, i) => (
          <PieChart key={i} {...p} />
        ))}

        {/* Pulse rings */}
        {PULSES.map((p, i) => (
          <g key={i}>
            <circle cx={p.cx} cy={p.cy} r={3} className={styles.pulseCore}
              style={{ animationDelay: `${p.delay}s` }} />
            <circle cx={p.cx} cy={p.cy} r={3} className={styles.pulseRing}
              style={{ animationDelay: `${p.delay}s` }} />
          </g>
        ))}

        {/* Dots */}
        {DOTS.map((d, i) => (
          <circle key={i} className={styles.dot}
            cx={d.cx} cy={d.cy} r={2}
            style={{ animationDelay: `${i * 0.5}s` }}
          />
        ))}

        {/* Ticker numbers */}
        {TICKERS.map((t, i) => (
          <text key={i} className={styles.ticker}
            x={t.x} y={t.y} fontSize={t.size}
            style={{ animationDelay: `${t.delay}s` }}
          >
            {t.text}
          </text>
        ))}

        {/* Scan lines */}
        {SCANS.map((s, i) => (
          <line key={i} className={styles.scanLine}
            x1={-100} y1={s.y} x2={2020} y2={s.y}
            style={{ animationDelay: `${s.delay}s` }}
          />
        ))}

        {/* Mini candle clusters */}
        {CANDLE_CLUSTERS.map((cl, ci) => (
          <g key={ci} className={styles.candleCluster}
            style={{ animationDelay: `${cl.delay}s` }}
          >
            {cl.candles.map((c, i) => {
              const top = Math.min(c.o, c.c);
              const body = Math.abs(c.c - c.o);
              const bull = c.c < c.o;
              return (
                <g key={i} className={bull ? styles.candleBull : styles.candleBear}
                  style={{ animationDelay: `${cl.delay + i * 0.4}s` }}
                >
                  <line x1={cl.x + c.dx + 4} y1={cl.y + c.h} x2={cl.x + c.dx + 4} y2={cl.y + c.l} />
                  <rect x={cl.x + c.dx} y={cl.y + top} width={8} height={Math.max(body, 2)} rx={1} />
                </g>
              );
            })}
          </g>
        ))}

        {/* Gauge arcs */}
        {GAUGES.map((g, i) => {
          const circ = Math.PI * g.r * 1.5;
          return (
            <g key={i} className={styles.gauge}
              style={{ animationDelay: `${g.delay}s`, transformOrigin: `${g.cx}px ${g.cy}px` }}
            >
              <path
                d={`M${g.cx - g.r},${g.cy} A${g.r},${g.r} 0 1,1 ${g.cx + g.r},${g.cy}`}
                className={styles.gaugeTrack}
                strokeWidth={3}
              />
              <path
                d={`M${g.cx - g.r},${g.cy} A${g.r},${g.r} 0 1,1 ${g.cx + g.r},${g.cy}`}
                className={styles.gaugeValue}
                strokeWidth={3}
                strokeDasharray={circ}
                strokeDashoffset={circ * (1 - g.fill)}
              />
              <circle cx={g.cx} cy={g.cy} r={2} className={styles.gaugeDot} />
            </g>
          );
        })}

        {/* Rising particles */}
        {PARTICLES.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.startY} r={1.5}
            className={styles.particle}
            style={{ animationDelay: `${p.delay}s` }}
          />
        ))}

        {/* Orbit rings */}
        {ORBITS.map((o, i) => (
          <g key={i} className={styles.orbit}
            style={{ animationDelay: `${o.delay}s`, transformOrigin: `${o.cx}px ${o.cy}px` }}
          >
            <ellipse cx={o.cx} cy={o.cy} rx={o.rx} ry={o.ry} className={styles.orbitRing} />
            <ellipse cx={o.cx} cy={o.cy} rx={o.rx * 0.6} ry={o.ry * 0.6} className={styles.orbitRingInner} />
            <circle cx={o.cx + o.rx} cy={o.cy} r={2.5} className={styles.orbitSat}
              style={{ transformOrigin: `${o.cx}px ${o.cy}px` }} />
            <circle cx={o.cx - o.rx * 0.6} cy={o.cy} r={1.5} className={styles.orbitSatInner}
              style={{ transformOrigin: `${o.cx}px ${o.cy}px` }} />
          </g>
        ))}

        {/* Radar sweeps */}
        {RADARS.map((r, i) => (
          <Radar key={i} {...r} />
        ))}

        {/* Marquee tape (bottom only) */}
        <Marquee items={MARQUEE_BOTTOM} y={1032} delay={0} alt />


        {/* Sine wave oscillators */}
        {WAVES.map((w, i) => (
          <path key={i}
            d={sineWave(w.x, w.y, w.w, w.amp, w.freq)}
            className={styles.wave}
            style={{ animationDelay: `${w.delay}s` }}
          />
        ))}

        {/* Data tables */}
        {TABLES.map((t, i) => (
          <g key={i} className={styles.table} style={{ animationDelay: `${t.delay}s` }}>
            {t.rows.map((row, ri) => (
              <text key={ri}
                className={styles.tableRow}
                x={t.x} y={t.y + ri * 14}
                style={{ animationDelay: `${t.delay + ri * 0.6}s` }}
              >
                {row}
              </text>
            ))}
          </g>
        ))}

        {/* Floating frames */}
        {FRAMES.map((f, i) => (
          <g key={i} className={styles.frame} style={{ animationDelay: `${f.delay}s` }}>
            {/* Corner brackets */}
            <path d={`M${f.x},${f.y + 8} L${f.x},${f.y} L${f.x + 8},${f.y}`} />
            <path d={`M${f.x + f.w - 8},${f.y} L${f.x + f.w},${f.y} L${f.x + f.w},${f.y + 8}`} />
            <path d={`M${f.x + f.w},${f.y + f.h - 8} L${f.x + f.w},${f.y + f.h} L${f.x + f.w - 8},${f.y + f.h}`} />
            <path d={`M${f.x + 8},${f.y + f.h} L${f.x},${f.y + f.h} L${f.x},${f.y + f.h - 8}`} />
          </g>
        ))}

        {/* Crosshairs — staggered lock-on: ring → horizontal ticks → vertical ticks → center dot */}
        {CROSSHAIRS.map((c, i) => (
          <g key={i}>
            <circle cx={c.cx} cy={c.cy} r={c.r} className={styles.crosshair}
              style={{ animationDelay: `${c.delay}s`, transformOrigin: `${c.cx}px ${c.cy}px` }}
            />
            <line x1={c.cx - c.r - 6} y1={c.cy} x2={c.cx - c.r + 4} y2={c.cy}
              className={styles.crosshair} style={{ animationDelay: `${c.delay + 0.1}s` }} />
            <line x1={c.cx + c.r - 4} y1={c.cy} x2={c.cx + c.r + 6} y2={c.cy}
              className={styles.crosshair} style={{ animationDelay: `${c.delay + 0.1}s` }} />
            <line x1={c.cx} y1={c.cy - c.r - 6} x2={c.cx} y2={c.cy - c.r + 4}
              className={styles.crosshair} style={{ animationDelay: `${c.delay + 0.18}s` }} />
            <line x1={c.cx} y1={c.cy + c.r - 4} x2={c.cx} y2={c.cy + c.r + 6}
              className={styles.crosshair} style={{ animationDelay: `${c.delay + 0.18}s` }} />
            <circle cx={c.cx} cy={c.cy} r={2} className={styles.crosshairDot}
              style={{ animationDelay: `${c.delay + 0.28}s`, transformOrigin: `${c.cx}px ${c.cy}px` }}
            />
          </g>
        ))}
      </svg>
    </div>
  );
}
