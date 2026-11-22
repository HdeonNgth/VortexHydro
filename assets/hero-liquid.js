/* ==========================================================================
   Vortex Hydro — Architectural U-Channel Water-Flow Hero (Inspired by hero.mp4)
   - Matte architectural studio surface with subtle stone grain & diagonal sunlight
   - Expanding sculpted translucent U-channel filled with living flowing cyan/blue water
   - Two 3D-shaded spheres (Hydro Water Emblem Orb + Polished Chrome Turbine Orb)
     gliding down both arms of the U-channel to meet gracefully at bottom center
   - Continuous water streamlines, caustics, bubbles, pointer sway & scroll exit
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

  /* ---------- Pre-Generated Matte Architectural Stone Grain Pattern ---------- */
  var grainCanvas = document.createElement('canvas');
  grainCanvas.width = 180;
  grainCanvas.height = 180;
  var gctx = grainCanvas.getContext('2d');
  if (gctx) {
    var imgData = gctx.createImageData(180, 180);
    var d = imgData.data;
    for (var gi = 0; gi < d.length; gi += 4) {
      var v = Math.random() > 0.5 ? 255 : 0;
      d[gi] = v;
      d[gi + 1] = v;
      d[gi + 2] = v;
      d[gi + 3] = Math.floor(Math.random() * 14);
    }
    gctx.putImageData(imgData, 0, 0);
  }
  var grainPattern = ctx.createPattern(grainCanvas, 'repeat');

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

  /* ---------- Easing Helpers ---------- */
  function clamp01(v) { return v < 0 ? 0 : (v > 1 ? 1 : v); }
  function easeOutQuart(t) { return 1 - Math.pow(1 - clamp01(t), 4); }
  function easeInOutCubic(t) {
    t = clamp01(t);
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /* ---------- Smooth Symmetric U-Channel Polyline Sampler ----------
     Builds an architectural rounded U-track from upper-left -> down -> bottom trough -> up -> upper-right.
     Returns sampled points + cumulative arc lengths so water streaks & rolling spheres follow the EXACT centerline! */
  function buildUTrack(w, h, openEase, scrollOffset) {
    var isMob = w < 720;

    /* Expand smoothly from compact initial frame (00:00) into wide architectural cradle (00:02) */
    var compactX = isMob ? 0.05 : 0.13;
    var openX    = isMob ? 0.03 : 0.055;
    var sideXFrac = compactX + (openX - compactX) * openEase;

    var topYFrac    = (isMob ? 0.14 : 0.12) + (1 - openEase) * 0.05;
    var bottomYFrac = (isMob ? 0.78 : 0.76) - (1 - openEase) * 0.06 + scrollOffset * 0.10;

    var xLeftIn   = -w * 0.04;
    var xLeftArm  = w * sideXFrac + (isMob ? 24 : 52);
    var xLeftBot  = w * (isMob ? 0.24 : 0.25);
    var xRightBot = w - xLeftBot;
    var xRightArm = w - xLeftArm;
    var xRightOut = w * 1.04;

    var yTop = h * topYFrac;
    var yBot = h * bottomYFrac;

    /* 5 cubic Bezier segments forming a silky symmetric U-channel */
    var segs = [
      /* 0: Upper-left horizontal entry bending down into left slope */
      [
        { x: xLeftIn, y: yTop },
        { x: xLeftArm * 0.52, y: yTop },
        { x: xLeftArm * 0.82, y: yTop + (yBot - yTop) * 0.06 },
        { x: xLeftArm * 1.05, y: yTop + (yBot - yTop) * 0.34 }
      ],
      /* 1: Left descending arm curving smoothly into bottom-left corner */
      [
        { x: xLeftArm * 1.05, y: yTop + (yBot - yTop) * 0.34 },
        { x: xLeftArm * 1.32, y: yBot - (yBot - yTop) * 0.16 },
        { x: xLeftBot - (xLeftBot - xLeftArm) * 0.52, y: yBot },
        { x: xLeftBot, y: yBot }
      ],
      /* 2: Flat architectural bottom trough */
      [
        { x: xLeftBot, y: yBot },
        { x: xLeftBot + (xRightBot - xLeftBot) * 0.33, y: yBot },
        { x: xLeftBot + (xRightBot - xLeftBot) * 0.67, y: yBot },
        { x: xRightBot, y: yBot }
      ],
      /* 3: Bottom-right corner sweeping up into right ascending arm */
      [
        { x: xRightBot, y: yBot },
        { x: xRightBot + (xRightArm - xRightBot) * 0.52, y: yBot },
        { x: w - xLeftArm * 1.32, y: yBot - (yBot - yTop) * 0.16 },
        { x: w - xLeftArm * 1.05, y: yTop + (yBot - yTop) * 0.34 }
      ],
      /* 4: Upper-right arm curving out horizontally */
      [
        { x: w - xLeftArm * 1.05, y: yTop + (yBot - yTop) * 0.34 },
        { x: w - xLeftArm * 0.82, y: yTop + (yBot - yTop) * 0.06 },
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
  for (var st = 0; st < 28; st++) {
    streaks.push({
      offset: st / 28,
      lane: (Math.random() - 0.5) * 0.66,
      len: 0.025 + Math.random() * 0.042,
      speed: 0.11 + Math.random() * 0.06,
      width: 1.5 + Math.random() * 2.4,
      alpha: 0.22 + Math.random() * 0.36
    });
  }

  var bubbles = [];
  for (var bi = 0; bi < 18; bi++) {
    bubbles.push({
      offset: Math.random(),
      lane: (Math.random() - 0.5) * 0.62,
      r: 1.8 + Math.random() * 3.0,
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
    ctx.ellipse(x + r * 0.28, y + r * 0.52, r * 1.05, r * 0.68, 0.22, 0, Math.PI * 2);
    ctx.fillStyle = isDark ? 'rgba(0, 0, 0, 0.55)' : 'rgba(6, 27, 73, 0.22)';
    ctx.filter = 'blur(12px)';
    ctx.fill();
    ctx.restore();

    /* Luminous cyan floor caustic bounce */
    if (meetGlow > 0.01) {
      var cg = ctx.createRadialGradient(x + r * 0.55, y + r * 0.45, r * 0.1, x + r * 0.55, y + r * 0.45, r * 1.8);
      cg.addColorStop(0, 'rgba(21, 217, 242,' + (0.34 * meetGlow).toFixed(3) + ')');
      cg.addColorStop(1, 'rgba(21, 217, 242, 0)');
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.arc(x + r * 0.55, y + r * 0.45, r * 1.8, 0, Math.PI * 2);
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

    /* Subtle lower-right rim reflection from aqua water */
    var rim = ctx.createRadialGradient(x + r * 0.4, y + r * 0.42, r * 0.1, x, y, r);
    rim.addColorStop(0, 'rgba(21, 217, 242, 0.48)');
    rim.addColorStop(0.6, 'rgba(21, 217, 242, 0)');
    ctx.fillStyle = rim;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    /* Luminous Hydro Water-Drop / Vortex Emblem Centered on Orb Face */
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rollAngle);

    /* Subtle circular inset ring */
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.48, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(7, 87, 200, 0.22)';
    ctx.lineWidth = Math.max(1.5, r * 0.05);
    ctx.stroke();

    /* Glowing Cyan-Blue Water Droplet Emblem */
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

    /* Tiny glossy droplet specular dot */
    ctx.beginPath();
    ctx.ellipse(-dr * 0.24, dr * 0.12, dr * 0.14, dr * 0.26, -0.35, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
    ctx.fill();
    ctx.restore();

    /* Crisp Top-Left Studio Specular Glint */
    ctx.beginPath();
    ctx.ellipse(x - r * 0.34, y - r * 0.36, r * 0.22, r * 0.12, -0.68, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fill();

    ctx.restore();
  }

  function drawMetallicTurbineOrb(x, y, r, rollAngle) {
    ctx.save();

    /* Ground cast shadow */
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(x + r * 0.30, y + r * 0.52, r * 1.06, r * 0.68, 0.22, 0, Math.PI * 2);
    ctx.fillStyle = isDark ? 'rgba(0, 0, 0, 0.6)' : 'rgba(6, 27, 73, 0.26)';
    ctx.filter = 'blur(12px)';
    ctx.fill();
    ctx.restore();

    /* Clip inside circle for chrome environment reflection */
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.save();
    ctx.clip();

    /* Studio Chrome Base Gradient */
    var mg = ctx.createRadialGradient(x - r * 0.32, y - r * 0.36, r * 0.05, x, y, r * 1.15);
    mg.addColorStop(0.0, '#FFFFFF');
    mg.addColorStop(0.24, '#E8EFF5');
    mg.addColorStop(0.52, '#8F9EAD');
    mg.addColorStop(0.74, '#2A394A');
    mg.addColorStop(0.90, '#6B859E');
    mg.addColorStop(1.0, '#C5E6F5');
    ctx.fillStyle = mg;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);

    /* Curved Metallic Horizon Band (Gives Authentic Mirror-Steel Depth) */
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rollAngle * 0.35 - 0.18);
    var band = ctx.createLinearGradient(0, -r * 0.35, 0, r * 0.55);
    band.addColorStop(0, 'rgba(255, 255, 255, 0.52)');
    band.addColorStop(0.45, 'rgba(15, 28, 46, 0.72)');
    band.addColorStop(0.75, 'rgba(12, 74, 110, 0.55)');
    band.addColorStop(1, 'rgba(21, 217, 242, 0.45)');
    ctx.fillStyle = band;
    ctx.beginPath();
    ctx.ellipse(0, r * 0.16, r * 1.25, r * 0.52, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    /* Cyan Water Bounce Reflection along Lower-Left Rim */
    var bounce = ctx.createRadialGradient(x - r * 0.42, y + r * 0.38, r * 0.05, x - r * 0.42, y + r * 0.38, r * 0.95);
    bounce.addColorStop(0, 'rgba(21, 217, 242, 0.55)');
    bounce.addColorStop(0.6, 'rgba(22, 139, 255, 0.12)');
    bounce.addColorStop(1, 'rgba(21, 217, 242, 0)');
    ctx.fillStyle = bounce;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);

    /* Sharp Studio Skylight Crescent Reflection (Top-Left) */
    ctx.beginPath();
    ctx.ellipse(x - r * 0.32, y - r * 0.38, r * 0.30, r * 0.16, -0.58, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.fill();

    ctx.restore();

    /* Crisp Outer Specular Rim */
    ctx.beginPath();
    ctx.arc(x, y, r - 0.5, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.42)';
    ctx.lineWidth = 1.1;
    ctx.stroke();

    ctx.restore();
  }

  /* ---------- Visibility Pause & Animation Clock ---------- */
  var isInView = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { isInView = entry.isIntersecting; });
    }, { threshold: 0.02 }).observe(hero);
  }

  var introTime = reduced ? 3.2 : 0;
  var flowTime = 0;
  var lastT = performance.now();

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
      introTime = Math.min(5.0, introTime + dt);
      flowTime += dt;
    } else {
      flowTime += dt * 0.16;
    }

    ctx.clearRect(0, 0, vw, vh);

    /* 1. Architectural Matte Stone Backdrop + Subtle Grain + Diagonal Sunlight Shaft */
    var bgGrad = ctx.createLinearGradient(0, 0, vw, vh);
    if (isDark) {
      bgGrad.addColorStop(0, '#071222');
      bgGrad.addColorStop(0.55, '#0B1A30');
      bgGrad.addColorStop(1, '#06101E');
    } else {
      bgGrad.addColorStop(0, '#F3F6F9');
      bgGrad.addColorStop(0.52, '#E9EEF3');
      bgGrad.addColorStop(1, '#DFE7EE');
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, vw, vh);

    if (grainPattern) {
      ctx.save();
      ctx.globalAlpha = isDark ? 0.22 : 0.45;
      ctx.fillStyle = grainPattern;
      ctx.fillRect(0, 0, vw, vh);
      ctx.restore();
    }

    /* Dramatic Soft Diagonal Sunlight Beam (Echoing hero.mp4 top-left -> bottom-right lighting) */
    ctx.save();
    var sunShift = pointer.x * 28;
    var sunGrad = ctx.createLinearGradient(vw * 0.15 + sunShift, 0, vw * 0.85 + sunShift, vh);
    if (isDark) {
      sunGrad.addColorStop(0, 'rgba(21, 217, 242, 0.08)');
      sunGrad.addColorStop(0.45, 'rgba(22, 139, 255, 0.03)');
      sunGrad.addColorStop(1, 'rgba(0, 0, 0, 0.25)');
    } else {
      sunGrad.addColorStop(0, 'rgba(255, 255, 255, 0.58)');
      sunGrad.addColorStop(0.42, 'rgba(255, 255, 255, 0.14)');
      sunGrad.addColorStop(0.75, 'rgba(6, 27, 73, 0.04)');
      sunGrad.addColorStop(1, 'rgba(6, 27, 73, 0.10)');
    }
    ctx.fillStyle = sunGrad;
    ctx.fillRect(0, 0, vw, vh);

    /* Soft architectural diagonal shadow wedge in top-right & bottom-left */
    ctx.beginPath();
    ctx.moveTo(vw * 0.46 + sunShift * 0.4, 0);
    ctx.lineTo(vw, 0);
    ctx.lineTo(vw, vh * 0.54);
    ctx.closePath();
    ctx.fillStyle = isDark ? 'rgba(0, 0, 0, 0.18)' : 'rgba(6, 27, 73, 0.038)';
    ctx.fill();
    ctx.restore();

    /* 2. Build Expanding U-Channel Track */
    var openEase = easeOutQuart(introTime / 1.85);
    var track = buildUTrack(vw, vh, openEase, scrollProg);
    var channelW = Math.max(44, Math.min(92, Math.min(vw, vh) * 0.095));
    var wallW = channelW + 20;

    /* 3. Cast Shadow of Sculpted U-Channel onto Studio Surface */
    ctx.save();
    ctx.translate(16 + pointer.x * 6, 24 + pointer.y * 4);
    traceTrackPath(track.pts);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = wallW + 6;
    ctx.strokeStyle = isDark ? 'rgba(0, 0, 0, 0.52)' : 'rgba(6, 27, 73, 0.14)';
    ctx.filter = 'blur(18px)';
    ctx.stroke();
    ctx.restore();

    /* 4. Sculpted Acrylic / Brushed Metal Outer Channel Frame */
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    /* Outer casing wall */
    traceTrackPath(track.pts);
    var wallGrad = ctx.createLinearGradient(0, vh * 0.12, 0, track.yBot + wallW);
    if (isDark) {
      wallGrad.addColorStop(0, '#16355C');
      wallGrad.addColorStop(0.5, '#0F2747');
      wallGrad.addColorStop(1, '#09182E');
    } else {
      wallGrad.addColorStop(0, '#C7D9E8');
      wallGrad.addColorStop(0.45, '#E4EEF5');
      wallGrad.addColorStop(1, '#9CB7CE');
    }
    ctx.lineWidth = wallW;
    ctx.strokeStyle = wallGrad;
    ctx.stroke();

    /* Inner recessed channel trough shadow */
    traceTrackPath(track.pts);
    ctx.lineWidth = channelW + 4;
    ctx.strokeStyle = isDark ? 'rgba(3, 10, 22, 0.85)' : 'rgba(6, 27, 73, 0.16)';
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

    /* Inner bright center-stream aqua core */
    traceTrackPath(track.pts);
    var coreGrad = ctx.createLinearGradient(vw * 0.18, track.yBot - 20, vw * 0.82, track.yBot + 20);
    coreGrad.addColorStop(0, 'rgba(189, 235, 255, 0.16)');
    coreGrad.addColorStop(0.5, 'rgba(210, 248, 255, 0.44)');
    coreGrad.addColorStop(1, 'rgba(189, 235, 255, 0.16)');
    ctx.lineWidth = channelW * 0.46;
    ctx.strokeStyle = coreGrad;
    ctx.stroke();

    /* Continuous Animated Water Flow Streamlines along U-Channel Centerline */
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
      var bLane = bb.lane * (channelW * 0.42) + Math.sin(flowTime * 3.0 + bb.wobble) * 2.5;
      var bx = bp.x + bp.nx * bLane;
      var by = bp.y + bp.ny * bLane;
      ctx.beginPath();
      ctx.arc(bx, by, bb.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.52)';
      ctx.fill();
    }

    /* Glossy Top-Edge Acrylic Specular Rim Highlight */
    ctx.save();
    ctx.translate(-1.5, -channelW * 0.42);
    traceTrackPath(track.pts);
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = isDark ? 'rgba(189, 235, 255, 0.24)' : 'rgba(255, 255, 255, 0.72)';
    ctx.stroke();
    ctx.restore();
    ctx.restore();

    /* 6. Two Iconic 3D Spheres Gliding Down Both Arms to Meet at Bottom Center */
    var sphereR = channelW * 0.56;
    var rollProg = easeInOutCubic((introTime - 0.15) / 2.45);
    var meetGlow = easeOutQuart((introTime - 2.15) / 0.9);

    /* Exact contact spacing at center of the U-track */
    var halfGapFrac = (sphereR * 1.06) / Math.max(1, track.totalLen);
    var idleDrift = Math.sin(flowTime * 1.15) * 0.0022 + pointer.x * 0.006;

    var leftFrac  = 0.02 + (0.5 - halfGapFrac - 0.02) * rollProg + idleDrift * rollProg;
    var rightFrac = 0.98 - (0.98 - (0.5 + halfGapFrac)) * rollProg + idleDrift * rollProg;

    var leftPt  = track.sampleAt(leftFrac);
    var rightPt = track.sampleAt(rightFrac);

    /* Luminous Aqua Energy Caustic Glow Between Both Spheres When They Meet */
    if (meetGlow > 0.01) {
      var midX = (leftPt.x + rightPt.x) * 0.5;
      var midY = (leftPt.y + rightPt.y) * 0.5;
      var pulse = 0.85 + 0.15 * Math.sin(flowTime * 2.4);
      var mg = ctx.createRadialGradient(midX, midY, sphereR * 0.1, midX, midY, sphereR * 2.8);
      mg.addColorStop(0, 'rgba(189, 245, 255,' + (0.65 * meetGlow * pulse).toFixed(3) + ')');
      mg.addColorStop(0.4, 'rgba(21, 217, 242,' + (0.28 * meetGlow * pulse).toFixed(3) + ')');
      mg.addColorStop(1, 'rgba(21, 217, 242, 0)');
      ctx.fillStyle = mg;
      ctx.beginPath();
      ctx.arc(midX, midY, sphereR * 2.8, 0, Math.PI * 2);
      ctx.fill();
    }

    /* Left Sphere rolls clockwise down the left slope, settling upright (angle = 0) at center */
    var leftRollAngle = -(1 - rollProg) * Math.PI * 2.0 + pointer.x * 0.08;
    var rightRollAngle = (1 - rollProg) * Math.PI * 2.0 + pointer.x * 0.08;

    drawHydroWaterOrb(leftPt.x, leftPt.y, sphereR, leftRollAngle, meetGlow);
    drawMetallicTurbineOrb(rightPt.x, rightPt.y, sphereR, rightRollAngle);
  }

  requestAnimationFrame(render);
})();
