/* ==========================================================================
   Vortex Hydro — Cinematic Camera-Follow U-Channel Water-Flow Hero
   Exact hero.mp4 entrance choreography adapted with flowing Vortex Hydro water:
   - 0.0s: WIDE shot (zoom 0.72x) showing full U-channel + horizontal inlets,
     both spheres peeking at left & right mouths, typography hidden
   - 0.0s -> 3.0s: Camera continuously ZOOMS IN (0.72x -> 1.18x) and pans gently
     downward FOLLOWING the two spheres as they roll down the left & right curves
   - 0.85s -> 2.15s: Headline & paragraph emerge in sync with the camera zoom
   - 2.65s: Both spheres meet at bottom-center with soft cushioned bounce & aqua glow
   ========================================================================== */
(function initVortexChannelHero() {
  'use strict';

  var hero = document.getElementById('vx-hero');
  var canvas = document.getElementById('hero-liquid-canvas');
  var copyCol = document.getElementById('hero-copy');
  var heroTitle = copyCol ? copyCol.querySelector('.hero__title') : null;
  var heroLead = copyCol ? copyCol.querySelector('.hero__lead') : null;
  var scrollCue = document.querySelector('.hero__scroll-cue');
  if (!hero || !canvas) return;

  var ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  var root = document.documentElement;
  var mqDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
  var isDark = false;
  var curPal = 'vortex';

  var HERO_PALS = {
    vortex: {
      rgb: '18, 194, 233',
      rgbDeep: '11, 99, 214',
      lightWater: ['#0959BA', '#0E8EE8', '#22D3EE'],
      darkWater:  ['#07438A', '#0B7BD1', '#14C5E8'],
      drop:       ['#22D3EE', '#0EA5E9', '#0B63D6'],
      orbTint:    ['#FFFFFF', '#EEF8FF', '#BFE6F8', '#6ABCE6', '#3C8BC4'],
      core:       ['rgba(189,235,255,0.16)', 'rgba(215,249,255,0.46)'],
      beamMid:    'rgba(220,250,255,'
    },
    vokasi: {
      rgb: '245, 130, 31',
      rgbDeep: '217, 78, 20',
      lightWater: ['#B83C0E', '#E36119', '#F79D3B'],
      darkWater:  ['#7D2709', '#C44711', '#EC7E24'],
      drop:       ['#FDBA74', '#F5821F', '#C2410C'],
      orbTint:    ['#FFFFFF', '#FFF7F0', '#FDE0C6', '#F4AF76', '#CF6D2D'],
      core:       ['rgba(255,228,200,0.18)', 'rgba(255,244,230,0.46)'],
      beamMid:    'rgba(255,238,218,'
    },
    emerald: {
      rgb: '20, 184, 154',
      rgbDeep: '11, 132, 114',
      lightWater: ['#086E5F', '#0EA58C', '#34D3B4'],
      darkWater:  ['#064D43', '#0B7D6A', '#18B89C'],
      drop:       ['#5EEAD4', '#14B89A', '#0B7666'],
      orbTint:    ['#FFFFFF', '#EEFAF7', '#BCEEE1', '#6FD3BA', '#2E9680'],
      core:       ['rgba(190,247,232,0.16)', 'rgba(224,252,245,0.46)'],
      beamMid:    'rgba(218,252,242,'
    },
    sakura: {
      rgb: '236, 72, 153',
      rgbDeep: '192, 38, 125',
      lightWater: ['#9D1C69', '#D6338E', '#F472B6'],
      darkWater:  ['#6D1248', '#B12272', '#E554A1'],
      drop:       ['#F9A8D4', '#EC4899', '#A81C6E'],
      orbTint:    ['#FFFFFF', '#FDF2F8', '#FBCFE8', '#EC8BC0', '#BA4B89'],
      core:       ['rgba(252,216,236,0.16)', 'rgba(255,236,247,0.46)'],
      beamMid:    'rgba(255,230,244,'
    }
  };
  function getPal() { return HERO_PALS[curPal] || HERO_PALS.vortex; }

  function syncTheme() {
    var explicit = root.dataset.theme;
    if (explicit === 'dark') isDark = true;
    else if (explicit === 'light') isDark = false;
    else isDark = !!(mqDark && mqDark.matches);
    var p = root.dataset.pal;
    curPal = HERO_PALS[p] ? p : 'vortex';
  }
  syncTheme();
  if (mqDark && mqDark.addEventListener) mqDark.addEventListener('change', syncTheme);
  window.addEventListener('vx:palettechange', syncTheme);
  if ('MutationObserver' in window) {
    new MutationObserver(syncTheme).observe(root, { attributes: true, attributeFilter: ['data-theme', 'data-pal'] });
  }

  /* ---------- Seamless 512x512 Architectural Plastered Concrete Wall Texture (Periodic FBM) ---------- */
  function createConcreteWallPattern(darkMode) {
    var size = 512;
    var tc = document.createElement('canvas');
    tc.width = size;
    tc.height = size;
    var tctx = tc.getContext('2d');
    if (!tctx) return null;

    /* Deterministic PRNG for clean organic plaster clouds without harsh artifacts */
    var seed = darkMode ? 918273 : 428519;
    function rand() {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    }

    function makeGrid(g) {
      var arr = new Float32Array(g * g);
      for (var i = 0; i < arr.length; i++) arr[i] = rand() * 2 - 1;
      return arr;
    }

    function samplePeriodic(grid, g, u, v) {
      var gx = u * g;
      var gy = v * g;
      var x0 = Math.floor(gx);
      var y0 = Math.floor(gy);
      var fx = gx - x0;
      var fy = gy - y0;
      /* Quintic smoothstep: zero grid seams or circular spots */
      var sx = fx * fx * fx * (fx * (fx * 6 - 15) + 10);
      var sy = fy * fy * fy * (fy * (fy * 6 - 15) + 10);
      var ix0 = x0 % g;
      var iy0 = y0 % g;
      var ix1 = (ix0 + 1) % g;
      var iy1 = (iy0 + 1) % g;
      var n00 = grid[iy0 * g + ix0];
      var n10 = grid[iy0 * g + ix1];
      var n01 = grid[iy1 * g + ix0];
      var n11 = grid[iy1 * g + ix1];
      var nx0 = n00 + (n10 - n00) * sx;
      var nx1 = n01 + (n11 - n01) * sx;
      return nx0 + (nx1 - nx0) * sy;
    }

    var g4  = makeGrid(4);
    var g8  = makeGrid(8);
    var g16 = makeGrid(16);
    var g32 = makeGrid(32);

    var img = tctx.createImageData(size, size);
    var px = img.data;
    var baseR = darkMode ? 11 : 235;
    var baseG = darkMode ? 22 : 237;
    var baseB = darkMode ? 39 : 236;
    var cloudAmp = darkMode ? 10.5 : 13.5;
    var grainAmp = darkMode ? 7.5 : 8.5;

    for (var y = 0; y < size; y++) {
      var v = y / size;
      for (var x = 0; x < size; x++) {
        var u = x / size;
        var fbm =
          samplePeriodic(g4, 4, u, v) * 0.50 +
          samplePeriodic(g8, 8, u, v) * 0.28 +
          samplePeriodic(g16, 16, u, v) * 0.14 +
          samplePeriodic(g32, 32, u, v) * 0.08;

        var grain = (rand() - 0.5) * grainAmp;
        var delta = fbm * cloudAmp + grain;
        var idx = (y * size + x) * 4;
        px[idx]     = Math.max(0, Math.min(255, baseR + delta));
        px[idx + 1] = Math.max(0, Math.min(255, baseG + delta * (darkMode ? 1.05 : 1.0)));
        px[idx + 2] = Math.max(0, Math.min(255, baseB + delta * (darkMode ? 1.15 : 0.98)));
        px[idx + 3] = 255;
      }
    }
    tctx.putImageData(img, 0, 0);

    /* Subtle architectural trowel wisps (wrapped toroidally so seamless) */
    tctx.strokeStyle = darkMode ? 'rgba(180,220,255,0.022)' : 'rgba(255,255,255,0.22)';
    tctx.lineWidth = 1;
    for (var s = 0; s < 26; s++) {
      var sx = rand() * size;
      var sy = rand() * size;
      var slen = 36 + rand() * 90;
      var sdy = (rand() - 0.5) * 4;
      for (var ox = -size; ox <= size; ox += size) {
        tctx.beginPath();
        tctx.moveTo(sx + ox, sy);
        tctx.lineTo(sx + ox + slen, sy + sdy);
        tctx.stroke();
      }
    }

    /* Fine architectural micro-pores (delicate, realistic micro-cement pinholes) */
    for (var p = 0; p < 110; p++) {
      var px0 = rand() * size;
      var py0 = rand() * size;
      var pr = 0.5 + rand() * 0.95;
      tctx.beginPath();
      tctx.arc(px0 + 0.45, py0 + 0.45, pr, 0, Math.PI * 2);
      tctx.fillStyle = darkMode ? 'rgba(160, 200, 235, 0.06)' : 'rgba(255, 255, 255, 0.42)';
      tctx.fill();
      tctx.beginPath();
      tctx.arc(px0, py0, pr, 0, Math.PI * 2);
      tctx.fillStyle = darkMode ? 'rgba(2, 6, 14, 0.38)' : 'rgba(104, 112, 122, 0.17)';
      tctx.fill();
    }

    return ctx.createPattern(tc, 'repeat');
  }

  var lightWallPattern = createConcreteWallPattern(false);
  var darkWallPattern  = createConcreteWallPattern(true);

  /* ---------- Responsive Sizing ---------- */
  var vw = 1280, vh = 720, dpr = 1;
  var cachedTrack = null;

  function buildWorldUTrack(w, h) {
    var isMob = w < 720;
    /* Static World-Space U-Channel (The Camera zooms IN from 0.72x -> 1.18x across this world!) */
    var xLeftIn   = -w * 0.24;
    var xLeftArm  = w * (isMob ? 0.115 : 0.135);
    var xLeftBot  = w * (isMob ? 0.28 : 0.28);
    var xRightBot = w - xLeftBot;
    var xRightArm = w - xLeftArm;
    var xRightOut = w * 1.24;

    var yTop = h * (isMob ? 0.22 : 0.21);
    var yBot = h * (isMob ? 0.76 : 0.74);

    var segs = [
      /* 0: Far-left horizontal entrance curving down into left slope */
      [
        { x: xLeftIn, y: yTop },
        { x: xLeftArm * 0.38, y: yTop },
        { x: xLeftArm * 0.85, y: yTop + (yBot - yTop) * 0.04 },
        { x: xLeftArm * 1.05, y: yTop + (yBot - yTop) * 0.34 }
      ],
      /* 1: Steep left curve bending into bottom-left corner */
      [
        { x: xLeftArm * 1.05, y: yTop + (yBot - yTop) * 0.34 },
        { x: xLeftArm * 1.28, y: yBot - (yBot - yTop) * 0.14 },
        { x: xLeftBot - (xLeftBot - xLeftArm) * 0.55, y: yBot },
        { x: xLeftBot, y: yBot }
      ],
      /* 2: Horizontal bottom trough */
      [
        { x: xLeftBot, y: yBot },
        { x: xLeftBot + (xRightBot - xLeftBot) * 0.33, y: yBot },
        { x: xLeftBot + (xRightBot - xLeftBot) * 0.67, y: yBot },
        { x: xRightBot, y: yBot }
      ],
      /* 3: Bottom-right corner sweeping up right arm */
      [
        { x: xRightBot, y: yBot },
        { x: xRightBot + (xRightArm - xRightBot) * 0.55, y: yBot },
        { x: w - xLeftArm * 1.28, y: yBot - (yBot - yTop) * 0.14 },
        { x: w - xLeftArm * 1.05, y: yTop + (yBot - yTop) * 0.34 }
      ],
      /* 4: Upper-right bend exiting far right */
      [
        { x: w - xLeftArm * 1.05, y: yTop + (yBot - yTop) * 0.34 },
        { x: w - xLeftArm * 0.85, y: yTop + (yBot - yTop) * 0.04 },
        { x: w - xLeftArm * 0.38, y: yTop },
        { x: xRightOut, y: yTop }
      ]
    ];

    var pts = [];
    var cumLen = [0];
    var stepsPerSeg = 36;

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

    return { pts: pts, totalLen: totalLen, sampleAt: sampleAt, yTop: yTop, yBot: yBot };
  }

  function handleResize() {
    var r = hero.getBoundingClientRect();
    if (!r.width || !r.height) return;
    vw = r.width;
    vh = r.height;
    dpr = Math.min(1.75, window.devicePixelRatio || 1);
    canvas.width = Math.max(1, Math.round(vw * dpr));
    canvas.height = Math.max(1, Math.round(vh * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cachedTrack = buildWorldUTrack(vw, vh);
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
  }
  window.addEventListener('scroll', updateHeroScroll, { passive: true });
  window.addEventListener('resize', updateHeroScroll, { passive: true });
  updateHeroScroll();

  /* ---------- Easing Helpers ---------- */
  function clamp01(v) { return v < 0 ? 0 : (v > 1 ? 1 : v); }
  function easeOutCubic(t) { return 1 - Math.pow(1 - clamp01(t), 3); }
  function easeInOutCubic(t) {
    t = clamp01(t);
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
  function easeInOutQuart(t) {
    t = clamp01(t);
    return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
  }

  /* Exact collision timestamp: spheres collide at bottom-center -> calm water shockwave ripples -> hero text emerges */
  var IMPACT_T = 2.55;

  function evalSphereRoll(timeSec) {
    var t = clamp01((timeSec - 0.15) / (IMPACT_T - 0.15));
    var base = easeInOutQuart(t);
    var bounce = 0;
    if (timeSec > IMPACT_T) {
      var bt = timeSec - IMPACT_T;
      bounce = Math.exp(-bt * 4.2) * Math.sin(bt * 10.5) * 0.0085;
    }
    return clamp01(base - Math.abs(bounce));
  }

  /* Organic calm-water ripple path with gentle liquid micro-undulation (never a rigid compass circle) */
  function traceOrganicRipple(cx, cy, baseR, phase, amp) {
    var segs = 72;
    ctx.beginPath();
    for (var s = 0; s <= segs; s++) {
      var ang = (s / segs) * Math.PI * 2;
      var wobble =
        Math.sin(ang * 3 + phase) * amp +
        Math.cos(ang * 5 - phase * 1.3) * (amp * 0.45) +
        Math.sin(ang * 2 - phase * 0.7) * (amp * 0.35);
      var rr = Math.max(2, baseR + wobble);
      var px = cx + Math.cos(ang) * rr;
      var py = cy + Math.sin(ang) * rr * 0.96; /* subtle natural perspective foreshortening */
      if (s === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }

  /* Natural dispersive calm-water ripple train radiating smoothly from the two-sphere touch */
  function drawCalmWaterShockwave(cx, cy, sphereR, dtImpact, pal) {
    if (dtImpact <= 0 || dtImpact > 3.2) return;
    ctx.save();

    /* 1. Soft liquid meniscus pulse right at the touch point (feathery radial gradient) */
    if (dtImpact < 0.78) {
      var ip = clamp01(dtImpact / 0.78);
      var flashAlpha = Math.sin(ip * Math.PI) * Math.exp(-ip * 1.2) * (isDark ? 0.32 : 0.38);
      var flashR = sphereR * (0.85 + Math.pow(ip, 0.7) * 2.5);
      var fg = ctx.createRadialGradient(cx, cy, sphereR * 0.1, cx, cy, flashR);
      fg.addColorStop(0, pal.beamMid + flashAlpha.toFixed(3) + ')');
      fg.addColorStop(0.5, 'rgba(' + pal.rgb + ',' + (flashAlpha * 0.42).toFixed(3) + ')');
      fg.addColorStop(1, 'rgba(' + pal.rgb + ',0)');
      ctx.fillStyle = fg;
      ctx.beginPath();
      ctx.arc(cx, cy, flashR, 0, Math.PI * 2);
      ctx.fill();
    }

    /* 2. Dispersive 5-wave calm pond ripple train (lead wave broader/faster, trailing capillary ripples finer/softer) */
    var waves = [
      { delay: 0.00, dur: 2.35, maxScale: 0.48, w0: 14, crest: 2.6, amp: 2.8, strength: 1.00, phase: 0.4 },
      { delay: 0.16, dur: 2.40, maxScale: 0.41, w0: 11, crest: 2.0, amp: 2.2, strength: 0.76, phase: 1.7 },
      { delay: 0.35, dur: 2.45, maxScale: 0.34, w0:  8, crest: 1.6, amp: 1.7, strength: 0.56, phase: 3.1 },
      { delay: 0.56, dur: 2.40, maxScale: 0.27, w0:  6, crest: 1.2, amp: 1.3, strength: 0.38, phase: 4.5 },
      { delay: 0.80, dur: 2.30, maxScale: 0.20, w0:  5, crest: 1.0, amp: 1.0, strength: 0.24, phase: 5.8 }
    ];
    var span = Math.max(vw, vh);

    for (var i = 0; i < waves.length; i++) {
      var wv = waves[i];
      var rt = dtImpact - wv.delay;
      if (rt <= 0 || rt >= wv.dur) continue;
      var p = rt / wv.dur;

      /* Natural water wave deceleration (fast initial release -> tranquil drifting outward) */
      var easeWave = 1 - Math.pow(1 - p, 2.6);
      var r = sphereR * 0.65 + easeWave * (span * wv.maxScale);

      /* Smooth bell fade-in + natural exponential viscous water damping */
      var fadeIn = clamp01(p / 0.10);
      var fadeOut = Math.exp(-p * 2.45) * (1 - p);
      var a = fadeIn * fadeOut * wv.strength;
      if (a < 0.003) continue;

      var phase = wv.phase + dtImpact * 1.4;
      var wobbleAmp = wv.amp * (0.45 + 0.55 * easeWave);
      var bandW = Math.max(2.0, wv.w0 * (0.75 + p * 0.85));

      /* Layer A: Soft feathery blurred water-refraction swell (radial gradient band via blurred stroke) */
      ctx.save();
      ctx.filter = 'blur(' + (4 + p * 5).toFixed(1) + 'px)';
      traceOrganicRipple(cx, cy, r, phase, wobbleAmp);
      ctx.strokeStyle = 'rgba(' + pal.rgb + ',' + (a * (isDark ? 0.34 : 0.24)).toFixed(3) + ')';
      ctx.lineWidth = bandW;
      ctx.stroke();
      ctx.restore();

      /* Layer B: Subtle calm-water trough shadow just inside the crest (gives natural 3D water depth) */
      if (r > 12) {
        ctx.save();
        ctx.filter = 'blur(2.5px)';
        traceOrganicRipple(cx, cy, r - bandW * 0.38, phase, wobbleAmp * 0.9);
        ctx.strokeStyle = isDark
          ? 'rgba(2, 10, 24,' + (a * 0.38).toFixed(3) + ')'
          : 'rgba(14, 38, 66,' + (a * 0.11).toFixed(3) + ')';
        ctx.lineWidth = Math.max(1.2, bandW * 0.36);
        ctx.stroke();
        ctx.restore();
      }

      /* Layer C: Feathery luminous specular water crest (softly blurred so never razor-harsh) */
      ctx.save();
      ctx.filter = 'blur(1.6px)';
      traceOrganicRipple(cx, cy, r + bandW * 0.14, phase, wobbleAmp);
      ctx.strokeStyle = isDark
        ? 'rgba(215, 248, 255,' + (a * 0.44).toFixed(3) + ')'
        : 'rgba(255, 255, 255,' + (a * 0.72).toFixed(3) + ')';
      ctx.lineWidth = Math.max(0.8, wv.crest * (1 - p * 0.45));
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
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
  for (var st = 0; st < 32; st++) {
    streaks.push({
      offset: st / 32,
      lane: (Math.random() - 0.5) * 0.66,
      len: 0.022 + Math.random() * 0.042,
      speed: 0.10 + Math.random() * 0.06,
      width: 1.4 + Math.random() * 2.2,
      alpha: 0.22 + Math.random() * 0.36
    });
  }

  var bubbles = [];
  for (var bi = 0; bi < 20; bi++) {
    bubbles.push({
      offset: Math.random(),
      lane: (Math.random() - 0.5) * 0.62,
      r: 1.6 + Math.random() * 2.8,
      speed: 0.085 + Math.random() * 0.055,
      wobble: Math.random() * Math.PI * 2
    });
  }

  /* ---------- 3D Shaded Spheres ---------- */
  function drawHydroWaterOrb(x, y, r, rollAngle, meetGlow) {
    var pal = getPal();
    ctx.save();

    /* Ground cast shadow */
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(x + r * 0.32, y + r * 0.52, r * 1.08, r * 0.68, 0.24, 0, Math.PI * 2);
    ctx.fillStyle = isDark ? 'rgba(0, 0, 0, 0.58)' : 'rgba(15, 28, 46, 0.24)';
    ctx.filter = 'blur(13px)';
    ctx.fill();
    ctx.restore();

    if (meetGlow > 0.01) {
      var cg = ctx.createRadialGradient(x + r * 0.55, y + r * 0.45, r * 0.1, x + r * 0.55, y + r * 0.45, r * 1.9);
      cg.addColorStop(0, 'rgba(' + pal.rgb + ',' + (0.36 * meetGlow).toFixed(3) + ')');
      cg.addColorStop(1, 'rgba(' + pal.rgb + ',0)');
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.arc(x + r * 0.55, y + r * 0.45, r * 1.9, 0, Math.PI * 2);
      ctx.fill();
    }

    var bg = ctx.createRadialGradient(x - r * 0.36, y - r * 0.38, r * 0.08, x, y, r);
    bg.addColorStop(0.0, pal.orbTint[0]);
    bg.addColorStop(0.42, pal.orbTint[1]);
    bg.addColorStop(0.76, pal.orbTint[2]);
    bg.addColorStop(0.93, pal.orbTint[3]);
    bg.addColorStop(1.0, pal.orbTint[4]);

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = bg;
    ctx.fill();

    var rim = ctx.createRadialGradient(x + r * 0.4, y + r * 0.42, r * 0.1, x, y, r);
    rim.addColorStop(0, 'rgba(' + pal.rgb + ',0.50)');
    rim.addColorStop(0.6, 'rgba(' + pal.rgb + ',0)');
    ctx.fillStyle = rim;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rollAngle);

    ctx.beginPath();
    ctx.arc(0, 0, r * 0.48, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(' + pal.rgbDeep + ',0.24)';
    ctx.lineWidth = Math.max(1.5, r * 0.05);
    ctx.stroke();

    var dr = r * 0.34;
    ctx.beginPath();
    ctx.moveTo(0, -dr * 1.15);
    ctx.bezierCurveTo(dr * 0.85, -dr * 0.15, dr * 0.92, dr * 0.82, 0, dr * 0.95);
    ctx.bezierCurveTo(-dr * 0.92, dr * 0.82, -dr * 0.85, -dr * 0.15, 0, -dr * 1.15);
    ctx.closePath();

    var dropGrad = ctx.createLinearGradient(0, -dr, 0, dr);
    dropGrad.addColorStop(0, pal.drop[0]);
    dropGrad.addColorStop(0.55, pal.drop[1]);
    dropGrad.addColorStop(1, pal.drop[2]);
    ctx.shadowColor = 'rgba(' + pal.rgb + ',0.65)';
    ctx.shadowBlur = 12;
    ctx.fillStyle = dropGrad;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.beginPath();
    ctx.ellipse(-dr * 0.24, dr * 0.12, dr * 0.14, dr * 0.26, -0.35, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fill();
    ctx.restore();

    ctx.beginPath();
    ctx.ellipse(x - r * 0.34, y - r * 0.36, r * 0.22, r * 0.12, -0.68, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.fill();

    ctx.restore();
  }

  function drawMetallicTurbineOrb(x, y, r, rollAngle) {
    ctx.save();

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(x + r * 0.34, y + r * 0.52, r * 1.08, r * 0.68, 0.24, 0, Math.PI * 2);
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

    var palM = getPal();
    var bounce = ctx.createRadialGradient(x - r * 0.42, y + r * 0.38, r * 0.05, x - r * 0.42, y + r * 0.38, r * 0.95);
    bounce.addColorStop(0, 'rgba(' + palM.rgb + ',0.55)');
    bounce.addColorStop(0.6, 'rgba(' + palM.rgbDeep + ',0.14)');
    bounce.addColorStop(1, 'rgba(' + palM.rgb + ',0)');
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

  /* ---------- Visibility Pause & Always-Active Cinema Entrance Clock ---------- */
  var isInView = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { isInView = entry.isIntersecting; });
    }, { threshold: 0.02 }).observe(hero);
  }

  /* ALWAYS start at 0.0s so the cinema wide -> zoom-in follow intro plays on every page load! */
  var introTime = 0;
  var flowTime = 0;
  var lastT = performance.now();

  window.__vxReplayHero = function () {
    introTime = 0;
  };

  /* ---------- Frame-Locked Typography Sync (Stays hidden until two spheres collide & calm water shockwave expands!) ---------- */
  function syncHeroText(t, scrollP) {
    var scrollFade = Math.max(0, 1 - scrollP * 1.35);
    var scrollLift = -scrollP * 48;

    if (heroTitle) {
      var tp = easeOutCubic((t - (IMPACT_T + 0.12)) / 0.92);
      var op = tp * scrollFade;
      var sc = 0.94 + tp * 0.06;
      var ty = (1 - tp) * 18 + scrollLift;
      heroTitle.style.opacity = op.toFixed(3);
      heroTitle.style.transform = 'translate3d(0,' + ty.toFixed(1) + 'px,0) scale(' + sc.toFixed(3) + ')';
    }
    if (heroLead) {
      var lp = easeOutCubic((t - (IMPACT_T + 0.38)) / 0.92);
      var lop = lp * scrollFade;
      var lsc = 0.96 + lp * 0.04;
      var lty = (1 - lp) * 14 + scrollLift;
      heroLead.style.opacity = lop.toFixed(3);
      heroLead.style.transform = 'translate3d(0,' + lty.toFixed(1) + 'px,0) scale(' + lsc.toFixed(3) + ')';
    }
    if (scrollCue) {
      var cp = easeOutCubic((t - (IMPACT_T + 0.95)) / 0.75);
      var cop = cp * Math.max(0, 1 - scrollP * 2.2);
      scrollCue.style.opacity = cop.toFixed(3);
      scrollCue.style.transform = 'translate3d(-50%,' + (-scrollP * 26).toFixed(1) + 'px,0)';
    }
  }
  syncHeroText(0, 0);

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

    introTime = Math.min(8.0, introTime + dt);
    flowTime += dt;

    /* Sync typography directly to the sphere & camera timeline */
    syncHeroText(introTime, scrollProg);

    if (!cachedTrack) cachedTrack = buildWorldUTrack(vw, vh);
    var track = cachedTrack;
    var isMob = vw < 720;

    var channelW = Math.max(42, Math.min(82, Math.min(vw, vh) * 0.088));
    var wallW = channelW + 18;
    var sphereR = channelW * 0.60;

    /* ---------- Compute Rolling Sphere Positions Along World U-Channel ---------- */
    var rollProg = evalSphereRoll(introTime);
    var halfGapFrac = (sphereR * 1.05) / Math.max(1, track.totalLen);
    var idleDrift = (introTime > 3.1) ? (Math.sin(flowTime * 1.15) * 0.0018 + pointer.x * 0.005) : 0;

    /* At t=0.0s (rollProg=0): spheres peek in at far left & right horizontal inlets (0.11 & 0.89 in wide view) */
    var startFracL = isMob ? 0.13 : 0.115;
    var startFracR = 1.0 - startFracL;
    var leftFrac  = startFracL + (0.5 - halfGapFrac - startFracL) * rollProg + idleDrift;
    var rightFrac = startFracR - (startFracR - (0.5 + halfGapFrac)) * rollProg + idleDrift;

    var leftPt  = track.sampleAt(leftFrac);
    var rightPt = track.sampleAt(rightFrac);

    /* ---------- CINEMATIC CAMERA ZOOM-IN FOLLOWING BOTH SPHERES! ----------
       - 0.0s (Wide Shot): camZoom = 0.72x -> sees ENTIRE U-channel + horizontal top arms + peeking spheres
       - 0.0s -> 2.95s: camera zooms IN (0.72x -> 1.18x desktop / 1.08x mobile) and tracks downward
         following the Y descent of the two spheres into the bottom-center cradle! */
    var camEase = easeInOutCubic((introTime - 0.08) / 2.85);
    var zoomStart = isMob ? 0.74 : 0.72;
    var zoomEnd   = isMob ? 1.14 : 1.18;
    var camZoom   = zoomStart + (zoomEnd - zoomStart) * camEase - scrollProg * 0.08;

    /* Follow-cam Y center tracks down with the falling spheres */
    var sphereYNorm = (leftPt.y - track.yTop) / Math.max(1, track.yBot - track.yTop);
    var camFocusY = vh * 0.45 + sphereYNorm * (vh * 0.085) - scrollProg * (vh * 0.08);
    var camFocusX = vw * 0.50 + pointer.x * 10;

    ctx.clearRect(0, 0, vw, vh);

    ctx.save();
    /* Apply real 2D cinema dolly-in & vertical follow-cam transform */
    ctx.translate(vw * 0.5, vh * 0.5);
    ctx.scale(camZoom, camZoom);
    ctx.translate(-camFocusX, -camFocusY);

    /* 1. Textured Architectural Concrete Wall (Zooms physically with the camera lens!) */
    var padX = vw * 0.65, padY = vh * 0.65;
    var wallPat = isDark ? darkWallPattern : lightWallPattern;
    if (wallPat) {
      ctx.fillStyle = wallPat;
      ctx.fillRect(-padX, -padY, vw + padX * 2, vh + padY * 2);
    } else {
      ctx.fillStyle = isDark ? '#0A1526' : '#E9EAE8';
      ctx.fillRect(-padX, -padY, vw + padX * 2, vh + padY * 2);
    }

    /* Studio Lighting Falloff + Diagonal Window Sunlight Shaft */
    var vig = ctx.createRadialGradient(vw * 0.44, vh * 0.42, vw * 0.12, vw * 0.5, vh * 0.5, Math.max(vw, vh) * 0.95);
    if (isDark) {
      vig.addColorStop(0, 'rgba(18, 42, 74, 0.16)');
      vig.addColorStop(1, 'rgba(3, 8, 18, 0.55)');
    } else {
      vig.addColorStop(0, 'rgba(255, 255, 255, 0.34)');
      vig.addColorStop(0.65, 'rgba(230, 234, 238, 0.05)');
      vig.addColorStop(1, 'rgba(42, 52, 66, 0.15)');
    }
    ctx.fillStyle = vig;
    ctx.fillRect(-padX, -padY, vw + padX * 2, vh + padY * 2);

    ctx.save();
    var sunShift = pointer.x * 24;
    ctx.beginPath();
    ctx.moveTo(vw * 0.44 + sunShift * 0.4, -padY);
    ctx.lineTo(vw + padX, -padY);
    ctx.lineTo(vw + padX, vh * 0.64);
    ctx.closePath();
    ctx.fillStyle = isDark ? 'rgba(2, 6, 14, 0.34)' : 'rgba(36, 44, 56, 0.09)';
    ctx.filter = 'blur(26px)';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-padX, vh * 0.46);
    ctx.lineTo(vw * 0.48 + sunShift * 0.5, -padY);
    ctx.lineTo(vw * 0.94 + sunShift * 0.5, -padY);
    ctx.lineTo(vw * 0.34 + sunShift * 0.3, vh + padY);
    ctx.lineTo(-padX, vh + padY);
    ctx.closePath();
    var shaftGrad = ctx.createLinearGradient(0, vh * 0.15, vw * 0.78, vh * 0.85);
    if (isDark) {
      shaftGrad.addColorStop(0, 'rgba(21, 217, 242, 0.08)');
      shaftGrad.addColorStop(0.55, 'rgba(22, 139, 255, 0.035)');
      shaftGrad.addColorStop(1, 'rgba(21, 217, 242, 0)');
    } else {
      shaftGrad.addColorStop(0, 'rgba(255, 253, 248, 0.46)');
      shaftGrad.addColorStop(0.55, 'rgba(255, 255, 255, 0.16)');
      shaftGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    }
    ctx.fillStyle = shaftGrad;
    ctx.filter = 'blur(22px)';
    ctx.fill();
    ctx.restore();

    /* 2. Cast Shadow of Sculpted U-Channel onto Concrete Wall */
    ctx.save();
    ctx.translate(18 + pointer.x * 6, 26 + pointer.y * 4);
    traceTrackPath(track.pts);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = wallW + 8;
    ctx.strokeStyle = isDark ? 'rgba(0, 0, 0, 0.58)' : 'rgba(28, 36, 48, 0.19)';
    ctx.filter = 'blur(20px)';
    ctx.stroke();
    ctx.restore();

    /* 3. Sculpted Acrylic / Brushed Metal U-Channel Casing */
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    traceTrackPath(track.pts);
    var wallGrad = ctx.createLinearGradient(0, track.yTop, 0, track.yBot + wallW);
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

    /* 4. Living Crystal-Clear Flowing Water Inside U-Channel (Palette-Synchronized) */
    var pal = getPal();
    var wStops = isDark ? pal.darkWater : pal.lightWater;
    traceTrackPath(track.pts);
    var waterGrad = ctx.createLinearGradient(0, track.yTop, vw, track.yBot);
    waterGrad.addColorStop(0, wStops[0]);
    waterGrad.addColorStop(0.26, wStops[1]);
    waterGrad.addColorStop(0.5, wStops[2]);
    waterGrad.addColorStop(0.74, wStops[1]);
    waterGrad.addColorStop(1, wStops[0]);
    ctx.lineWidth = channelW;
    ctx.strokeStyle = waterGrad;
    ctx.stroke();

    traceTrackPath(track.pts);
    var coreGrad = ctx.createLinearGradient(vw * 0.18, track.yBot - 20, vw * 0.82, track.yBot + 20);
    coreGrad.addColorStop(0, pal.core[0]);
    coreGrad.addColorStop(0.5, pal.core[1]);
    coreGrad.addColorStop(1, pal.core[0]);
    ctx.lineWidth = channelW * 0.46;
    ctx.strokeStyle = coreGrad;
    ctx.stroke();

    /* Continuous Flowing Water Streamlines */
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

    /* Animated Micro-Bubbles */
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

    /* Glossy Top-Edge Acrylic Rim */
    ctx.save();
    ctx.translate(-1.5, -channelW * 0.42);
    traceTrackPath(track.pts);
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = isDark ? 'rgba(189, 235, 255, 0.25)' : 'rgba(255, 255, 255, 0.78)';
    ctx.stroke();
    ctx.restore();
    ctx.restore();

    /* 5. Approach Light Beam, Calm Water Collision Shockwave & Meet Glow Between the Two Rolling Spheres */
    var approachBeam = clamp01((introTime - 1.55) / 0.80) * (1 - clamp01((introTime - (IMPACT_T + 0.10)) / 0.70) * 0.45);
    var meetGlow = easeOutCubic((introTime - (IMPACT_T - 0.18)) / 0.78);
    var midX = (leftPt.x + rightPt.x) * 0.5;
    var midY = (leftPt.y + rightPt.y) * 0.5;

    /* Expanding serene calm-water shockwave rings right when the two spheres collide! */
    drawCalmWaterShockwave(midX, midY, sphereR, introTime - IMPACT_T, pal);

    if (approachBeam > 0.02) {
      ctx.save();
      var beamGrad = ctx.createLinearGradient(leftPt.x, leftPt.y, rightPt.x, rightPt.y);
      beamGrad.addColorStop(0, 'rgba(' + pal.rgb + ',' + (0.48 * approachBeam).toFixed(3) + ')');
      beamGrad.addColorStop(0.5, pal.beamMid + (0.68 * approachBeam).toFixed(3) + ')');
      beamGrad.addColorStop(1, 'rgba(' + pal.rgb + ',' + (0.42 * approachBeam).toFixed(3) + ')');
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

    if (meetGlow > 0.01) {
      var pulse = 0.88 + 0.12 * Math.sin(flowTime * 2.4);
      var mg = ctx.createRadialGradient(midX, midY, sphereR * 0.1, midX, midY, sphereR * 2.9);
      mg.addColorStop(0, pal.beamMid + (0.64 * meetGlow * pulse).toFixed(3) + ')');
      mg.addColorStop(0.42, 'rgba(' + pal.rgb + ',' + (0.28 * meetGlow * pulse).toFixed(3) + ')');
      mg.addColorStop(1, 'rgba(' + pal.rgb + ',0)');
      ctx.fillStyle = mg;
      ctx.beginPath();
      ctx.arc(midX, midY, sphereR * 2.9, 0, Math.PI * 2);
      ctx.fill();
    }

    var leftRollAngle = -(1 - rollProg) * Math.PI * 2.4 + pointer.x * 0.08;
    var rightRollAngle = (1 - rollProg) * Math.PI * 2.4 + pointer.x * 0.08;

    drawHydroWaterOrb(leftPt.x, leftPt.y, sphereR, leftRollAngle, meetGlow);
    drawMetallicTurbineOrb(rightPt.x, rightPt.y, sphereR, rightRollAngle);

    ctx.restore();
  }

  requestAnimationFrame(render);
})();
