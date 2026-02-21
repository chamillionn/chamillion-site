// ── State ────────────────────────────────────────────────────────────
let bids = [];
let asks = [];
let side = 'buy';

// ── Seed data ────────────────────────────────────────────────────────
function seed() {
  const mid = 2; // EUR per Kg — a realistic-ish potato price
  for (let i = 1; i <= 4; i++) {
    bids.push({ price: +(mid - i * 0.05).toFixed(2), qty: +(Math.random() * 5 + 1).toFixed(1), isUser: false });
    asks.push({ price: +(mid + i * 0.05).toFixed(2), qty: +(Math.random() * 5 + 1).toFixed(1), isUser: false });
  }
  sortBook();
}

function sortBook() {
  bids.sort((a, b) => b.price - a.price);
  asks.sort((a, b) => a.price - b.price);
}

// ── Matching engine ──────────────────────────────────────────────────
function addOrder(orderSide, price, qty, isUser = false) {
  let remaining = qty;
  let totalFilled = 0;
  let totalCost = 0;

  if (orderSide === 'buy') {
    while (remaining > 0 && asks.length > 0 && asks[0].price <= price) {
      const ask = asks[0];
      const filled = Math.min(remaining, ask.qty);
      remaining = +(remaining - filled).toFixed(4);
      ask.qty = +(ask.qty - filled).toFixed(4);
      totalFilled += filled;
      totalCost += filled * ask.price;
      if (ask.qty <= 0) asks.shift();
    }
    if (remaining > 0) {
      bids.push({ price, qty: +remaining.toFixed(4), isUser });
    }
  } else {
    while (remaining > 0 && bids.length > 0 && bids[0].price >= price) {
      const bid = bids[0];
      const filled = Math.min(remaining, bid.qty);
      remaining = +(remaining - filled).toFixed(4);
      bid.qty = +(bid.qty - filled).toFixed(4);
      totalFilled += filled;
      totalCost += filled * bid.price;
      if (bid.qty <= 0) bids.shift();
    }
    if (remaining > 0) {
      asks.push({ price, qty: +remaining.toFixed(4), isUser });
    }
  }

  // Limpiar órdenes vacías (por si acaso)
  bids = bids.filter(o => o.qty > 0);
  asks = asks.filter(o => o.qty > 0);

  sortBook();
  render();

  // Show notification
  if (totalFilled > 0 && remaining > 0) {
    showToast(orderSide, totalFilled, totalCost, +remaining.toFixed(1));
  } else if (totalFilled > 0) {
    showToast(orderSide, totalFilled, totalCost, 0);
  } else {
    showRestingToast(orderSide, qty, price);
  }

  // Return info about what happened
  return { totalFilled, remaining: +remaining.toFixed(4), totalCost };
}

// ── Auto-fill system ─────────────────────────────────────────────────
function scheduleAutoFill(orderSide, price, qty) {
  const delay = 10000 + Math.random() * 5000; // 10-15 segundos aleatorio

  setTimeout(() => {
    dismissToast();

    setTimeout(() => {
      // Simular un participante de mercado que barre el libro hasta el precio del usuario.
      // Eliminamos todas las órdenes del lado contrario hasta ese nivel (inclusive),
      // lo que produce el efecto visual de "vaciarse hasta el nivel".
      if (orderSide === 'sell') {
        asks = asks.filter(a => a.price > price);
      } else {
        bids = bids.filter(b => b.price < price);
      }
      sortBook();
      render();
      showToast(orderSide, qty, qty * price, 0);
    }, 300);
  }, delay);
}

// ── Toast notifications ──────────────────────────────────────────────
function showToast(orderSide, filledQty, cost, restingQty) {
  const icon = orderSide === 'buy' ? '🎉🥔' : '🎉💰';
  const title = orderSide === 'buy'
    ? '¡Trato hecho!'
    : '¡Vendido!';

  let body;
  if (orderSide === 'buy') {
    body = `Has comprado <strong>${filledQty.toFixed(1)} kilos de patatas</strong>
      por <strong>${cost.toFixed(2)} EUR</strong>.`;
  } else {
    body = `Has vendido <strong>${filledQty.toFixed(1)} kilos de patatas</strong>
      y recibiste <strong>${cost.toFixed(2)} EUR</strong>.`;
  }

  let resting = '';
  if (restingQty > 0) {
    resting = orderSide === 'buy'
      ? `⏳ ${restingQty} kilos más siguen esperando un vendedor.`
      : `⏳ ${restingQty} kilos más siguen esperando un comprador.`;
  }

  document.getElementById('toast-icon').textContent = icon;
  document.getElementById('toast-title').textContent = title;
  document.getElementById('toast-body').innerHTML = body;
  document.getElementById('toast-resting').textContent = resting;
  document.getElementById('toast-overlay').classList.add('visible');
}

function showRestingToast(orderSide, qty, price) {
  const icon = '⏳';
  let title, body;

  if (orderSide === 'buy') {
    title = 'Buscando vendedor...';
    body = `Tu orden de <strong>${qty.toFixed(1)} kilos a ${price.toFixed(2)} EUR</strong> está en el libro.<br><br>
      Esperando a que aparezca alguien que venda patatas a ese precio.`;
  } else {
    title = 'Buscando comprador...';
    body = `Tu oferta de <strong>${qty.toFixed(1)} kilos a ${price.toFixed(2)} EUR</strong> está en el libro.<br><br>
      Esperando a que aparezca alguien que compre patatas a ese precio.`;
  }

  document.getElementById('toast-icon').textContent = icon;
  document.getElementById('toast-title').textContent = title;
  document.getElementById('toast-body').innerHTML = body;
  document.getElementById('toast-resting').textContent = '';
  document.getElementById('toast-overlay').classList.add('visible');
}

function dismissToast() {
  document.getElementById('toast-overlay').classList.remove('visible');
}

// ── Rendering ────────────────────────────────────────────────────────
function render() {
  renderSide('asks-body', asks, 'ask');
  renderSide('bids-body', bids, 'bid');
  updateSpread();
  updatePreview();
}

function updateSpread() {
  const valEl = document.getElementById('spread-value');
  const pctEl = document.getElementById('spread-pct');
  if (!asks.length || !bids.length) { valEl.textContent = '—'; pctEl.textContent = ''; return; }
  const bestAsk = asks[0].price;
  const bestBid = bids[0].price;
  const spread = +(bestAsk - bestBid).toFixed(2);
  const pct = ((spread / ((bestAsk + bestBid) / 2)) * 100).toFixed(2);
  valEl.textContent = spread.toFixed(2) + ' €/kg';
  pctEl.textContent = '(' + pct + '%)';
}

function renderSide(containerId, orders, type) {
  const el = document.getElementById(containerId);
  if (orders.length === 0) {
    el.innerHTML = '<div style="padding:6px 12px;font-size:12px;color:#555555;">Sin ordenes</div>';
    return;
  }

  let cumulative = 0;
  const rows = orders.map(o => {
    cumulative += o.qty;
    return { ...o, total: +cumulative.toFixed(4) };
  });
  const maxTotal = rows[rows.length - 1].total;

  const display = type === 'ask' ? [...rows].reverse() : rows;

  el.innerHTML = display.map(r => {
    const depthPct = ((r.total / maxTotal) * 100).toFixed(1);
    const userClass = r.isUser ? ' user-order' : '';
    const userIcon = r.isUser ? '<span class="user-order-spinner">·</span>' : '';
    const tip = type === 'ask'
      ? `Alguien quiere vender <strong class='th'>${Number(r.qty).toFixed(1)} kg</strong> a <strong class='th'>${r.price.toFixed(2)} €/kg</strong>. Si compras a este precio o más, ejecutas esta orden. Total acumulado: <strong class='th'>${Number(r.total).toFixed(1)} kg</strong>.`
      : `Alguien quiere comprar <strong class='th'>${Number(r.qty).toFixed(1)} kg</strong> a <strong class='th'>${r.price.toFixed(2)} €/kg</strong>. Si vendes a este precio o menos, ejecutas esta orden. Total acumulado: <strong class='th'>${Number(r.total).toFixed(1)} kg</strong>.`;
    return `<div class="book-row${userClass}" onclick="fillPrice(${r.price})" data-price="${r.price}" data-tooltip="${tip}">
      <div class="depth-bar" style="width:${depthPct}%"></div>
      <div>${userIcon}${r.price.toFixed(2)}</div>
      <div class="right">${Number(r.qty).toFixed(1)}</div>
      <div class="right col-total">${Number(r.total).toFixed(1)}</div>
    </div>`;
  }).join('');
}

// ── UI helpers ───────────────────────────────────────────────────────
function setSide(s) {
  side = s;
  document.getElementById('btn-buy').className = s === 'buy' ? 'active-buy' : '';
  document.getElementById('btn-sell').className = s === 'sell' ? 'active-sell' : '';

  const submitBtn = document.getElementById('submit-btn');
  submitBtn.className = 'submit-btn ' + s;
  submitBtn.textContent = s === 'buy' ? 'Comprar Patatas' : 'Vender Patatas';
  submitBtn.dataset.tooltip = s === 'buy'
    ? "Al pulsar, tu orden de <strong class='th'>compra</strong> entra al mercado. Si hay alguien vendiendo a tu precio o menos, se ejecuta al instante."
    : "Al pulsar, tu orden de <strong class='th'>venta</strong> entra al mercado. Si hay alguien comprando a tu precio o más, se ejecuta al instante.";
  updatePreview();
}

function updatePreview() {
  const preview = document.getElementById('order-preview');
  if (!preview) return;
  const price = parseFloat(document.getElementById('input-price').value);
  const qty   = parseFloat(document.getElementById('input-qty').value);

  if (isNaN(price) || price <= 0 || isNaN(qty) || qty <= 0) {
    preview.className = 'order-preview'; preview.textContent = '';
    highlightBook(NaN, false);
    return;
  }

  const book = side === 'buy' ? asks : bids;
  const crosses = side === 'buy' ? r => r.price <= price : r => r.price >= price;

  let fillable = 0;
  for (const r of book) {
    if (!crosses(r)) break;
    fillable += r.qty;
    if (fillable >= qty) break;
  }
  fillable = Math.min(+fillable.toFixed(1), qty);

  const wouldCross = book.length > 0 && crosses(book[0]);
  const bestPrice  = book.length > 0 ? book[0].price.toFixed(2) : null;

  if (!wouldCross) {
    const ref = bestPrice
      ? (side === 'buy' ? `mejor venta: ${bestPrice} €/kg` : `mejor compra: ${bestPrice} €/kg`)
      : (side === 'buy' ? 'sin vendedores en el libro' : 'sin compradores en el libro');
    preview.className = 'order-preview waiting';
    preview.textContent = `Esperará en el libro · ${ref}`;
  } else if (fillable >= qty - 0.001) {
    preview.className = 'order-preview instant';
    preview.textContent = `Ejecuta al instante · ${qty.toFixed(1)} kg`;
  } else {
    const rest = +(qty - fillable).toFixed(1);
    preview.className = 'order-preview partial';
    preview.textContent = `Parcial · ${fillable} kg ahora, ${rest} kg esperarán`;
  }

  highlightBook(price, wouldCross);
}

function highlightBook(price, wouldCross) {
  // Limpiar estado anterior
  document.querySelectorAll('.book-row.will-fill').forEach(e => e.classList.remove('will-fill'));
  document.querySelectorAll('.order-marker').forEach(e => e.remove());

  if (isNaN(price) || price <= 0) return;

  if (wouldCross) {
    // Resaltar las filas que se ejecutarían
    const container = side === 'buy' ? 'asks-body' : 'bids-body';
    document.querySelectorAll(`#${container} .book-row`).forEach(el => {
      const rp = parseFloat(el.dataset.price);
      if (side === 'buy' && rp <= price) el.classList.add('will-fill');
      if (side === 'sell' && rp >= price) el.classList.add('will-fill');
    });
  } else {
    // Orden pasiva: insertar un marcador de línea donde descansaría
    const container = side === 'buy' ? 'bids-body' : 'asks-body';
    const book = side === 'buy' ? bids : asks;
    if (!book.length) return;

    const rows = document.querySelectorAll(`#${container} .book-row`);
    let insertBefore = null;
    for (const el of rows) {
      const rp = parseFloat(el.dataset.price);
      if (side === 'buy' && rp < price) { insertBefore = el; break; }
      if (side === 'sell' && rp > price) { insertBefore = el; break; }
    }

    const marker = document.createElement('div');
    marker.className = 'order-marker ' + side;
    const parent = document.getElementById(container);
    if (insertBefore) parent.insertBefore(marker, insertBefore);
    else parent.appendChild(marker);
  }
}

function fillPrice(price) {
  document.getElementById('input-price').value = price.toFixed(2);
  document.getElementById('input-price').focus();
  updatePreview();
}

function placeOrder() {
  const price = parseFloat(document.getElementById('input-price').value);
  const qty = parseFloat(document.getElementById('input-qty').value);
  if (isNaN(price) || price <= 0 || isNaN(qty) || qty <= 0) return;

  const result = addOrder(side, +price.toFixed(2), +qty.toFixed(1), true);

  // Si la orden quedó parcial o totalmente en el libro, programar auto-relleno
  if (result.remaining > 0) {
    scheduleAutoFill(side, +price.toFixed(2), result.remaining);
  }

  document.getElementById('input-qty').value = '1';
}

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && (document.activeElement.id === 'input-price' || document.activeElement.id === 'input-qty')) {
    placeOrder();
  }
});

// ── Tooltip system ───────────────────────────────────────────────────
(function() {
  const box = document.getElementById('tooltip-box');
  let timer = null;

  function show(target) {
    box.innerHTML = target.getAttribute('data-tooltip');
    box.style.display = 'block';
    const r = target.getBoundingClientRect();
    const bW = box.offsetWidth, bH = box.offsetHeight;
    let top = r.top - bH - 8 >= 0 ? r.top - bH - 8 : r.bottom + 8;
    let left = Math.max(8, Math.min(r.left + r.width / 2 - bW / 2, window.innerWidth - bW - 8));
    box.style.top  = top  + 'px';
    box.style.left = left + 'px';
    box.classList.add('visible');
  }

  function hide() { clearTimeout(timer); box.classList.remove('visible'); }

  document.addEventListener('mouseover', function(e) {
    const t = e.target.closest('[data-tooltip]');
    if (!t) return;
    clearTimeout(timer);
    timer = setTimeout(function() { show(t); }, 120);
  });

  document.addEventListener('mouseout', function(e) {
    const from = e.target.closest('[data-tooltip]');
    if (!from) return;
    const to = e.relatedTarget && e.relatedTarget.closest('[data-tooltip]');
    if (to === from) return;
    clearTimeout(timer);
    hide();
  });

  document.addEventListener('scroll', hide, true);
  document.addEventListener('mousedown', hide);
})();

// ── Theme & capture ──────────────────────────────────────────────────
if (window.self !== window.top) document.documentElement.classList.add('embedded');

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
    try { localStorage.setItem('orderbook-theme', t); } catch(e) {}
  }
  function setCapture(on) {
    html.classList.toggle('capture', on);
    ctxCapture.classList.toggle('active', on);
    try { localStorage.setItem('orderbook-capture', on ? '1' : '0'); } catch(e) {}
  }

  var savedTheme;
  try { savedTheme = localStorage.getItem('orderbook-theme'); } catch(e) {}
  if (!savedTheme) savedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  setTheme(savedTheme);

  var savedCapture = false;
  try { savedCapture = localStorage.getItem('orderbook-capture') === '1'; } catch(e) {}
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

// ── Init ─────────────────────────────────────────────────────────────
document.getElementById('input-price').addEventListener('input', updatePreview);
document.getElementById('input-qty').addEventListener('input', updatePreview);

seed();
render();
