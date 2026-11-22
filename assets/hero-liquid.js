/* ==========================================================================
   Vortex Hydro — Lightweight Organic Liquid Hero (Pure Canvas 2D)
   - Silky-smooth layered translucent abstract liquid waves (no stiff 3D tubes)
   - Soft floating translucent bubbles & subtle luminous particles
   - Gentle pointer sway & smooth multi-depth scroll exit
   - Adapts seamlessly to Light & Dark themes, pauses off-screen
   ========================================================================== */
(function initVortexLiquidHero() {
  'use strict';

  var hero = document.getElementById('vx-hero');
  var canvas = document.getElementById('hero-liquid-canvas');
  var copyCol = document.getElementById('hero-copy');
  var scrollCue = document.querySelector('.hero__scroll-cue');
  if (!hero || !canvas) return;

  var ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  var root = document.documentElement;
  var mqDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
  var mqReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduced = !!(mqReduced && mqReduced.matches);
  var isDark = false;

  function syncTheme() {
    var explicit = root.dataset.theme;
    if (explicit === 'dark') isDark = true;
    else if (explicit === 'light') isDark = false;
    else isDark = !!(mqDark && mqDark.matches);
  }
  syncTheme();
  if (mqDark && mqDark.addEventListener) mqDark.addEventListener('change', syncTheme);
  if (mqReduced && mqReduced.addEventListener) {
    mqReduced.addEventListener('change', function (e) { reduced = !!e.matches; });
  }
  if ('MutationObserver' in window) {
    new MutationObserver(syncTheme).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  }

  /* ---------- Responsive Canvas Sizing (DPR capped at 1.5) ---------- */
  var vw = 1280, vh = 720, dpr = 1;
  function handleResize() {
    var r = hero.getBoundingClientRect();
    if (!r.width || !r.height) return;
    vw = r.width;
    vh = r.height;
    dpr = Math.min(1.5, window.devicePixelRatio || 1);
    canvas.width = Math.max(1, Math.round(vw * dpr));
    canvas.height = Math.max(1, Math.round(vh * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  handleResize();
  window.addEventListener('resize', handleResize, { passive: true });
  window.__vxHeroResize = handleResize;

  /* ---------- Gentle Pointer & Scroll Tracking ---------- */
  var pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  var scrollProg = 0;

  hero.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse') return;
    var r = hero.getBoundingClientRect();
    if (!r.width || !r.height) return;
    pointer.tx = ((e.clientX - r.left) / r.width) * 2 - 1;
    pointer.ty = ((e.clientY - r.top) / r.height) * 2 - 1;
  }, { passive: true });

  hero.addEventListener('pointerleave', function () {
    pointer.tx = 0;
    pointer.ty = 0;
  }, { passive: true });

  function updateHeroScroll() {
    var beranda = document.getElementById('beranda');
    if (beranda && beranda.hidden) return;
    var sy = window.scrollY || window.pageYOffset || 0;
    var h = hero.offsetHeight || window.innerHeight || 800;
    scrollProg = Math.min(1, Math.max(0, sy / Math.max(280, h * 0.82)));

    if (reduced) return;

    if (copyCol) {
      if (scrollProg <= 0.002) {
        copyCol.style.transform = '';
        copyCol.style.opacity = '';
      } else {
        copyCol.style.transform = 'translate3d(0,' + (-scrollProg * 46).toFixed(1) + 'px,0)';
        copyCol.style.opacity = Math.max(0, 1 - scrollProg * 1.3).toFixed(3);
      }
    }
    if (scrollCue) {
      if (scrollProg <= 0.002) {
        scrollCue.style.transform = '';
        scrollCue.style.opacity = '';
      } else {
        scrollCue.style.transform = 'translate3d(-50%,' + (-scrollProg * 26).toFixed(1) + 'px,0)';
        scrollCue.style.opacity = Math.max(0, 1 - scrollProg * 2.2).toFixed(3);
      }
    }
  }
  window.addEventListener('scroll', updateHeroScroll, { passive: true });
  window.addEventListener('resize', updateHeroScroll, { passive: true });
  updateHeroScroll();

  /* ---------- Flowing Wave Layers & Soft Floating Bubbles ---------- */
  var waves = [
    { yFrac: 0.60, amp: 34, freq: 0.0026, speed: 0.55, phase: 0.4,  parallax: 0.35, light: ['rgba(7,87,200,0.13)', 'rgba(21,217,242,0.08)'],  dark: ['rgba(7,87,200,0.30)', 'rgba(21,217,242,0.14)'],  rim: 'rgba(22,139,255,0.22)' },
    { yFrac: 0.68, amp: 42, freq: 0.0033, speed: -0.72, phase: 2.1, parallax: 0.65, light: ['rgba(22,139,255,0.16)', 'rgba(21,217,242,0.14)'], dark: ['rgba(22,139,255,0.28)', 'rgba(21,217,242,0.20)'], rim: 'rgba(21,217,242,0.34)' },
    { yFrac: 0.76, amp: 30, freq: 0.0041, speed: 0.92, phase: 4.0,  parallax: 0.95, light: ['rgba(21,217,242,0.18)', 'rgba(189,235,255,0.22)'], dark: ['rgba(21,217,242,0.22)', 'rgba(7,87,200,0.26)'],  rim: 'rgba(189,235,255,0.52)' },
    { yFrac: 0.84, amp: 22, freq: 0.0052, speed: -1.10, phase: 1.2, parallax: 1.25, light: ['rgba(189,235,255,0.36)', 'rgba(244,250,255,0.45)'], dark: ['rgba(10,36,84,0.42)', 'rgba(5,15,30,0.68)'],     rim: 'rgba(255,255,255,0.55)' }
  ];

  var bubbles = [];
  for (var bi = 0; bi < 7; bi++) {
    bubbles.push({
      xFrac: 0.12 + (bi * 0.13) + (Math.random() * 0.05),
      yFrac: 0.22 + Math.random() * 0.62,
      r: 10 + (bi % 4) * 9,
      spd: 0.45 + Math.random() * 0.55,
      ph: Math.random() * Math.PI * 2,
      pull: 8 + (bi % 3) * 7
    });
  }

  var specks = [];
  for (var si = 0; si < 24; si++) {
    specks.push({
      xFrac: Math.random(),
      yFrac: 0.18 + Math.random() * 0.76,
      r: 1.4 + Math.random() * 2.2,
      spd: 0.35 + Math.random() * 0.65,
      ph: Math.random() * Math.PI * 2
    });
  }

  /* Pause off-screen */
  var isInView = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { isInView = entry.isIntersecting; });
    }, { threshold: 0.02 }).observe(hero);
  }

  var simTime = 0, lastT = performance.now();

  function draw(now) {
    requestAnimationFrame(draw);
    var beranda = document.getElementById('beranda');
    if (!isInView || document.hidden || (beranda && beranda.hidden)) {
      lastT = now;
      return;
    }

    var dt = Math.min(0.05, Math.max(0.001, (now - lastT) / 1000));
    lastT = now;

    var ease = 1 - Math.pow(0.005, dt);
    pointer.x += (pointer.tx - pointer.x) * ease;
    pointer.y += (pointer.ty - pointer.y) * ease;

    simTime += dt * (reduced ? 0.18 : 1.0);

    ctx.clearRect(0, 0, vw, vh);

    /* 1. Soft Layered Organic Liquid Waves */
    var step = Math.max(14, Math.round(vw / 56));
    for (var wi = 0; wi < waves.length; wi++) {
      var w = waves[wi];
      var baseY = vh * w.yFrac + pointer.y * 14 * w.parallax + scrollProg * 58 * w.parallax;
      var t = simTime * w.speed + w.phase;
      var xShift = pointer.x * 26 * w.parallax;

      ctx.beginPath();
      for (var x = -step; x <= vw + step * 2; x += step) {
        var nx = x + xShift;
        var y = baseY
          + Math.sin(nx * w.freq + t) * w.amp
          + Math.sin(nx * (w.freq * 1.85) - t * 1.25) * (w.amp * 0.38)
          + Math.cos(nx * (w.freq * 0.72) + t * 0.65) * (w.amp * 0.25);
        if (x === -step) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      /* Soft luminous rim stroke along top crest of each wave */
      ctx.strokeStyle = isDark ? 'rgba(21,217,242,0.22)' : w.rim;
      ctx.lineWidth = 1.4;
      ctx.stroke();

      /* Fill silky translucent liquid body down to bottom */
      ctx.lineTo(vw + step * 2, vh + 20);
      ctx.lineTo(-step, vh + 20);
      ctx.closePath();

      var cols = isDark ? w.dark : w.light;
      var grad = ctx.createLinearGradient(0, baseY - w.amp, vw, vh);
      grad.addColorStop(0, cols[0]);
      grad.addColorStop(1, cols[1]);
      ctx.fillStyle = grad;
      ctx.fill();
    }

    /* 2. Soft Floating Translucent Glass Bubbles */
    for (var b = 0; b < bubbles.length; b++) {
      var bb = bubbles[b];
      var bx = vw * bb.xFrac + Math.cos(simTime * bb.spd * 0.7 + bb.ph) * 18 + pointer.x * bb.pull;
      var by = vh * bb.yFrac + Math.sin(simTime * bb.spd + bb.ph) * 16 + pointer.y * (bb.pull * 0.7) - scrollProg * (28 + bb.pull * 2);

      var rg = ctx.createRadialGradient(bx - bb.r * 0.32, by - bb.r * 0.32, bb.r * 0.1, bx, by, bb.r);
      if (isDark) {
        rg.addColorStop(0, 'rgba(189, 235, 255, 0.52)');
        rg.addColorStop(0.45, 'rgba(21, 217, 242, 0.16)');
        rg.addColorStop(1, 'rgba(7, 87, 200, 0.04)');
      } else {
        rg.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
        rg.addColorStop(0.5, 'rgba(21, 217, 242, 0.18)');
        rg.addColorStop(1, 'rgba(22, 139, 255, 0.05)');
      }

      ctx.beginPath();
      ctx.arc(bx, by, bb.r, 0, Math.PI * 2);
      ctx.fillStyle = rg;
      ctx.fill();
      ctx.strokeStyle = isDark ? 'rgba(189, 235, 255, 0.28)' : 'rgba(255, 255, 255, 0.72)';
      ctx.lineWidth = 1.1;
      ctx.stroke();
    }

    /* 3. Delicate Luminous Water Shimmer Dots */
    for (var s = 0; s < specks.length; s++) {
      var sp = specks[s];
      var sx = vw * sp.xFrac + Math.sin(simTime * sp.spd + sp.ph) * 20 + pointer.x * 10;
      var sy = vh * sp.yFrac + Math.cos(simTime * sp.spd * 0.8 + sp.ph) * 14 - scrollProg * 40;
      var alpha = 0.25 + 0.45 * (0.5 + 0.5 * Math.sin(simTime * 1.4 + sp.ph));

      ctx.beginPath();
      ctx.arc(sx, sy, sp.r, 0, Math.PI * 2);
      ctx.fillStyle = isDark
        ? 'rgba(189, 235, 255,' + (alpha * 0.7).toFixed(2) + ')'
        : 'rgba(22, 139, 255,' + (alpha * 0.5).toFixed(2) + ')';
      ctx.fill();
    }
  }

  requestAnimationFrame(draw);
})();
