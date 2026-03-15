/* ═══════════════════════════════════════════════════════════
   Compounder Diario — chamillion.site
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var LINE_COLOR_DARK  = '#6b9ebb';
  var LINE_COLOR_LIGHT = '#4a7a9a';

  var PAD = { top: 18, right: 60, bottom: 32, left: 56 };

  // ── Slider configs ──
  // Rate: 0.0, 0.1, 0.2, … 1.0  (11 stops)
  var RATE_STOPS = [];
  for (var r = 0; r <= 10; r++) RATE_STOPS.push(r / 10);

  // Days: discrete stops
  var DAY_STOPS = [30, 60, 90, 180, 360];
  var DAY_LABELS = ['30d', '60d', '90d', '180d', '360d'];

  // ── DOM refs ──
  var inputCapital  = document.getElementById('input-capital');
  var inputRate     = document.getElementById('input-rate');
  var inputDays     = document.getElementById('input-days');
  var rateDisplay   = document.getElementById('rate-display');
  var daysDisplay   = document.getElementById('days-display');
  var rateStopsEl   = document.getElementById('rate-stops');
  var daysStopsEl   = document.getElementById('days-stops');
  var rateSliderWrap = document.getElementById('rate-slider-wrap');
  var daysSliderWrap = document.getElementById('days-slider-wrap');
  var chartCanvas   = document.getElementById('chart');
  var overlayCanvas = document.getElementById('chart-overlay');
  var tooltipEl     = document.getElementById('chart-tooltip');
  var tipHeader     = document.getElementById('tip-header');
  var tipRows       = document.getElementById('tip-rows');
  var summaryEl     = document.getElementById('summary');
  var chartWrap     = document.getElementById('chart-wrap');

  // ── State ──
  var data = [];
  var hoverIdx = -1;

  // ── Current values (read from sliders) ──
  function currentRate() {
    return RATE_STOPS[parseInt(inputRate.value)] || 0;
  }

  function currentDays() {
    return DAY_STOPS[parseInt(inputDays.value)] || 365;
  }

  // ── Compute ──
  function compute() {
    var capital = Math.max(0, parseFloat(inputCapital.value) || 0);
    var rate    = currentRate();
    var days    = currentDays();
    var factor  = 1 + rate / 100;

    data = new Array(days + 1);
    data[0] = capital;
    for (var d = 1; d <= days; d++) {
      data[d] = data[d - 1] * factor;
    }
  }

  // ── Format helpers ──
  function formatMoney(val) {
    if (val >= 1e9) return (val / 1e9).toFixed(2) + 'B €';
    if (val >= 1e6) return (val / 1e6).toFixed(2) + 'M €';
    if (val >= 1e4) return (val / 1e3).toFixed(1) + 'k €';
    return val.toFixed(val < 100 ? 2 : 0).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' €';
  }

  function formatMultiplier(val) {
    if (val >= 1e6) return (val / 1e6).toFixed(1) + 'M';
    if (val >= 1e3) return (val / 1e3).toFixed(1) + 'k';
    return val.toFixed(val < 100 ? 1 : 0);
  }

  function getTheme() {
    return document.documentElement.getAttribute('data-theme') || 'dark';
  }

  function lineColor() {
    return getTheme() === 'dark' ? LINE_COLOR_DARK : LINE_COLOR_LIGHT;
  }

  function themeColors() {
    var dark = getTheme() === 'dark';
    return {
      grid:      dark ? '#242428' : '#e8dace',
      axis:      dark ? '#555'    : '#8a7060',
      text:      dark ? '#e8e6e1' : '#1e1410',
      crosshair: dark ? 'rgba(107,158,187,0.4)' : 'rgba(74,122,154,0.35)'
    };
  }

  // ── Nice scale ──
  function niceScale(maxRaw) {
    if (maxRaw <= 0) return { max: 1000, step: 200 };
    var order = Math.pow(10, Math.floor(Math.log10(maxRaw)));
    var step = order;
    if (maxRaw / step <= 2) step = order / 4;
    else if (maxRaw / step <= 5) step = order / 2;
    var ceil = Math.ceil(maxRaw / step) * step;
    return { max: ceil, step: step };
  }

  // ── Monotone cubic spline ──
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

  // ── Build stop tick marks ──
  function buildRateStops() {
    var html = '';
    var max = RATE_STOPS.length - 1;
    for (var i = 0; i <= max; i++) {
      var pct = (i / max) * 100;
      var val = RATE_STOPS[i];
      var label = val.toFixed(1).replace('.', ',') + '%';
      html += '<button class="stop" data-idx="' + i + '" style="left:' + pct + '%">';
      html += '<span class="stop-tick"></span>';
      html += '<span class="stop-label">' + label + '</span>';
      html += '</button>';
    }
    rateStopsEl.innerHTML = html;
  }

  function buildDayStops() {
    var html = '';
    var max = DAY_STOPS.length - 1;
    for (var i = 0; i <= max; i++) {
      var pct = (i / max) * 100;
      html += '<button class="stop" data-idx="' + i + '" style="left:' + pct + '%">';
      html += '<span class="stop-tick"></span>';
      html += '<span class="stop-label">' + DAY_LABELS[i] + '</span>';
      html += '</button>';
    }
    daysStopsEl.innerHTML = html;
  }

  function syncStopActive(container, sliderVal) {
    var stops = container.querySelectorAll('.stop');
    var idx = parseInt(sliderVal);
    for (var i = 0; i < stops.length; i++) {
      stops[i].classList.toggle('active', parseInt(stops[i].getAttribute('data-idx')) === idx);
    }
  }

  // ── Update displays ──
  function updateRateDisplay() {
    var val = currentRate();
    rateDisplay.textContent = val.toFixed(1).replace('.', ',') + '%';
    syncStopActive(rateStopsEl, inputRate.value);
  }

  function updateDaysDisplay() {
    var days = currentDays();
    daysDisplay.textContent = days + ' dias';
    syncStopActive(daysStopsEl, inputDays.value);
  }

  // ── Draw chart ──
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

    var totalDays = data.length - 1;
    if (totalDays <= 0) { ctx.clearRect(0, 0, W, H); return; }

    var maxVal = 0;
    for (var i = 0; i < data.length; i++) {
      if (data[i] > maxVal) maxVal = data[i];
    }

    var scale = niceScale(maxVal);
    maxVal = scale.max;

    function xPos(day) { return PAD.left + (day / totalDays) * pW; }
    function yPos(val) { return PAD.top + pH - (val / maxVal) * pH; }

    ctx.clearRect(0, 0, W, H);

    // Grid + Y-axis
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
      else if (v >= 1e9) label = (v / 1e9).toFixed(v % 1e9 === 0 ? 0 : 1) + 'B';
      else if (v >= 1e6) label = (v / 1e6).toFixed(v % 1e6 === 0 ? 0 : 1) + 'M';
      else if (v >= 1e3) label = (v / 1e3).toFixed(v % 1e3 === 0 ? 0 : 0) + 'k';
      else label = v.toFixed(0);
      ctx.fillText(label, PAD.left - 6, y + 1);
    }

    // X-axis
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    var xLabels = buildXLabels(totalDays);
    for (var li = 0; li < xLabels.length; li++) {
      ctx.fillStyle = c.axis;
      ctx.fillText(xLabels[li].label, xPos(xLabels[li].day), H - PAD.bottom + 8);
    }

    // Sample points
    var step = Math.max(1, Math.floor(data.length / 400));
    var pts = [];
    for (var j = 0; j < data.length; j += step) {
      pts.push({ x: xPos(j), y: yPos(data[j]) });
    }
    if (pts.length > 0 && pts[pts.length - 1].x !== xPos(totalDays)) {
      pts.push({ x: xPos(totalDays), y: yPos(data[totalDays]) });
    }
    if (pts.length < 2) return;

    var color = lineColor();

    // Gradient fill
    var spline = monotoneCubic(pts);
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (var i = 0; i < pts.length - 1; i++) {
      var dx = (pts[i + 1].x - pts[i].x) / 3;
      ctx.bezierCurveTo(
        pts[i].x + dx, pts[i].y + spline.m[i] * dx,
        pts[i + 1].x - dx, pts[i + 1].y - spline.m[i + 1] * dx,
        pts[i + 1].x, pts[i + 1].y
      );
    }
    ctx.lineTo(pts[pts.length - 1].x, yPos(0));
    ctx.lineTo(pts[0].x, yPos(0));
    ctx.closePath();

    var grad = ctx.createLinearGradient(0, PAD.top, 0, PAD.top + pH);
    var cr = parseInt(color.slice(1, 3), 16);
    var cg = parseInt(color.slice(3, 5), 16);
    var cb = parseInt(color.slice(5, 7), 16);
    grad.addColorStop(0, 'rgba(' + cr + ',' + cg + ',' + cb + ',0.18)');
    grad.addColorStop(1, 'rgba(' + cr + ',' + cg + ',' + cb + ',0)');
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    spline = monotoneCubic(pts);
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (var i = 0; i < pts.length - 1; i++) {
      var dx = (pts[i + 1].x - pts[i].x) / 3;
      ctx.bezierCurveTo(
        pts[i].x + dx, pts[i].y + spline.m[i] * dx,
        pts[i + 1].x - dx, pts[i + 1].y - spline.m[i + 1] * dx,
        pts[i + 1].x, pts[i + 1].y
      );
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Capital dashed line
    var capitalY = yPos(data[0]);
    ctx.strokeStyle = c.axis;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(PAD.left, capitalY);
    ctx.lineTo(W - PAD.right, capitalY);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function buildXLabels(totalDays) {
    var labels = [];
    if (totalDays <= 60) {
      var step = totalDays <= 30 ? 5 : 10;
      for (var d = 0; d <= totalDays; d += step) labels.push({ day: d, label: d + 'd' });
    } else if (totalDays <= 365) {
      var monthStep = totalDays <= 180 ? 1 : 2;
      for (var m = 0; m <= Math.ceil(totalDays / 30); m += monthStep) {
        labels.push({ day: Math.min(m * 30, totalDays), label: m + 'm' });
      }
    } else {
      var years = totalDays / 365;
      var yearStep = years > 6 ? 2 : 1;
      for (var y = 0; y <= Math.ceil(years); y += yearStep) {
        labels.push({ day: Math.min(Math.round(y * 365), totalDays), label: y + 'a' });
      }
    }
    return labels;
  }

  // ── Overlay ──
  function drawOverlay(dayIdx) {
    var ctx = overlayCanvas.getContext('2d');
    var W = overlayCanvas.clientWidth;
    var H = overlayCanvas.clientHeight;
    var dpr = window.devicePixelRatio || 1;

    overlayCanvas.width  = W * dpr;
    overlayCanvas.height = H * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    if (dayIdx < 0 || dayIdx >= data.length) {
      tooltipEl.hidden = true;
      return;
    }

    var c = themeColors();
    var pW = W - PAD.left - PAD.right;
    var pH = H - PAD.top - PAD.bottom;
    var totalDays = data.length - 1;
    if (totalDays <= 0) return;

    var maxVal = 0;
    for (var i = 0; i < data.length; i++) {
      if (data[i] > maxVal) maxVal = data[i];
    }
    maxVal = niceScale(maxVal).max;

    function xPos(day) { return PAD.left + (day / totalDays) * pW; }
    function yPos(val) { return PAD.top + pH - (val / maxVal) * pH; }

    var x = xPos(dayIdx);
    var val = data[dayIdx];
    var py = yPos(val);
    var color = lineColor();

    // Crosshair
    ctx.strokeStyle = c.crosshair;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(x, PAD.top);
    ctx.lineTo(x, H - PAD.bottom);
    ctx.stroke();
    ctx.setLineDash([]);

    // Dot
    ctx.beginPath();
    ctx.arc(x, py, 5, 0, Math.PI * 2);
    ctx.fillStyle = c.text;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, py, 3, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    // Tooltip
    var capital = data[0];
    var gain = val - capital;
    var pct = capital > 0 ? (gain / capital * 100) : 0;

    tipHeader.textContent = 'Dia ' + dayIdx;

    var rowsHtml = '<div class="tip-row">';
    rowsHtml += '<span class="tip-dot" style="background:' + color + '"></span>';
    rowsHtml += '<span class="tip-val" style="color:' + color + '">' + formatMoney(val) + '</span>';
    rowsHtml += '</div>';
    if (dayIdx > 0) {
      rowsHtml += '<div class="tip-row" style="font-size:0.62rem;color:var(--subtext)">';
      rowsHtml += (gain >= 0 ? '+' : '') + formatMoney(gain) + ' (' + (pct >= 0 ? '+' : '') + pct.toFixed(1) + '%)';
      rowsHtml += '</div>';
    }
    tipRows.innerHTML = rowsHtml;

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

  // ── Summary ──
  function renderSummary() {
    var isCapture = document.documentElement.classList.contains('capture');
    var capital = data[0];
    var finalVal = data[data.length - 1];
    var gain = finalVal - capital;
    var pct = capital > 0 ? (gain / capital * 100) : 0;
    var mult = capital > 0 ? (finalVal / capital) : 0;
    var days = data.length - 1;
    var rate = currentRate();

    var html = '';

    html += '<div class="summary-card">';
    if (isCapture) {
      html += '<div class="summary-params">' + formatMoney(capital) + ' · ' + rate.toFixed(1) + '% diario · ' + days + ' dias</div>';
    }
    html += '<div class="summary-label">Valor final</div>';
    html += '<div class="summary-value">' + formatMoney(finalVal) + '</div>';
    html += '</div>';

    html += '<div class="summary-card">';
    html += '<div class="summary-label">Beneficio</div>';
    html += '<div class="summary-value positive">+' + formatMoney(gain) + '</div>';
    html += '<div class="summary-sub">+' + pct.toFixed(1) + '%</div>';
    html += '</div>';

    html += '<div class="summary-card">';
    html += '<div class="summary-label">Multiplicador</div>';
    html += '<div class="summary-value">&times;' + formatMultiplier(mult) + '</div>';
    html += '</div>';

    summaryEl.innerHTML = html;
  }

  // ── Render all ──
  function renderAll() {
    compute();
    drawChart();
    if (hoverIdx >= 0) drawOverlay(hoverIdx);
    else drawOverlay(-1);
    renderSummary();
  }

  // ── Form listeners ──
  inputCapital.addEventListener('input', renderAll);

  inputRate.addEventListener('input', function () {
    updateRateDisplay();
    renderAll();
  });

  inputDays.addEventListener('input', function () {
    updateDaysDisplay();
    renderAll();
  });

  // Stop click → jump slider
  rateStopsEl.addEventListener('click', function (e) {
    var stop = e.target.closest('.stop');
    if (!stop) return;
    inputRate.value = stop.getAttribute('data-idx');
    updateRateDisplay();
    renderAll();
  });

  daysStopsEl.addEventListener('click', function (e) {
    var stop = e.target.closest('.stop');
    if (!stop) return;
    inputDays.value = stop.getAttribute('data-idx');
    updateDaysDisplay();
    renderAll();
  });

  // ── Chart interaction ──
  function chartMouseHandler(e) {
    var rect = chartWrap.getBoundingClientRect();
    var mx = e.clientX - rect.left;
    var W = chartCanvas.clientWidth;
    var pW = W - PAD.left - PAD.right;
    var totalDays = data.length - 1;

    var dayFrac = (mx - PAD.left) / pW;
    var dayIdx = Math.round(dayFrac * totalDays);
    dayIdx = Math.max(0, Math.min(dayIdx, totalDays));

    hoverIdx = dayIdx;
    drawOverlay(dayIdx);
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

  // ── Responsive resize ──
  new ResizeObserver(function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      drawChart();
      if (hoverIdx >= 0) drawOverlay(hoverIdx);
    }, 60);
  }).observe(chartWrap);

  // ── Init ──
  buildRateStops();
  buildDayStops();
  updateRateDisplay();
  updateDaysDisplay();
  renderAll();

  // ── Widget common ──
  initWidgetCommon('daily-compounder', { onThemeChange: renderAll, onCaptureChange: renderSummary, shareUrl: '/w/daily-compounder' });

})();
