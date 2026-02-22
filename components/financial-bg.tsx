"use client";

import styles from "./financial-bg.module.css";

/* ── Candlestick clusters ── */

const CANDLES_A = [
  { x: 220, open: 520, close: 450, high: 430, low: 550, bull: true },
  { x: 250, open: 450, close: 480, high: 440, low: 500, bull: false },
  { x: 280, open: 480, close: 420, high: 400, low: 500, bull: true },
  { x: 310, open: 420, close: 460, high: 410, low: 480, bull: false },
  { x: 340, open: 460, close: 390, high: 370, low: 470, bull: true },
  { x: 370, open: 390, close: 350, high: 330, low: 400, bull: true },
  { x: 400, open: 350, close: 380, high: 340, low: 400, bull: false },
  { x: 430, open: 380, close: 330, high: 310, low: 390, bull: true },
  { x: 460, open: 330, close: 360, high: 320, low: 380, bull: false },
  { x: 490, open: 360, close: 300, high: 280, low: 370, bull: true },
];

const CANDLES_B = [
  { x: 1300, open: 700, close: 740, high: 690, low: 760, bull: false },
  { x: 1330, open: 740, close: 690, high: 670, low: 750, bull: true },
  { x: 1360, open: 690, close: 720, high: 680, low: 740, bull: false },
  { x: 1390, open: 720, close: 670, high: 650, low: 730, bull: true },
  { x: 1420, open: 670, close: 700, high: 660, low: 720, bull: false },
  { x: 1450, open: 700, close: 640, high: 620, low: 710, bull: true },
  { x: 1480, open: 640, close: 670, high: 630, low: 690, bull: false },
  { x: 1510, open: 670, close: 610, high: 590, low: 680, bull: true },
];

const CANDLES_C = [
  { x: 800, open: 180, close: 210, high: 170, low: 220, bull: false },
  { x: 825, open: 210, close: 175, high: 165, low: 215, bull: true },
  { x: 850, open: 175, close: 195, high: 168, low: 205, bull: false },
  { x: 875, open: 195, close: 160, high: 150, low: 200, bull: true },
  { x: 900, open: 160, close: 180, high: 155, low: 190, bull: false },
];

/* ── Volume bars ── */

const VOLUME_A = [
  { x: 220, h: 35 }, { x: 250, h: 20 }, { x: 280, h: 50 },
  { x: 310, h: 25 }, { x: 340, h: 60 }, { x: 370, h: 40 },
  { x: 400, h: 18 }, { x: 430, h: 45 }, { x: 460, h: 30 },
  { x: 490, h: 55 },
];

const VOLUME_B = [
  { x: 1300, h: 30 }, { x: 1330, h: 50 }, { x: 1360, h: 22 },
  { x: 1390, h: 45 }, { x: 1420, h: 35 }, { x: 1450, h: 58 },
  { x: 1480, h: 28 }, { x: 1510, h: 42 },
];

/* ── Main line chart (kept) ── */

const LINE1 =
  "M-40,720 C60,700 140,730 280,660 C400,600 500,630 640,560 C760,500 860,530 1000,460 C1120,400 1220,420 1360,360 C1480,310 1580,340 1720,280 C1820,240 1900,260 1960,230";

const AREA1 = `${LINE1} L1960,1080 L-40,1080 Z`;

/* ── New animated line + area charts ── */

const LINE_A =
  "M1200,320 C1280,280 1360,300 1440,250 C1520,210 1600,230 1680,190 C1760,160 1840,180 1920,140";
const AREA_A = `${LINE_A} L1920,380 L1200,380 Z`;

const LINE_B =
  "M-20,880 C80,850 180,870 300,830 C420,790 520,810 640,780 C720,760 760,770 800,750";
const AREA_B = `${LINE_B} L800,950 L-20,950 Z`;

const LINE_C =
  "M900,550 C1000,520 1100,540 1200,500 C1300,470 1400,490 1500,460 C1560,445 1600,455 1640,440";
const AREA_C = `${LINE_C} L1640,600 L900,600 Z`;

/* ── Pie charts (circle-based with stroke-dasharray) ── */

const PIE_A = {
  cx: 300, cy: 200, r: 45,
  sectors: [
    { pct: 0.45, color: "green" },
    { pct: 0.30, color: "green2" },
    { pct: 0.25, color: "red" },
  ],
};

const PIE_B = {
  cx: 1700, cy: 700, r: 35,
  sectors: [
    { pct: 0.35, color: "green" },
    { pct: 0.25, color: "green2" },
    { pct: 0.22, color: "green3" },
    { pct: 0.18, color: "red" },
  ],
};

const PIE_C = {
  cx: 1050, cy: 150, r: 28,
  sectors: [
    { pct: 0.50, color: "green" },
    { pct: 0.30, color: "green2" },
    { pct: 0.20, color: "red" },
  ],
};

function renderPie(
  pie: typeof PIE_A,
  groupClass: string,
) {
  const circ = 2 * Math.PI * pie.r;
  let offset = 0;

  return (
    <g className={groupClass} transform={`translate(${pie.cx}, ${pie.cy})`}>
      {pie.sectors.map((s, i) => {
        const dashLen = circ * s.pct;
        const dashGap = circ - dashLen;
        const rotation = -90 + (offset / circ) * 360;
        const colorClass =
          s.color === "green" ? styles.pieGreen :
          s.color === "green2" ? styles.pieGreen2 :
          s.color === "green3" ? styles.pieGreen3 :
          styles.pieRed;
        offset += dashLen;
        return (
          <circle
            key={i}
            className={`${styles.pieSector} ${colorClass}`}
            r={pie.r}
            fill="none"
            strokeWidth={pie.r * 0.6}
            strokeDasharray={`${dashLen} ${dashGap}`}
            transform={`rotate(${rotation})`}
            style={{ animationDelay: `${i * 0.8}s` }}
          />
        );
      })}
    </g>
  );
}

/* ── Database tables ── */

const DB_A = {
  x: 560, y: 700,
  headers: ["ADDR", "AMT", "TIME"],
  rows: [
    ["0x3f..a2", "1,420", "12:04"],
    ["0xb7..19", "890", "12:05"],
    ["0x1c..e8", "3,200", "12:05"],
    ["0x9a..4d", "560", "12:06"],
    ["0xe2..71", "2,100", "12:07"],
  ],
};

const DB_B = {
  x: 1380, y: 250,
  headers: ["PAIR", "PRICE", "VOL"],
  rows: [
    ["BTC/USD", "42,180", "1.2B"],
    ["ETH/USD", "2,310", "840M"],
    ["SOL/USD", "98.4", "320M"],
    ["LINK/USD", "14.2", "95M"],
  ],
};

function renderDbTable(
  db: typeof DB_A,
  groupClass: string,
) {
  const colW = [80, 56, 50];
  const rowH = 18;
  const totalW = colW.reduce((a, b) => a + b, 0) + 16;

  return (
    <g className={groupClass} transform={`translate(${db.x}, ${db.y})`}>
      {/* Header bg */}
      <rect
        className={styles.dbHeaderBg}
        x={0} y={0}
        width={totalW} height={rowH + 4}
        rx={3}
      />
      {/* Header text */}
      {db.headers.map((h, i) => (
        <text
          key={i}
          className={styles.dbHeaderText}
          x={8 + colW.slice(0, i).reduce((a, b) => a + b, 0)}
          y={13}
        >
          {h}
        </text>
      ))}
      {/* Divider */}
      <line
        className={styles.dbDivider}
        x1={0} y1={rowH + 4}
        x2={totalW} y2={rowH + 4}
      />
      {/* Animated rows */}
      {db.rows.map((row, ri) => (
        <g
          key={ri}
          className={styles.dbRow}
          style={{ animationDelay: `${ri * 1.8}s` }}
        >
          <rect
            className={styles.dbRowBg}
            x={0} y={(ri + 1) * (rowH + 2) + 6}
            width={totalW} height={rowH}
            rx={2}
          />
          {row.map((cell, ci) => (
            <text
              key={ci}
              className={styles.dbCellText}
              x={8 + colW.slice(0, ci).reduce((a, b) => a + b, 0)}
              y={(ri + 1) * (rowH + 2) + 18}
            >
              {cell}
            </text>
          ))}
        </g>
      ))}
    </g>
  );
}

/* ── Floating data ── */

const NUMBERS = [
  { text: "+12.4%", x: 120, y: 180, size: 16 },
  { text: "$42,180", x: 1560, y: 260, size: 18 },
  { text: "-3.2%", x: 640, y: 120, size: 14 },
  { text: "TVL $4.2B", x: 1700, y: 460, size: 12 },
  { text: "24h Vol", x: 200, y: 900, size: 11 },
  { text: "1.08x", x: 1180, y: 100, size: 15 },
  { text: "APY 8.7%", x: 740, y: 970, size: 12 },
  { text: "$0.998", x: 1780, y: 840, size: 13 },
  { text: "0.62 ratio", x: 460, y: 760, size: 11 },
  { text: "MCap", x: 1100, y: 940, size: 11 },
];

/* ── Scatter dots ── */

const DOTS = [
  { cx: 100, cy: 320, r: 3 },   { cx: 360, cy: 460, r: 2 },
  { cx: 620, cy: 230, r: 3.5 }, { cx: 880, cy: 620, r: 2.5 },
  { cx: 1080, cy: 380, r: 2 },  { cx: 1330, cy: 520, r: 3 },
  { cx: 1560, cy: 280, r: 2 },  { cx: 200, cy: 660, r: 3 },
  { cx: 480, cy: 800, r: 2.5 }, { cx: 980, cy: 160, r: 3 },
  { cx: 1680, cy: 720, r: 2 },  { cx: 780, cy: 860, r: 2.5 },
  { cx: 440, cy: 140, r: 2 },   { cx: 1230, cy: 880, r: 3 },
  { cx: 1600, cy: 140, r: 2.5 },{ cx: 50, cy: 540, r: 2 },
  { cx: 720, cy: 420, r: 2.5 }, { cx: 1760, cy: 580, r: 2 },
  { cx: 300, cy: 280, r: 3 },   { cx: 1440, cy: 180, r: 2 },
];

/* ── Mini sparklines ── */

const SPARK1 = "M0,12 L5,9 L10,13 L15,5 L20,9 L25,3 L30,7 L35,1 L40,5";
const SPARK2 = "M0,3 L6,7 L12,5 L18,11 L24,8 L30,13 L36,9 L42,12";
const SPARK3 = "M0,8 L5,4 L10,10 L15,6 L20,2 L25,8 L30,4 L35,6";

/* ── Gauge arcs ── */

const GAUGE_ARC = "M0,-28 A28,28 0 1,1 -24.25,14";
const GAUGE_ARC_SM = "M0,-18 A18,18 0 1,1 -15.6,9";

/* ── Bar chart (horizontal) ── */

const HBARS = [
  { y: 0, w: 120, label: "BTC" },
  { y: 20, w: 95, label: "ETH" },
  { y: 40, w: 70, label: "SOL" },
  { y: 60, w: 45, label: "LINK" },
];

export default function FinancialBg() {
  return (
    <div className={`financial-bg ${styles.root}`}>
      <svg
        className={styles.svg}
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Main area fill (kept) */}
        <path className={styles.areaFill} d={AREA1} />

        {/* Main line chart (kept) */}
        <path className={styles.lineChart1} d={LINE1} />

        {/* New line + area charts */}
        <path className={styles.areaFillA} d={AREA_A} />
        <path className={styles.lineChartA} d={LINE_A} />

        <path className={styles.areaFillB} d={AREA_B} />
        <path className={styles.lineChartB} d={LINE_B} />

        <path className={styles.areaFillC} d={AREA_C} />
        <path className={styles.lineChartC} d={LINE_C} />

        {/* Pie charts */}
        {renderPie(PIE_A, styles.pieGroupA)}
        {renderPie(PIE_B, styles.pieGroupB)}
        {renderPie(PIE_C, styles.pieGroupC)}

        {/* Database tables */}
        {renderDbTable(DB_A, styles.dbGroupA)}
        {renderDbTable(DB_B, styles.dbGroupB)}

        {/* Candlestick cluster A (left) */}
        <g className={`${styles.candleGroup} ${styles.candleGroupA}`}>
          {CANDLES_A.map((c, i) => (
            <g
              key={i}
              className={`${styles.candle} ${c.bull ? styles.candleGreen : styles.candleRed}`}
            >
              <line
                className={styles.candleWick}
                x1={c.x} y1={c.high} x2={c.x} y2={c.low}
              />
              <rect
                className={styles.candleBody}
                x={c.x - 9}
                y={Math.min(c.open, c.close)}
                width={18}
                height={Math.abs(c.close - c.open)}
              />
            </g>
          ))}
        </g>

        {/* Volume bars A */}
        <g className={`${styles.volumeGroup} ${styles.volumeGroupA}`}>
          {VOLUME_A.map((v, i) => (
            <rect
              key={i}
              className={styles.volumeBar}
              x={v.x - 7}
              y={590 - v.h}
              width={14}
              height={v.h}
              rx={1}
            />
          ))}
        </g>

        {/* Candlestick cluster B (right) */}
        <g className={`${styles.candleGroup} ${styles.candleGroupB}`}>
          {CANDLES_B.map((c, i) => (
            <g
              key={i}
              className={`${styles.candle} ${c.bull ? styles.candleGreen : styles.candleRed}`}
            >
              <line
                className={styles.candleWick}
                x1={c.x} y1={c.high} x2={c.x} y2={c.low}
              />
              <rect
                className={styles.candleBody}
                x={c.x - 9}
                y={Math.min(c.open, c.close)}
                width={18}
                height={Math.abs(c.close - c.open)}
              />
            </g>
          ))}
        </g>

        {/* Volume bars B */}
        <g className={`${styles.volumeGroup} ${styles.volumeGroupB}`}>
          {VOLUME_B.map((v, i) => (
            <rect
              key={i}
              className={styles.volumeBar}
              x={v.x - 7}
              y={800 - v.h}
              width={14}
              height={v.h}
              rx={1}
            />
          ))}
        </g>

        {/* Candlestick cluster C (top, small) */}
        <g className={`${styles.candleGroup} ${styles.candleGroupC}`}>
          {CANDLES_C.map((c, i) => (
            <g
              key={i}
              className={`${styles.candle} ${c.bull ? styles.candleGreen : styles.candleRed}`}
            >
              <line
                className={styles.candleWick}
                x1={c.x} y1={c.high} x2={c.x} y2={c.low}
              />
              <rect
                className={styles.candleBody}
                x={c.x - 7}
                y={Math.min(c.open, c.close)}
                width={14}
                height={Math.abs(c.close - c.open)}
              />
            </g>
          ))}
        </g>

        {/* Gauge indicator (large) */}
        <g className={styles.gauge} transform="translate(1680, 300)">
          <path className={styles.gaugeTrack} d={GAUGE_ARC} fill="none" strokeWidth={3} />
          <path className={styles.gaugeValue} d={GAUGE_ARC} fill="none" strokeWidth={3} />
          <text className={styles.gaugeLabel} x={0} y={4} textAnchor="middle">72</text>
        </g>

        {/* Gauge indicator (small) */}
        <g className={styles.gaugeSm} transform="translate(160, 480)">
          <path className={styles.gaugeTrack} d={GAUGE_ARC_SM} fill="none" strokeWidth={2} />
          <path className={`${styles.gaugeValue} ${styles.gaugeValueSm}`} d={GAUGE_ARC_SM} fill="none" strokeWidth={2} />
          <text className={styles.gaugeLabel} x={0} y={3} textAnchor="middle" fontSize={10}>48</text>
        </g>

        {/* Horizontal bar chart */}
        <g className={styles.hbarGroup} transform="translate(1580, 580)">
          {HBARS.map((b, i) => (
            <g key={i} className={styles.hbar}>
              <text className={styles.hbarLabel} x={-4} y={b.y + 13} textAnchor="end">{b.label}</text>
              <rect className={styles.hbarTrack} x={0} y={b.y} width={140} height={14} rx={2} />
              <rect className={styles.hbarValue} x={0} y={b.y} width={b.w} height={14} rx={2} />
            </g>
          ))}
        </g>

        {/* Mini sparklines */}
        <g className={styles.sparkGroup}>
          <g transform="translate(1620, 440)" className={styles.spark1}>
            <rect className={styles.sparkBg} x={-6} y={-6} width={52} height={26} rx={4} />
            <path d={SPARK1} className={styles.sparkLine} />
          </g>
          <g transform="translate(80, 780)" className={styles.spark2}>
            <rect className={styles.sparkBg} x={-6} y={-6} width={54} height={26} rx={4} />
            <path d={SPARK2} className={styles.sparkLineRed} />
          </g>
          <g transform="translate(1100, 780)" className={styles.spark3}>
            <rect className={styles.sparkBg} x={-6} y={-6} width={42} height={22} rx={4} />
            <path d={SPARK3} className={styles.sparkLine} />
          </g>
        </g>

        {/* Trend arrows */}
        <g className={styles.arrowGroup}>
          <g className={styles.arrowUp1} transform="translate(1660, 160)">
            <polygon points="0,14 10,0 20,14" />
            <rect x={8} y={14} width={4} height={16} />
          </g>
          <g className={styles.arrowUp2} transform="translate(540, 80)">
            <polygon points="0,12 8,0 16,12" />
            <rect x={6} y={12} width={4} height={14} />
          </g>
          <g className={styles.arrowDown1} transform="translate(1260, 840)">
            <polygon points="0,0 10,14 20,0" />
            <rect x={8} y={-16} width={4} height={16} />
          </g>
          <g className={styles.arrowUp3} transform="translate(160, 380)">
            <polygon points="0,10 7,0 14,10" />
            <rect x={5} y={10} width={4} height={12} />
          </g>
          <g className={styles.arrowDown2} transform="translate(980, 960)">
            <polygon points="0,0 8,12 16,0" />
            <rect x={6} y={-14} width={4} height={14} />
          </g>
        </g>

        {/* Scatter dots */}
        <g>
          {DOTS.map((d, i) => (
            <circle
              key={i}
              className={styles.dot}
              cx={d.cx}
              cy={d.cy}
              r={d.r}
            />
          ))}
        </g>

        {/* Floating numbers */}
        <g>
          {NUMBERS.map((n, i) => (
            <text
              key={i}
              className={styles.number}
              x={n.x}
              y={n.y}
              fontSize={n.size}
            >
              {n.text}
            </text>
          ))}
        </g>
      </svg>
    </div>
  );
}
