/* ═════════════════════════════════════════════════════════════
   Kronos launch video — master timeline
   All animations are timed against the 18s composition.
   Real Kronos-mini output for BTC/USDT 1h.
   ═════════════════════════════════════════════════════════════ */

async function loadJson(path) {
  const res = await fetch(path);
  return res.json();
}

function build() {
  return Promise.all([
    loadJson("data/btc-history.json"),
    loadJson("data/btc-prediction.json"),
  ]).then(([history, prediction]) => buildTimeline(history, prediction));
}

function buildTimeline(history, prediction) {
  // Chart layout ────────────────────────────────────────────
  const W = 1260, H = 560;
  const padTop = 24, padBottom = 24, padLeft = 16, padRight = 16;
  const chartW = W - padLeft - padRight;
  const chartH = H - padTop - padBottom;

  // Display only the most recent N historical candles so each candle has enough width
  const histDisplay = history.slice(-90);
  const totalCandles = histDisplay.length + prediction.length;
  const candleGap = 2;
  const candleW = Math.max(3, (chartW - candleGap * (totalCandles - 1)) / totalCandles);
  const step = candleW + candleGap;

  // Compute y-scale across all visible candles (historical + prediction)
  const allCandles = [...histDisplay, ...prediction];
  let minP = Infinity, maxP = -Infinity;
  for (const c of allCandles) {
    if (c.l < minP) minP = c.l;
    if (c.h > maxP) maxP = c.h;
  }
  // Padding
  const pRange = maxP - minP || 1;
  minP -= pRange * 0.05;
  maxP += pRange * 0.05;
  const yScale = (p) => padTop + ((maxP - p) / (maxP - minP)) * chartH;

  // Build historical candles ────────────────────────────────
  const histGroup = document.getElementById("hist-candles");
  histDisplay.forEach((c, i) => {
    const x = padLeft + i * step;
    const up = c.c >= c.o;
    const color = up ? "#5BAA7C" : "#C7555A";
    const wickX = x + candleW / 2;
    const bodyTop = yScale(Math.max(c.o, c.c));
    const bodyBot = yScale(Math.min(c.o, c.c));
    const bodyH = Math.max(1, bodyBot - bodyTop);

    const wick = document.createElementNS("http://www.w3.org/2000/svg", "line");
    wick.setAttribute("class", "candle-wick");
    wick.setAttribute("x1", wickX);
    wick.setAttribute("x2", wickX);
    wick.setAttribute("y1", yScale(c.h));
    wick.setAttribute("y2", yScale(c.l));
    wick.setAttribute("stroke", color);
    wick.setAttribute("stroke-width", 1);
    wick.setAttribute("data-hidx", i);
    histGroup.appendChild(wick);

    const body = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    body.setAttribute("class", "candle-body");
    body.setAttribute("x", x);
    body.setAttribute("y", bodyTop);
    body.setAttribute("width", candleW);
    body.setAttribute("height", bodyH);
    body.setAttribute("fill", color);
    body.setAttribute("data-hidx", i);
    histGroup.appendChild(body);
  });

  // Grid lines ──────────────────────────────────────────────
  const gridGroup = document.getElementById("grid-lines");
  const nGridLines = 5;
  for (let i = 0; i <= nGridLines; i++) {
    const y = padTop + (chartH * i) / nGridLines;
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("class", "grid-line");
    line.setAttribute("x1", padLeft);
    line.setAttribute("x2", W - padRight);
    line.setAttribute("y1", y);
    line.setAttribute("y2", y);
    gridGroup.appendChild(line);

    const p = maxP - ((maxP - minP) * i) / nGridLines;
    const lbl = document.createElementNS("http://www.w3.org/2000/svg", "text");
    lbl.setAttribute("class", "axis-label grid-line");
    lbl.setAttribute("x", W - padRight - 4);
    lbl.setAttribute("y", y - 4);
    lbl.setAttribute("text-anchor", "end");
    lbl.textContent = `$${p.toLocaleString("es-ES", { maximumFractionDigits: 0 })}`;
    gridGroup.appendChild(lbl);
  }

  // Separator between history and prediction ────────────────
  const sepX = padLeft + histDisplay.length * step - candleGap / 2;
  const sep = document.createElementNS("http://www.w3.org/2000/svg", "line");
  sep.setAttribute("class", "separator-line");
  sep.setAttribute("x1", sepX);
  sep.setAttribute("x2", sepX);
  sep.setAttribute("y1", padTop);
  sep.setAttribute("y2", H - padBottom);
  document.getElementById("separator").appendChild(sep);

  // Last historical close — horizontal reference line
  const lastHistClose = histDisplay[histDisplay.length - 1].c;
  const lastY = yScale(lastHistClose);
  const lastLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
  lastLine.setAttribute("class", "last-price-line");
  lastLine.setAttribute("x1", padLeft);
  lastLine.setAttribute("x2", W - padRight);
  lastLine.setAttribute("y1", lastY);
  lastLine.setAttribute("y2", lastY);
  document.getElementById("last-line").appendChild(lastLine);

  // Build prediction candles (initial hidden state) ─────────
  const predGroup = document.getElementById("pred-candles");
  prediction.forEach((c, i) => {
    const x = padLeft + (histDisplay.length + i) * step;
    const up = c.c >= c.o;
    const color = up ? "#6B8EA0" : "#4A6E80";
    const wickX = x + candleW / 2;
    const bodyTop = yScale(Math.max(c.o, c.c));
    const bodyBot = yScale(Math.min(c.o, c.c));
    const bodyH = Math.max(1, bodyBot - bodyTop);

    const wick = document.createElementNS("http://www.w3.org/2000/svg", "line");
    wick.setAttribute("class", "candle-wick");
    wick.setAttribute("x1", wickX);
    wick.setAttribute("x2", wickX);
    wick.setAttribute("y1", yScale(c.h));
    wick.setAttribute("y2", yScale(c.l));
    wick.setAttribute("stroke", color);
    wick.setAttribute("stroke-width", 1);
    wick.setAttribute("data-pidx", i);
    predGroup.appendChild(wick);

    const body = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    body.setAttribute("class", "candle-body");
    body.setAttribute("x", x);
    body.setAttribute("y", bodyTop);
    body.setAttribute("width", candleW);
    body.setAttribute("height", bodyH);
    body.setAttribute("fill", color);
    body.setAttribute("data-pidx", i);
    predGroup.appendChild(body);
  });

  // Final delta values ──────────────────────────────────────
  const lastPredClose = prediction[prediction.length - 1].c;
  const deltaPct = ((lastPredClose - lastHistClose) / lastHistClose) * 100;
  const sign = deltaPct >= 0 ? "+" : "";
  const deltaStr = `${sign}${deltaPct.toFixed(2)}%`;
  const closeStr = `${lastPredClose.toLocaleString("es-ES", { maximumFractionDigits: 0 })}`;
  document.getElementById("delta-val").textContent = deltaStr;
  document.getElementById("close-final").textContent = closeStr;
  // Initialize result-delta to 0% so the count-up animation looks right
  document.getElementById("result-delta").textContent = "+0.00%";

  // ════════════════════════════════════════════════════════════
  //   TIMELINE
  // ════════════════════════════════════════════════════════════
  const tl = gsap.timeline({ paused: true });

  // Background fades in
  tl.to([".bg-grid", ".bg-vignette"], { opacity: 1, duration: 0.6, ease: "power2.out" }, 0);

  // Scene 1: intro
  tl.fromTo(
    ".intro",
    { opacity: 0, y: 14 },
    { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" },
    0.2,
  );
  tl.fromTo(
    "#kronos-title",
    { opacity: 0, y: 10 },
    { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" },
    0.4,
  );
  tl.fromTo(
    "#kronos-subtitle",
    { opacity: 0, y: 8 },
    { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" },
    0.9,
  );

  // Controls slide in
  tl.fromTo(
    ".controls",
    { opacity: 0, y: -10 },
    { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" },
    1.8,
  );
  tl.fromTo(
    ".controls > *",
    { opacity: 0, y: -6 },
    { opacity: 1, y: 0, duration: 0.5, stagger: 0.06, ease: "power2.out" },
    1.85,
  );

  // Chart wrap appears
  tl.fromTo(
    ".chart-wrap",
    { opacity: 0 },
    { opacity: 1, duration: 0.4, ease: "power2.out" },
    3.0,
  );
  tl.fromTo(
    ".grid-line",
    { opacity: 0 },
    { opacity: 1, duration: 0.4, stagger: 0.02, ease: "power1.out" },
    3.0,
  );

  // Historical candles draw in (staggered left to right)
  tl.to(
    `#hist-candles .candle-wick, #hist-candles .candle-body`,
    {
      opacity: 1,
      duration: 0.35,
      stagger: { amount: 1.4, from: "start" },
      ease: "power1.out",
    },
    3.2,
  );
  tl.fromTo(
    ".last-price-line",
    { opacity: 0 },
    { opacity: 1, duration: 0.5, ease: "power2.out" },
    4.7,
  );

  // Brand top-right
  tl.fromTo(".brand-tr", { opacity: 0, x: 12 }, { opacity: 1, x: 0, duration: 0.7, ease: "power2.out" }, 0.3);

  // Terminal appears
  tl.fromTo(
    ".terminal",
    { opacity: 0, x: 20 },
    { opacity: 1, x: 0, duration: 0.5, ease: "power2.out" },
    3.0,
  );
  // First three log lines appear while chart builds (Binance fetch)
  tl.fromTo("#term-line-0", { opacity: 0, x: -6 }, { opacity: 1, x: 0, duration: 0.3, ease: "power1.out" }, 3.3);
  tl.fromTo("#term-line-1", { opacity: 0, x: -6 }, { opacity: 1, x: 0, duration: 0.3, ease: "power1.out" }, 3.7);
  tl.fromTo("#term-line-2", { opacity: 0, x: -6 }, { opacity: 1, x: 0, duration: 0.3, ease: "power1.out" }, 4.3);

  // Predict button attract — subtle border/shadow pulse + shimmer sweep
  tl.to(".predict-btn", {
    boxShadow:
      "0 2px 0 rgba(107, 142, 160, 0.35), 0 16px 44px rgba(107, 142, 160, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.22)",
    duration: 0.55,
    yoyo: true,
    repeat: 1,
    ease: "power1.inOut",
  }, 4.8);
  tl.fromTo(
    "#predict-shimmer",
    { x: "-120%" },
    { x: "220%", duration: 1.0, ease: "power2.out" },
    5.0,
  );

  // Click flash at 5.8
  tl.to(".predict-btn", {
    scale: 0.96,
    duration: 0.1,
    ease: "power2.in",
  }, 5.8);
  tl.to(".predict-btn", {
    scale: 1,
    duration: 0.15,
    ease: "power2.out",
  }, 5.9);

  // Transform button to loading state at 6.0
  tl.call(() => {
    document.querySelector("#predict-label").textContent = "PREDICIENDO";
    document.querySelector(".predict-idle-icon").style.display = "none";
    document.getElementById("predict-progress").style.opacity = "1";
  }, null, 6.0);
  tl.to(
    "#predict-progress",
    { x: "250%", duration: 1.4, ease: "power2.inOut", repeat: 3 },
    6.0,
  );

  // Remaining log lines (separator + predict details)
  tl.fromTo("#term-line-3", { opacity: 0 }, { opacity: 1, duration: 0.2 }, 6.0);
  tl.fromTo("#term-line-4", { opacity: 0, x: -6 }, { opacity: 1, x: 0, duration: 0.3 }, 6.4);
  tl.fromTo("#term-line-5", { opacity: 0, x: -6 }, { opacity: 1, x: 0, duration: 0.3 }, 6.9);
  tl.fromTo("#term-line-6", { opacity: 0, x: -6 }, { opacity: 1, x: 0, duration: 0.3 }, 7.4);
  tl.fromTo("#term-line-7", { opacity: 0, x: -6 }, { opacity: 1, x: 0, duration: 0.3 }, 7.9);

  // Waiting line appears
  tl.fromTo("#term-wait", { opacity: 0 }, { opacity: 1, duration: 0.3 }, 8.4);
  tl.fromTo(
    ".wait-dot",
    { scale: 1, boxShadow: "0 0 0 3px rgba(107, 142, 160, 0.15)" },
    { scale: 1.25, boxShadow: "0 0 0 10px rgba(107, 142, 160, 0)", duration: 0.7, repeat: 4, yoyo: true, ease: "power1.inOut" },
    8.4,
  );
  // LED ticker
  const ticks = document.querySelectorAll(".wait-ticks span");
  ticks.forEach((t, i) => {
    tl.fromTo(
      t,
      { opacity: 0.3 },
      { opacity: 1, duration: 0.3, repeat: 10, yoyo: true, ease: "power1.inOut" },
      8.4 + i * 0.08,
    );
  });
  // Elapsed counter 0.0 → 4.7s
  const clockEl = document.getElementById("wait-clock");
  tl.to({ v: 0 }, {
    v: 4.7,
    duration: 2.5,
    ease: "none",
    onUpdate() {
      clockEl.textContent = `${this.targets()[0].v.toFixed(1)}s`;
    },
  }, 8.4);

  // At 11.0 stop progress + transform button back to idle
  tl.call(() => {
    document.getElementById("predict-progress").style.opacity = "0";
    document.querySelector("#predict-label").textContent = "PREDECIR";
    document.querySelector(".predict-idle-icon").style.display = "inline-block";
  }, null, 11.0);
  tl.fromTo("#term-done", { opacity: 0 }, { opacity: 1, duration: 0.4 }, 11.0);

  // ── Scene 4: prediction candles slide in ─────────────
  tl.to(
    `#pred-candles .candle-wick, #pred-candles .candle-body`,
    {
      opacity: 1,
      duration: 0.22,
      stagger: { amount: 2.2, from: "start" },
      ease: "power1.out",
    },
    11.2,
  );
  // Separator fades in when prediction starts
  tl.fromTo(".separator-line", { opacity: 0 }, { opacity: 0.6, duration: 0.5 }, 11.2);

  // Delta line in terminal
  tl.fromTo("#term-delta", { opacity: 0 }, { opacity: 1, duration: 0.4 }, 13.6);

  // ── Scene 5: result card ──────────────────────────────
  tl.fromTo(
    ".result-card",
    { opacity: 0, y: 12 },
    { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" },
    14.5,
  );
  // Animate the big delta number counting up for visual punch
  const resultEl = document.getElementById("result-delta");
  const counter = { v: 0 };
  tl.to(counter, {
    v: deltaPct,
    duration: 1.1,
    ease: "power2.out",
    onUpdate() {
      const s = counter.v >= 0 ? "+" : "";
      resultEl.textContent = `${s}${counter.v.toFixed(2)}%`;
    },
  }, 14.5);

  // Outro: fade whole composition to chamillion card
  tl.fromTo(".outro", { opacity: 0 }, { opacity: 1, duration: 0.6, ease: "power2.out" }, 17.0);
  tl.fromTo(
    ".outro-content",
    { opacity: 0, scale: 0.96 },
    { opacity: 1, scale: 1, duration: 0.5, ease: "power2.out" },
    17.1,
  );

  window.__timelines = window.__timelines || {};
  window.__timelines["main"] = tl;
}
build();
