/* ==========================================================================
   Vortex Hydro — Architectural Concrete U-Channel Water-Flow Hero
   Choreographed frame-for-frame after hero.mp4 with flowing Vortex Hydro water:
   - 0.0s: Compact U-channel, spheres peeking at upper inlets, text hidden
   - 0.0s -> 1.75s: U-channel opens wide, spheres drop down both curved arms,
     headline & paragraph emerge smoothly inside the concrete wall cradle
   - 1.8s -> 2.65s: Spheres accelerate across bottom trough with bright aqua
     caustic light cone between them, meeting at center with cushioned micro-bounce
   - Continuous living crystal-clear blue-cyan water streamlines & bubbles
   ========================================================================== */
(function initVortexChannelHero() {
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

  /* ---------- Procedural 512x512 Architectural Concrete / Plaster Wall Texture ---------- */
  function createConcreteWallPattern(darkMode) {
    var size = 512;
    var tc = document.createElement('canvas');
    tc.width = size;
    tc.height = size;
    var tctx = tc.getContext('2d');
    if (!tctx) return null;

    /* Base matte mineral concrete tone */
    tctx.fillStyle = darkMode ? '#0A1526' : '#E9EAE8';
    tctx.fillRect(0, 0, size, size);

    /* 1. Soft multi-scale mottled plaster/mineral clouds (toroidally wrapped for 100% seamless tiling) */
    for (var m = 0; m < 44; m++) {
      var mx = Math.random() * size;
      var my = Math.random() * size;
      var mr = 38 + Math.random() * 110;
      var bright = Math.random() > 0.48;
      var col0 = darkMode
        ? (bright ? 'rgba(34, 64, 102, 0.13)' : 'rgba(2, 6, 14, 0.20)')
        : (bright ? 'rgba(255, 255, 255, 0.24)' : 'rgba(130, 138, 146, 0.11)');
      for (var ox = -size; ox <= size; ox += size) {
        for (var oy = -size; oy <= size; oy += size) {
          var cx = mx + ox, cy = my + oy;
          if (cx + mr < 0 || cx - mr > size || cy + mr < 0 || cy - mr > size) continue;
          var cg = tctx.createRadialGradient(cx, cy, 2, cx, cy, mr);
          cg.addColorStop(0, col0);
          cg.addColorStop(1, 'rgba(0,0,0,0)');
          tctx.fillStyle = cg;
          tctx.fillRect(cx - mr, cy - mr, mr * 2, mr * 2);
        }
      }
    }

    /* 2. Fine mineral sand grain pixel texture */
    var img = tctx.getImageData(0, 0, size, size);
    var px = img.data;
    var grainAmp = darkMode ? 12 : 16;
    for (var i = 0; i < px.length; i += 4) {
      var n = (Math.random() - 0.5) * grainAmp;
      px[i]     = Math.max(0, Math.min(255, px[i] + n));
      px[i + 1] = Math.max(0, Math.min(255, px[i + 1] + n));
      px[i + 2] = Math.max(0, Math.min(255, px[i + 2] + n));
    }
    tctx.putImageData(img, 0, 0);

    /* 3. Subtle horizontal troweled concrete micro-streaks */
    tctx.strokeStyle = darkMode ? 'rgba(255,255,255,0.025)' : 'rgba(255,255,255,0.18)';
    tctx.lineWidth = 1;
    for (var s = 0; s < 36; s++) {
      var sy = Math.random() * size;
      var sx = Math.random() * size;
      var slen = 30 + Math.random() * 90;
      tctx.beginPath();
      tctx.moveTo(sx, sy);
      tctx.lineTo(sx + slen, sy + (Math.random() - 0.5) * 3);
      tctx.stroke();
    }

    /* 4. Authentic tiny architectural concrete air-void pinholes / pores (like hero.mp4) */
    for (var p = 0; p < 145; p++) {
      var x = Math.random() * size;
      var y = Math.random() * size;
      var pr = 0.65 + Math.random() * 1.45;
      /* Tiny bright lower-right rim highlight */
      tctx.beginPath();
      tctx.arc(x + 0.5, y + 0.5, pr, 0, Math.PI * 2);
      tctx.fillStyle = darkMode ? 'rgba(160, 200, 235, 0.08)' : 'rgba(255, 255, 255, 0.45)';
      tctx.fill();
      /* Tiny recessed concrete pore */
      tctx.beginPath();
      tctx.arc(x, y, pr, 0, Math.PI * 2);
      tctx.fillStyle = darkMode ? 'rgba(2, 6, 14, 0.46)' : 'rgba(92, 98, 106, 0.24)';
      tctx.fill();
    }

    return ctx.createPattern(tc, 'repeat');
  }

  var lightWallPattern = createConcreteWallPattern(false);
  var darkWallPattern  = createConcreteWallPattern(true);

  /* ---------- Responsive Sizing ---------- */
  var vw = 1280, vh = 720, dpr = 1;
  function handleResize() {
    var r = hero.getBoundingClientRect();
    if (!r.width || !r.height) return;
    vw = r.width;
    vh = r.height;
    dpr = Math.min(1.75, window.devicePixelRatio || 1);
    canvas.width = Math.max(1, Math.round(vw * dpr));
    canvas.height = Math.max(1, Math.round(vh * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  handleResize();
  window.addEventListener('resize', handleResize, { passive: true });
  window.__vxHeroResize = handleResize;

  /* ---------- Pointer & Scroll Interaction ---------- */
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
        copyCol.style.transform = 'translate3d(0,' + (-scrollProg * 48).toFixed(1) + 'px,0)';
        copyCol.style.opacity = Math.max(0, 1 - scrollProg * 1.35).toFixed(3);
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

  /* ---------- Easing Helpers (Exact hero.mp4 Physics) ---------- */
  function clamp01(v) { return v < 0 ? 0 : (v > 1 ? 1 : v); }
  function easeOutCubic(t) { return 1 - Math.pow(1 - clamp01(t), 3); }
  function easeInOutQuart(t) {
    t = clamp01(t);
    return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
  }

  /* Physical sphere roll progress with subtle cushioned micro-rebound upon meeting at center */
  function evalSphereMotion(timeSec) {
    var t = clamp01((timeSec - 0.12) / 2.45);
    /* Accelerates down the steep slope, glides smoothly into center kiss */
    var base = easeInOutQuart(t);
    var bounce = 0;
    if (timeSec > 2.55) {
      var bt = timeSec - 2.55;
      /* Soft damped micro-rebound (kiss & settle, never jittery) */
      bounce = Math.exp(-bt * 4.8) * Math.sin(bt * 11.5) * 0.0065;
    }
    return clamp01(base - Math.abs(bounce));
  }

  /* ---------- Symmetric Expanding U-Channel Sampler (Matches hero.mp4 00:00 -> 00:02) ---------- */
  function buildUTrack(w, h, openEase, scrollOffset) {
    var isMob = w < 720;

    /* At 00:00 (openEase = 0): tight inner U-frame; at 00:02 (openEase = 1): wide architectural cradle */
    var sideStart = isMob ? 0.10 : 0.185;
    var sideEnd   = isMob ? 0.025 : 0.052;
    var sideFrac  = sideStart + (sideEnd - sideStart) * openEase;

    var topStart = isMob ? 0.22 : 0.21;
    var topEnd   = isMob ? 0.13 : 0.105;
    var topYFrac = topStart + (topEnd - topStart) * openEase;

    var botStart = isMob ? 0.68 : 0.69;
    var botEnd   = isMob ? 0.78 : 0.765;
    var bottomYFrac = botStart + (botEnd - botStart) * openEase + scrollOffset * 0.10;

    var xLeftIn   = -w * 0.05;
    var xLeftArm  = w * sideFrac + (isMob ? 20 : 48);
    var xLeftBot  = w * (isMob ? 0.24 : (0.30 - 0.05 * openEase));
    var xRightBot = w - xLeftBot;
    var xRightArm = w - xLeftArm;
    var xRightOut = w * 1.05;

    var yTop = h * topYFrac;
    var yBot = h * bottomYFrac;

    var segs = [
      [
        { x: xLeftIn, y: yTop },
        { x: xLeftArm * 0.52, y: yTop },
        { x: xLeftArm * 0.84, y: yTop + (yBot - yTop) * 0.07 },
        { x: xLeftArm * 1.06, y: yTop + (yBot - yTop) * 0.36 }
      ],
      [
        { x: xLeftArm * 1.06, y: yTop + (yBot - yTop) * 0.36 },
        { x: xLeftArm * 1.30, y: yBot - (yBot - yTop) * 0.14 },
        { x: xLeftBot - (xLeftBot - xLeftArm) * 0.54, y: yBot },
        { x: xLeftBot, y: yBot }
      ],
      [
        { x: xLeftBot, y: yBot },
        { x: xLeftBot + (xRightBot - xLeftBot) * 0.33, y: yBot },
        { x: xLeftBot + (xRightBot - xLeftBot) * 0.67, y: yBot },
        { x: xRightBot, y: yBot }
      ],
      [
        { x: xRightBot, y: yBot },
        { x: xRightBot + (xRightArm - xRightBot) * 0.54, y: yBot },
        { x: w - xLeftArm * 1.30, y: yBot - (yBot - yTop) * 0.14 },
        { x: w - xLeftArm * 1.06, y: yTop + (yBot - yTop) * 0.36 }
      ],
      [
        { x: w - xLeftArm * 1.06, y: yTop + (yBot - yTop) * 0.36 },
        { x: w - xLeftArm * 0.84, y: yTop + (yBot - yTop) * 0.07 },
        { x: w - xLeftArm * 0.52, y: yTop },
        { x: xRightOut, y: yTop }
      ]
    ];

    var pts = [];
    var cumLen = [0];
    var stepsPerSeg = 34;

    function evalCubic(s, t) {
      var mt = 1 - t;
      var mt2 = mt * mt, t2 = t * t;
      var a = mt2 * mt, b = 3 * mt2 * t, c = 3 * mt * t2, d = t2 * t;
      return {
        x: a * s[0].x + b * s[1].x + c * s[2].x + d * s[3].x,
        y: a * s[0].y + b * s[1].y + c * s[2].y + d * s[3].y
      };
    }

    for (var si = 0; si < segs.length; si++) {
      var startK = (si === 0) ? 0 : 1;
      for (var k = startK; k <= stepsPerSeg; k++) {
        var pt = evalCubic(segs[si], k / stepsPerSeg);
        if (pts.length > 0) {
          var prev = pts[pts.length - 1];
          cumLen.push(cumLen[cumLen.length - 1] + Math.hypot(pt.x - prev.x, pt.y - prev.y));
        }
        pts.push(pt);
      }
    }

    var totalLen = cumLen[cumLen.length - 1] || 1;

    function sampleAt(frac) {
      var target = clamp01(frac) * totalLen;
      var lo = 0, hi = cumLen.length - 1;
      while (lo < hi - 1) {
        var mid = (lo + hi) >> 1;
        if (cumLen[mid] <= target) lo = mid;
        else hi = mid;
      }
      var span = Math.max(0.0001, cumLen[hi] - cumLen[lo]);
      var u = (target - cumLen[lo]) / span;
      var p0 = pts[lo], p1 = pts[hi];
      var dx = p1.x - p0.x, dy = p1.y - p0.y;
      var mag = Math.hypot(dx, dy) || 1;
      return {
        x: p0.x + dx * u,
        y: p0.y + dy * u,
        tx: dx / mag,
        ty: dy / mag,
        nx: -dy / mag,
        ny: dx / mag
      };
    }

    return { pts: pts, totalLen: totalLen, sampleAt: sampleAt, yBot: yBot };
  }

  function traceTrackPath(pts) {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (var i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
  }

  /* ---------- Pre-Seeded Flowing Water Streaks & Micro-Bubbles ---------- */
  var streaks = [];
  for (var st = 0; st < 30; st++) {
    streaks.push({
      offset: st / 30,
      lane: (Math.random() - 0.5) * 0.66,
      len: 0.024 + Math.random() * 0.044,
      speed: 0.11 + Math.random() * 0.06,
      width: 1.4 + Math.random() * 2.3,
      alpha: 0.22 + Math.random() * 0.36
    });
  }

  var bubbles = [];
  for (var bi = 0; bi < 18; bi++) {
    bubbles.push({
      offset: Math.random(),
      lane: (Math.random() - 0.5) * 0.62,
      r: 1.7 + Math.random() * 2.9,
      speed: 0.09 + Math.random() * 0.06,
      wobble: Math.random() * Math.PI * 2
    });
  }

  /* ---------- 3D Shaded Spheres ---------- */
  function drawHydroWaterOrb(x, y, r, rollAngle, meetGlow) {
    ctx.save();

    /* Ground cast shadow (diagonal sunlit studio bottom-right) */
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(x + r * 0.32, y + r * 0.54, r * 1.08, r * 0.68, 0.24, 0, Math.PI * 2);
    ctx.fillStyle = isDark ? 'rgba(0, 0, 0, 0.58)' : 'rgba(15, 28, 46, 0.24)';
    ctx.filter = 'blur(13px)';
    ctx.fill();
    ctx.restore();

    /* Luminous cyan floor caustic bounce */
    if (meetGlow > 0.01) {
      var cg = ctx.createRadialGradient(x + r * 0.55, y + r * 0.45, r * 0.1, x + r * 0.55, y + r * 0.45, r * 1.9);
      cg.addColorStop(0, 'rgba(21, 217, 242,' + (0.36 * meetGlow).toFixed(3) + ')');
      cg.addColorStop(1, 'rgba(21, 217, 242, 0)');
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.arc(x + r * 0.55, y + r * 0.45, r * 1.9, 0, Math.PI * 2);
      ctx.fill();
    }

    /* Main Glossy Pearl-White & Ice-Aqua 3D Sphere */
    var bg = ctx.createRadialGradient(x - r * 0.36, y - r * 0.38, r * 0.08, x, y, r);
    bg.addColorStop(0.0, '#FFFFFF');
    bg.addColorStop(0.42, '#EEF8FF');
    bg.addColorStop(0.76, '#BFE6F8');
    bg.addColorStop(0.93, '#6ABCE6');
    bg.addColorStop(1.0, '#3C8BC4');

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = bg;
    ctx.fill();

    /* Lower-right cyan bounce from water trough */
    var rim = ctx.createRadialGradient(x + r * 0.4, y + r * 0.42, r * 0.1, x, y, r);
    rim.addColorStop(0, 'rgba(21, 217, 242, 0.50)');
    rim.addColorStop(0.6, 'rgba(21, 217, 242, 0)');
    ctx.fillStyle = rim;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    /* Glowing Hydro Water-Drop Emblem */
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rollAngle);

    ctx.beginPath();
    ctx.arc(0, 0, r * 0.48, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(7, 87, 200, 0.22)';
    ctx.lineWidth = Math.max(1.5, r * 0.05);
    ctx.stroke();

    var dr = r * 0.34;
    ctx.beginPath();
    ctx.moveTo(0, -dr * 1.15);
    ctx.bezierCurveTo(dr * 0.85, -dr * 0.15, dr * 0.92, dr * 0.82, 0, dr * 0.95);
    ctx.bezierCurveTo(-dr * 0.92, dr * 0.82, -dr * 0.85, -dr * 0.15, 0, -dr * 1.15);
    ctx.closePath();

    var dropGrad = ctx.createLinearGradient(0, -dr, 0, dr);
    dropGrad.addColorStop(0, '#15D9F2');
    dropGrad.addColorStop(0.55, '#0EA5E9');
    dropGrad.addColorStop(1, '#0757C8');
    ctx.shadowColor = 'rgba(21, 217, 242, 0.65)';
    ctx.shadowBlur = 12;
    ctx.fillStyle = dropGrad;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.beginPath();
    ctx.ellipse(-dr * 0.24, dr * 0.12, dr * 0.14, dr * 0.26, -0.35, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fill();
    ctx.restore();

    /* Crisp Top-Left Specular Glint */
    ctx.beginPath();
    ctx.ellipse(x - r * 0.34, y - r * 0.36, r * 0.22, r * 0.12, -0.68, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.fill();

    ctx.restore();
  }

  function drawMetallicTurbineOrb(x, y, r, rollAngle) {
    ctx.save();

    /* Ground cast shadow */
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(x + r * 0.34, y + r * 0.54, r * 1.08, r * 0.68, 0.24, 0, Math.PI * 2);
    ctx.fillStyle = isDark ? 'rgba(0, 0, 0, 0.62)' : 'rgba(15, 28, 46, 0.28)';
    ctx.filter = 'blur(13px)';
    ctx.fill();
    ctx.restore();

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.save();
    ctx.clip();

    var mg = ctx.createRadialGradient(x - r * 0.32, y - r * 0.36, r * 0.05, x, y, r * 1.15);
    mg.addColorStop(0.0, '#FFFFFF');
    mg.addColorStop(0.24, '#E8EFF5');
    mg.addColorStop(0.52, '#8F9EAD');
    mg.addColorStop(0.74, '#2A394A');
    mg.addColorStop(0.90, '#6B859E');
    mg.addColorStop(1.0, '#C5E6F5');
    ctx.fillStyle = mg;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rollAngle * 0.35 - 0.18);
    var band = ctx.createLinearGradient(0, -r * 0.35, 0, r * 0.55);
    band.addColorStop(0, 'rgba(255, 255, 255, 0.55)');
    band.addColorStop(0.45, 'rgba(15, 28, 46, 0.72)');
    band.addColorStop(0.75, 'rgba(12, 74, 110, 0.55)');
    band.addColorStop(1, 'rgba(21, 217, 242, 0.45)');
    ctx.fillStyle = band;
    ctx.beginPath();
    ctx.ellipse(0, r * 0.16, r * 1.25, r * 0.52, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    var bounce = ctx.createRadialGradient(x - r * 0.42, y + r * 0.38, r * 0.05, x - r * 0.42, y + r * 0.38, r * 0.95);
    bounce.addColorStop(0, 'rgba(21, 217, 242, 0.55)');
    bounce.addColorStop(0.6, 'rgba(22, 139, 255, 0.12)');
    bounce.addColorStop(1, 'rgba(21, 217, 242, 0)');
    ctx.fillStyle = bounce;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);

    ctx.beginPath();
    ctx.ellipse(x - r * 0.32, y - r * 0.38, r * 0.30, r * 0.16, -0.58, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
    ctx.fill();

    ctx.restore();

    ctx.beginPath();
    ctx.arc(x, y, r - 0.5, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.42)';
    ctx.lineWidth = 1.1;
    ctx.stroke();

    ctx.restore();
  }

  /* ---------- Visibility Pause & Replayable Intro Clock ---------- */
  var isInView = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { isInView = entry.isIntersecting; });
    }, { threshold: 0.02 }).observe(hero);
  }

  var introTime = reduced ? 3.5 : 0;
  var flowTime = 0;
  var lastT = performance.now();

  /* Allow clean replay if user navigates back to Beranda */
  window.__vxReplayHero = function () {
    if (!reduced) introTime = 0;
  };

  /* ---------- Main 60 FPS Render Loop ---------- */
  function render(now) {
    requestAnimationFrame(render);
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

    if (!reduced) {
      introTime = Math.min(6.0, introTime + dt);
      flowTime += dt;
    } else {
      flowTime += dt * 0.16;
    }

    ctx.clearRect(0, 0, vw, vh);

    /* 1. Textured Architectural Concrete / Plaster Studio Wall */
    var wallPat = isDark ? darkWallPattern : lightWallPattern;
    if (wallPat) {
      ctx.fillStyle = wallPat;
      ctx.fillRect(0, 0, vw, vh);
    } else {
      ctx.fillStyle = isDark ? '#0A1526' : '#E9EAE8';
      ctx.fillRect(0, 0, vw, vh);
    }

    /* Subtle edge vignette for natural studio lighting falloff */
    var vig = ctx.createRadialGradient(vw * 0.44, vh * 0.42, vw * 0.12, vw * 0.5, vh * 0.5, Math.max(vw, vh) * 0.78);
    if (isDark) {
      vig.addColorStop(0, 'rgba(18, 42, 74, 0.16)');
      vig.addColorStop(1, 'rgba(3, 8, 18, 0.52)');
    } else {
      vig.addColorStop(0, 'rgba(255, 255, 255, 0.34)');
      vig.addColorStop(0.65, 'rgba(230, 234, 238, 0.05)');
      vig.addColorStop(1, 'rgba(42, 52, 66, 0.13)');
    }
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, vw, vh);

    /* Dramatic Diagonal Window Sunlight Beam & Architectural Corner Shadows (Matches hero.mp4!) */
    ctx.save();
    var sunShift = pointer.x * 26;

    /* Upper-right architectural shadow cast across the wall */
    ctx.beginPath();
    ctx.moveTo(vw * 0.44 + sunShift * 0.4, 0);
    ctx.lineTo(vw, 0);
    ctx.lineTo(vw, vh * 0.62);
    ctx.closePath();
    ctx.fillStyle = isDark ? 'rgba(2, 6, 14, 0.34)' : 'rgba(36, 44, 56, 0.085)';
    ctx.filter = 'blur(26px)';
    ctx.fill();

    /* Warm-bright diagonal sunlight shaft cutting across center-left to bottom-right */
    ctx.beginPath();
    ctx.moveTo(0, vh * 0.48);
    ctx.lineTo(vw * 0.48 + sunShift * 0.5, 0);
    ctx.lineTo(vw * 0.92 + sunShift * 0.5, 0);
    ctx.lineTo(vw * 0.32 + sunShift * 0.3, vh);
    ctx.lineTo(0, vh);
    ctx.closePath();
    var shaftGrad = ctx.createLinearGradient(0, vh * 0.2, vw * 0.75, vh * 0.85);
    if (isDark) {
      shaftGrad.addColorStop(0, 'rgba(21, 217, 242, 0.075)');
      shaftGrad.addColorStop(0.55, 'rgba(22, 139, 255, 0.035)');
      shaftGrad.addColorStop(1, 'rgba(21, 217, 242, 0)');
    } else {
      shaftGrad.addColorStop(0, 'rgba(255, 253, 248, 0.44)');
      shaftGrad.addColorStop(0.55, 'rgba(255, 255, 255, 0.16)');
      shaftGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    }
    ctx.fillStyle = shaftGrad;
    ctx.filter = 'blur(22px)';
    ctx.fill();
    ctx.restore();

    /* 2. Choreographed Expanding U-Channel (00:00 Compact -> 00:02 Wide Cradle) */
    var openEase = easeOutCubic(introTime / 1.75);
    var track = buildUTrack(vw, vh, openEase, scrollProg);
    var channelW = Math.max(44, Math.min(90, Math.min(vw, vh) * 0.092));
    var wallW = channelW + 20;

    /* 3. Cast Shadow of Sculpted U-Channel onto Textured Concrete Wall */
    ctx.save();
    ctx.translate(18 + pointer.x * 7, 26 + pointer.y * 5);
    traceTrackPath(track.pts);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = wallW + 8;
    ctx.strokeStyle = isDark ? 'rgba(0, 0, 0, 0.58)' : 'rgba(28, 36, 48, 0.18)';
    ctx.filter = 'blur(20px)';
    ctx.stroke();
    ctx.restore();

    /* 4. Sculpted Acrylic / Metallic U-Channel Casing */
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    traceTrackPath(track.pts);
    var wallGrad = ctx.createLinearGradient(0, vh * 0.10, 0, track.yBot + wallW);
    if (isDark) {
      wallGrad.addColorStop(0, '#1B3D68');
      wallGrad.addColorStop(0.5, '#112B4E');
      wallGrad.addColorStop(1, '#09182E');
    } else {
      wallGrad.addColorStop(0, '#C0D2E0');
      wallGrad.addColorStop(0.45, '#E4ECF2');
      wallGrad.addColorStop(1, '#93AFC6');
    }
    ctx.lineWidth = wallW;
    ctx.strokeStyle = wallGrad;
    ctx.stroke();

    traceTrackPath(track.pts);
    ctx.lineWidth = channelW + 4;
    ctx.strokeStyle = isDark ? 'rgba(3, 10, 22, 0.86)' : 'rgba(12, 32, 58, 0.18)';
    ctx.stroke();

    /* 5. Living Crystal-Clear Flowing Water Inside the U-Channel */
    traceTrackPath(track.pts);
    var waterGrad = ctx.createLinearGradient(0, vh * 0.14, vw, track.yBot);
    if (isDark) {
      waterGrad.addColorStop(0, '#074B94');
      waterGrad.addColorStop(0.28, '#0D85DB');
      waterGrad.addColorStop(0.5, '#15C9EC');
      waterGrad.addColorStop(0.72, '#0D85DB');
      waterGrad.addColorStop(1, '#063C7A');
    } else {
      waterGrad.addColorStop(0, '#0968C4');
      waterGrad.addColorStop(0.24, '#1396EC');
      waterGrad.addColorStop(0.5, '#2AD9F7');
      waterGrad.addColorStop(0.76, '#1396EC');
      waterGrad.addColorStop(1, '#0968C4');
    }
    ctx.lineWidth = channelW;
    ctx.strokeStyle = waterGrad;
    ctx.stroke();

    /* Inner luminous aqua core */
    traceTrackPath(track.pts);
    var coreGrad = ctx.createLinearGradient(vw * 0.18, track.yBot - 20, vw * 0.82, track.yBot + 20);
    coreGrad.addColorStop(0, 'rgba(189, 235, 255, 0.16)');
    coreGrad.addColorStop(0.5, 'rgba(215, 249, 255, 0.46)');
    coreGrad.addColorStop(1, 'rgba(189, 235, 255, 0.16)');
    ctx.lineWidth = channelW * 0.46;
    ctx.strokeStyle = coreGrad;
    ctx.stroke();

    /* Continuous Animated Water Streamlines along U-Channel */
    for (var si = 0; si < streaks.length; si++) {
      var st = streaks[si];
      var f0 = (st.offset + flowTime * st.speed) % 1.0;
      var segSteps = 8;
      ctx.beginPath();
      for (var k = 0; k <= segSteps; k++) {
        var frac = f0 + (k / segSteps) * st.len;
        if (frac > 1) break;
        var sp = track.sampleAt(frac);
        var laneOffset = st.lane * (channelW * 0.44) + Math.sin(flowTime * 2.2 + si + k * 0.5) * 1.8;
        var sx = sp.x + sp.nx * laneOffset;
        var sy = sp.y + sp.ny * laneOffset;
        if (k === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.lineWidth = st.width;
      ctx.strokeStyle = 'rgba(235, 252, 255,' + st.alpha.toFixed(2) + ')';
      ctx.stroke();
    }

    /* Animated Micro-Bubbles Gliding Through the Water Current */
    for (var bi = 0; bi < bubbles.length; bi++) {
      var bb = bubbles[bi];
      var bf = (bb.offset + flowTime * bb.speed) % 1.0;
      var bp = track.sampleAt(bf);
      var bLane = bb.lane * (channelW * 0.42) + Math.sin(flowTime * 3.0 + bb.wobble) * 2.4;
      ctx.beginPath();
      ctx.arc(bp.x + bp.nx * bLane, bp.y + bp.ny * bLane, bb.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.54)';
      ctx.fill();
    }

    /* Sunlit Specular Top-Edge Acrylic Bevel Rim */
    ctx.save();
    ctx.translate(-1.5, -channelW * 0.42);
    traceTrackPath(track.pts);
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = isDark ? 'rgba(189, 235, 255, 0.25)' : 'rgba(255, 255, 255, 0.78)';
    ctx.stroke();
    ctx.restore();
    ctx.restore();

    /* 6. Choreographed 3D Spheres Gliding In from Both Inlets to Meet at Bottom Center */
    var sphereR = channelW * 0.58;
    var rollProg = evalSphereMotion(introTime);
    var approachBeam = clamp01((introTime - 1.55) / 0.85) * (1 - clamp01((introTime - 2.65) / 0.75) * 0.45);
    var meetGlow = easeOutCubic((introTime - 2.20) / 0.85);

    var halfGapFrac = (sphereR * 1.04) / Math.max(1, track.totalLen);
    var idleDrift = (introTime > 2.8) ? (Math.sin(flowTime * 1.15) * 0.0020 + pointer.x * 0.0055) : 0;

    /* At 00:00 (rollProg = 0): both spheres peek right at the upper-left and upper-right edges */
    var leftFrac  = 0.015 + (0.5 - halfGapFrac - 0.015) * rollProg + idleDrift;
    var rightFrac = 0.985 - (0.985 - (0.5 + halfGapFrac)) * rollProg + idleDrift;

    var leftPt  = track.sampleAt(leftFrac);
    var rightPt = track.sampleAt(rightFrac);

    /* Bright Aqua Caustic Light Cone Shooting Between the Two Approaching Spheres (Like hero.mp4 00:02!) */
    if (approachBeam > 0.02) {
      ctx.save();
      var beamGrad = ctx.createLinearGradient(leftPt.x, leftPt.y, rightPt.x, rightPt.y);
      beamGrad.addColorStop(0, 'rgba(21, 217, 242,' + (0.48 * approachBeam).toFixed(3) + ')');
      beamGrad.addColorStop(0.5, 'rgba(220, 250, 255,' + (0.68 * approachBeam).toFixed(3) + ')');
      beamGrad.addColorStop(1, 'rgba(21, 217, 242,' + (0.42 * approachBeam).toFixed(3) + ')');
      ctx.beginPath();
      ctx.moveTo(leftPt.x, leftPt.y - sphereR * 0.35);
      ctx.lineTo(rightPt.x, rightPt.y - sphereR * 0.25);
      ctx.lineTo(rightPt.x, rightPt.y + sphereR * 0.85);
      ctx.lineTo(leftPt.x, leftPt.y + sphereR * 0.85);
      ctx.closePath();
      ctx.fillStyle = beamGrad;
      ctx.filter = 'blur(14px)';
      ctx.fill();
      ctx.restore();
    }

    /* Soft Luminous Aqua Halo When Spheres Meet at Center */
    if (meetGlow > 0.01) {
      var midX = (leftPt.x + rightPt.x) * 0.5;
      var midY = (leftPt.y + rightPt.y) * 0.5;
      var pulse = 0.88 + 0.12 * Math.sin(flowTime * 2.4);
      var mg = ctx.createRadialGradient(midX, midY, sphereR * 0.1, midX, midY, sphereR * 2.9);
      mg.addColorStop(0, 'rgba(200, 248, 255,' + (0.64 * meetGlow * pulse).toFixed(3) + ')');
      mg.addColorStop(0.42, 'rgba(21, 217, 242,' + (0.28 * meetGlow * pulse).toFixed(3) + ')');
      mg.addColorStop(1, 'rgba(21, 217, 242, 0)');
      ctx.fillStyle = mg;
      ctx.beginPath();
      ctx.arc(midX, midY, sphereR * 2.9, 0, Math.PI * 2);
      ctx.fill();
    }

    var leftRollAngle = -(1 - rollProg) * Math.PI * 2.2 + pointer.x * 0.08;
    var rightRollAngle = (1 - rollProg) * Math.PI * 2.2 + pointer.x * 0.08;

    drawHydroWaterOrb(leftPt.x, leftPt.y, sphereR, leftRollAngle, meetGlow);
    drawMetallicTurbineOrb(rightPt.x, rightPt.y, sphereR, rightRollAngle);
  }

  requestAnimationFrame(render);
})();
