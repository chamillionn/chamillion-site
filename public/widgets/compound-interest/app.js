/* ═══════════════════════════════════════════════════════════
   Calculadora de Interés Compuesto — chamillion.site
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ── Constants ──
  var COLORS = ['#6b9ebb', '#e8a87c', '#82c4a0', '#c4a0d0', '#d4b896'];
  var COLORS_LIGHT = ['#4a7a9a', '#c47a52', '#4a8a6a', '#8a60a0', '#a08a60'];
  var MAX_PORTFOLIOS = 5;
  var ANNUAL_VOL = 0.15;
  var MONTHLY_VOL = ANNUAL_VOL / Math.sqrt(12);

  var PAD = { top: 18, right: 60, bottom: 32, left: 56 };

  // ── DOM refs ──
  var tabsEl       = document.getElementById('portfolio-tabs');
  var inputCapital = document.getElementById('input-capital');
  var inputMonthly = document.getElementById('input-monthly');
  var inputRateRange  = document.getElementById('input-rate-range');
  var inputRate       = document.getElementById('input-rate');
  var sliderTrackWrap = document.getElementById('slider-track-wrap');
  var markerBtns      = document.querySelectorAll('#slider-markers .marker');
  var inputYears      = document.getElementById('input-years');
  var pillsContainer  = document.getElementById('pills-years');
  var inputNoise   = document.getElementById('input-noise');
  var noiseModes   = document.getElementById('noise-modes');
  var noiseVisual  = document.getElementById('noise-visual');
  var noiseReal    = document.getElementById('noise-real');
  var btnReroll    = document.getElementById('btn-reroll');
  var chartCanvas  = document.getElementById('chart');
  var overlayCanvas = document.getElementById('chart-overlay');
  var tooltipEl    = document.getElementById('chart-tooltip');
  var tipHeader    = document.getElementById('tip-header');
  var tipRows      = document.getElementById('tip-rows');
  var summaryEl    = document.getElementById('summary');
  var chartWrap    = document.getElementById('chart-wrap');

  // ── State ──
  var portfolios = [];
  var activeIdx  = 0;
  var nextId     = 1;
  var hoverIdx   = -1; // hovered month index (chart)

  // ── PRNG (Mulberry32) ──
  function mulberry32(seed) {
    return function () {
      seed |= 0;
      seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function randomSeed() {
    return Math.floor(Math.random() * 2147483647) + 1;
  }

  // ── Box-Muller (seeded) ──
  function boxMuller(rng) {
    var u1 = rng();
    var u2 = rng();
    if (u1 < 1e-10) u1 = 1e-10;
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }

  // ── Compound interest calculation ──
  function computeClean(p) {
    var months = p.years * 12;
    var monthlyRate = p.rate / 100 / 12;
    var data = new Array(months + 1);
    var capital = p.capital;
    data[0] = capital;
    for (var m = 1; m <= months; m++) {
      capital = capital * (1 + monthlyRate) + p.monthly;
      data[m] = capital;
    }
    return data;
  }

  function compute(p) {
    if (!p.noise) return computeClean(p);

    var months = p.years * 12;
    var monthlyRate = p.rate / 100 / 12;
    var data = new Array(months + 1);
    var capital = p.capital;
    data[0] = capital;

    if (p.noiseMode === 'real') {
      // Realistic: true random returns, final value deviates from theoretical
      var rng = mulberry32(p.seed);
      for (var m = 1; m <= months; m++) {
        var noisyRate = monthlyRate + boxMuller(rng) * MONTHLY_VOL;
        capital = capital * (1 + noisyRate) + p.monthly;
        if (capital < 0) capital = 0;
        data[m] = capital;
      }
    } else {
      // Visual: Brownian bridge — fluctuates but converges to theoretical final value
      var clean = computeClean(p);
      var rng = mulberry32(p.seed);

      // Generate cumulative noise (random walk)
      var walk = new Array(months + 1);
      walk[0] = 0;
      for (var m = 1; m <= months; m++) {
        walk[m] = walk[m - 1] + boxMuller(rng) * MONTHLY_VOL;
      }

      // Brownian bridge: subtract linear interpolation so walk[0]=0 and walk[n]=0
      var drift = walk[months] / months;
      for (var m = 1; m <= months; m++) {
        walk[m] = walk[m] - drift * m;
      }

      // Apply as multiplicative deviation from clean trajectory
      for (var m = 0; m <= months; m++) {
        data[m] = Math.max(0, clean[m] * (1 + walk[m]));
      }
    }

    return data;
  }

  var DEFAULT_NAMES = ['Cartera 1', 'Cartera 2', 'Cartera 3', 'Cartera 4', 'Cartera 5'];

  // ── Portfolio management ──
  function createPortfolio() {
    var idx = portfolios.length;
    var p = {
      id: nextId++,
      name: DEFAULT_NAMES[idx] || ('Cartera ' + (idx + 1)),
      capital: 1000,
      monthly: 200,
      rate: 7,
      years: 20,
      noise: false,
      noiseMode: 'visual',
      seed: randomSeed(),
      color: COLORS[idx % COLORS.length],
      colorLight: COLORS_LIGHT[idx % COLORS_LIGHT.length],
      data: []
    };
    p.data = compute(p);
    portfolios.push(p);
    return idx;
  }

  function removePortfolio(idx) {
    if (portfolios.length <= 1) return;
    portfolios.splice(idx, 1);
    // Re-assign colors
    for (var i = 0; i < portfolios.length; i++) {
      portfolios[i].color = COLORS[i % COLORS.length];
      portfolios[i].colorLight = COLORS_LIGHT[i % COLORS_LIGHT.length];
    }
    if (activeIdx >= portfolios.length) activeIdx = portfolios.length - 1;
    syncFormFromPortfolio();
    renderAll();
  }

  function syncFormFromPortfolio() {
    var p = portfolios[activeIdx];
    inputCapital.value = p.capital;
    inputMonthly.value = p.monthly;
    inputRateRange.value = p.rate;
    inputRate.value    = p.rate;
    inputYears.value   = p.years;
    inputNoise.checked = p.noise;
    btnReroll.hidden   = !p.noise;
    noiseModes.hidden  = !p.noise;
    noiseVisual.checked = p.noiseMode === 'visual';
    noiseReal.checked   = p.noiseMode === 'real';
    syncPillActive();
  }

  function syncPillActive() {
    var pills = pillsContainer.querySelectorAll('.pill');
    var val = parseInt(inputYears.value);
    for (var i = 0; i < pills.length; i++) {
      var pv = parseInt(pills[i].getAttribute('data-years'));
      pills[i].classList.toggle('active', pv === val);
    }
  }

  // Position markers aligned with the slider track
  function positionMarkers() {
    var trackW = inputRateRange.offsetWidth;
    var thumbHalf = 8; // half of 16px thumb
    var effective = trackW - thumbHalf * 2;
    var max = parseFloat(inputRateRange.max);
    for (var i = 0; i < markerBtns.length; i++) {
      var v = parseFloat(markerBtns[i].getAttribute('data-value'));
      var px = thumbHalf + (v / max) * effective;
      markerBtns[i].style.left = px + 'px';
    }
  }

  function syncPortfolioFromForm() {
    var p = portfolios[activeIdx];
    p.capital   = Math.max(0, parseFloat(inputCapital.value) || 0);
    p.monthly   = Math.max(0, parseFloat(inputMonthly.value) || 0);
    p.rate      = parseFloat(inputRate.value) || 0;
    p.years     = Math.max(1, Math.min(60, parseInt(inputYears.value) || 1));
    p.noise     = inputNoise.checked;
    p.noiseMode = noiseReal.checked ? 'real' : 'visual';
    btnReroll.hidden  = !p.noise;
    noiseModes.hidden = !p.noise;
    p.data = compute(p);
  }

  // ── Render tabs ──
  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function renderTabs() {
    var html = '';
    for (var i = 0; i < portfolios.length; i++) {
      var p = portfolios[i];
      var isActive = i === activeIdx;
      var color = getTheme() === 'dark' ? p.color : p.colorLight;
      html += '<button class="tab' + (isActive ? ' active' : '') + '" data-idx="' + i + '">';
      html += '<span class="tab-dot" style="background:' + color + '"></span>';
      html += '<span class="tab-name" data-name-idx="' + i + '">' + escapeHtml(p.name) + '</span>';
      if (isActive) {
        html += '<span class="tab-edit" data-edit="' + i + '" title="Renombrar"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3l4 4L7 21H3v-4z"/></svg></span>';
      }
      if (portfolios.length > 1) {
        html += '<span class="tab-remove" data-remove="' + i + '">&times;</span>';
      }
      html += '</button>';
    }
    if (portfolios.length < MAX_PORTFOLIOS) {
      html += '<button class="tab-add" id="btn-add-portfolio">+ Añadir</button>';
    }
    tabsEl.innerHTML = html;

    // Listeners
    var tabs = tabsEl.querySelectorAll('.tab');
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].addEventListener('click', function (e) {
        var removeBtn = e.target.closest('.tab-remove');
        if (removeBtn) {
          e.stopPropagation();
          removePortfolio(parseInt(removeBtn.getAttribute('data-remove')));
          return;
        }
        var editBtn = e.target.closest('.tab-edit');
        if (editBtn) {
          e.stopPropagation();
          var idx = parseInt(editBtn.getAttribute('data-edit'));
          var nameSpan = tabsEl.querySelector('.tab-name[data-name-idx="' + idx + '"]');
          if (nameSpan) startRename(nameSpan, idx);
          return;
        }
        var newIdx = parseInt(this.getAttribute('data-idx'));
        if (newIdx === activeIdx) return;
        activeIdx = newIdx;
        syncFormFromPortfolio();
        renderAll();
      });
    }

    var addBtn = document.getElementById('btn-add-portfolio');
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        activeIdx = createPortfolio();
        syncFormFromPortfolio();
        renderAll();
      });
    }
  }

  function startRename(spanEl, idx) {
    var input = document.createElement('input');
    input.type = 'text';
    input.className = 'tab-rename-input';
    input.value = portfolios[idx].name;
    input.maxLength = 20;
    spanEl.replaceWith(input);
    input.focus();
    input.select();

    function commit() {
      var val = input.value.trim();
      if (val) portfolios[idx].name = val;
      renderAll();
    }

    input.addEventListener('blur', commit);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
      if (e.key === 'Escape') { input.value = portfolios[idx].name; input.blur(); }
    });
  }

  // ── Render summary ──
  function renderSummary() {
    var isCapture = document.documentElement.classList.contains('capture');
    var html = '';
    for (var i = 0; i < portfolios.length; i++) {
      var p = portfolios[i];
      var finalVal = p.data[p.data.length - 1];
      var totalInvested = p.capital + p.monthly * (p.data.length - 1);
      var gain = finalVal - totalInvested;
      var pct = totalInvested > 0 ? (gain / totalInvested * 100) : 0;
      var color = getTheme() === 'dark' ? p.color : p.colorLight;

      html += '<div class="summary-card">';
      html += '<div class="summary-card-header"><span class="summary-dot" style="background:' + color + '"></span>' + escapeHtml(p.name) + '</div>';

      if (isCapture) {
        // Capture mode: descriptive labeled rows for the strategy
        html += '<div class="summary-strategy">';
        html += '<div class="summary-row"><span class="summary-label">Capital inicial</span><span class="summary-value">' + formatMoney(p.capital) + '</span></div>';
        html += '<div class="summary-row"><span class="summary-label">Aportación</span><span class="summary-value">' + formatMoney(p.monthly) + '/mes</span></div>';
        html += '<div class="summary-row"><span class="summary-label">Rentabilidad</span><span class="summary-value">' + p.rate + '% anual</span></div>';
        html += '<div class="summary-row"><span class="summary-label">Horizonte</span><span class="summary-value">' + p.years + ' años</span></div>';
        if (p.noise) {
          html += '<div class="summary-row"><span class="summary-label">Volatilidad</span><span class="summary-value">' + (p.noiseMode === 'real' ? 'Real' : 'Visual') + '</span></div>';
        }
        html += '</div>';
      } else {
        // Normal mode: compact one-liner
        html += '<div class="summary-params">';
        html += formatMoney(p.capital) + ' inicial · ' + formatMoney(p.monthly) + '/mes · ' + p.rate + '% · ' + p.years + 'a';
        if (p.noise) html += p.noiseMode === 'real' ? ' · vol real' : ' · vol visual';
        html += '</div>';
      }

      html += '<div class="summary-big">' + formatMoney(finalVal) + '</div>';
      html += '<div class="summary-row"><span class="summary-label">Invertido</span><span class="summary-value">' + formatMoney(totalInvested) + '</span></div>';
      html += '<div class="summary-row"><span class="summary-label">Ganancia</span><span class="summary-value positive">+' + formatMoney(gain) + ' (' + pct.toFixed(0) + '%)</span></div>';
      html += '</div>';
    }
    summaryEl.innerHTML = html;
  }

  // ── Format helpers ──
  function formatMoney(val) {
    if (val >= 1e6) return (val / 1e6).toFixed(2) + 'M €';
    if (val >= 1e4) return (val / 1e3).toFixed(1) + 'k €';
    return val.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' €';
  }

  function getTheme() {
    return document.documentElement.getAttribute('data-theme') || 'dark';
  }

  // ── Chart: theme colors ──
  function themeColors() {
    var dark = getTheme() === 'dark';
    return {
      grid:      dark ? '#242428' : '#e8dace',
      axis:      dark ? '#555'    : '#8a7060',
      text:      dark ? '#e8e6e1' : '#1e1410',
      crosshair: dark ? 'rgba(107,158,187,0.4)' : 'rgba(74,122,154,0.35)',
      invested:  dark ? 'rgba(136,136,140,0.25)' : 'rgba(138,112,96,0.2)'
    };
  }

  function lineColor(i) {
    return getTheme() === 'dark'
      ? COLORS[i % COLORS.length]
      : COLORS_LIGHT[i % COLORS_LIGHT.length];
  }

  // ── Chart: nice scale ──
  function niceScale(maxRaw) {
    if (maxRaw <= 0) return { max: 1000, step: 200 };
    var order = Math.pow(10, Math.floor(Math.log10(maxRaw)));
    var step = order;
    if (maxRaw / step <= 2) step = order / 4;
    else if (maxRaw / step <= 5) step = order / 2;
    var ceil = Math.ceil(maxRaw / step) * step;
    return { max: ceil, step: step };
  }

  // ── Chart: monotone cubic spline ──
  function monotoneCubic(points) {
    var n = points.length;
    if (n < 2) return { m: [0] };
    var d = [], m = [];

    for (var i = 0; i < n - 1; i++) {
      d[i] = (points[i + 1].y - points[i].y) / ((points[i + 1].x - points[i].x) || 1);
    }

    m[0] = d[0];
    for (var i = 1; i < n - 1; i++) {
      m[i] = (d[i - 1] + d[i]) / 2;
    }
    m[n - 1] = d[n - 2];

    for (var i = 0; i < n - 1; i++) {
      if (Math.abs(d[i]) < 1e-10) { m[i] = 0; m[i + 1] = 0; continue; }
      var a = m[i] / d[i];
      var b = m[i + 1] / d[i];
      var s = a * a + b * b;
      if (s > 9) {
        var tau = 3 / Math.sqrt(s);
        m[i]     = tau * a * d[i];
        m[i + 1] = tau * b * d[i];
      }
    }

    return { m: m };
  }

  // ── Chart: draw ──
  var resizeTimer;

  function drawChart() {
    var ctx = chartCanvas.getContext('2d');
    var W = chartCanvas.clientWidth;
    var H = chartCanvas.clientHeight;
    var dpr = window.devicePixelRatio || 1;

    chartCanvas.width  = W * dpr;
    chartCanvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    var c = themeColors();
    var pW = W - PAD.left - PAD.right;
    var pH = H - PAD.top - PAD.bottom;

    // Find global max months and max value
    var maxMonths = 0;
    var maxVal = 0;
    for (var pi = 0; pi < portfolios.length; pi++) {
      var data = portfolios[pi].data;
      if (data.length - 1 > maxMonths) maxMonths = data.length - 1;
      for (var j = 0; j < data.length; j++) {
        if (data[j] > maxVal) maxVal = data[j];
      }
    }

    if (maxMonths === 0) { ctx.clearRect(0, 0, W, H); return; }

    var scale = niceScale(maxVal);
    maxVal = scale.max;

    function xPos(month) { return PAD.left + (month / maxMonths) * pW; }
    function yPos(val)   { return PAD.top + pH - (val / maxVal) * pH; }

    // Clear
    ctx.clearRect(0, 0, W, H);

    // Grid + Y-axis labels
    ctx.font = '10px DM Mono, monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    for (var v = 0; v <= maxVal; v += scale.step) {
      var y = yPos(v);
      ctx.strokeStyle = c.grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(PAD.left, y);
      ctx.lineTo(W - PAD.right, y);
      ctx.stroke();

      ctx.fillStyle = c.axis;
      var label;
      if (v === 0) label = '0 €';
      else if (v >= 1e6) label = (v / 1e6).toFixed(v % 1e6 === 0 ? 0 : 1) + 'M';
      else if (v >= 1e3) label = (v / 1e3).toFixed(v % 1e3 === 0 ? 0 : 0) + 'k';
      else label = v.toFixed(0);
      ctx.fillText(label, PAD.left - 6, y + 1);
    }

    // X-axis labels (years)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    var maxYears = maxMonths / 12;
    var yearStep = 1;
    if (maxYears > 40) yearStep = 10;
    else if (maxYears > 20) yearStep = 5;
    else if (maxYears > 10) yearStep = 2;

    for (var yr = 0; yr <= maxYears; yr += yearStep) {
      var x = xPos(yr * 12);
      ctx.fillStyle = c.axis;
      ctx.fillText(yr + 'a', x, H - PAD.bottom + 8);
    }

    // Draw invested area for first portfolio (filled)
    if (portfolios.length > 0) {
      var p0 = portfolios[0];
      ctx.beginPath();
      ctx.moveTo(xPos(0), yPos(p0.capital));
      for (var m = 0; m <= p0.data.length - 1; m++) {
        var invested = p0.capital + p0.monthly * m;
        ctx.lineTo(xPos(m), yPos(invested));
      }
      ctx.lineTo(xPos(p0.data.length - 1), yPos(0));
      ctx.lineTo(xPos(0), yPos(0));
      ctx.closePath();
      ctx.fillStyle = c.invested;
      ctx.fill();
    }

    // Draw lines (one per portfolio)
    var pendingLabels = [];
    for (var pi = 0; pi < portfolios.length; pi++) {
      var data = portfolios[pi].data;
      var color = lineColor(pi);

      // Build points (sample for performance — max ~360 points)
      var step = Math.max(1, Math.floor(data.length / 360));
      var pts = [];
      for (var j = 0; j < data.length; j += step) {
        pts.push({ x: xPos(j), y: yPos(data[j]) });
      }
      // Ensure last point
      if (pts.length > 0 && pts[pts.length - 1].x !== xPos(data.length - 1)) {
        pts.push({ x: xPos(data.length - 1), y: yPos(data[data.length - 1]) });
      }

      if (pts.length < 2) continue;

      // Gradient fill for first portfolio only
      if (pi === 0) {
        var spline = monotoneCubic(pts);
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (var i = 0; i < pts.length - 1; i++) {
          var dx = (pts[i + 1].x - pts[i].x) / 3;
          var cp1x = pts[i].x + dx;
          var cp1y = pts[i].y + spline.m[i] * dx;
          var cp2x = pts[i + 1].x - dx;
          var cp2y = pts[i + 1].y - spline.m[i + 1] * dx;
          ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, pts[i + 1].x, pts[i + 1].y);
        }
        ctx.lineTo(pts[pts.length - 1].x, yPos(0));
        ctx.lineTo(pts[0].x, yPos(0));
        ctx.closePath();

        var grad = ctx.createLinearGradient(0, PAD.top, 0, PAD.top + pH);
        var r = parseInt(color.slice(1, 3), 16);
        var g = parseInt(color.slice(3, 5), 16);
        var b = parseInt(color.slice(5, 7), 16);
        grad.addColorStop(0, 'rgba(' + r + ',' + g + ',' + b + ',0.18)');
        grad.addColorStop(1, 'rgba(' + r + ',' + g + ',' + b + ',0)');
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // Draw line (spline)
      var spline = monotoneCubic(pts);
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (var i = 0; i < pts.length - 1; i++) {
        var dx = (pts[i + 1].x - pts[i].x) / 3;
        var cp1x = pts[i].x + dx;
        var cp1y = pts[i].y + spline.m[i] * dx;
        var cp2x = pts[i + 1].x - dx;
        var cp2y = pts[i + 1].y - spline.m[i + 1] * dx;
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, pts[i + 1].x, pts[i + 1].y);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Collect label info for later (draw after all lines)
      if (portfolios.length > 1 && pts.length > 1) {
        var labelIdx = Math.min(Math.round(pts.length * 0.18), pts.length - 1);
        if (labelIdx < 1) labelIdx = 1;
        pendingLabels.push({ name: portfolios[pi].name, color: color, x: pts[labelIdx].x, y: pts[labelIdx].y });
      }
    }

    // Draw labels with anti-overlap
    if (pendingLabels.length > 1) {
      pendingLabels.sort(function(a, b) { return a.y - b.y; });
      var minGap = 13;
      for (var li = 1; li < pendingLabels.length; li++) {
        var diff = pendingLabels[li].y - pendingLabels[li - 1].y;
        if (diff < minGap) {
          pendingLabels[li].y = pendingLabels[li - 1].y + minGap;
        }
      }
    }
    for (var li = 0; li < pendingLabels.length; li++) {
      var lb = pendingLabels[li];
      ctx.font = '10px DM Mono, monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = lb.color;
      ctx.fillText(lb.name, lb.x + 6, lb.y);
    }
  }

  // ── Overlay: crosshair + tooltip ──
  function drawOverlay(monthIdx) {
    var ctx = overlayCanvas.getContext('2d');
    var W = overlayCanvas.clientWidth;
    var H = overlayCanvas.clientHeight;
    var dpr = window.devicePixelRatio || 1;

    overlayCanvas.width  = W * dpr;
    overlayCanvas.height = H * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    if (monthIdx < 0) {
      tooltipEl.hidden = true;
      return;
    }

    var c = themeColors();
    var pW = W - PAD.left - PAD.right;
    var pH = H - PAD.top - PAD.bottom;

    var maxMonths = 0;
    for (var pi = 0; pi < portfolios.length; pi++) {
      if (portfolios[pi].data.length - 1 > maxMonths) maxMonths = portfolios[pi].data.length - 1;
    }
    if (maxMonths === 0) return;

    var maxVal = niceScale(globalMaxVal()).max;

    function xPos(month) { return PAD.left + (month / maxMonths) * pW; }
    function yPos(val)   { return PAD.top + pH - (val / maxVal) * pH; }

    var x = xPos(monthIdx);

    // Vertical crosshair
    ctx.strokeStyle = c.crosshair;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(x, PAD.top);
    ctx.lineTo(x, H - PAD.bottom);
    ctx.stroke();
    ctx.setLineDash([]);

    // Dots on each line
    for (var pi = 0; pi < portfolios.length; pi++) {
      var data = portfolios[pi].data;
      if (monthIdx >= data.length) continue;
      var val = data[monthIdx];
      var py = yPos(val);
      var color = lineColor(pi);

      // Outer ring
      ctx.beginPath();
      ctx.arc(x, py, 5, 0, Math.PI * 2);
      ctx.fillStyle = c.text;
      ctx.fill();

      // Inner dot
      ctx.beginPath();
      ctx.arc(x, py, 3, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }

    // Tooltip content
    var yr = Math.floor(monthIdx / 12);
    var mo = monthIdx % 12;
    tipHeader.textContent = 'Año ' + yr + (mo > 0 ? ' · Mes ' + mo : '');

    var rowsHtml = '';
    for (var pi = 0; pi < portfolios.length; pi++) {
      var data = portfolios[pi].data;
      if (monthIdx >= data.length) continue;
      var val = data[monthIdx];
      var color = lineColor(pi);
      rowsHtml += '<div class="tip-row">';
      rowsHtml += '<span class="tip-dot" style="background:' + color + '"></span>';
      if (portfolios.length > 1) {
        rowsHtml += '<span class="tip-label">' + escapeHtml(portfolios[pi].name) + '</span>';
      }
      rowsHtml += '<span class="tip-val" style="color:' + color + '">' + formatMoney(val) + '</span>';
      rowsHtml += '</div>';
    }
    tipRows.innerHTML = rowsHtml;

    // Position tooltip
    tooltipEl.hidden = false;
    var tW = tooltipEl.offsetWidth;
    var tH = tooltipEl.offsetHeight;
    var tx = x + 14;
    if (tx + tW > W - 8) tx = x - tW - 14;
    var ty = PAD.top + pH / 2 - tH / 2;
    ty = Math.max(PAD.top, Math.min(ty, H - PAD.bottom - tH));

    tooltipEl.style.left = tx + 'px';
    tooltipEl.style.top  = ty + 'px';
  }

  function globalMaxVal() {
    var maxVal = 0;
    for (var pi = 0; pi < portfolios.length; pi++) {
      var data = portfolios[pi].data;
      for (var j = 0; j < data.length; j++) {
        if (data[j] > maxVal) maxVal = data[j];
      }
    }
    return maxVal;
  }

  // ── Chart interaction ──
  function chartMouseHandler(e) {
    var rect = chartWrap.getBoundingClientRect();
    var mx = e.clientX - rect.left;
    var W = chartCanvas.clientWidth;
    var pW = W - PAD.left - PAD.right;

    var maxMonths = 0;
    for (var pi = 0; pi < portfolios.length; pi++) {
      if (portfolios[pi].data.length - 1 > maxMonths) maxMonths = portfolios[pi].data.length - 1;
    }

    var monthFrac = (mx - PAD.left) / pW;
    var monthIdx = Math.round(monthFrac * maxMonths);
    monthIdx = Math.max(0, Math.min(monthIdx, maxMonths));

    hoverIdx = monthIdx;
    drawOverlay(monthIdx);
  }

  chartWrap.addEventListener('mousemove', chartMouseHandler);
  chartWrap.addEventListener('touchmove', function (e) {
    e.preventDefault();
    var touch = e.touches[0];
    chartMouseHandler({ clientX: touch.clientX, clientY: touch.clientY });
  }, { passive: false });

  chartWrap.addEventListener('mouseleave', function () {
    hoverIdx = -1;
    drawOverlay(-1);
  });

  chartWrap.addEventListener('touchend', function () {
    // Keep last tooltip visible on mobile
  });

  // ── Render all ──
  function renderAll() {
    renderTabs();
    drawChart();
    if (hoverIdx >= 0) drawOverlay(hoverIdx);
    else drawOverlay(-1);
    renderSummary();
  }

  // ── Form change listeners ──
  function onFormChange() {
    syncPortfolioFromForm();
    renderAll();
  }

  inputCapital.addEventListener('input', onFormChange);
  inputMonthly.addEventListener('input', onFormChange);

  // Rate: range slider → sync number input
  inputRateRange.addEventListener('input', function () {
    inputRate.value = inputRateRange.value;
    onFormChange();
  });
  // Rate: number input → sync range slider
  inputRate.addEventListener('input', function () {
    var v = parseFloat(inputRate.value);
    if (!isNaN(v)) inputRateRange.value = Math.min(50, Math.max(0, v));
    onFormChange();
  });
  // Rate: marker buttons → set value
  for (var mi = 0; mi < markerBtns.length; mi++) {
    markerBtns[mi].addEventListener('click', function () {
      var v = parseFloat(this.getAttribute('data-value'));
      inputRateRange.value = v;
      inputRate.value = v;
      onFormChange();
    });
  }

  // Slider markers: show on hover/focus/drag, hide on leave
  var sliderHideTimer;
  function showMarkers() {
    clearTimeout(sliderHideTimer);
    sliderTrackWrap.classList.add('active');
  }
  function hideMarkers() {
    sliderHideTimer = setTimeout(function () {
      sliderTrackWrap.classList.remove('active');
    }, 600);
  }
  sliderTrackWrap.addEventListener('mouseenter', showMarkers);
  sliderTrackWrap.addEventListener('mouseleave', hideMarkers);
  inputRateRange.addEventListener('focus', showMarkers);
  inputRateRange.addEventListener('blur', hideMarkers);
  inputRateRange.addEventListener('touchstart', showMarkers, { passive: true });
  inputRateRange.addEventListener('touchend', hideMarkers);

  // Years: number input
  inputYears.addEventListener('input', function () {
    syncPillActive();
    onFormChange();
  });
  // Years: pill buttons
  var pillBtns = pillsContainer.querySelectorAll('.pill');
  for (var pi = 0; pi < pillBtns.length; pi++) {
    pillBtns[pi].addEventListener('click', function () {
      inputYears.value = this.getAttribute('data-years');
      syncPillActive();
      onFormChange();
    });
  }

  inputNoise.addEventListener('change', onFormChange);
  noiseVisual.addEventListener('change', onFormChange);
  noiseReal.addEventListener('change', onFormChange);

  btnReroll.addEventListener('click', function () {
    portfolios[activeIdx].seed = randomSeed();
    portfolios[activeIdx].data = compute(portfolios[activeIdx]);
    renderAll();
  });

  // ── Responsive resize ──
  new ResizeObserver(function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      drawChart();
      if (hoverIdx >= 0) drawOverlay(hoverIdx);
      positionMarkers();
    }, 60);
  }).observe(chartWrap);

  // Also observe the slider wrapper for marker repositioning
  new ResizeObserver(function () { positionMarkers(); }).observe(sliderTrackWrap);

  // ── Init ──
  createPortfolio();
  syncFormFromPortfolio();
  renderAll();
  positionMarkers();

  // ── Widget common ──
  initWidgetCommon('compound', { onThemeChange: renderAll, onCaptureChange: renderSummary, shareUrl: '/w/compound' });

})();
