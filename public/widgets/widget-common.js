// ── Widget common: theme, capture mode, context menu ──
// Usage: initWidgetCommon('prefix', { onThemeChange: fn })

if (window.self !== window.top) document.documentElement.classList.add('embedded');

function initWidgetCommon(prefix, options) {
  var opts = options || {};
  var SUN  = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/><line x1="5.64" y1="5.64" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="18.36" y2="18.36"/><line x1="5.64" y1="18.36" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="18.36" y2="5.64"/></svg>';
  var MOON = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  var html       = document.documentElement;
  var themeBtn   = document.getElementById('theme-toggle');
  var ctxMenu    = document.getElementById('ctx-menu');
  var ctxCapture = document.getElementById('ctx-capture');
  var ctxBg      = document.getElementById('ctx-bg');
  var ctxBgInput = document.getElementById('ctx-bg-input');
  var ctxBgClear = document.getElementById('ctx-bg-clear');

  function setTheme(t) {
    html.setAttribute('data-theme', t);
    themeBtn.innerHTML = t === 'dark' ? SUN : MOON;
    try { localStorage.setItem(prefix + '-theme', t); } catch(e) {}
    try { localStorage.setItem('chamillion-theme', t); } catch(e) {}
    if (opts.onThemeChange) opts.onThemeChange(t);
  }

  function setCapture(on) {
    html.classList.toggle('capture', on);
    ctxCapture.classList.toggle('active', on);
    if (on) { ctxBg.removeAttribute('hidden'); } else { ctxBg.setAttribute('hidden', ''); clearCaptureBg(); }
    try { localStorage.setItem(prefix + '-capture', on ? '1' : '0'); } catch(e) {}
  }

  function applyCaptureBg(val) {
    val = val.trim();
    if (!val) { clearCaptureBg(); return; }
    var test = document.createElement('div');
    test.style.color = val;
    if (!test.style.color) return;
    document.body.style.background = val;
    try { localStorage.setItem(prefix + '-capture-bg', val); } catch(e) {}
  }

  function clearCaptureBg() {
    document.body.style.background = '';
    ctxBgInput.value = '';
    try { localStorage.removeItem(prefix + '-capture-bg'); } catch(e) {}
  }

  // Listen for parent theme changes
  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'chamillion-theme') {
      setTheme(e.data.theme);
    }
  });

  // Restore saved theme
  var savedTheme;
  try { savedTheme = localStorage.getItem('chamillion-theme') || localStorage.getItem(prefix + '-theme'); } catch(e) {}
  if (!savedTheme) savedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  setTheme(savedTheme);

  // Restore saved capture state
  var savedCapture = false;
  try { savedCapture = localStorage.getItem(prefix + '-capture') === '1'; } catch(e) {}
  setCapture(savedCapture);

  // Theme toggle click
  themeBtn.addEventListener('click', function() {
    setTheme(html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });

  // Context menu on right-click
  themeBtn.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    var r = themeBtn.getBoundingClientRect();
    ctxMenu.style.top   = (r.bottom + 4) + 'px';
    ctxMenu.style.right = (window.innerWidth - r.right) + 'px';
    ctxMenu.removeAttribute('hidden');
  });

  // Capture toggle
  ctxCapture.addEventListener('click', function() {
    setCapture(!html.classList.contains('capture'));
    if (!html.classList.contains('capture')) ctxMenu.setAttribute('hidden', '');
  });

  // Background color input
  ctxBgInput.addEventListener('input', function() { applyCaptureBg(ctxBgInput.value); });
  ctxBgInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') { e.preventDefault(); ctxMenu.setAttribute('hidden', ''); } });
  ctxBgClear.addEventListener('click', function() { clearCaptureBg(); });

  // Restore saved capture bg
  var savedBg;
  try { savedBg = localStorage.getItem(prefix + '-capture-bg'); } catch(e) {}
  if (savedBg && html.classList.contains('capture')) { ctxBgInput.value = savedBg; applyCaptureBg(savedBg); }

  // Close menu on outside click
  document.addEventListener('click', function(e) {
    if (!ctxMenu.contains(e.target) && e.target !== themeBtn) {
      ctxMenu.setAttribute('hidden', '');
    }
  });

  // Escape key exits capture mode
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      ctxMenu.setAttribute('hidden', '');
      if (html.classList.contains('capture')) setCapture(false);
    }
  });
}
