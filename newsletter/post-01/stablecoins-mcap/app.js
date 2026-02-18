// ── Stats ─────────────────────────────────────────────────────────────
(function() {
  var last  = DATA[DATA.length - 1].value;
  var max   = Math.max.apply(null, DATA.map(function(d) { return d.value; }));
  var first = DATA.find(function(d) { return d.value > 0; }).value;
  var growth = ((last - first) / first * 100).toFixed(0);

  document.getElementById('stat-current').textContent = '$' + last.toFixed(1) + 'B';
  document.getElementById('stat-max').textContent     = '$' + max.toFixed(1) + 'B';
  document.getElementById('stat-growth').textContent  = '+' + growth + '%';
})();

// ── Chart ─────────────────────────────────────────────────────────────
var chartCanvas  = document.getElementById('chart');
var overlayCanvas = document.getElementById('chart-overlay');
var tooltip      = document.getElementById('chart-tooltip');
var tipDate      = document.getElementById('tip-date');
var tipValue     = document.getElementById('tip-value');

var PAD = { top: 18, right: 16, bottom: 32, left: 52 };

function getTheme() {
  return document.documentElement.getAttribute('data-theme') || 'dark';
}

function themeColors() {
  var dark = getTheme() === 'dark';
  return {
    line:     dark ? '#6b9ebb' : '#4a7a9a',
    fillTop:  dark ? 'rgba(107,158,187,0.22)' : 'rgba(74,122,154,0.18)',
    fillBot:  dark ? 'rgba(107,158,187,0)' : 'rgba(74,122,154,0)',
    grid:     dark ? '#242428' : '#e8dace',
    axis:     dark ? '#555' : '#8a7060',
    text:     dark ? '#e8e6e1' : '#1e1410',
    dot:      dark ? '#6b9ebb' : '#4a7a9a',
    crosshair:dark ? 'rgba(107,158,187,0.5)' : 'rgba(74,122,154,0.4)',
    dotHover: dark ? '#e8e6e1' : '#1e1410',
  };
}

// Monotone cubic spline — returns control points for smooth bezier curves
function monotoneCubic(points) {
  var n = points.length;
  var d = [], m = [], alpha = [], beta = [], tau = [];

  for (var i = 0; i < n - 1; i++) {
    d[i] = (points[i + 1].y - points[i].y) / (points[i + 1].x - points[i].x);
  }

  m[0] = d[0];
  for (var i = 1; i < n - 1; i++) {
    m[i] = (d[i - 1] + d[i]) / 2;
  }
  m[n - 1] = d[n - 2];

  for (var i = 0; i < n - 1; i++) {
    if (Math.abs(d[i]) < 1e-10) { m[i] = 0; m[i + 1] = 0; continue; }
    alpha[i] = m[i] / d[i];
    beta[i]  = m[i + 1] / d[i];
    var s = alpha[i] * alpha[i] + beta[i] * beta[i];
    if (s > 9) {
      tau[i]    = 3 / Math.sqrt(s);
      m[i]      = tau[i] * alpha[i] * d[i];
      m[i + 1]  = tau[i] * beta[i]  * d[i];
    }
  }

  return { m: m, d: d };
}

function drawChart() {
  var dpr = window.devicePixelRatio || 1;
  var wrap = chartCanvas.parentElement;
  var W = wrap.clientWidth;
  var H = wrap.clientHeight;

  // Size both canvases
  [chartCanvas, overlayCanvas].forEach(function(c) {
    c.width  = W * dpr;
    c.height = H * dpr;
    c.style.width  = W + 'px';
    c.style.height = H + 'px';
    c.getContext('2d').scale(dpr, dpr);
  });

  var ctx = chartCanvas.getContext('2d');
  var c = themeColors();

  var pW = W - PAD.left - PAD.right;
  var pH = H - PAD.top  - PAD.bottom;

  var maxVal = 400; // round ceiling above max data (~350B)
  var step   = 100; // grid step

  // Scales
  function xPos(i)   { return PAD.left + (i / (DATA.length - 1)) * pW; }
  function yPos(val) { return PAD.top  + pH - (val / maxVal) * pH; }

  // Clear
  ctx.clearRect(0, 0, W, H);

  // ── Grid lines & Y labels ──
  ctx.save();
  ctx.font = '10px "DM Mono", monospace';
  ctx.textAlign = 'right';
  for (var v = 0; v <= maxVal; v += step) {
    var y = yPos(v);
    ctx.strokeStyle = c.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PAD.left, y);
    ctx.lineTo(W - PAD.right, y);
    ctx.stroke();

    ctx.fillStyle = c.axis;
    var label = v === 0 ? '$0' : '$' + v + 'B';
    ctx.fillText(label, PAD.left - 6, y + 3.5);
  }
  ctx.restore();

  // ── X axis labels (years) ──
  ctx.save();
  ctx.font = '10px "DM Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = c.axis;
  var years = {};
  DATA.forEach(function(d, i) {
    var yr = d.date.slice(0, 4);
    if (!years[yr]) {
      years[yr] = i;
      var x = xPos(i);
      var y = H - PAD.bottom + 16;
      ctx.fillText(yr, x, y);
    }
  });
  ctx.restore();

  // ── Build screen-space points ──
  var pts = DATA.map(function(d, i) {
    return { x: xPos(i), y: yPos(d.value) };
  });

  // ── Monotone spline ──
  var spline = monotoneCubic(pts);

  // ── Gradient fill ──
  var grad = ctx.createLinearGradient(0, PAD.top, 0, PAD.top + pH);
  grad.addColorStop(0, c.fillTop);
  grad.addColorStop(1, c.fillBot);

  ctx.save();
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

  // Close area
  ctx.lineTo(pts[pts.length - 1].x, yPos(0));
  ctx.lineTo(pts[0].x, yPos(0));
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.restore();

  // ── Line stroke ──
  ctx.save();
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
  ctx.strokeStyle = c.line;
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.restore();

  // ── Endpoint dot ──
  var last = pts[pts.length - 1];
  ctx.save();
  ctx.beginPath();
  ctx.arc(last.x, last.y, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = c.dot;
  ctx.fill();
  ctx.restore();

  // Store pts for hover use
  chartCanvas._pts = pts;
}

// ── Overlay: crosshair ────────────────────────────────────────────────
function drawOverlay(idx) {
  var dpr = window.devicePixelRatio || 1;
  var ctx = overlayCanvas.getContext('2d');
  var W = overlayCanvas.clientWidth;
  var H = overlayCanvas.clientHeight;
  ctx.clearRect(0, 0, W * dpr, H * dpr);

  if (idx == null || !chartCanvas._pts) return;

  var c   = themeColors();
  var pts = chartCanvas._pts;
  var p   = pts[idx];
  if (!p) return;

  var pH = H - PAD.top - PAD.bottom;
  var maxVal = 400;
  function yPos(val) { return PAD.top + pH - (val / maxVal) * pH; }

  // Vertical line
  ctx.save();
  ctx.strokeStyle = c.crosshair;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(p.x, PAD.top);
  ctx.lineTo(p.x, H - PAD.bottom);
  ctx.stroke();
  ctx.restore();

  // Dot on line
  ctx.save();
  ctx.beginPath();
  ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2);
  ctx.fillStyle = c.line;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
  ctx.fillStyle = c.dotHover;
  ctx.fill();
  ctx.restore();
}

// ── Mouse interaction ─────────────────────────────────────────────────
overlayCanvas.style.pointerEvents = 'auto';

chartCanvas.parentElement.addEventListener('mousemove', function(e) {
  if (!chartCanvas._pts) return;
  var rect = chartCanvas.getBoundingClientRect();
  var mx   = e.clientX - rect.left;
  var pts  = chartCanvas._pts;

  // Find nearest point by X
  var best = 0, bestDist = Infinity;
  pts.forEach(function(p, i) {
    var d = Math.abs(p.x - mx);
    if (d < bestDist) { bestDist = d; best = i; }
  });

  drawOverlay(best);

  // Position tooltip
  var d = DATA[best];
  var dateStr = formatDate(d.date);
  tipDate.textContent  = dateStr;
  tipValue.textContent = '$' + d.value.toFixed(1) + 'B';
  tooltip.removeAttribute('hidden');

  var W   = chartCanvas.clientWidth;
  var p   = pts[best];
  var tW  = tooltip.offsetWidth;
  var tH  = tooltip.offsetHeight;
  var tx  = p.x + 12;
  if (tx + tW > W - 10) tx = p.x - tW - 12;
  var ty  = p.y - tH / 2;
  ty = Math.max(PAD.top, Math.min(ty, chartCanvas.clientHeight - PAD.bottom - tH));
  tooltip.style.left = tx + 'px';
  tooltip.style.top  = ty + 'px';
});

chartCanvas.parentElement.addEventListener('mouseleave', function() {
  drawOverlay(null);
  tooltip.setAttribute('hidden', '');
});

function formatDate(str) {
  var months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  var parts = str.split('-');
  return months[parseInt(parts[1], 10) - 1] + ' ' + parts[0];
}

// ── Responsive ────────────────────────────────────────────────────────
var resizeTimer;
new ResizeObserver(function() {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(drawChart, 60);
}).observe(chartCanvas.parentElement);

// ── Theme & capture ───────────────────────────────────────────────────
(function() {
  var SUN  = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/><line x1="5.64" y1="5.64" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="18.36" y2="18.36"/><line x1="5.64" y1="18.36" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="18.36" y2="5.64"/></svg>';
  var MOON = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  var html       = document.documentElement;
  var themeBtn   = document.getElementById('theme-toggle');
  var ctxMenu    = document.getElementById('ctx-menu');
  var ctxCapture = document.getElementById('ctx-capture');

  function setTheme(t) {
    html.setAttribute('data-theme', t);
    themeBtn.innerHTML = t === 'dark' ? SUN : MOON;
    try { localStorage.setItem('stablecoins-theme', t); } catch(e) {}
    drawChart();
  }
  function setCapture(on) {
    html.classList.toggle('capture', on);
    ctxCapture.classList.toggle('active', on);
    try { localStorage.setItem('stablecoins-capture', on ? '1' : '0'); } catch(e) {}
  }

  var savedTheme;
  try { savedTheme = localStorage.getItem('stablecoins-theme'); } catch(e) {}
  if (!savedTheme) savedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  setTheme(savedTheme);

  var savedCapture = false;
  try { savedCapture = localStorage.getItem('stablecoins-capture') === '1'; } catch(e) {}
  setCapture(savedCapture);

  themeBtn.addEventListener('click', function() {
    setTheme(html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });

  themeBtn.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    var r = themeBtn.getBoundingClientRect();
    ctxMenu.style.top   = (r.bottom + 4) + 'px';
    ctxMenu.style.right = (window.innerWidth - r.right) + 'px';
    ctxMenu.removeAttribute('hidden');
  });

  ctxCapture.addEventListener('click', function() {
    setCapture(!html.classList.contains('capture'));
    ctxMenu.setAttribute('hidden', '');
  });

  document.addEventListener('click', function(e) {
    if (!ctxMenu.contains(e.target) && e.target !== themeBtn) {
      ctxMenu.setAttribute('hidden', '');
    }
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') ctxMenu.setAttribute('hidden', '');
  });
})();

// ── Init ──────────────────────────────────────────────────────────────
drawChart();
