// ── Widget common: theme, capture mode, context menu ──
// Usage: initWidgetCommon('prefix', { onThemeChange: fn })

if (window.self !== window.top) document.documentElement.classList.add('embedded');

// Lazy-load modern-screenshot
var _msLoaded = null;
function _loadMS() {
  if (_msLoaded) return _msLoaded;
  _msLoaded = new Promise(function(resolve, reject) {
    var s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/modern-screenshot/dist/index.js';
    s.onload = function() { resolve(window.modernScreenshot); };
    s.onerror = function() { _msLoaded = null; reject(new Error('Failed to load modern-screenshot')); };
    document.head.appendChild(s);
  });
  return _msLoaded;
}

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
  var ctxCaptureDl = document.getElementById('ctx-capture-dl');
  var ctxDownload  = document.getElementById('ctx-download');
  var ctxScales    = document.querySelectorAll('.ctx-scale');
  var captureScale = 2;

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
    if (on) {
      ctxBg.removeAttribute('hidden');
      if (ctxCaptureDl) ctxCaptureDl.removeAttribute('hidden');
    } else {
      ctxBg.setAttribute('hidden', '');
      if (ctxCaptureDl) ctxCaptureDl.setAttribute('hidden', '');
      clearCaptureBg();
    }
    try { localStorage.setItem(prefix + '-capture', on ? '1' : '0'); } catch(e) {}
    if (opts.onCaptureChange) opts.onCaptureChange(on);
  }

  function applyCaptureBg(val) {
    val = val.trim();
    if (!val) { clearCaptureBg(); return; }
    var test = document.createElement('div');
    test.style.color = val;
    if (!test.style.color) return;
    html.style.background = val;
    document.body.style.background = val;
    try { localStorage.setItem(prefix + '-capture-bg', val); } catch(e) {}
  }

  function clearCaptureBg() {
    html.style.background = '';
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
  function openCtxMenuFrom(anchor) {
    var r = anchor.getBoundingClientRect();
    ctxMenu.style.top   = '';
    ctxMenu.style.bottom = '';
    ctxMenu.style.right = (window.innerWidth - r.right) + 'px';
    // If anchor is at the bottom, open menu upward
    if (r.top > window.innerHeight / 2) {
      ctxMenu.style.bottom = (window.innerHeight - r.top + 4) + 'px';
      ctxMenu.style.top = '';
    } else {
      ctxMenu.style.top = (r.bottom + 4) + 'px';
      ctxMenu.style.bottom = '';
    }
    ctxMenu.removeAttribute('hidden');
  }

  themeBtn.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    openCtxMenuFrom(themeBtn);
  });

  // Floating capture FAB — created dynamically
  var captureFab = document.createElement('button');
  captureFab.className = 'capture-fab';
  captureFab.setAttribute('aria-label', 'Opciones de captura');
  captureFab.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>';
  document.body.appendChild(captureFab);

  captureFab.addEventListener('click', function(e) {
    e.stopPropagation();
    if (ctxMenu.hasAttribute('hidden')) {
      openCtxMenuFrom(captureFab);
    } else {
      ctxMenu.setAttribute('hidden', '');
    }
  });

  // Capture toggle
  ctxCapture.addEventListener('click', function() {
    setCapture(!html.classList.contains('capture'));
    if (!html.classList.contains('capture')) ctxMenu.setAttribute('hidden', '');
  });

  // Background color presets
  var bgPresets = ['#0d0d0d', '#ffffff', '#0c0e11', '#f5ede0'];
  var swatchRow = document.createElement('div');
  swatchRow.className = 'ctx-bg-swatches';
  bgPresets.forEach(function(color) {
    var sw = document.createElement('button');
    sw.className = 'ctx-bg-swatch';
    sw.style.background = color;
    sw.title = color;
    sw.addEventListener('click', function() {
      ctxBgInput.value = color;
      applyCaptureBg(color);
      swatchRow.querySelectorAll('.ctx-bg-swatch').forEach(function(s) { s.classList.remove('active'); });
      sw.classList.add('active');
    });
    swatchRow.appendChild(sw);
  });
  ctxBg.appendChild(swatchRow);

  // Background color input
  ctxBgInput.addEventListener('input', function() {
    applyCaptureBg(ctxBgInput.value);
    swatchRow.querySelectorAll('.ctx-bg-swatch').forEach(function(s) { s.classList.remove('active'); });
  });
  ctxBgInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') { e.preventDefault(); ctxMenu.setAttribute('hidden', ''); } });
  ctxBgClear.addEventListener('click', function() { clearCaptureBg(); });

  // Scale selector
  ctxScales.forEach(function(btn) {
    btn.addEventListener('click', function() {
      ctxScales.forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      captureScale = parseInt(btn.dataset.scale);
    });
  });

  // ── Screen Recording ──
  var ctxRecord = document.getElementById('ctx-record');
  var recorder = null;
  var recordChunks = [];

  if (ctxRecord) {
    ctxRecord.addEventListener('click', function() {
      if (recorder && recorder.state === 'recording') {
        recorder.stop();
        return;
      }

      var canvasEl = opts.recordCanvas;
      var startRecording = canvasEl
        ? startCanvasRecording(canvasEl)
        : startDisplayRecording(opts.recordTarget);

      startRecording.then(function(mr) {
        recorder = mr;
        recordChunks = [];
        recorder.ondataavailable = function(e) { if (e.data.size > 0) recordChunks.push(e.data); };
        recorder.onstop = function() {
          var blob = new Blob(recordChunks, { type: recordChunks[0].type });
          var ext = blob.type.includes('mp4') ? 'mp4' : 'webm';
          var a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = prefix + '-recording.' + ext;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(a.href);
          ctxRecord.textContent = 'Grabar video';
          ctxRecord.classList.remove('active');
        };
        recorder.start();
        ctxRecord.textContent = 'Parar grabación';
        ctxRecord.classList.add('active');
        ctxMenu.setAttribute('hidden', '');
      }).catch(function(err) {
        if (err.name !== 'NotAllowedError') console.error('Recording failed:', err);
      });
    });
  }

  function startCanvasRecording(canvas) {
    return new Promise(function(resolve) {
      var stream = canvas.captureStream(30);
      var mimeTypes = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'];
      var mime = mimeTypes.find(function(m) { return MediaRecorder.isTypeSupported(m); }) || '';
      resolve(new MediaRecorder(stream, { mimeType: mime }));
    });
  }

  function startDisplayRecording(targetEl) {
    var cropPromise = (targetEl && typeof CropTarget !== 'undefined')
      ? CropTarget.fromElement(targetEl)
      : Promise.resolve(null);

    return cropPromise.then(function(cropTarget) {
      return navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'browser' },
        preferCurrentTab: true
      }).then(function(stream) {
        var track = stream.getVideoTracks()[0];
        var cropDone = (cropTarget && track.cropTo)
          ? track.cropTo(cropTarget)
          : Promise.resolve();

        return cropDone.then(function() {
          var mimeTypes = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'];
          var mime = mimeTypes.find(function(m) { return MediaRecorder.isTypeSupported(m); }) || '';
          var mr = new MediaRecorder(stream, { mimeType: mime });
          track.addEventListener('ended', function() {
            if (mr.state === 'recording') mr.stop();
          });
          return mr;
        });
      });
    });
  }

  // Download capture
  if (ctxDownload) {
    ctxDownload.addEventListener('click', function() {
      ctxDownload.textContent = 'Capturando...';
      ctxDownload.disabled = true;
      ctxMenu.setAttribute('hidden', '');
      captureFab.style.display = 'none';

      _loadMS().then(function(ms) {
        return ms.domToPng(document.body, { scale: captureScale });
      }).then(function(url) {
        var a = document.createElement('a');
        a.href = url;
        a.download = prefix + '-' + captureScale + 'x.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }).catch(function(err) {
        console.error('Capture failed:', err);
      }).finally(function() {
        captureFab.style.display = '';
        ctxDownload.textContent = 'Descargar PNG';
        ctxDownload.disabled = false;
      });
    });
  }

  // Restore saved capture bg
  var savedBg;
  try { savedBg = localStorage.getItem(prefix + '-capture-bg'); } catch(e) {}
  if (savedBg && html.classList.contains('capture')) { ctxBgInput.value = savedBg; applyCaptureBg(savedBg); }

  // Share button (only if shareUrl provided and not embedded)
  if (opts.shareUrl && !html.classList.contains('embedded')) {
    var toggleBar = document.querySelector('.toggle-bar');
    if (toggleBar) {
      var shareBtn = document.createElement('button');
      shareBtn.id = 'btn-share';
      shareBtn.setAttribute('aria-label', 'Copiar enlace');
      shareBtn.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>';
      toggleBar.insertBefore(shareBtn, toggleBar.firstChild);

      var shareTimeout;
      shareBtn.addEventListener('click', function() {
        var url = window.location.origin + opts.shareUrl;
        navigator.clipboard.writeText(url).then(function() {
          shareBtn.classList.add('share-copied');
          clearTimeout(shareTimeout);
          shareTimeout = setTimeout(function() { shareBtn.classList.remove('share-copied'); }, 1500);
        });
      });
    }
  }

  // Close menu on outside click
  document.addEventListener('click', function(e) {
    if (!ctxMenu.contains(e.target) && e.target !== themeBtn && !captureFab.contains(e.target)) {
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

  // Auto-resize parent iframe when embedded
  if (html.classList.contains('embedded')) {
    function postResize() {
      window.parent.postMessage({ type: 'chamillion-resize', id: prefix, height: document.documentElement.scrollHeight }, '*');
    }
    postResize();
    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(postResize).observe(document.body);
    }
  }
}
