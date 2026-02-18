  (function() {
    var SUN  = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/><line x1="5.64" y1="5.64" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="18.36" y2="18.36"/><line x1="5.64" y1="18.36" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="18.36" y2="5.64"/></svg>';
    var MOON = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    var html = document.documentElement;
    var themeBtn   = document.getElementById('theme-toggle');
    var captureBtn = document.getElementById('capture-toggle');

    function setTheme(t) {
      html.setAttribute('data-theme', t);
      themeBtn.innerHTML = t === 'dark' ? SUN : MOON;
      try { localStorage.setItem('esma-theme', t); } catch(e) {}
    }
    function setCapture(on) {
      html.classList.toggle('capture', on);
      captureBtn.classList.toggle('active', on);
      try { localStorage.setItem('esma-capture', on ? '1' : '0'); } catch(e) {}
    }

    var savedTheme = 'dark';
    try { savedTheme = localStorage.getItem('esma-theme') || 'dark'; } catch(e) {}
    setTheme(savedTheme);

    var savedCapture = false;
    try { savedCapture = localStorage.getItem('esma-capture') === '1'; } catch(e) {}
    setCapture(savedCapture);

    themeBtn.addEventListener('click', function() {
      setTheme(html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    });
    captureBtn.addEventListener('click', function() {
      setCapture(!html.classList.contains('capture'));
    });
  })();
