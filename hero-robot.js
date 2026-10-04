/*
 * LATTICE LAB — animated hero
 * A robot rendered entirely from glowing binary digits (matching the original
 * "digital hands" art style), with blinking eyes that follow the pointer and the
 * LATTICELAB wordmark sitting behind it.
 *
 * Drawn on a dark canvas at a fixed 1280x511 logical size (same as home-hero.jpg)
 * so the existing CSS invert/hue-rotate filter themes it for the light site.
 */
(() => {
  const canvas = document.getElementById('hero-robot');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const W = 1280, H = 511, CX = 640;
  const CELL_W = 8, CELL_H = 11;
  const GOLD = '250, 204, 21';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- geometry helpers ----------
  function rrect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }
  function circle(c, x, y, r) { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); }

  // Filled robot silhouette (used both as a mask and for occluding the wordmark)
  function drawSilhouette(c) {
    c.fillStyle = '#000';
    const fills = [
      () => rrect(c, 540, 70, 200, 160, 40),   // head
      () => rrect(c, 522, 120, 22, 60, 8),     // left ear
      () => rrect(c, 736, 120, 22, 60, 8),     // right ear
      () => { c.beginPath(); c.rect(636, 34, 8, 38); }, // antenna stem
      () => circle(c, 640, 26, 12),            // antenna ball
      () => { c.beginPath(); c.rect(612, 226, 56, 30); }, // neck
      () => rrect(c, 498, 252, 284, 320, 46),  // torso (runs off the bottom)
      () => { c.beginPath(); c.rect(478, 272, 44, 38); }, // left shoulder
      () => { c.beginPath(); c.rect(758, 272, 44, 38); }, // right shoulder
      () => rrect(c, 436, 268, 56, 170, 26),   // left arm
      () => rrect(c, 788, 268, 56, 170, 26),   // right arm
      () => circle(c, 464, 452, 28),           // left hand
      () => circle(c, 816, 452, 28),           // right hand
    ];
    fills.forEach(f => { f(); c.fill(); });
  }

  // Outline / panel detail lines (rendered as the brightest digits)
  function drawDetails(c) {
    c.strokeStyle = '#000';
    c.lineWidth = 3;
    const strokes = [
      () => rrect(c, 562, 118, 156, 68, 30),   // visor
      () => rrect(c, 560, 300, 160, 112, 18),  // chest panel
      () => circle(c, 640, 356, 26),           // chest core ring
      () => { c.beginPath(); c.moveTo(498, 446); c.lineTo(782, 446); }, // belt
      () => { c.beginPath(); c.moveTo(436, 352); c.lineTo(492, 352); }, // left elbow
      () => { c.beginPath(); c.moveTo(788, 352); c.lineTo(844, 352); }, // right elbow
      () => { c.beginPath(); c.moveTo(612, 240); c.lineTo(668, 240); }, // neck ring
    ];
    strokes.forEach(s => { s(); c.stroke(); });
    // mouth grille
    c.lineWidth = 4;
    c.beginPath(); c.moveTo(604, 207); c.lineTo(676, 207); c.stroke();
    c.lineWidth = 2;
    for (let x = 614; x <= 666; x += 13) {
      c.beginPath(); c.moveTo(x, 200); c.lineTo(x, 214); c.stroke();
    }
  }

  function makeLayer(drawFn) {
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const cc = c.getContext('2d');
    drawFn(cc);
    return { canvas: c, alpha: cc.getImageData(0, 0, W, H).data };
  }

  const silhouette = makeLayer(drawSilhouette);
  const details = makeLayer(drawDetails);
  const visor = makeLayer(c => { c.fillStyle = '#000'; rrect(c, 562, 118, 156, 68, 30); c.fill(); });

  const alphaAt = (layer, x, y) => {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= W || y >= H) return 0;
    return layer.alpha[(y * W + x) * 4 + 3];
  };
  const randBit = () => (Math.random() < 0.5 ? '0' : '1');

  // ---------- build the digit grid for the robot ----------
  const cells = [];
  for (let gy = 0; gy < H; gy += CELL_H) {
    for (let gx = 0; gx < W; gx += CELL_W) {
      const sx = gx + CELL_W / 2, sy = gy + CELL_H / 2;
      if (alphaAt(silhouette, sx, sy) < 128) continue;

      const edge =
        alphaAt(silhouette, sx - CELL_W, sy) < 128 || alphaAt(silhouette, sx + CELL_W, sy) < 128 ||
        alphaAt(silhouette, sx, sy - CELL_H) < 128 || (sy + CELL_H < H && alphaAt(silhouette, sx, sy + CELL_H) < 128);
      const detail = alphaAt(details, sx, sy) > 60;
      const inVisor = alphaAt(visor, sx, sy) > 128;

      let a;
      if (edge || detail) a = 0.92 + Math.random() * 0.08;
      else if (inVisor) a = 0.12 + Math.random() * 0.06;
      else {
        // soft volumetric shading: brighter toward the centre & top
        const horiz = 1 - Math.min(1, Math.abs(sx - CX) / 300);
        const vert = 1 - Math.min(1, (sy - 40) / 470);
        a = 0.2 + 0.24 * horiz + 0.12 * vert + Math.random() * 0.12;
      }
      cells.push({ x: gx + 1, y: gy + CELL_H - 2, a, ch: randBit() });
    }
  }

  // ---------- background binary rain ----------
  const rain = [];
  for (let x = 4; x < W; x += 16) {
    rain.push({
      x,
      y: Math.random() * H,
      speed: 18 + Math.random() * 40,      // px per second
      len: 6 + Math.floor(Math.random() * 14),
      chars: Array.from({ length: 22 }, randBit),
    });
  }

  // ---------- animation state ----------
  let blinkStart = -1, nextBlink = 1400, doubleBlinkAt = -1;
  const BLINK_MS = 170;
  const pointer = { x: 0, y: 0 };       // normalised -1..1
  const pupil = { x: 0, y: 0 };
  let sweepX = -200, nextSweep = 2500;

  function eyeOpenness(t) {
    if (t >= nextBlink && blinkStart < 0) {
      blinkStart = t;
      if (Math.random() < 0.25) doubleBlinkAt = t + 280;
    }
    if (doubleBlinkAt > 0 && t >= doubleBlinkAt && blinkStart < 0) {
      blinkStart = t; doubleBlinkAt = -1;
    }
    if (blinkStart >= 0) {
      const p = (t - blinkStart) / BLINK_MS;
      if (p >= 1) {
        blinkStart = -1;
        if (doubleBlinkAt < 0) nextBlink = t + 2600 + Math.random() * 3200;
        return 1;
      }
      return Math.abs(1 - 2 * p);
    }
    return 1;
  }

  // ---------- rendering ----------
  function drawEyes(open, t) {
    if (open <= 0.04) {
      // closed eye slit
      ctx.fillStyle = `rgb(${GOLD})`;
      ctx.fillRect(598 - 18, 151, 36, 2);
      ctx.fillRect(682 - 18, 151, 36, 2);
      return;
    }
    const rY = 18 * Math.max(0.08, open);
    const rX = 20;
    const lookX = pupil.x * 6;
    const lookY = pupil.y * 5;

    for (const ex of [598, 682]) {
      // eye glow
      const g = ctx.createRadialGradient(ex, 152, 4, ex, 152, 28);
      g.addColorStop(0, `rgba(${GOLD}, 0.5)`);
      g.addColorStop(1, `rgba(${GOLD}, 0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(ex, 152, 28, 0, Math.PI * 2);
      ctx.fill();

      // outer eye oval
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(ex, 152, rX, rY, 0, 0, Math.PI * 2);
      ctx.fillStyle = `rgb(${GOLD})`;
      ctx.shadowColor = `rgb(${GOLD})`;
      ctx.shadowBlur = 14;
      ctx.fill();

      // pupil / highlight
      ctx.beginPath();
      ctx.arc(ex + lookX - 4, 152 + lookY - 3, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#fffdf0';
      ctx.shadowBlur = 0;
      ctx.fill();
      ctx.restore();
    }

    // Antenna pulse & chest core pulse
    const pulse = 0.7 + 0.3 * Math.sin(t * 0.004);
    ctx.save();
    ctx.beginPath();
    ctx.arc(640, 26, 10, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${GOLD}, ${0.85 * pulse})`;
    ctx.shadowColor = `rgb(${GOLD})`;
    ctx.shadowBlur = 12 * pulse;
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.arc(640, 356, 15, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${GOLD}, ${0.75 * pulse})`;
    ctx.shadowColor = `rgb(${GOLD})`;
    ctx.shadowBlur = 16 * pulse;
    ctx.fill();
    ctx.restore();
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    // 1. clear background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);

    // 2. background binary rain
    ctx.font = '10px "JetBrains Mono", Consolas, monospace';
    for (const r of rain) {
      r.y += r.speed * dt;
      if (r.y - r.len * CELL_H > H) {
        r.y = -10;
        r.speed = 18 + Math.random() * 40;
        r.len = 6 + Math.floor(Math.random() * 14);
      }
      for (let i = 0; i < r.len; i++) {
        const cy = r.y - i * CELL_H;
        if (cy < -CELL_H || cy > H) continue;
        const fade = 1 - i / r.len;
        const a = (i === 0 ? 0.32 : 0.14) * fade;
        ctx.fillStyle = `rgba(${GOLD}, ${a})`;
        ctx.fillText(r.chars[i % r.chars.length], r.x, cy);
      }
    }

    // 3. robot digits (with flicker + periodic light sweep)
    if (now > nextSweep) { sweepX += 520 * dt; if (sweepX > 900) { sweepX = 380; nextSweep = now + 4000 + Math.random() * 3000; } }
    const flips = Math.ceil(cells.length * 0.015);
    for (let i = 0; i < flips; i++) { const c = cells[(Math.random() * cells.length) | 0]; c.ch = randBit(); }

    ctx.font = '10px "JetBrains Mono", Consolas, monospace';
    ctx.fillStyle = `rgb(${GOLD})`;
    const sweeping = now > nextSweep;
    for (const c of cells) {
      let a = c.a;
      if (sweeping) { const d = Math.abs(c.x - sweepX); if (d < 40) a = Math.min(1, a + 0.45 * (1 - d / 40)); }
      ctx.globalAlpha = a;
      ctx.fillText(c.ch, c.x, c.y);
    }
    ctx.globalAlpha = 1;

    // 4. eyes (blink + follow pointer), antenna & chest glow
    pupil.x += (pointer.x - pupil.x) * 0.08;
    pupil.y += (pointer.y - pupil.y) * 0.08;
    drawEyes(reducedMotion ? 1 : eyeOpenness(now), now);

    if (running && !reducedMotion) requestAnimationFrame(frame);
  }

  // ---------- sizing, visibility & input ----------
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth || W;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(w * (H / W) * dpr);
    ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
    if (!running || reducedMotion) frame(performance.now());
  }

  let running = false;
  function start() {
    if (running) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(frame);
  }
  function stop() { running = false; }

  window.addEventListener('pointermove', e => {
    const r = canvas.getBoundingClientRect();
    pointer.x = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - 0.5) * 2));
    pointer.y = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height - 0.3) * 2));
  });
  window.addEventListener('resize', resize);

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => (entry.isIntersecting && !document.hidden ? start() : stop()))
      .observe(canvas);
  }
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

  const fontsReady = document.fonts && document.fonts.load
    ? document.fonts.load('10px "JetBrains Mono"').catch(() => {})
    : Promise.resolve();
  fontsReady.then(() => { resize(); if (reducedMotion) frame(performance.now()); else start(); });
})();
