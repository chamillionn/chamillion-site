// ── Chart ─────────────────────────────────────────────────────────────
var chartCanvas  = document.getElementById('chart');
var overlayCanvas = document.getElementById('chart-overlay');
var tooltip      = document.getElementById('chart-tooltip');
var tipDate      = document.getElementById('tip-date');
var tipValue     = document.getElementById('tip-value');

var PAD = { top: 18, right: 16, bottom: 32, left: 52 };

// ── Zoom state ──
var viewStart = 0;
var viewEnd   = DATA.length - 1;

function viewData() {
  return DATA.slice(viewStart, viewEnd + 1);
}

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

function niceScale(maxRaw) {
  var order = Math.pow(10, Math.floor(Math.log10(maxRaw)));
  var step = order;
  if (maxRaw / step <= 2) step = order / 4;
  else if (maxRaw / step <= 5) step = order / 2;
  var ceil = Math.ceil(maxRaw / step) * step;
  return { max: ceil, step: step };
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

  var vd = viewData();
  var dataMax = Math.max.apply(null, vd.map(function(d) { return d.value; }));
  var scale = niceScale(Math.max(dataMax * 1.1, 1));
  var maxVal = scale.max;
  var step   = scale.step;

  // Scales
  function xPos(i)   { return PAD.left + (i / (vd.length - 1)) * pW; }
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

  // ── X axis labels ──
  ctx.save();
  ctx.font = '10px "DM Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = c.axis;
  var labelCount = Math.min(vd.length, 8);
  var labelStep = Math.max(1, Math.floor(vd.length / labelCount));
  for (var i = 0; i < vd.length; i += labelStep) {
    var x = xPos(i);
    var y = H - PAD.bottom + 16;
    var d = vd[i];
    var lbl = vd.length <= 24 ? formatDate(d.date) : d.date.slice(0, 4);
    ctx.fillText(lbl, x, y);
  }
  ctx.restore();

  // ── Build screen-space points ──
  var pts = vd.map(function(d, i) {
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

// ── Overlay: crosshair + selection ────────────────────────────────────
function drawOverlay(idx, selX0, selX1) {
  var dpr = window.devicePixelRatio || 1;
  var ctx = overlayCanvas.getContext('2d');
  var W = overlayCanvas.clientWidth;
  var H = overlayCanvas.clientHeight;
  ctx.clearRect(0, 0, W * dpr, H * dpr);

  var c = themeColors();

  // Draw selection rectangle if dragging
  if (selX0 != null && selX1 != null) {
    var left = Math.min(selX0, selX1);
    var right = Math.max(selX0, selX1);
    ctx.save();
    ctx.fillStyle = getTheme() === 'dark' ? 'rgba(107,158,187,0.12)' : 'rgba(74,122,154,0.10)';
    ctx.fillRect(left, PAD.top, right - left, H - PAD.top - PAD.bottom);
    ctx.strokeStyle = c.crosshair;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(left, PAD.top); ctx.lineTo(left, H - PAD.bottom);
    ctx.moveTo(right, PAD.top); ctx.lineTo(right, H - PAD.bottom);
    ctx.stroke();
    ctx.restore();
  }

  if (idx == null || !chartCanvas._pts) return;

  var pts = chartCanvas._pts;
  var p   = pts[idx];
  if (!p) return;

  // Vertical crosshair
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
var chartWrap = chartCanvas.parentElement;
overlayCanvas.style.pointerEvents = 'auto';

var dragStartX = null;
var isDragging = false;

function nearestIdx(mx) {
  var pts = chartCanvas._pts;
  if (!pts) return 0;
  var best = 0, bestDist = Infinity;
  pts.forEach(function(p, i) {
    var d = Math.abs(p.x - mx);
    if (d < bestDist) { bestDist = d; best = i; }
  });
  return best;
}

chartWrap.addEventListener('mousedown', function(e) {
  if (e.button !== 0) return;
  var rect = chartCanvas.getBoundingClientRect();
  dragStartX = e.clientX - rect.left;
  isDragging = false;
});

chartWrap.addEventListener('mousemove', function(e) {
  if (!chartCanvas._pts) return;
  var rect = chartCanvas.getBoundingClientRect();
  var mx   = e.clientX - rect.left;

  if (dragStartX != null && Math.abs(mx - dragStartX) > 5) {
    isDragging = true;
  }

  if (isDragging) {
    drawOverlay(null, dragStartX, mx);
    tooltip.setAttribute('hidden', '');
    return;
  }

  var best = nearestIdx(mx);
  drawOverlay(best);

  // Position tooltip
  var vd = viewData();
  var d = vd[best];
  if (!d) return;
  tipDate.textContent  = formatDate(d.date);
  tipValue.textContent = '$' + d.value.toFixed(1) + 'B';
  tooltip.removeAttribute('hidden');

  var W   = chartCanvas.clientWidth;
  var p   = chartCanvas._pts[best];
  var tW  = tooltip.offsetWidth;
  var tH  = tooltip.offsetHeight;
  var tx  = p.x + 12;
  if (tx + tW > W - 10) tx = p.x - tW - 12;
  var ty  = p.y - tH / 2;
  ty = Math.max(PAD.top, Math.min(ty, chartCanvas.clientHeight - PAD.bottom - tH));
  tooltip.style.left = tx + 'px';
  tooltip.style.top  = ty + 'px';
});

chartWrap.addEventListener('mouseup', function(e) {
  if (isDragging && dragStartX != null) {
    var rect = chartCanvas.getBoundingClientRect();
    var mx = e.clientX - rect.left;
    var i0 = nearestIdx(Math.min(dragStartX, mx));
    var i1 = nearestIdx(Math.max(dragStartX, mx));
    if (i1 - i0 >= 2) {
      viewStart = viewStart + i0;
      viewEnd   = viewStart + (i1 - i0);
      if (viewEnd > DATA.length - 1) viewEnd = DATA.length - 1;
      updateSubtitle();
      drawChart();
    }
  }
  dragStartX = null;
  isDragging = false;
});

chartWrap.addEventListener('mouseleave', function() {
  drawOverlay(null);
  tooltip.setAttribute('hidden', '');
  dragStartX = null;
  isDragging = false;
});

// Double-click to reset zoom
chartWrap.addEventListener('dblclick', function() {
  viewStart = 0;
  viewEnd   = DATA.length - 1;
  updateSubtitle();
  drawChart();
});

function formatDate(str) {
  var months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  var parts = str.split('-');
  return months[parseInt(parts[1], 10) - 1] + ' ' + parts[0];
}

var zoomResetBtn = document.getElementById('zoom-reset');

function updateSubtitle() {
  var sub = document.querySelector('.subtitle');
  var from = formatDate(DATA[viewStart].date);
  var to   = formatDate(DATA[viewEnd].date);
  var isZoomed = viewStart !== 0 || viewEnd !== DATA.length - 1;
  sub.textContent = 'Stablecoins — Capitalización de mercado total · ' + from + ' — ' + to;
  if (isZoomed) {
    zoomResetBtn.removeAttribute('hidden');
  } else {
    zoomResetBtn.setAttribute('hidden', '');
  }
}

zoomResetBtn.addEventListener('click', function(e) {
  e.stopPropagation();
  viewStart = 0;
  viewEnd   = DATA.length - 1;
  updateSubtitle();
  drawChart();
});

// ── Responsive ────────────────────────────────────────────────────────
var resizeTimer;
new ResizeObserver(function() {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(drawChart, 60);
}).observe(chartCanvas.parentElement);

// ── Theme & capture ───────────────────────────────────────────────────
initWidgetCommon('stablecoins', { onThemeChange: drawChart });
