// ── Blockchain chain animation ──
(function () {
  var canvas = document.getElementById('chain');
  var ctx    = canvas.getContext('2d');
  var dpr    = window.devicePixelRatio || 1;

  // ── Palette ──
  var palettes = {
    dark: {
      bg:          'transparent',
      blockFill:   '#16181d',
      blockStroke: 'rgba(232,230,225,0.18)',
      blockSeal:   'rgba(232,230,225,0.65)',
      ghost:       'rgba(107,158,187,0.08)',
      ghostStroke: 'rgba(107,158,187,0.30)',
      label:       'rgba(232,230,225,0.70)',
      labelDim:    'rgba(232,230,225,0.28)',
      hashColor:   'rgba(107,158,187,0.55)',
      txColor:     'rgba(232,230,225,0.40)',
      pending:     'rgba(107,158,187,0.35)',
      pendingLbl:  'rgba(107,158,187,0.60)',
      fillBar:     'rgba(107,158,187,0.22)',
      fillBarFg:   'rgba(107,158,187,0.55)',
      link:        'rgba(107,158,187,0.20)',
      linkSolid:   'rgba(107,158,187,0.45)',
      pulse:       '#6b9ebb',
      particle:    'rgba(107,158,187,0.70)',
      glow:        'rgba(107,158,187,0.10)',
    },
    light: {
      bg:          'transparent',
      blockFill:   '#e8dfd4',
      blockStroke: 'rgba(30,20,16,0.18)',
      blockSeal:   'rgba(30,20,16,0.65)',
      ghost:       'rgba(74,122,154,0.08)',
      ghostStroke: 'rgba(74,122,154,0.28)',
      label:       'rgba(30,20,16,0.75)',
      labelDim:    'rgba(30,20,16,0.30)',
      hashColor:   'rgba(74,122,154,0.55)',
      txColor:     'rgba(30,20,16,0.40)',
      pending:     'rgba(74,122,154,0.30)',
      pendingLbl:  'rgba(74,122,154,0.60)',
      fillBar:     'rgba(74,122,154,0.15)',
      fillBarFg:   'rgba(74,122,154,0.45)',
      link:        'rgba(74,122,154,0.18)',
      linkSolid:   'rgba(74,122,154,0.40)',
      pulse:       '#4a7a9a',
      particle:    'rgba(74,122,154,0.65)',
      glow:        'rgba(74,122,154,0.08)',
    },
  };

  function pal() { return palettes[document.documentElement.getAttribute('data-theme') || 'dark']; }

  // ── Sizing ──
  var W, H, BW, BH, GAP, CY;

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    BH  = Math.max(Math.min(H * 0.38, 200), 62);
    BW  = BH * 1.7;
    GAP = BW * 0.30;
    CY  = H / 2;
  }

  resize();
  window.addEventListener('resize', resize);

  // ── Dummy data generators ──
  var blockCounter = 21847300 + Math.floor(Math.random() * 500);

  function randHex(len) {
    var s = '0x';
    var chars = '0123456789abcdef';
    for (var i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
  }

  function makeBlockData() {
    blockCounter++;
    var hash = randHex(4) + '…' + randHex(4);
    var txCount = 80 + Math.floor(Math.random() * 320);
    var gas = (12 + Math.random() * 28).toFixed(1);
    return { num: blockCounter, hash: hash, txCount: txCount, gas: gas };
  }

  // ── Block state ──
  var CYCLE = 4.5;
  var MAX   = 8;
  var blocks = [];
  var offsetX = 0;
  var phase = 'filling', phaseTime = 0;
  var particles = [];
  var flashes = []; // { x, y, progress, speed }
  var spawnAccum = 0;

  // Fixed position for pending block (center-right area)
  var PENDING_X_RATIO = 0.62; // 62% from left edge
  var ENTER_DIST = 60; // pixels to offset new pending block on entry

  for (var i = 0; i < 4; i++) {
    blocks.push({ sealed: true, sealAnim: 1, linkAnim: 1, data: makeBlockData(), enterAnim: 1 });
  }
  blocks.push({ sealed: false, sealAnim: 0, linkAnim: 0, data: makeBlockData(), enterAnim: 1 });

  // ── Block X position ──
  function blockX(idx) {
    var stride = BW + GAP;
    var pendingX = W * PENDING_X_RATIO;
    var b = blocks[idx];
    // Pending block (last) has entry animation
    if (idx === blocks.length - 1) {
      var enterOffset = (1 - b.enterAnim) * ENTER_DIST;
      return pendingX - enterOffset;
    }
    // Sealed blocks are positioned to the left, extending from center-left
    var sealedCount = blocks.length - 1; // excluding pending
    var sealedTotalW = sealedCount * BW + (sealedCount - 1) * GAP;
    var sealedStartX = pendingX - stride - sealedTotalW + BW;
    return sealedStartX + idx * stride;
  }

  // ── Particles ──
  function spawnParticles(tx, ty) {
    var sc = BH / 80;
    var n = 1 + Math.floor(Math.random() * 2);
    for (var i = 0; i < n; i++) {
      var angle = Math.random() * Math.PI * 2;
      var dist  = (55 + Math.random() * 70) * sc;
      particles.push({
        x: tx + Math.cos(angle) * dist,
        y: ty + Math.sin(angle) * dist,
        tx: tx + (Math.random() - 0.5) * BW * 0.55,
        ty: ty + (Math.random() - 0.5) * BH * 0.45,
        progress: 0,
        speed: 0.35 + Math.random() * 0.55,
        size:  (1.0 + Math.random() * 1.4) * sc,
      });
    }
  }

  // ── Draw helpers ──
  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  }

  function drawBlock(x, y, block, fillP) {
    var p  = pal();
    var hw = BW / 2, hh = BH / 2;
    var s  = BH / 80; // scale factor (1 at legacy 80px)
    var r  = 7 * s;
    var pad = 9 * s;
    var lx = x - hw, ty = y - hh;

    ctx.save();

    if (block.sealed) {
      // Subtle glow behind sealed block
      ctx.globalAlpha = 0.5 * block.sealAnim;
      ctx.shadowColor  = p.pulse;
      ctx.shadowBlur   = 16 * s;
      roundRect(lx + 2, ty + 2, BW - 4, BH - 4, r);
      ctx.fillStyle = p.glow;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Body
      ctx.globalAlpha = 1;
      roundRect(lx, ty, BW, BH, r);
      ctx.fillStyle = p.blockFill;
      ctx.fill();
      ctx.strokeStyle = block.sealAnim < 1 ? p.blockStroke : p.blockSeal;
      ctx.lineWidth   = 1;
      ctx.globalAlpha = 0.15 + block.sealAnim * 0.85;
      ctx.stroke();

      // ── Content ──
      ctx.globalAlpha = block.sealAnim;

      // Block number top-left
      ctx.font        = '500 ' + (9 * s) + 'px DM Mono, monospace';
      ctx.fillStyle   = p.hashColor;
      ctx.textAlign   = 'left';
      ctx.fillText('#' + block.data.num, lx + pad, ty + 15 * s);

      // Hash — full width, centered
      ctx.font        = '300 ' + (8 * s) + 'px DM Mono, monospace';
      ctx.fillStyle   = p.labelDim;
      ctx.textAlign   = 'center';
      ctx.fillText(block.data.hash, x, ty + 30 * s);

      // Divider
      ctx.globalAlpha = block.sealAnim * 0.12;
      ctx.fillStyle   = p.label;
      ctx.fillRect(lx + pad, ty + 35 * s, BW - pad * 2, 1);

      ctx.globalAlpha = block.sealAnim;

      // Tx count left
      ctx.textAlign   = 'left';
      ctx.font        = '400 ' + (8.5 * s) + 'px DM Mono, monospace';
      ctx.fillStyle   = p.label;
      ctx.fillText(block.data.txCount + ' tx', lx + pad, ty + BH - 12 * s);

      // Gas right
      ctx.textAlign   = 'right';
      ctx.fillStyle   = p.labelDim;
      ctx.fillText(block.data.gas + ' gwei', lx + BW - pad, ty + BH - 12 * s);

    } else {
      // Ghost (pending) block
      ctx.globalAlpha = 0.4 + fillP * 0.25;
      roundRect(lx, ty, BW, BH, r);
      ctx.fillStyle = p.ghost;
      ctx.fill();
      ctx.strokeStyle = p.ghostStroke;
      ctx.lineWidth   = 1;
      ctx.setLineDash([3 * s, 4 * s]);
      ctx.stroke();
      ctx.setLineDash([]);

      // "PENDING" label
      ctx.globalAlpha = 0.55;
      ctx.font        = '400 ' + (7.5 * s) + 'px DM Mono, monospace';
      ctx.fillStyle   = p.pendingLbl;
      ctx.textAlign   = 'center';
      ctx.fillText('PENDIENTE', x, ty + 18 * s);

      // Fill progress bar
      var barX = lx + pad, barY = ty + BH - 18 * s;
      var barW = BW - pad * 2, barH = 3 * s;
      ctx.globalAlpha = 0.5;
      ctx.fillStyle   = p.fillBar;
      ctx.beginPath(); ctx.roundRect(barX, barY, barW, barH, 2 * s); ctx.fill();
      ctx.globalAlpha = 0.85;
      ctx.fillStyle   = p.fillBarFg;
      ctx.beginPath(); ctx.roundRect(barX, barY, barW * fillP, barH, 2 * s); ctx.fill();

      // Tx count hint (animates up as filled)
      if (fillP > 0.1) {
        var txPreview = Math.floor(block.data.txCount * fillP);
        ctx.globalAlpha = fillP * 0.6;
        ctx.font        = '300 ' + (8 * s) + 'px DM Mono, monospace';
        ctx.fillStyle   = p.pending;
        ctx.fillText(txPreview + ' tx…', x, ty + BH - 24 * s);
      }
    }

    ctx.restore();
  }

  function drawLink(x1, x2, sealed, sealP, linkP) {
    var p  = pal();
    var sc = BH / 80;
    var sx = x1 + BW / 2 + 2 * sc;
    var ex = x2 - BW / 2 - 2 * sc;
    var len = ex - sx;
    ctx.save();
    if (sealed) {
      // Dashed underlay (full length, dim)
      ctx.globalAlpha = 0.12;
      ctx.strokeStyle = p.linkSolid;
      ctx.lineWidth   = 1 * sc;
      ctx.setLineDash([2 * sc, 5 * sc]);
      ctx.beginPath(); ctx.moveTo(sx, CY); ctx.lineTo(ex, CY); ctx.stroke();
      ctx.setLineDash([]);

      // Solid link drawn progressively via linkAnim
      var drawTo = sx + len * linkP;
      ctx.globalAlpha = 0.25 + sealP * 0.55;
      ctx.strokeStyle = p.linkSolid;
      ctx.lineWidth   = 1.5 * sc;
      ctx.beginPath(); ctx.moveTo(sx, CY); ctx.lineTo(drawTo, CY); ctx.stroke();

      // Left dot (origin, always shown)
      ctx.globalAlpha = 0.4 + sealP * 0.45;
      ctx.fillStyle   = p.linkSolid;
      ctx.beginPath(); ctx.arc(sx + 1, CY, 2.2 * sc, 0, Math.PI * 2); ctx.fill();

      // Right dot only when link fully drawn
      if (linkP > 0.92) {
        var dotAlpha = (linkP - 0.92) / 0.08;
        ctx.globalAlpha = dotAlpha * (0.4 + sealP * 0.45);
        ctx.beginPath(); ctx.arc(ex - 1, CY, 2.2 * sc, 0, Math.PI * 2); ctx.fill();
      }

      // Moving head: a bright dot travelling along the link while drawing
      if (linkP > 0 && linkP < 1) {
        var headX = sx + len * linkP;
        var c = getTheme() === 'dark' ? '107,158,187' : '74,122,154';
        var gHead = ctx.createRadialGradient(headX, CY, 0, headX, CY, 7 * sc);
        gHead.addColorStop(0, 'rgba(' + c + ',0.9)');
        gHead.addColorStop(1, 'rgba(' + c + ',0)');
        ctx.globalAlpha = 1;
        ctx.fillStyle = gHead;
        ctx.beginPath(); ctx.arc(headX, CY, 7 * sc, 0, Math.PI * 2); ctx.fill();

        // Bright core
        ctx.globalAlpha = 1;
        ctx.fillStyle = 'rgba(' + c + ',0.95)';
        ctx.beginPath(); ctx.arc(headX, CY, 2 * sc, 0, Math.PI * 2); ctx.fill();
      }
    } else {
      ctx.globalAlpha = 0.25;
      ctx.strokeStyle = p.link;
      ctx.lineWidth   = 1 * sc;
      ctx.setLineDash([2 * sc, 5 * sc]);
      ctx.beginPath(); ctx.moveTo(sx, CY); ctx.lineTo(ex, CY); ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  function spawnFlash(x, y) {
    flashes.push({ x: x, y: y, progress: 0, speed: 2.2 });
  }

  function drawFlashes() {
    var c = getTheme() === 'dark' ? '107,158,187' : '74,122,154';
    ctx.save();
    for (var i = flashes.length - 1; i >= 0; i--) {
      var f = flashes[i];
      var t = f.progress;
      var ease = 1 - Math.pow(1 - t, 3);
      var r  = ease * BH * 0.7;
      var a  = (1 - t) * 0.7;
      var g  = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, r);
      g.addColorStop(0, 'rgba(' + c + ',' + a + ')');
      g.addColorStop(1, 'rgba(' + c + ',0)');
      ctx.globalAlpha = 1;
      ctx.fillStyle   = g;
      ctx.beginPath(); ctx.arc(f.x, f.y, r, 0, Math.PI * 2); ctx.fill();

      // Ring
      ctx.globalAlpha = (1 - t) * 0.5;
      ctx.strokeStyle = 'rgba(' + c + ',0.8)';
      ctx.lineWidth   = 1.5 * (1 - t);
      ctx.beginPath(); ctx.arc(f.x, f.y, r * 0.7, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  }

  function drawParticles() {
    var p = pal();
    ctx.save();
    for (var i = particles.length - 1; i >= 0; i--) {
      var pt   = particles[i];
      var t    = pt.progress;
      var ease = t * t * (3 - 2 * t);
      var px   = pt.x + (pt.tx - pt.x) * ease;
      var py   = pt.y + (pt.ty - pt.y) * ease;
      var a    = t < 0.75 ? 1 : (1 - t) / 0.25;

      // Trail
      if (t > 0.04) {
        var pt2  = Math.max(0, t - 0.07);
        var e2   = pt2 * pt2 * (3 - 2 * pt2);
        var ppx  = pt.x + (pt.tx - pt.x) * e2;
        var ppy  = pt.y + (pt.ty - pt.y) * e2;
        ctx.globalAlpha = a * 0.15;
        ctx.strokeStyle = p.particle;
        ctx.lineWidth   = 0.8;
        ctx.beginPath(); ctx.moveTo(ppx, ppy); ctx.lineTo(px, py); ctx.stroke();
      }

      // Dot
      ctx.globalAlpha = a * 0.75;
      ctx.fillStyle   = p.particle;
      ctx.beginPath(); ctx.arc(px, py, pt.size * (1 - t * 0.25), 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  function drawPulse(progress) {
    var p = pal();
    var sealedBlocks = blocks.filter(function(b) { return b.sealed; });
    if (sealedBlocks.length < 2) return;

    var x0 = blockX(sealedBlocks.length - 1);
    var x1 = blockX(0);
    var dist = x0 - x1;
    if (dist <= 0) return;

    var px = x0 - progress * dist;
    var pw = Math.max(dist * 0.12, 28);

    var grad = ctx.createLinearGradient(px - pw, 0, px + pw * 0.4, 0);
    grad.addColorStop(0,   'transparent');
    grad.addColorStop(0.4, p.pulse.replace(')', ', 0.18)').replace('rgb', 'rgba').replace('#6b9ebb', 'rgba(107,158,187,0.18)').replace('#4a7a9a', 'rgba(74,122,154,0.18)'));
    grad.addColorStop(0.7, p.pulse.replace('#6b9ebb', 'rgba(107,158,187,0.50)').replace('#4a7a9a', 'rgba(74,122,154,0.50)'));
    grad.addColorStop(1,   'transparent');

    // Simplified gradient
    var c = getTheme() === 'dark' ? '107,158,187' : '74,122,154';
    var g2 = ctx.createLinearGradient(px - pw, 0, px + pw * 0.5, 0);
    g2.addColorStop(0,   'rgba(' + c + ',0)');
    g2.addColorStop(0.6, 'rgba(' + c + ',0.45)');
    g2.addColorStop(1,   'rgba(' + c + ',0)');

    ctx.save();
    ctx.globalAlpha = 0.6 * (1 - progress * 0.6);
    ctx.fillStyle   = g2;
    ctx.fillRect(px - pw, CY - BH / 2 - 6, pw * 1.5, BH + 12);
    ctx.restore();
  }

  function getTheme() {
    return document.documentElement.getAttribute('data-theme') || 'dark';
  }

  // ── Loop ──
  var lastTime = 0;

  function tick(ts) {
    if (!lastTime) lastTime = ts;
    var dt = Math.min((ts - lastTime) / 1000, 0.08);
    lastTime = ts;
    phaseTime += dt;

    var pIdx = blocks.length - 1;
    var pb   = blocks[pIdx];

    var fillDur = CYCLE * 0.65;

    if (phase === 'filling') {
      var fp = Math.min(phaseTime / fillDur, 1);
      pb.data.fillProgress = fp;

      spawnAccum += dt;
      var rate = 0.10 + fp * 0.08;
      while (spawnAccum >= rate) {
        spawnAccum -= rate;
        spawnParticles(blockX(pIdx), CY);
      }

      if (phaseTime >= fillDur) { phase = 'sealing'; phaseTime = 0; }
    }

    if (phase === 'sealing') {
      var sp = Math.min(phaseTime / 0.6, 1);
      var es = sp * sp * (3 - 2 * sp);
      pb.sealAnim = es;

      // Animate the link drawing (starts a bit after sealing begins)
      var linkStart = 0.1;
      var linkDur   = 0.5;
      var lp = Math.max(0, Math.min((phaseTime - linkStart) / linkDur, 1));
      pb.linkAnim = lp * lp * (3 - 2 * lp);

      // Flash when link snaps into place
      if (lp >= 1 && !pb._flashed) {
        pb._flashed = true;
        var prevIdx = pIdx - 1;
        if (prevIdx >= 0) {
          var jx = blockX(prevIdx) + BW / 2 + (blockX(pIdx) - BW / 2 - (blockX(prevIdx) + BW / 2)) * 0.5;
          spawnFlash(jx, CY);
          // Burst particles at connection point
          for (var k = 0; k < 4; k++) {
            var ang = (k / 4) * Math.PI * 2;
            var d   = 18 + Math.random() * 20;
            particles.push({
              x: jx, y: CY,
              tx: jx + Math.cos(ang) * d,
              ty: CY  + Math.sin(ang) * d,
              progress: 0, speed: 1.8 + Math.random(), size: 1.2,
            });
          }
        }
      }

      if (sp >= 1) { pb.sealed = true; pb.sealAnim = 1; pb.linkAnim = 1; phase = 'pulsing'; phaseTime = 0; }
    }

    if (phase === 'pulsing' && phaseTime >= 0.9) {
      var newData = makeBlockData();
      blocks.push({ sealed: false, sealAnim: 0, linkAnim: 0, data: newData, enterAnim: 0 });
      if (blocks.length > MAX) blocks.shift();
      phase = 'filling'; phaseTime = 0; spawnAccum = 0;
    }

    // Animate enterAnim for new pending blocks
    for (var i = 0; i < blocks.length; i++) {
      if (!blocks[i].sealed && blocks[i].enterAnim < 1) {
        blocks[i].enterAnim = Math.min(1, blocks[i].enterAnim + dt * 3);
      }
    }

    // Update particles
    for (var i = particles.length - 1; i >= 0; i--) {
      particles[i].progress += dt * particles[i].speed;
      if (particles[i].progress >= 1) particles.splice(i, 1);
    }

    // Update flashes
    for (var i = flashes.length - 1; i >= 0; i--) {
      flashes[i].progress += dt * flashes[i].speed;
      if (flashes[i].progress >= 1) flashes.splice(i, 1);
    }

    // Smooth scroll: keep last 2 blocks + pending in frame
    // DISABLED: blocks now have fixed positions
    // var pendX    = blockX(pIdx);
    // var rightLim = W - BW * 0.7;
    // var target   = pendX > rightLim ? offsetX - (pendX - rightLim) : 0;
    // offsetX     += (target - offsetX) * 0.06;

    // ── Draw ──
    ctx.clearRect(0, 0, W, H);

    // Links
    for (var i = 1; i < blocks.length; i++) {
      var both = blocks[i - 1].sealed && blocks[i].sealed;
      var sp   = blocks[i].sealAnim || 0;
      var lp   = blocks[i].linkAnim || 0;
      drawLink(blockX(i - 1), blockX(i), both, sp, lp);
    }

    // Blocks
    for (var i = 0; i < blocks.length; i++) {
      var bx = blockX(i);
      if (bx + BW / 2 < -20 || bx - BW / 2 > W + 20) continue;
      var fp = 0;
      if (i === pIdx) {
        if (phase === 'filling')  fp = Math.min(phaseTime / fillDur, 1);
        if (phase === 'sealing')  fp = 1;
      }
      drawBlock(bx, CY, blocks[i], fp);
    }

    // Particles
    drawParticles();

    // Flashes (connection bursts)
    drawFlashes();

    // Pulse
    if (phase === 'pulsing') {
      var prog = Math.min(phaseTime / 0.9, 1);
      drawPulse(prog * prog * (3 - 2 * prog));
    }

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
})();
