/* ==========================================================================
   Vortex Hydro — Core Application
   Multi-Page SPA Router, Toolsbar & Calculator, 8-Point Diagram,
   Leader-Only "Tentang Kami" + Division Members Modal, Theme & Search
   ========================================================================== */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var H = document.documentElement;
  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. Multi-Page SPA Hash Router ---------- */
  var PAGES = ['beranda', 'tentang', 'dokumentasi', 'tentang-kami', 'dashboard'];
  var TITLES = {
    beranda: 'Vortex Hydro — Pembangkit Listrik Mikro-Hidro Pusaran Air',
    tentang: 'Cara Kerja & Peralatan | Vortex Hydro',
    dokumentasi: 'Dokumentasi & FAQ | Vortex Hydro',
    'tentang-kami': 'Tentang Kami | Vortex Hydro',
    dashboard: 'Dashboard | Vortex Hydro'
  };
  var hdr = $('hdr');
  var lgn = $('lgn'), lgnLens = $('lgn-lens'), prevLensRect = null, lensAnim = null;

  function emitWaterDrops(targetEl) {
    if (!lgn || !targetEl || reducedMotion || !targetEl.offsetWidth) return;
    var cx = targetEl.offsetLeft + targetEl.offsetWidth / 2;
    var cy = targetEl.offsetTop + targetEl.offsetHeight / 2;
    var ring = document.createElement('span');
    ring.className = 'lgn-ripple';
    ring.style.left = targetEl.offsetLeft + 'px';
    ring.style.top = targetEl.offsetTop + 'px';
    ring.style.width = targetEl.offsetWidth + 'px';
    ring.style.height = targetEl.offsetHeight + 'px';
    lgn.appendChild(ring);
    if (ring.animate) {
      ring.animate([
        { transform: 'scale(0.95)', opacity: 0.7 },
        { transform: 'scale(1.18, 1.42)', opacity: 0 }
      ], { duration: 560, easing: 'ease-out' }).onfinish = function () { ring.remove(); };
    } else {
      setTimeout(function () { ring.remove(); }, 560);
    }

    for (var i = 0; i < 6; i++) {
      var drop = document.createElement('span');
      drop.className = 'lgn-drop';
      var spreadX = (Math.random() - 0.5) * (targetEl.offsetWidth * 0.72);
      var liftY = -(12 + Math.random() * 18);
      var fallY = 18 + Math.random() * 12;
      var sz = 4 + Math.random() * 4;
      drop.style.width = sz.toFixed(1) + 'px';
      drop.style.height = (sz * 1.15).toFixed(1) + 'px';
      drop.style.left = (cx + spreadX * 0.35) + 'px';
      drop.style.top = (cy - 4) + 'px';
      lgn.appendChild(drop);
      if (drop.animate) {
        drop.animate([
          { transform: 'translate(0, 0) scale(0.2)', opacity: 0 },
          { transform: 'translate(' + spreadX.toFixed(1) + 'px, ' + liftY.toFixed(1) + 'px) scale(1.1)', opacity: 0.95, offset: 0.42 },
          { transform: 'translate(' + (spreadX * 1.3).toFixed(1) + 'px, ' + fallY.toFixed(1) + 'px) scale(0.55)', opacity: 0 }
        ], { duration: 560 + Math.random() * 200, easing: 'cubic-bezier(.25,.7,.45,1)', delay: i * 24 }).onfinish = (function (el) {
          return function () { el.remove(); };
        })(drop);
      } else {
        setTimeout((function (el) { return function () { el.remove(); }; })(drop), 650);
      }
    }
  }

  function placeNavLens(animate) {
    if (!lgn || !lgnLens) return;
    var active = lgn.querySelector('a[aria-current="page"]');
    if (!active || !active.offsetWidth) return;
    var r = { l: active.offsetLeft, t: active.offsetTop, w: active.offsetWidth, h: active.offsetHeight };
    if (lensAnim) { lensAnim.cancel(); lensAnim = null; }
    if (animate && prevLensRect && !reducedMotion && lgnLens.animate) {
      var uL = Math.min(prevLensRect.l, r.l);
      var uW = Math.max(prevLensRect.l + prevLensRect.w, r.l + r.w) - uL;
      lensAnim = lgnLens.animate([
        { left: prevLensRect.l + 'px', top: prevLensRect.t + 'px', width: prevLensRect.w + 'px', height: prevLensRect.h + 'px' },
        { left: uL + 'px', top: r.t + 'px', width: uW + 'px', height: r.h + 'px', offset: 0.44 },
        { left: r.l + 'px', top: r.t + 'px', width: r.w + 'px', height: r.h + 'px' }
      ], { duration: 480, easing: 'cubic-bezier(.22, 1.08, .36, 1)' });
      emitWaterDrops(active);
    }
    lgnLens.style.left = r.l + 'px';
    lgnLens.style.top = r.t + 'px';
    lgnLens.style.width = r.w + 'px';
    lgnLens.style.height = r.h + 'px';
    lgnLens.classList.add('is-ready');
    prevLensRect = r;
  }

  function updateHeaderState(routeId) {
    if (!hdr) return;
    var darkTop = routeId === 'beranda';
    var solid = !darkTop || window.scrollY > 40;
    hdr.classList.toggle('is-scrolled', solid);
    hdr.classList.remove('is-dark-page');
  }

  var firstRoute = true;
  function route() {
    var raw = (location.hash || '#beranda').slice(1);
    var scrollFaq = false;
    if (raw === 'faq') { raw = 'dokumentasi'; scrollFaq = true; }
    else if (raw === 'struktur-tim' || raw === 'tim') { raw = 'tentang-kami'; }
    else if (raw === 'teknologi' || raw === 'cara-kerja') { raw = 'tentang'; }

    var active = PAGES.indexOf(raw) >= 0 ? raw : 'beranda';
    PAGES.forEach(function (id) {
      var el = $(id);
      if (el) el.hidden = (id !== active);
    });

    $$('[data-nav-link]').forEach(function (a) {
      var k = a.getAttribute('data-k');
      if (k === active) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });

    var footer = document.querySelector('.footer');
    if (footer) footer.hidden = (active === 'dashboard');

    document.title = TITLES[active] || TITLES.beranda;
    updateHeaderState(active);
    requestAnimationFrame(function () { placeNavLens(!firstRoute); firstRoute = false; });

    if (scrollFaq) {
      setTimeout(function () {
        var fq = $('faq-sec');
        if (fq) fq.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
      }, 40);
    } else {
      window.scrollTo(0, 0);
    }
    var docVid = $('doc-recap-video');
    if (docVid) {
      if (active === 'dokumentasi') {
        docVid.muted = true;
        var p = docVid.play();
        if (p && typeof p.catch === 'function') p.catch(function () {});
      } else {
        docVid.pause();
      }
    }
    if (typeof window.__vxRefreshScroll === 'function') {
      requestAnimationFrame(window.__vxRefreshScroll);
    }
  }

  window.addEventListener('hashchange', route);
  window.addEventListener('resize', function () { prevLensRect = null; placeNavLens(false); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { prevLensRect = null; placeNavLens(false); });
  window.addEventListener('scroll', function () {
    var cur = (location.hash || '#beranda').slice(1);
    updateHeaderState(PAGES.indexOf(cur) >= 0 ? cur : 'beranda');
  }, { passive: true });
  route();

  /* ---------- 2. Theme Toggle (Light / Dark) ---------- */
  var SUN = '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>';
  var MOON = '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/>';

  function syncThemeIcons() {
    var dark = H.dataset.theme === 'dark';
    $$('[data-theme-toggle]').forEach(function (btn) {
      var svg = btn.querySelector('svg');
      if (svg) svg.innerHTML = dark ? SUN : MOON;
      btn.setAttribute('aria-pressed', String(dark));
      var lbl = dark ? 'Ganti ke mode terang' : 'Ganti ke mode gelap';
      btn.setAttribute('aria-label', lbl);
      btn.setAttribute('title', lbl);
    });
  }
  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('[data-theme-toggle]');
    if (!btn) return;
    H.dataset.theme = H.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('vxt', H.dataset.theme); } catch (_) {}
    syncThemeIcons();
  });
  syncThemeIcons();

  /* ---------- 3. Scroll Animations Engine (Animation_Scroll.mp4 Patterns) ---------- */
  (function initScrollAnimations() {
    var progressBar = $('scroll-progress');
    var heroImg = document.querySelector('.hero__media img');
    var berandaEl = $('beranda');
    var stepper = $('hydro-stepper');
    var stageBadge = $('stage-badge');
    var stepItems = stepper ? $$('.step-item', stepper) : [];
    var STAGE_LABELS = {
      'all': 'MODEL 3D PENUH · SELURUH PROTOTIPE VORTEX HYDRO',
      '1': 'TAHAP 01 · SIRKULASI TERTUTUP & POMPA 100 W',
      '2': 'TAHAP 02 · FOKUS ALIRAN & KINCIR 6 SUDU',
      '3': 'TAHAP 03 · TRANSMISI 1:4 & PEMBANGKIT DC 12 V'
    };
    var STAGE_DETAILS = {
      '1': {
        img: 'assets/images/components/comp-pump.jpg?v=2',
        chain: 'ENERGI LISTRIK 100 W → ENERGI POTENSIAL & HIDROLIK',
        title: '01 · Sirkulasi Air Tertutup & Elevasi Head',
        desc: 'Pompa sirkulasi menyedot air dari tangki bawah Ø 520 mm dan memompanya naik melalui pipa PVC Ø 45 mm melewati flow meter menuju bak penenang atas untuk menjaga debit konstan.',
        metrics: [
          ['Komponen Utama', 'Pompa 100 W & Tangki'],
          ['Dimensi Teknis', 'Tangki Ø 520 · Pipa Ø 45 mm'],
          ['Instrumen Ukur', 'Flow Meter Digital'],
          ['Output Tahap', 'Debit & Head Stabil']
        ],
        formula: 'P_hidrolik = ρ · g · Q · H',
        hotspot: '2'
      },
      '2': {
        img: 'assets/images/components/comp-wheel.jpg',
        chain: 'ENERGI KINETIK ALIRAN → TORSI MEKANIS POROS',
        title: '02 · Fokus Aliran Akrilik & Kincir 6 Sudu Ø 330 mm',
        desc: 'Dari bak penenang, air meluncur pada saluran miring akrilik yang menyempit (0,416 m → 0,28 m) sehingga kecepatan arus meningkat tajam saat menumbuk 6 sudu kincir dan memutar poros stainless Ø 30 mm.',
        metrics: [
          ['Saluran Akrilik', 'Menyempit 0,416 → 0,28 m'],
          ['Kincir Turbin', '6 Sudu · Ø 330 × 250 mm'],
          ['Poros Utama', 'Stainless Steel Ø 30 mm'],
          ['Output Tahap', 'Putaran & Torsi Poros']
        ],
        formula: 'P_mekanik = τ · ω_turbin',
        hotspot: '6'
      },
      '3': {
        img: 'assets/images/components/comp-generator.jpg?v=2',
        chain: 'TRANSMISI STEP-UP 1:4 → ENERGI LISTRIK DC 12 V',
        title: '03 · Zona Kering, Pulley 1:4 & Generator DC XD 3240',
        desc: 'Di balik sekat zona kering bebas cipratan, pulley besar Ø 270 mm memutar pulley kecil Ø 67,5 mm via V-belt (rasio 1:4) untuk melipatgandakan RPM Generator DC XD 3240, menyuplai baterai 12 V dan beban 2× LED 5 W.',
        metrics: [
          ['Rasio Transmisi', 'Step-Up 1 : 4 (Ø 270 → 67,5)'],
          ['Pembangkit', 'Generator DC XD 3240'],
          ['Penyimpanan', 'Baterai 12 V + Controller'],
          ['Beban Output', '2 × 5 W Lampu LED (10 W)']
        ],
        formula: 'ω_gen = 4 · ω_turbin  |  P_out = V · I (10 W)',
        hotspot: '8'
      }
    };

    /* 3a. Scroll Reveal Observer (SPA-safe across hidden pages) */
    var revObs = null;
    if ('IntersectionObserver' in window && !reducedMotion) {
      revObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          en.target.classList.add('is-visible');
          revObs.unobserve(en.target);
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -32px 0px' });
    }
    function observeReveals() {
      $$('[data-reveal]').forEach(function (el) {
        if (el.classList.contains('is-visible')) return;
        if (revObs) revObs.observe(el);
        else el.classList.add('is-visible');
      });
    }

    /* 3b. Scroll-Scrubbed Word-by-Word Text Illumination ([data-scroll-words]) */
    var wordBlocks = [];
    function wrapTextWords(node, bucket) {
      if (node.nodeType === 3) {
        var txt = node.nodeValue;
        if (!txt || !txt.trim()) return;
        var frag = document.createDocumentFragment();
        var parts = txt.split(/(\s+)/);
        parts.forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) {
            frag.appendChild(document.createTextNode(part));
          } else {
            var sp = document.createElement('span');
            sp.className = 'sw-word';
            sp.textContent = part;
            if (reducedMotion) sp.style.opacity = '1';
            bucket.push(sp);
            frag.appendChild(sp);
          }
        });
        node.parentNode.replaceChild(frag, node);
      } else if (node.nodeType === 1) {
        Array.prototype.slice.call(node.childNodes).forEach(function (child) {
          wrapTextWords(child, bucket);
        });
      }
    }
    $$('[data-scroll-words]').forEach(function (el) {
      var bucket = [];
      wrapTextWords(el, bucket);
      if (bucket.length) wordBlocks.push({ el: el, words: bucket });
    });

    /* 3c. Stepper Activation (scroll + click + 3D pin/object click) */
    var manualStepUntil = 0;
    var curStage = '';
    var infoPanel = $('stage-info-panel');
    var infoImg = $('stage-info-img');
    var infoChain = $('stage-info-chain');
    var infoTitle = $('stage-info-title');
    var infoDesc = $('stage-info-desc');
    var infoMetrics = $('stage-info-metrics');
    var infoFormula = $('stage-info-formula');
    var infoLink = $('stage-info-link');

    function setStage(stage, fromUser) {
      if (!stepper) return;
      var s = String(stage);
      if (fromUser) manualStepUntil = Date.now() + 9000;
      if (curStage === s) return;
      curStage = s;
      stepper.setAttribute('data-stage', s);
      if (stageBadge && STAGE_LABELS[s]) stageBadge.textContent = STAGE_LABELS[s];

      var activeStep = s === 'all' ? '1' : s;
      stepItems.forEach(function (btn) {
        var on = s !== 'all' && btn.getAttribute('data-step') === s;
        btn.classList.toggle('is-active', on);
        btn.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      $$('[data-3d-stage]').forEach(function (t) {
        t.classList.toggle('is-active', t.getAttribute('data-3d-stage') === s);
      });
      $$('[data-pin-step]').forEach(function (p) {
        p.classList.toggle('is-active', p.getAttribute('data-pin-step') === s);
      });

      var d = STAGE_DETAILS[activeStep];
      if (d && infoPanel) {
        infoPanel.classList.add('is-switching');
        setTimeout(function () {
          if (infoImg) { infoImg.src = d.img; infoImg.alt = d.title; }
          if (infoChain) infoChain.textContent = d.chain;
          if (infoTitle) infoTitle.textContent = d.title;
          if (infoDesc) infoDesc.textContent = d.desc;
          if (infoMetrics) {
            infoMetrics.innerHTML = d.metrics.map(function (m) {
              return '<div class="stage-info__metric"><span>' + m[0] + '</span><strong>' + m[1] + '</strong></div>';
            }).join('');
          }
          if (infoFormula) infoFormula.textContent = d.formula;
          if (infoLink) infoLink.setAttribute('data-go-hotspot', d.hotspot);
          infoPanel.classList.remove('is-switching');
        }, 90);
      }
      if (typeof window.__vxFocus3DStage === 'function') {
        window.__vxFocus3DStage(s);
      }
    }
    window.__vxSelectStage = function (s) { setStage(s, true); };

    stepItems.forEach(function (btn) {
      btn.addEventListener('click', function () {
        setStage(btn.getAttribute('data-step'), true);
      });
    });
    $$('[data-3d-stage]').forEach(function (t) {
      t.addEventListener('click', function () {
        setStage(t.getAttribute('data-3d-stage'), true);
      });
    });
    $$('[data-pin-step]').forEach(function (p) {
      p.addEventListener('click', function (e) {
        e.stopPropagation();
        setStage(p.getAttribute('data-pin-step'), true);
      });
    });

    /* Smooth scroll cue button inside Hero (does not hijack SPA hash) */
    var cue = document.querySelector('.hero__scroll-cue');
    if (cue) {
      cue.addEventListener('click', function (e) {
        e.preventDefault();
        var target = $('manifesto');
        if (target) target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
      });
    }

    /* 3d. Unified rAF Scroll Tick */
    var ticking = false;
    function updateScrollFX() {
      ticking = false;
      var sy = window.scrollY || window.pageYOffset || 0;
      var vh = window.innerHeight || 800;
      var maxScroll = Math.max(1, document.documentElement.scrollHeight - vh);

      /* Top Scroll Progress Hairline */
      if (progressBar) {
        var pct = Math.min(1, Math.max(0, sy / maxScroll));
        progressBar.style.transform = 'scaleX(' + pct.toFixed(4) + ')';
      }

      if (reducedMotion) return;

      /* Subtle Hero Background Parallax */
      if (heroImg && berandaEl && !berandaEl.hidden) {
        if (sy < vh * 1.25) {
          heroImg.style.transform = 'translate3d(0,' + (sy * 0.18).toFixed(1) + 'px,0) scale(1.06)';
        }
      }

      /* Scroll-Scrubbed Word Illumination */
      for (var i = 0; i < wordBlocks.length; i++) {
        var wb = wordBlocks[i];
        var page = wb.el.closest('.page');
        if (page && page.hidden) continue;
        var rect = wb.el.getBoundingClientRect();
        var start = vh * 0.9;
        var end = vh * 0.24;
        var prog = (start - rect.top) / Math.max(1, start - end + rect.height * 0.45);
        prog = Math.min(1, Math.max(0, prog));
        var n = wb.words.length;
        for (var w = 0; w < n; w++) {
          var threshold = w / n;
          var local = Math.min(1, Math.max(0, (prog - threshold) * (n * 0.32 + 2.4)));
          wb.words[w].style.opacity = (0.18 + local * 0.82).toFixed(2);
        }
      }

      /* Scroll-Activated 3-Stage Stepper */
      if (stepper && berandaEl && !berandaEl.hidden && Date.now() > manualStepUntil) {
        var anchorY = vh * 0.46;
        var best = '1';
        var bestDist = Infinity;
        stepItems.forEach(function (btn) {
          var r = btn.getBoundingClientRect();
          var mid = r.top + r.height * 0.5;
          var dist = Math.abs(mid - anchorY);
          if (dist < bestDist) {
            bestDist = dist;
            best = btn.getAttribute('data-step') || '1';
          }
        });
        setStage(best);
      }
    }

    function requestTick() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(updateScrollFX);
      }
    }

    window.addEventListener('scroll', requestTick, { passive: true });
    window.addEventListener('resize', requestTick, { passive: true });
    window.__vxRefreshScroll = function () {
      observeReveals();
      updateScrollFX();
    };
    observeReveals();
    updateScrollFX();
  })();

  /* ---------- 4. Restored Vortex Toolsbar, Palette Modes & Kalkulator Daya ---------- */
  (function initToolsbar() {
    var vxt = $('vxt'), vxb = $('vxb'), vxm = $('vxm'), vxp = $('vxp'), vxc = $('vxc');
    var vxpal = $('vxpal'), vxpc = $('vxpc'), palList = $('pal-list');
    if (!vxt || !vxb || !vxm) return;

    function closeAll() {
      vxm.hidden = true;
      if (vxp) vxp.hidden = true;
      if (vxpal) vxpal.hidden = true;
      vxt.classList.remove('is-open');
      vxb.setAttribute('aria-expanded', 'false');
    }

    vxb.addEventListener('click', function () {
      var willOpen = vxm.hidden;
      vxm.hidden = !willOpen;
      if (!willOpen) {
        if (vxp) vxp.hidden = true;
        if (vxpal) vxpal.hidden = true;
      }
      vxt.classList.toggle('is-open', willOpen);
      vxb.setAttribute('aria-expanded', String(willOpen));
    });

    if (vxc && vxp) vxc.addEventListener('click', function () { vxp.hidden = true; });
    if (vxpc && vxpal) vxpc.addEventListener('click', function () { vxpal.hidden = true; });

    /* Color Palette Switcher */
    function syncPalButtons() {
      var curPal = H.dataset.pal || 'vortex';
      $$('[data-pal-pick]').forEach(function (b) {
        b.classList.toggle('is-active', b.getAttribute('data-pal-pick') === curPal);
      });
    }
    if (palList) {
      palList.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-pal-pick]');
        if (!btn) return;
        var pal = btn.getAttribute('data-pal-pick');
        H.dataset.pal = pal;
        try { localStorage.setItem('vxpal', pal); } catch (_) {}
        syncPalButtons();
      });
    }
    syncPalButtons();

    vxm.addEventListener('click', function (e) {
      var item = e.target.closest('[data-tool]');
      if (!item) {
        if (e.target.closest('[data-vx-admin-login]') || e.target.closest('[data-theme-toggle]') || e.target.closest('[data-language-toggle]')) closeAll();
        return;
      }
      var tool = item.getAttribute('data-tool');
      if (tool === 'calc' && vxp) {
        if (vxpal) vxpal.hidden = true;
        vxp.hidden = !vxp.hidden;
      } else if (tool === 'palette' && vxpal) {
        if (vxp) vxp.hidden = true;
        vxpal.hidden = !vxpal.hidden;
      }
    });

    document.addEventListener('click', function (e) {
      if (!vxt.contains(e.target) && (!vxm.hidden || (vxp && !vxp.hidden) || (vxpal && !vxpal.hidden))) closeAll();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeAll();
    });

    /* Kalkulator Daya Mikro-hidro */
    function calcPower() {
      var q = Math.max(0, +($('vq') && $('vq').value) || 0);
      var h = Math.max(0, +($('vh') && $('vh').value) || 0);
      var eff = Math.min(100, Math.max(0, +($('ve') && $('ve').value) || 0)) / 100;
      var w = 9.81 * q * h * eff;
      if ($('vr')) $('vr').textContent = w >= 1000 ? (w / 1000).toFixed(2) + ' kW' : w.toFixed(1) + ' W';
    }
    ['vq', 'vh', 've'].forEach(function (id) {
      var el = $(id);
      if (el) el.addEventListener('input', calcPower);
    });
    calcPower();
  })();

  /* ---------- 4b. Hero Ambient Water Stream Canvas & Component Carousel ---------- */
  (function initHeroWaterAndCarousel() {
    var canvas = $('hero-water');
    if (canvas && canvas.getContext && !reducedMotion) {
      var ctx = canvas.getContext('2d');
      var drops = [];
      for (var i = 0; i < 36; i++) {
        drops.push({
          x: Math.random(), y: 0.1 + Math.random() * 0.8,
          len: 28 + Math.random() * 64, spd: 0.04 + Math.random() * 0.08,
          a: 0.08 + Math.random() * 0.18
        });
      }
      var last = performance.now();
      function draw(now) {
        var dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        var beranda = $('beranda');
        if (beranda && !beranda.hidden) {
          var w = canvas.width, h = canvas.height;
          ctx.clearRect(0, 0, w, h);
          for (var j = 0; j < drops.length; j++) {
            var d = drops[j];
            d.x += dt * d.spd;
            if (d.x > 1.15) { d.x = -0.15; d.y = 0.12 + Math.random() * 0.78; }
            var px = d.x * w, py = d.y * h + Math.sin(d.x * 8 + now * 0.0014) * 14;
            var g = ctx.createLinearGradient(px - d.len, py, px + d.len, py);
            g.addColorStop(0, 'rgba(144,224,239,0)');
            g.addColorStop(0.5, 'rgba(144,224,239,' + d.a.toFixed(2) + ')');
            g.addColorStop(1, 'rgba(0,168,232,0)');
            ctx.strokeStyle = g;
            ctx.lineWidth = 1.8;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(px - d.len, py);
            ctx.lineTo(px + d.len, py);
            ctx.stroke();
          }
        }
        requestAnimationFrame(draw);
      }
      requestAnimationFrame(draw);
    }

    var track = $('comp-track'), prevB = $('comp-prev'), nextB = $('comp-next');
    if (track && prevB && nextB) {
      function stepSize() {
        var first = track.querySelector('.comp-tile');
        return first ? first.offsetWidth + 20 : 340;
      }
      function syncBtns() {
        prevB.disabled = track.scrollLeft <= 4;
        nextB.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 6;
      }
      prevB.addEventListener('click', function () { track.scrollBy({ left: -stepSize(), behavior: 'smooth' }); });
      nextB.addEventListener('click', function () { track.scrollBy({ left: stepSize(), behavior: 'smooth' }); });
      track.addEventListener('scroll', syncBtns, { passive: true });
      window.addEventListener('resize', syncBtns);
      syncBtns();
    }
  })();

  /* ---------- 5. Interactive 8-Hotspot Cross-Section Diagram ---------- */
  (function initDiagram() {
    var dia = $('vx-diagram'), dtxt = $('dinfo-txt');
    if (!dia || !dtxt) return;
    var spots = $$('.hs', dia), chips = $$('#dchips button');

    function show(i) {
      var tpl = document.querySelector('template[data-i="' + i + '"]');
      if (!tpl) return;
      dtxt.innerHTML = tpl.innerHTML;
      spots.forEach(function (s) { s.classList.toggle('is-on', +s.dataset.i === i); });
      chips.forEach(function (c) {
        var on = +c.dataset.i === i;
        c.classList.toggle('is-on', on);
        c.setAttribute('aria-pressed', String(on));
      });
    }
    spots.forEach(function (s) {
      s.addEventListener('click', function () { show(+s.dataset.i); });
      s.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(+s.dataset.i); } });
    });
    chips.forEach(function (c) { c.addEventListener('click', function () { show(+c.dataset.i); }); });

    /* Deep link from Beranda component cards -> activate exact hotspot on #tentang */
    document.addEventListener('click', function (e) {
      var link = e.target.closest && e.target.closest('[data-go-hotspot]');
      if (!link) return;
      var hs = +link.getAttribute('data-go-hotspot');
      if (hs) setTimeout(function () { show(hs); }, 60);
    });

    show(1);
  })();

  /* ---------- 6. Tentang Kami: ON.Energy Portrait Grid + Right Slide-Over Drawer ---------- */
  (function initTentangKami() {
    var grid = $('leader-grid'), ov = $('tmod-ov'), closeBtn = $('tmod-close');
    var prevBtn = $('tmod-prev'), nextBtn = $('tmod-next');
    var mPhoto = $('tmod-photo'), mName = $('tmod-name'), mRole = $('tmod-role'),
        mDesc = $('tmod-desc'), mBadge = $('tmod-badge'), mCnt = $('tmod-cnt'), mBody = $('tmod-body');
    if (!grid) return;

    var DIVISIONS = [
      {
        id: 'pengurus', badge: 'Pengurus Inti', division: 'Pengurus Inti',
        leader: 'Mochammad Ardiansyah Tri Wicaksono', leaderRole: 'Ketua Tim',
        desc: 'Memimpin koordinasi seluruh divisi, administrasi proyek kelas, serta pengelolaan jadwal dan anggaran prototipe Vortex Hydro.',
        members: [
          { name: "Mohammad Miftah Yusron Hana'i", role: 'Sekretaris Tim 1' },
          { name: 'Mohamad Supriyadi', role: 'Sekretaris Tim 2' },
          { name: 'Khalidatul Aliyah Safitri', role: 'Bendahara Tim 1' },
          { name: 'Loudy Firza Aulia', role: 'Bendahara Tim 2' },
          { name: 'Maritza Aprilia Putri', role: 'Bendahara Tim 3' }
        ]
      },
      {
        id: 'modeling', badge: 'Divisi Modeling', division: 'Modeling',
        leader: 'Kristoforus Rizkiano Tembang Langit', leaderRole: 'Ketua Divisi · Modeling',
        desc: 'Memimpin pemodelan geometri 3D saluran dan simulasi CFD perilaku aliran air untuk mengevaluasi rancangan turbin pusaran.',
        members: [
          { name: 'Muhammad Firdhie Andalas', role: 'Anggota Modeling' },
          { name: 'M. Rangga Satria Noorfando', role: 'Anggota Modeling' },
          { name: 'Rakha Aribawa Rahman', role: 'Anggota Modeling' },
          { name: 'Lutfi Ahmad Suriyana', role: 'Anggota Modeling' }
        ]
      },
      {
        id: 'mat-model', badge: 'Divisi Mat Model', division: 'Mat Model',
        leader: 'Muhammad Alfian Firmansyah', leaderRole: 'Ketua Divisi · Mat Model',
        desc: 'Memimpin pemodelan matematis hidrodinamika, perhitungan teoritis debit-head-daya, serta kajian pemilihan material komponen.',
        members: [
          { name: 'Muhammad Iqbal Maulana', role: 'Anggota Mat Model' },
          { name: 'Khalidatul Aliyah Safitri', role: 'Anggota Mat Model' },
          { name: 'Muhamad Ferly Farnando', role: 'Anggota Mat Model' }
        ]
      },
      {
        id: 'software', badge: 'Divisi Software', division: 'Software',
        leader: 'Fattar Davino Aulia Rahman', leaderRole: 'Ketua Divisi · Software',
        desc: 'Memimpin pengembangan website Vortex Hydro, antarmuka dashboard pemantauan telemetri, serta integrasi asisten Vortex AI.',
        members: [
          { name: 'Muhamad Supriyadi', role: 'Anggota Software' },
          { name: 'Muhammad Aryaputra Manda', role: 'Anggota Software' },
          { name: 'M. Nauval Al-Ghafary Wardoyo', role: 'Anggota Software' },
          { name: "Haudh Al Maa'uun", role: 'Anggota Software' }
        ]
      },
      {
        id: 'electrical', badge: 'Divisi Electrical', division: 'Electrical',
        leader: 'Muhammad Nur Faizin', leaderRole: 'Ketua Divisi · Electrical',
        desc: 'Memimpin perancangan sistem pembangkitan Generator DC XD 3240, pengkondisian daya baterai 12 V, sensor, dan beban 2× LED 5 W.',
        members: [
          { name: 'Muhammad Farrel Caesar', role: 'Anggota Electrical' },
          { name: 'Mokhamad Rayhan Faturahman', role: 'Anggota Electrical' },
          { name: 'Dava Maulana Yudha', role: 'Anggota Electrical' },
          { name: 'Iltizamul Haqqi', role: 'Anggota Electrical' },
          { name: 'Mexcelino Perwira Dirganesia', role: 'Anggota Electrical' },
          { name: 'Mochammad Ardiansyah Tri Wicaksono', role: 'Anggota Electrical' }
        ]
      },
      {
        id: 'mekanikal', badge: 'Divisi Mekanikal', division: 'Mekanikal',
        leader: 'M. Salman Alfarizi Ramadani', leaderRole: 'Ketua Divisi · Mekanikal',
        desc: 'Memimpin fabrikasi rangka utama 2 × 0,8 m, perakitan kincir 6 sudu Ø 330 mm, poros stainless Ø 30 mm, dan transmisi pulley 1:4.',
        members: [
          { name: 'Mukhamad Nur Alfan', role: 'Anggota Mekanikal' },
          { name: "Mohammad Miftah Yusron Hana'i", role: 'Anggota Mekanikal' },
          { name: 'Febrian Patria Yoni', role: 'Anggota Mekanikal' },
          { name: 'Muhammad Fadil', role: 'Anggota Mekanikal' },
          { name: 'Mohamad Rizky Fadilah', role: 'Anggota Mekanikal' },
          { name: 'Mohammad Hisyam Rifai', role: 'Anggota Mekanikal' }
        ]
      },
      {
        id: 'perlengkapan', badge: 'Divisi Perlengkapan', division: 'Perlengkapan',
        leader: 'Handhika Hidayatullah', leaderRole: 'Ketua Divisi · Perlengkapan',
        desc: 'Mengelola pengadaan komponen teknis, kesiapan pompa dan perpipaan Ø 45 mm, serta logistik pengujian laboratorium.',
        members: [
          { name: 'Loudy Firza Aulia', role: 'Anggota Perlengkapan' },
          { name: 'Keihan Daafa Parsya', role: 'Anggota Perlengkapan' },
          { name: 'Girendra Hangestubrata', role: 'Anggota Perlengkapan' },
          { name: 'Jalalludin Satriya Nayaka', role: 'Anggota Perlengkapan' }
        ]
      },
      {
        id: 'pdd', badge: 'Divisi PDD', division: 'PDD',
        leader: "Mohammad Miftah Yusron Hana'i", leaderRole: 'Ketua Divisi · PDD',
        desc: 'Mengelola publikasi media, desain visual proyek, serta dokumentasi foto dan video selama tahap perakitan hingga uji coba.',
        members: [
          { name: 'Legison Satria Manik Allo', role: 'Anggota PDD' },
          { name: 'Maritza Aprilia Putri', role: 'Anggota PDD' }
        ]
      }
    ];

    var PHOTOS = {
      'mexcelino-perwira-dirganesia': 'assets/team/electrical/mexcelino-perwira-dirganesia.jpg',
      'mokhamad-rayhan-faturahman': 'assets/team/electrical/mokhamad-rayhan-faturahman.jpg',
      'muhammad-farrel-caesar': 'assets/team/electrical/muhammad-farrel-caesar.jpg',
      'muhammad-nur-faizin': 'assets/team/electrical/muhammad-nur-faizin.jpg',
      'khalidatul-aliyah-safitri': 'assets/team/mat-model/khalidatul-aliyah-safitri.jpg',
      'muhamad-ferly-farnando': 'assets/team/mat-model/muhamad-ferly-farnando.jpg',
      'muhammad-alfian-firmansyah': 'assets/team/mat-model/muhammad-alfian-firmansyah.jpg',
      'muhammad-iqbal-maulana': 'assets/team/mat-model/muhammad-iqbal-maulana.jpg',
      'febrian-patria-yoni': 'assets/team/mekanikal/febrian-patria-yoni.jpg',
      'm-salman-alfarizi-ramadani': 'assets/team/mekanikal/m-salman-alfarizi-ramadani.jpg',
      'mohamad-rizky-fadilah': 'assets/team/mekanikal/mohamad-rizky-fadilah.jpg',
      'mohammad-hisyam-rifai': 'assets/team/mekanikal/mohammad-hisyam-rifai.jpg',
      'muhammad-fadil': 'assets/team/mekanikal/muhammad-fadil.jpg',
      'kristoforus-rizkiano-tembang-langit': 'assets/team/modeling/kristoforus-rizkiano-tembang-langit.jpg',
      'lutfi-ahmad-suriyana': 'assets/team/modeling/lutfi-ahmad-suriyana.jpg',
      'm-rangga-satria-noorfando': 'assets/team/modeling/m-rangga-satria-noorfando.jpg',
      'muhammad-firdhie-andalas': 'assets/team/modeling/muhammad-firdhie-andalas.jpg',
      'rakha-aribawa-rahman': 'assets/team/modeling/rakha-aribawa-rahman.jpg',
      'legison-satria-manik-allo': 'assets/team/pdd/legison-satria-manik-allo.jpg',
      'maritza-aprilia-putri': 'assets/team/pdd/maritza-aprilia-putri.jpg',
      'mohammad-miftah-yusron-hana-i': 'assets/team/pdd/mohammad-miftah-yusron-hana-i.jpg',
      'mochammad-ardiansyah-tri-wicaksono': 'assets/team/pengurus/mochammad-ardiansyah-tri-wicaksono.jpg',
      'mohamad-supriyadi': 'assets/team/pengurus/mohamad-supriyadi.jpg',
      'muhamad-supriyadi': 'assets/team/pengurus/mohamad-supriyadi.jpg',
      'girendra-hangestubrata': 'assets/team/perlengkapan/girendra-hangestubrata.jpg',
      'handhika-hidayatullah': 'assets/team/perlengkapan/handhika-hidayatullah.jpg',
      'jalalludin-satriya-nayaka': 'assets/team/perlengkapan/jalalludin-satriya-nayaka.jpg',
      'keihan-daafa-parsya': 'assets/team/perlengkapan/keihan-daafa-parsya.jpg',
      'loudy-firza-aulia': 'assets/team/perlengkapan/loudy-firza-aulia.jpg',
      'fattar-davino-aulia-rahman': 'assets/team/software/fattar-davino-aulia-rahman.jpg',
      'haudh-al-maa-uun': 'assets/team/software/haudh-al-maa-uun.jpg',
      'm-nauval-al-ghafary-wardoyo': 'assets/team/software/m-nauval-al-ghafary-wardoyo.jpg',
      'muhammad-aryaputra-manda': 'assets/team/software/muhammad-aryaputra-manda.jpg'
    };

    function slug(s) { return s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
    function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
    function init(s) { var p = s.replace(/[^A-Za-z\s]/g, '').trim().split(/\s+/).filter(Boolean); return p.length > 1 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : (p[0] || 'VH').slice(0, 2).toUpperCase(); }

    function portraitHtml(name, role) {
      var src = PHOTOS[slug(name)];
      if (src) return '<img src="' + src + '" alt="' + esc(name) + '" loading="lazy" decoding="async">';
      return '<div class="on-monogram" aria-hidden="true">' +
        '<svg class="on-monogram__bg" viewBox="0 0 120 120" fill="none"><circle cx="60" cy="60" r="46" stroke="currentColor" stroke-opacity=".14" stroke-width="1.5"/><path d="M60 22a38 38 0 1 1-38 38 25 25 0 1 1 25 25 13 13 0 1 1 13-13" stroke="currentColor" stroke-opacity=".2" stroke-width="2" stroke-linecap="round"/></svg>' +
        '<span>' + esc(init(name)) + '</span>' +
        '<small>' + esc(role) + '</small>' +
      '</div>';
    }

    function memberAv(name) {
      var src = PHOTOS[slug(name)];
      return src
        ? '<span class="on-mav"><img src="' + src + '" alt="' + esc(name) + '" loading="lazy" decoding="async"></span>'
        : '<span class="on-mav is-init" aria-hidden="true">' + esc(init(name)) + '</span>';
    }

    var PLUS_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';

    grid.innerHTML = DIVISIONS.map(function (d, idx) {
      return '<button type="button" class="on-card" data-idx="' + idx + '" data-reveal style="--d:' + (idx % 4 * 70) + 'ms" aria-label="Lihat anggota ' + esc(d.division) + ', diketuai ' + esc(d.leader) + '">' +
        '<div class="on-card__frame">' +
          portraitHtml(d.leader, d.division) +
          '<span class="on-card__plus" aria-hidden="true">' + PLUS_SVG + '</span>' +
        '</div>' +
        '<div class="on-card__meta">' +
          '<strong>' + esc(d.leader) + '</strong>' +
          '<span>' + esc(d.leaderRole) + '</span>' +
        '</div>' +
      '</button>';
    }).join('');
    if (typeof window.__vxRefreshScroll === 'function') window.__vxRefreshScroll();

    var curIdx = 0;
    function renderDrawer(idx) {
      curIdx = (idx + DIVISIONS.length) % DIVISIONS.length;
      var d = DIVISIONS[curIdx];
      if (!d || !ov) return;
      mPhoto.innerHTML = portraitHtml(d.leader, d.division);
      mName.textContent = d.leader;
      mRole.textContent = d.leaderRole;
      mDesc.textContent = d.desc;
      mBadge.textContent = 'Anggota · ' + d.badge;
      mCnt.textContent = d.members.length + ' anggota';
      mBody.innerHTML = d.members.map(function (m) {
        return '<div class="on-member">' + memberAv(m.name) +
          '<div><strong>' + esc(m.name) + '</strong><span>' + esc(m.role) + '</span></div></div>';
      }).join('');
      var sc = ov.querySelector('.on-drawer__scroll');
      if (sc) sc.scrollTop = 0;
    }

    function openDrawer(idx) {
      renderDrawer(idx);
      ov.hidden = false;
      requestAnimationFrame(function () { ov.classList.add('is-open'); });
      document.body.style.overflow = 'hidden';
      if (closeBtn) closeBtn.focus();
    }
    window.__vxOpenDivision = function (divId) {
      for (var k = 0; k < DIVISIONS.length; k++) {
        if (DIVISIONS[k].id === divId) { openDrawer(k); return; }
      }
    };

    function closeDrawer() {
      if (!ov || ov.hidden) return;
      ov.classList.remove('is-open');
      document.body.style.overflow = '';
      setTimeout(function () { ov.hidden = true; }, reducedMotion ? 0 : 220);
    }

    grid.addEventListener('click', function (e) {
      var card = e.target.closest('.on-card');
      if (card) openDrawer(+card.dataset.idx);
    });
    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
    if (prevBtn) prevBtn.addEventListener('click', function () { renderDrawer(curIdx - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { renderDrawer(curIdx + 1); });
    if (ov) ov.addEventListener('mousedown', function (e) { if (e.target === ov) closeDrawer(); });
    document.addEventListener('keydown', function (e) {
      if (!ov || ov.hidden) return;
      if (e.key === 'Escape') closeDrawer();
      else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); renderDrawer(curIdx - 1); }
      else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); renderDrawer(curIdx + 1); }
    });
  })();

  /* ---------- 7. Site Search Modal (Ctrl+K / /) ---------- */
  (function initSearch() {
    var ov = $('vs-ov'), inp = $('vs-in'), ul = $('vs-res'), hint = $('vs-hint'), xBtn = $('vs-x');
    if (!ov || !inp || !ul) return;
    var idx = [], items = [], act = -1, back = null;

    function esc(t) { return t.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    function build() {
      idx = [];
      var seen = {};
      $$('.page[id]').forEach(function (pg) {
        var pn = pg.getAttribute('data-title') || pg.id;
        $$('h1,h2,h3,p,li,summary,strong', pg).forEach(function (el) {
          var t = (el.textContent || '').replace(/\s+/g, ' ').trim();
          if (t.length < 3 || seen[t]) return;
          seen[t] = 1;
          idx.push({ pg: pg.id, pn: pn, el: el, t: t, n: t.toLowerCase(), h: /^H/.test(el.tagName) });
        });
      });
    }
    function render() {
      var q = inp.value.trim();
      var tok = q.toLowerCase().split(/\s+/).filter(Boolean);
      if (q.length < 2) { items = []; ul.innerHTML = ''; hint.textContent = 'Ketik minimal 2 huruf. Pintasan: Ctrl+K atau tombol /.'; return; }
      items = idx.filter(function (e) { return tok.every(function (k) { return e.n.indexOf(k) >= 0; }); })
        .sort(function (a, b) { return (b.h ? 3 : 0) - (a.h ? 3 : 0); }).slice(0, 10);
      act = items.length ? 0 : -1;
      if (!items.length) { ul.innerHTML = ''; hint.textContent = 'Tidak ada hasil untuk “' + q + '”.'; return; }
      hint.textContent = items.length + ' hasil ditemukan. Tekan Enter untuk membuka.';
      ul.innerHTML = items.map(function (e, i) {
        var sn = esc(e.t.slice(0, 120) + (e.t.length > 120 ? '…' : ''));
        return '<li role="option" data-i="' + i + '" aria-selected="' + (i === act) + '"><small>' + esc(e.pn) + '</small><span>' + sn + '</span></li>';
      }).join('');
    }
    function open() { back = document.activeElement; build(); ov.hidden = false; inp.value = ''; render(); inp.focus(); }
    function close() { ov.hidden = true; if (back && back.focus) back.focus(); }
    function go(item) {
      close();
      location.hash = '#' + item.pg;
      setTimeout(function () {
        item.el.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
        item.el.classList.add('vs-flash');
        setTimeout(function () { item.el.classList.remove('vs-flash'); }, 1800);
      }, 80);
    }

    $$('[data-vs-open]').forEach(function (b) { b.addEventListener('click', open); });
    if (xBtn) xBtn.addEventListener('click', close);
    ov.addEventListener('mousedown', function (e) { if (e.target === ov) close(); });
    inp.addEventListener('input', render);
    ul.addEventListener('click', function (e) { var li = e.target.closest('li'); if (li) go(items[+li.dataset.i]); });
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' && items.length) { e.preventDefault(); act = (act + 1) % items.length; $$('li', ul).forEach(function (l, i) { l.setAttribute('aria-selected', i === act); }); }
      else if (e.key === 'ArrowUp' && items.length) { e.preventDefault(); act = (act - 1 + items.length) % items.length; $$('li', ul).forEach(function (l, i) { l.setAttribute('aria-selected', i === act); }); }
      else if (e.key === 'Enter' && items[act]) { e.preventDefault(); go(items[act]); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !ov.hidden) { close(); return; }
      var t = e.target, typing = t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable);
      if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey)) { e.preventDefault(); ov.hidden ? open() : close(); }
      else if (e.key === '/' && !typing && ov.hidden) { e.preventDefault(); open(); }
    });
  })();

  /* ---------- 8. Documentary & Division Archive Lightbox (#dokumentasi) ---------- */
  (function initDocArchive() {
    var ov = $('doc-mod-ov'), closeBtn = $('doc-mod-close');
    var media = $('doc-mod-media'), tagEl = $('doc-mod-tag'), titleEl = $('doc-mod-title'),
        descEl = $('doc-mod-desc'), chipsEl = $('doc-mod-chips'), actEl = $('doc-mod-actions');
    if (!ov) return;

    var ARCHIVE = {
      journey: {
        tag: '01 / DOCUMENTATION RECAP · 16:9',
        title: 'The Journey — Vortex Hydro Documentary',
        badge: 'REKAP DOKUMENTER · PROYEK LAB',
        img: 'assets/images/hero-turbine.jpg',
        desc: 'Rekaman lengkap perjalanan tim Fakultas Vokasi Universitas Negeri Malang merancang, memfabrikasi, dan menguji prototipe pembangkit listrik mikro-hidro pusaran air sirkulasi tertutup di atas rangka 2,0 × 0,8 m.',
        chips: ['Rangka 2,0 × 0,8 m', 'Kincir 6 Sudu Ø 330 mm', 'Transmisi 1:4', 'Generator DC XD 3240'],
        goHref: '#tentang',
        goLabel: 'Lihat Diagram Cara Kerja →'
      },
      process: {
        tag: '02 / BEHIND THE PROCESS · 1:1',
        title: 'Behind Every Creation — Process Film',
        badge: 'PROSES KOLABORASI · 8 DIVISI',
        img: 'assets/images/team-group.jpg',
        desc: 'Di balik setiap pengujian prototipe terdapat diskusi lintas divisi: mulai dari simulasi fluida ANSYS Fluent, perhitungan hidrodinamika, perakitan mekanikal, instalasi kelistrikan zona kering, hingga pengembangan web & AI.',
        chips: ['ANSYS Fluent', 'AutoCAD', 'MATLAB', 'VS Code', 'Uji Lab UM'],
        goHref: '#tentang-kami',
        goLabel: 'Kenali Tim Kepemimpinan →'
      },
      pengurus: {
        tag: '01 / DIVISION ARCHIVE',
        title: 'Pengurus Inti',
        badge: 'KOORDINASI & MANAJEMEN PROYEK',
        img: 'assets/images/documentation/t-tim.jpg',
        desc: 'Menyelaraskan jadwal kerja tujuh divisi teknis, administrasi proyek kelas Mekanika Fluida, serta pengelolaan anggaran dan kesiapan presentasi prototipe Vortex Hydro.',
        chips: ['Koordinasi Lintas Divisi', 'Administrasi', 'Anggaran & Jadwal'],
        divId: 'pengurus'
      },
      modeling: {
        tag: '02 / DIVISION ARCHIVE',
        title: 'Divisi Modeling',
        badge: 'CAD 3D & SIMULASI CFD',
        img: 'assets/images/documentation/t-akademik.jpg',
        desc: 'Membangun model geometri 3D rangka, headbox, saluran miring akrilik (0,416 m → 0,28 m), serta mengevaluasi profil kecepatan aliran fluida melalui simulasi ANSYS Fluent & AutoCAD.',
        chips: ['AutoCAD 3D', 'ANSYS Fluent CFD', 'Geometri Saluran'],
        divId: 'modeling'
      },
      'mat-model': {
        tag: '03 / DIVISION ARCHIVE',
        title: 'Divisi Mat Model',
        badge: 'HIDRODINAMIKA & MATERIAL',
        img: 'assets/images/documentation/t-blog.jpg',
        desc: 'Menyusun pemodelan matematis debit aliran, tinggi jatuh (head), persamaan daya mikro-hidro P = ρ·g·Q·H·η di MATLAB, serta kajian pemilihan material tahan air untuk komponen.',
        chips: ['MATLAB', 'Persamaan P = ρ·g·Q·H·η', 'Kajian Material'],
        divId: 'mat-model'
      },
      software: {
        tag: '04 / DIVISION ARCHIVE',
        title: 'Divisi Software',
        badge: 'WEBSITE, DASHBOARD & AI',
        img: 'assets/images/documentation/t-acara.jpg',
        desc: 'Merancang antarmuka website interaktif Vortex Hydro, diagram penampang animasi, simulasi Dashboard Admin telemetri, serta integrasi asisten cerdas Vortex Hydro AI berbasis Supabase & Gemini.',
        chips: ['VS Code', 'Web SPA & Animasi', 'Dashboard Simulasi', 'Vortex Hydro AI'],
        divId: 'software'
      },
      electrical: {
        tag: '05 / DIVISION ARCHIVE',
        title: 'Divisi Electrical',
        badge: 'PEMBANGKITAN DC & BEBAN LED',
        img: 'assets/images/components/comp-generator.jpg',
        desc: 'Merakit sistem kelistrikan pada zona kering: Generator DC XD 3240, pengontrol pengisian baterai 12 V, rangkaian beban 2× lampu LED 12 V / 5 W (total 10 W), serta rencana instrumentasi sensor.',
        chips: ['Generator DC XD 3240', 'Baterai 12 V', '2× LED 5 W (10 W)'],
        divId: 'electrical'
      },
      mekanikal: {
        tag: '06 / DIVISION ARCHIVE',
        title: 'Divisi Mekanikal',
        badge: 'FABRIKASI & TRANSMISI 1:4',
        img: 'assets/images/components/comp-wheel.jpg',
        desc: 'Mengerjakan fabrikasi rangka utama 2,0 × 0,8 m, perakitan kincir air 6 sudu Ø 330 mm (lebar sudu 250 mm), poros stainless steel Ø 30 mm, serta transmisi pulley & V-belt step-up 1:4 (Ø 270 → Ø 67,5 mm).',
        chips: ['Kincir Ø 330 mm', 'Poros Ø 30 mm', 'Pulley Step-Up 1:4'],
        divId: 'mekanikal'
      },
      perlengkapan: {
        tag: '07 / DIVISION ARCHIVE',
        title: 'Divisi Perlengkapan',
        badge: 'SIRKULASI POMPA & LOGISTIK',
        img: 'assets/images/components/comp-pump.jpg',
        desc: 'Mengelola pengadaan komponen teknis dan kesiapan sirkulasi hidrolik: pompa celup Wasser WD-101E (100 W), tangki penampung Ø 520 mm, perpipaan Ø 45 mm + flow meter, dan logistik uji lab.',
        chips: ['Pompa Wasser 100 W', 'Tangki Ø 520 mm', 'Pipa Ø 45 mm & Flow Meter'],
        divId: 'perlengkapan'
      },
      pdd: {
        tag: '08 / DIVISION ARCHIVE',
        title: 'Divisi PDD',
        badge: 'MEDIA, VISUAL & DOKUMENTASI',
        img: 'assets/images/documentation/t-cerita.jpg',
        desc: 'Mendokumentasikan seluruh momen perakitan hingga pengujian laboratorium dalam bentuk foto, video dokumenter, identitas visual, dan publikasi media sosial @Vortexa.Team.',
        chips: ['Dokumentasi Foto/Video', 'Desain Visual', 'Publikasi @Vortexa.Team'],
        divId: 'pdd'
      }
    };

    function closeDoc() {
      if (ov.hidden) return;
      ov.hidden = true;
      document.body.style.overflow = '';
    }

    function openDoc(key) {
      var item = ARCHIVE[key];
      if (!item) return;
      media.innerHTML = '<img src="' + item.img + '" alt="' + item.title + '"><span class="doc-mod__badge">' + item.badge + '</span>';
      tagEl.textContent = item.tag;
      titleEl.textContent = item.title;
      descEl.textContent = item.desc;
      chipsEl.innerHTML = item.chips.map(function (c) { return '<li>' + c + '</li>'; }).join('');
      actEl.innerHTML = '';
      if (item.divId) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'c-btn c-btn--navy';
        b.textContent = 'Lihat Anggota Divisi di Tentang Kami →';
        b.addEventListener('click', function () {
          closeDoc();
          location.hash = '#tentang-kami';
          setTimeout(function () {
            if (typeof window.__vxOpenDivision === 'function') window.__vxOpenDivision(item.divId);
          }, 120);
        });
        actEl.appendChild(b);
      } else if (item.goHref) {
        var a = document.createElement('a');
        a.className = 'c-btn c-btn--navy';
        a.href = item.goHref;
        a.textContent = item.goLabel;
        a.addEventListener('click', closeDoc);
        actEl.appendChild(a);
      }
      ov.hidden = false;
      document.body.style.overflow = 'hidden';
      if (closeBtn) closeBtn.focus();
    }

    document.addEventListener('click', function (e) {
      var btn = e.target.closest && e.target.closest('[data-doc-open]');
      if (btn) openDoc(btn.getAttribute('data-doc-open'));
    });
    if (closeBtn) closeBtn.addEventListener('click', closeDoc);
    ov.addEventListener('mousedown', function (e) { if (e.target === ov) closeDoc(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !ov.hidden) closeDoc(); });
  })();

  /* ---------- 9. Tentang Kami Top Photo Slideshow (Auto 5s) ---------- */
  (function initAboutSlider() {
    var slider = $('about-slider'), track = $('about-slider-track');
    if (!slider || !track) return;
    var slides = $$('.about-slider__slide', track);
    var dots = $$('.about-slider__dot', slider);
    if (slides.length < 2) return;
    var idx = 0, timer = null;

    function go(next) {
      idx = (next + slides.length) % slides.length;
      track.style.transform = 'translateX(-' + (idx * 100) + '%)';
      dots.forEach(function (d, i) {
        var on = i === idx;
        d.classList.toggle('is-active', on);
        d.setAttribute('aria-selected', on ? 'true' : 'false');
      });
    }
    function start() {
      stop();
      timer = setInterval(function () { go(idx + 1); }, 5000);
    }
    function stop() {
      if (timer) { clearInterval(timer); timer = null; }
    }

    dots.forEach(function (d) {
      d.addEventListener('click', function () {
        go(+d.getAttribute('data-slide') || 0);
        start();
      });
    });
    slider.addEventListener('mouseenter', stop);
    slider.addEventListener('mouseleave', start);
    start();
  })();

  /* ---------- 10. Interactive 3D Energy Conversion Rig (#hydro-3d-canvas) ---------- */
  (function initHydro3DRig() {
    var canvas = $('hydro-3d-canvas');
    var viewport = $('hydro-3d-viewport');
    if (!canvas || !viewport) return;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var pins = {
      '1': viewport.querySelector('[data-pin-step="1"]'),
      '2': viewport.querySelector('[data-pin-step="2"]'),
      '3': viewport.querySelector('[data-pin-step="3"]')
    };

    /* Camera presets per stage */
    var PRESETS = {
      'all': { yaw: -0.52, pitch: 0.36, zoom: 1.02, tx: 0, ty: -4, tz: 0 },
      '1':   { yaw: -0.34, pitch: 0.34, zoom: 1.24, tx: -72, ty: 8, tz: -10 },
      '2':   { yaw: -0.55, pitch: 0.38, zoom: 1.28, tx: 10, ty: -14, tz: -14 },
      '3':   { yaw: -0.78, pitch: 0.33, zoom: 1.30, tx: 64, ty: -6, tz: 36 }
    };

    var activeStage = '1';
    var cam = { yaw: -0.34, pitch: 0.34, zoom: 1.24, tx: -72, ty: 8, tz: -10 };
    var target = { yaw: -0.34, pitch: 0.34, zoom: 1.24, tx: -72, ty: 8, tz: -10 };

    window.__vxFocus3DStage = function (s) {
      activeStage = String(s || '1');
      var p = PRESETS[activeStage] || PRESETS['all'];
      target.yaw = p.yaw;
      target.pitch = p.pitch;
      target.zoom = p.zoom;
      target.tx = p.tx;
      target.ty = p.ty;
      target.tz = p.tz;
    };

    /* High-DPI resize */
    var cw = 680, ch = 400, dpr = 1;
    function resize() {
      var r = viewport.getBoundingClientRect();
      if (!r.width || !r.height) return;
      cw = r.width;
      ch = r.height;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(cw * dpr);
      canvas.height = Math.round(ch * dpr);
    }
    resize();
    window.addEventListener('resize', resize);

    /* 3D Projection Math (World -> Camera -> Screen) */
    var cosY = 1, sinY = 0, cosP = 1, sinP = 0, scale = 1;
    function project(x, y, z) {
      var dx = x - cam.tx;
      var dy = y - cam.ty;
      var dz = z - cam.tz;
      var x1 = dx * cosY - dz * sinY;
      var z1 = dx * sinY + dz * cosY;
      var y2 = dy * cosP - z1 * sinP;
      var z2 = dy * sinP + z1 * cosP;
      var fov = 560;
      var persp = fov / Math.max(140, fov + z2);
      return {
        x: cw * 0.5 + x1 * scale * persp,
        y: ch * 0.52 + y2 * scale * persp,
        z: z2,
        p: persp * scale
      };
    }

    /* Draw a 3D Box extruded into 6 faces */
    function pushBox(faces, cx, cy, cz, wx, wy, wz, cols, stageTag, alpha) {
      var hx = wx * 0.5, hy = wy * 0.5, hz = wz * 0.5;
      var v = [
        project(cx - hx, cy - hy, cz - hz),
        project(cx + hx, cy - hy, cz - hz),
        project(cx + hx, cy + hy, cz - hz),
        project(cx - hx, cy + hy, cz - hz),
        project(cx - hx, cy - hy, cz + hz),
        project(cx + hx, cy - hy, cz + hz),
        project(cx + hx, cy + hy, cz + hz),
        project(cx - hx, cy + hy, cz + hz)
      ];
      var defs = [
        { idx: [0, 1, 5, 4], fill: cols.top,    stroke: cols.stroke }, // Top (-Y)
        { idx: [3, 2, 6, 7], fill: cols.bottom, stroke: cols.stroke }, // Bottom (+Y)
        { idx: [4, 5, 6, 7], fill: cols.front,  stroke: cols.stroke }, // Front (+Z)
        { idx: [0, 1, 2, 3], fill: cols.back,   stroke: cols.stroke }, // Back (-Z)
        { idx: [1, 5, 6, 2], fill: cols.right,  stroke: cols.stroke }, // Right (+X)
        { idx: [0, 4, 7, 3], fill: cols.left,   stroke: cols.stroke }  // Left (-X)
      ];
      for (var i = 0; i < defs.length; i++) {
        var f = defs[i], pts = [v[f.idx[0]], v[f.idx[1]], v[f.idx[2]], v[f.idx[3]]];
        var zAvg = (pts[0].z + pts[1].z + pts[2].z + pts[3].z) * 0.25;
        faces.push({
          pts: pts,
          z: zAvg,
          fill: f.fill,
          stroke: f.stroke,
          stage: stageTag,
          alpha: alpha == null ? 1 : alpha
        });
      }
    }

    /* Draw a 3D Polygonal Quad */
    function pushQuad(faces, p1, p2, p3, p4, fill, stroke, stageTag, alpha) {
      var a = project(p1[0], p1[1], p1[2]);
      var b = project(p2[0], p2[1], p2[2]);
      var c = project(p3[0], p3[1], p3[2]);
      var d = project(p4[0], p4[1], p4[2]);
      faces.push({
        pts: [a, b, c, d],
        z: (a.z + b.z + c.z + d.z) * 0.25,
        fill: fill,
        stroke: stroke,
        stage: stageTag,
        alpha: alpha == null ? 1 : alpha
      });
    }

    /* Draw a 3D Cylinder along Y or Z axis */
    function pushCylinderY(faces, cx, yTop, yBot, rad, segs, fillSide, fillTop, stroke, stageTag, alpha) {
      var topPts = [];
      for (var i = 0; i < segs; i++) {
        var a1 = (i / segs) * Math.PI * 2;
        var a2 = ((i + 1) / segs) * Math.PI * 2;
        var x1 = cx + Math.cos(a1) * rad, z1 = Math.sin(a1) * rad;
        var x2 = cx + Math.cos(a2) * rad, z2 = Math.sin(a2) * rad;
        pushQuad(faces, [x1, yTop, z1], [x2, yTop, z2], [x2, yBot, z2], [x1, yBot, z1], fillSide, stroke, stageTag, alpha);
        topPts.push(project(x1, yTop, z1));
      }
      var zSum = 0;
      for (var k = 0; k < topPts.length; k++) zSum += topPts[k].z;
      faces.push({
        pts: topPts,
        z: zSum / topPts.length - 1,
        fill: fillTop,
        stroke: stroke,
        stage: stageTag,
        alpha: alpha == null ? 1 : alpha
      });
    }

    function pushCylinderZ(faces, cx, cy, zBack, zFront, rad, segs, fillSide, fillCap, stroke, stageTag, alpha, rotOffset) {
      var frontPts = [], backPts = [];
      var ro = rotOffset || 0;
      for (var i = 0; i < segs; i++) {
        var a1 = ro + (i / segs) * Math.PI * 2;
        var a2 = ro + ((i + 1) / segs) * Math.PI * 2;
        var x1 = cx + Math.cos(a1) * rad, y1 = cy + Math.sin(a1) * rad;
        var x2 = cx + Math.cos(a2) * rad, y2 = cy + Math.sin(a2) * rad;
        pushQuad(faces, [x1, y1, zBack], [x2, y2, zBack], [x2, y2, zFront], [x1, y1, zFront], fillSide, stroke, stageTag, alpha);
        frontPts.push(project(x1, y1, zFront));
        backPts.push(project(x1, y1, zBack));
      }
      var zF = 0, zB = 0;
      for (var k = 0; k < segs; k++) { zF += frontPts[k].z; zB += backPts[k].z; }
      faces.push({ pts: backPts, z: zB / segs, fill: fillCap, stroke: stroke, stage: stageTag, alpha: alpha == null ? 1 : alpha });
      faces.push({ pts: frontPts, z: zF / segs - 1, fill: fillCap, stroke: stroke, stage: stageTag, alpha: alpha == null ? 1 : alpha });
    }

    /* 3D Hotspot World Anchors for Stage 01, 02, 03 */
    var STAGE_ANCHORS = {
      '1': [-108, 42, -16],
      '2': [16, -8, -16],
      '3': [78, -12, 56]
    };
    var projectedAnchors = {};

    /* Pointer Orbit Drag + Direct 3D Stage Picking */
    var dragging = false, startX = 0, startY = 0, moved = 0, lastX = 0, lastY = 0;
    canvas.addEventListener('pointerdown', function (e) {
      dragging = true;
      moved = 0;
      startX = lastX = e.clientX;
      startY = lastY = e.clientY;
      if (canvas.setPointerCapture) canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - lastX;
      var dy = e.clientY - lastY;
      moved += Math.abs(dx) + Math.abs(dy);
      lastX = e.clientX;
      lastY = e.clientY;
      target.yaw += dx * 0.0075;
      target.pitch = Math.max(-0.15, Math.min(0.88, target.pitch + dy * 0.006));
    });
    function endDrag(e) {
      if (!dragging) return;
      dragging = false;
      if (moved < 7 && e && e.clientX != null) {
        var r = canvas.getBoundingClientRect();
        var mx = e.clientX - r.left;
        var my = e.clientY - r.top;
        var bestS = null, bestD = 92;
        ['1', '2', '3'].forEach(function (k) {
          var pt = projectedAnchors[k];
          if (!pt) return;
          var dist = Math.hypot(mx - pt.x, my - pt.y);
          if (dist < bestD) { bestD = dist; bestS = k; }
        });
        if (bestS && typeof window.__vxSelectStage === 'function') {
          window.__vxSelectStage(bestS);
        }
      }
    }
    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', endDrag);

    /* Zoom & Reset Buttons */
    var btnIn = $('h3d-zoom-in'), btnOut = $('h3d-zoom-out'), btnReset = $('h3d-reset');
    if (btnIn) btnIn.addEventListener('click', function () { target.zoom = Math.min(1.65, target.zoom + 0.14); });
    if (btnOut) btnOut.addEventListener('click', function () { target.zoom = Math.max(0.75, target.zoom - 0.14); });
    if (btnReset) btnReset.addEventListener('click', function () {
      if (typeof window.__vxSelectStage === 'function') window.__vxSelectStage('all');
      else window.__vxFocus3DStage('all');
    });

    /* Main 60fps 3D Render Loop */
    var wheelAngle = 0;
    var flowPhase = 0;

    function stageAlpha(st) {
      if (!st || activeStage === 'all') return 1;
      return String(st) === activeStage ? 1 : 0.34;
    }

    function draw3DLine(p1, p2, color, width, dash, alpha) {
      var a = project(p1[0], p1[1], p1[2]);
      var b = project(p2[0], p2[1], p2[2]);
      ctx.save();
      ctx.globalAlpha = alpha == null ? 1 : alpha;
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      if (dash) ctx.setLineDash(dash);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.restore();
    }

    function renderFrame() {
      requestAnimationFrame(renderFrame);
      var beranda = $('beranda');
      if (beranda && beranda.hidden) return;

      /* Smooth camera lerp */
      var idleSpin = dragging ? 0 : Math.sin(flowPhase * 0.35) * 0.0008;
      cam.yaw += (target.yaw - cam.yaw) * 0.11 + idleSpin;
      cam.pitch += (target.pitch - cam.pitch) * 0.11;
      cam.zoom += (target.zoom - cam.zoom) * 0.11;
      cam.tx += (target.tx - cam.tx) * 0.11;
      cam.ty += (target.ty - cam.ty) * 0.11;
      cam.tz += (target.tz - cam.tz) * 0.11;

      cosY = Math.cos(cam.yaw); sinY = Math.sin(cam.yaw);
      cosP = Math.cos(cam.pitch); sinP = Math.sin(cam.pitch);
      scale = Math.min(cw / 420, ch / 270) * cam.zoom;

      if (!reducedMotion) {
        wheelAngle += 0.042;
        flowPhase += 0.036;
      }

      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cw, ch);

      /* 1. 3D Engineering Floor Grid & 2.0 x 0.8 m Base Frame */
      var floorY = 82;
      for (var gx = -160; gx <= 160; gx += 32) {
        draw3DLine([gx, floorY, -75], [gx, floorY, 75], 'rgba(144,224,239,0.10)', 1, null, 1);
      }
      for (var gz = -75; gz <= 75; gz += 25) {
        draw3DLine([-160, floorY, gz], [160, floorY, gz], 'rgba(144,224,239,0.10)', 1, null, 1);
      }
      /* Outer Structural Base Rails (2,0 x 0,8 m) */
      draw3DLine([-152, floorY, -62], [136, floorY, -62], 'rgba(144,224,239,0.34)', 2, null, 1);
      draw3DLine([136, floorY, -62], [136, floorY, 68], 'rgba(144,224,239,0.34)', 2, null, 1);
      draw3DLine([136, floorY, 68], [-152, floorY, 68], 'rgba(144,224,239,0.34)', 2, null, 1);
      draw3DLine([-152, floorY, 68], [-152, floorY, -62], 'rgba(144,224,239,0.34)', 2, null, 1);

      var faces = [];
      var a1 = stageAlpha('1');
      var a2 = stageAlpha('2');
      var a3 = stageAlpha('3');

      /* =====================================================================
         STAGE 01: RESERVOIR TANK (Ø 520 mm) + PUMP (100 W) + PIPE (Ø 45 mm)
         ===================================================================== */
      /* Cylindrical Water Volume inside Tank */
      var waveDy = Math.sin(flowPhase * 2) * 2.2;
      pushCylinderY(
        faces, -108, 22 + waveDy, 78, 38, 16,
        'rgba(0, 168, 232, 0.42)', 'rgba(0, 198, 184, 0.58)', 'rgba(144, 224, 239, 0.45)', '1', a1
      );
      /* Translucent Outer Cylindrical Tank (Ø 520 mm) */
      pushCylinderY(
        faces, -108, 4, 80, 42, 16,
        'rgba(14, 58, 104, 0.24)', 'rgba(144, 224, 239, 0.12)', 'rgba(144, 224, 239, 0.65)', '1', a1
      );
      /* Submerged Pump Unit (100 W) inside Tank */
      pushBox(faces, -108, 58, -12, 26, 22, 22, {
        top: '#0096C7', bottom: '#023E8A', front: '#0077B6', back: '#005F92', right: '#0084B8', left: '#00669E',
        stroke: '#90E0EF'
      }, '1', a1);
      /* Digital Flow Meter Box on Rising Pipe */
      pushBox(faces, -108, -22, -12, 18, 18, 16, {
        top: '#00C6B8', bottom: '#065F5B', front: '#0D9488', back: '#0F766E', right: '#14B8A6', left: '#0F766E',
        stroke: '#A7F3D0'
      }, '1', a1);

      /* =====================================================================
         STAGE 02: HEADBOX + NARROWING CHUTE (0,416 -> 0,28 m) + 6-BLADE WHEEL
         ===================================================================== */
      /* Upper Calming Basin (Bak Penenang Atas) */
      pushBox(faces, -60, -64, -18, 34, 26, 40, {
        top: 'rgba(0, 168, 232, 0.36)', bottom: 'rgba(4, 36, 72, 0.6)',
        front: 'rgba(0, 136, 204, 0.34)', back: 'rgba(0, 119, 182, 0.28)',
        right: 'rgba(0, 168, 232, 0.32)', left: 'rgba(0, 119, 182, 0.32)',
        stroke: 'rgba(144, 224, 239, 0.75)'
      }, '2', a2);

      /* Narrowing Inclined Acrylic Chute (0.416 m wide at top -> 0.28 m narrow at turbine) */
      var cX1 = -43, cY1 = -62, cW1 = 18;
      var cX2 = 16,  cY2 = -36, cW2 = 11;
      var cZ = -18, cH = 12;
      /* Chute Floor (Water Bed) */
      pushQuad(faces,
        [cX1, cY1, cZ - cW1], [cX2, cY2, cZ - cW2],
        [cX2, cY2, cZ + cW2], [cX1, cY1, cZ + cW1],
        'rgba(0, 180, 236, 0.52)', '#90E0EF', '2', a2
      );
      /* Chute Front & Back Acrylic Side Walls */
      pushQuad(faces,
        [cX1, cY1 - cH, cZ + cW1], [cX2, cY2 - cH, cZ + cW2],
        [cX2, cY2, cZ + cW2],      [cX1, cY1, cZ + cW1],
        'rgba(144, 224, 239, 0.24)', '#90E0EF', '2', a2
      );
      pushQuad(faces,
        [cX1, cY1 - cH, cZ - cW1], [cX2, cY2 - cH, cZ - cW2],
        [cX2, cY2, cZ - cW2],      [cX1, cY1, cZ - cW1],
        'rgba(0, 119, 182, 0.24)', 'rgba(144, 224, 239, 0.65)', '2', a2
      );

      /* 3D 6-Blade Waterwheel Rotor (Ø 330 mm, 6 curved/radial paddles) */
      var wX = 32, wY = 8, wZ = -18, wR = 42;
      /* Stainless Steel Main Shaft (Ø 30 mm) spanning from wet zone across dry-zone wall */
      pushCylinderZ(
        faces, wX, wY, -44, 38, 5.5, 10,
        '#94A3B8', '#E2E8F0', '#CBD5E1', '2', Math.max(a2, a3), wheelAngle
      );
      /* 6 Rotating 3D Turbine Blades */
      for (var b = 0; b < 6; b++) {
        var ang = wheelAngle + (b * Math.PI) / 3;
        var rIn = 12, rOut = wR;
        var xIn = wX + Math.cos(ang) * rIn, yIn = wY + Math.sin(ang) * rIn;
        var xOut = wX + Math.cos(ang) * rOut, yOut = wY + Math.sin(ang) * rOut;
        var pAng = ang + 0.34;
        var xTip = wX + Math.cos(pAng) * (rOut - 4), yTip = wY + Math.sin(pAng) * (rOut - 4);
        /* Blade main paddle face */
        pushQuad(faces,
          [xIn, yIn, wZ - 13], [xOut, yOut, wZ - 13],
          [xOut, yOut, wZ + 13], [xIn, yIn, wZ + 13],
          '#00A8E8', '#90E0EF', '2', a2
        );
        /* Blade curved bucket lip */
        pushQuad(faces,
          [xOut, yOut, wZ - 13], [xTip, yTip, wZ - 13],
          [xTip, yTip, wZ + 13], [xOut, yOut, wZ + 13],
          '#00C6B8', '#E0F7FC', '2', a2
        );
      }
      /* Turbine Hub */
      pushCylinderZ(
        faces, wX, wY, wZ - 15, wZ + 15, 12, 12,
        '#023E8A', '#0077B6', '#90E0EF', '2', a2, wheelAngle
      );

      /* =====================================================================
         STAGE 03: DRY-ZONE PARTITION + 1:4 PULLEY + GENERATOR DC + 2x5W LED
         ===================================================================== */
      /* Translucent Dry-Zone Splash Partition Wall (Sekat Zona Kering) */
      pushQuad(faces,
        [-8, -74, 18], [124, -74, 18],
        [124, 80, 18],  [-8, 80, 18],
        'rgba(144, 224, 239, 0.11)', 'rgba(144, 224, 239, 0.48)', '3', a3
      );

      /* Large Driver Pulley (Ø 270 mm) on Front End of Main Shaft (Z = 34) */
      var p1X = wX, p1Y = wY, pZ = 34, p1R = 29;
      pushCylinderZ(
        faces, p1X, p1Y, pZ - 3, pZ + 3, p1R, 16,
        '#0F766E', 'rgba(0, 198, 184, 0.35)', '#2DD4BF', '3', a3, wheelAngle
      );

      /* Small Driven Pulley (Ø 67.5 mm — 1:4 Ratio, spins 4x faster!) */
      var p2X = 96, p2Y = -28, p2R = 9.5;
      pushCylinderZ(
        faces, p2X, p2Y, pZ - 3, pZ + 3, p2R, 12,
        '#0D9488', '#5EEAD4', '#99F6E4', '3', a3, wheelAngle * 4
      );

      /* Generator DC XD 3240 (Mounted behind Small Pulley in Dry Zone) */
      pushCylinderZ(
        faces, p2X, p2Y, 40, 68, 15, 14,
        '#1E293B', '#334155', '#00C6B8', '3', a3, 0
      );

      /* 12 V Battery & Charge Controller Module */
      pushBox(faces, 96, 36, 52, 34, 24, 22, {
        top: '#1E3A5F', bottom: '#0A192F', front: '#172A45', back: '#0F223D', right: '#233554', left: '#112240',
        stroke: '#38BDF8'
      }, '3', a3);

      /* 2x 5W LED Output Load Base & Lamps */
      pushBox(faces, 96, 6, 54, 32, 12, 14, {
        top: '#334155', bottom: '#0F172A', front: '#1E293B', back: '#0F172A', right: '#334155', left: '#1E293B',
        stroke: '#FBBF24'
      }, '3', a3);

      /* Depth-Sort all 3D polygons (Painter's Algorithm back-to-front) */
      faces.sort(function (a, b) { return b.z - a.z; });

      /* Render Sorted 3D Faces */
      for (var fIdx = 0; fIdx < faces.length; fIdx++) {
        var face = faces[fIdx];
        var pts = face.pts;
        ctx.save();
        ctx.globalAlpha = face.alpha;
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (var pIdx = 1; pIdx < pts.length; pIdx++) {
          ctx.lineTo(pts[pIdx].x, pts[pIdx].y);
        }
        ctx.closePath();
        if (face.fill) {
          ctx.fillStyle = face.fill;
          ctx.fill();
        }
        if (face.stroke) {
          ctx.strokeStyle = face.stroke;
          ctx.lineWidth = (activeStage === face.stage || activeStage === 'all') ? 1.35 : 0.85;
          ctx.stroke();
        }
        ctx.restore();
      }

      /* 3D Turbine Wheel Side Shroud Rings & Spokes (for crisp 3D depth) */
      [-13, 13].forEach(function (dz) {
        ctx.save();
        ctx.globalAlpha = a2;
        ctx.strokeStyle = '#90E0EF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (var s = 0; s <= 28; s++) {
          var a = (s / 28) * Math.PI * 2;
          var pt = project(wX + Math.cos(a) * wR, wY + Math.sin(a) * wR, wZ + dz);
          if (s === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
        ctx.restore();
      });

      /* 3D Rising PVC Pipe (Ø 45 mm) + Flowing 3D Water Particles (Stage 01) */
      var pipeNodes = [
        [-108, 48, -12],
        [-108, -68, -12],
        [-64, -68, -12]
      ];
      draw3DLine(pipeNodes[0], pipeNodes[1], 'rgba(144, 224, 239, 0.42)', 9 * cam.zoom, null, a1);
      draw3DLine(pipeNodes[1], pipeNodes[2], 'rgba(144, 224, 239, 0.42)', 9 * cam.zoom, null, a1);
      draw3DLine(pipeNodes[0], pipeNodes[1], '#00A8E8', 4 * cam.zoom, null, a1);
      draw3DLine(pipeNodes[1], pipeNodes[2], '#00A8E8', 4 * cam.zoom, null, a1);

      /* Animated 3D Water Droplets inside Rising Pipe (Stage 01) */
      for (var wp = 0; wp < 9; wp++) {
        var tPipe = ((wp / 9) + flowPhase * 0.25) % 1;
        var px, py, pz = -12;
        if (tPipe < 0.72) {
          var u = tPipe / 0.72;
          px = -108;
          py = 48 - u * 116;
        } else {
          var u2 = (tPipe - 0.72) / 0.28;
          px = -108 + u2 * 44;
          py = -68;
        }
        var sp = project(px, py, pz);
        ctx.save();
        ctx.globalAlpha = a1;
        ctx.fillStyle = '#E0F7FC';
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, Math.max(2, 3.2 * sp.p), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      /* Animated 3D Water Stream & Splash Particles on Chute & Wheel (Stage 02) */
      for (var cp = 0; cp < 10; cp++) {
        var tc = ((cp / 10) + flowPhase * 0.38) % 1;
        var cxP = cX1 + (cX2 - cX1) * tc;
        var cyP = cY1 + (cY2 - cY1) * tc - 3;
        var czP = cZ + ((cp % 3) - 1) * (5 * (1 - tc * 0.4));
        var scp = project(cxP, cyP, czP);
        ctx.save();
        ctx.globalAlpha = a2;
        ctx.fillStyle = '#90E0EF';
        ctx.beginPath();
        ctx.arc(scp.x, scp.y, Math.max(2, 3 * scp.p), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      /* Return Water Cascade from Wheel bottom back to Reservoir Tank */
      draw3DLine([wX, wY + wR + 4, wZ], [wX, 66, wZ], 'rgba(0, 198, 184, 0.55)', 3.5, [6, 6], a2);
      draw3DLine([wX, 66, wZ], [-70, 66, wZ], 'rgba(0, 198, 184, 0.55)', 3.5, [6, 6], a2);

      /* 3D Step-Up 1:4 V-Belt Loops & Pulley Rotation Spokes (Stage 03) */
      var beltTop1 = [p1X - 10, p1Y - p1R + 2, pZ];
      var beltTop2 = [p2X - 4, p2Y - p2R + 1, pZ];
      var beltBot1 = [p1X + 12, p1Y + p1R - 2, pZ];
      var beltBot2 = [p2X + 5, p2Y + p2R - 1, pZ];
      draw3DLine(beltTop1, beltTop2, '#2DD4BF', 2.6, [7, 5], a3);
      draw3DLine(beltBot1, beltBot2, '#2DD4BF', 2.6, [7, 5], a3);

      /* Pulley 1 Spokes */
      for (var spk = 0; spk < 4; spk++) {
        var sa = wheelAngle + (spk * Math.PI) / 2;
        draw3DLine([p1X, p1Y, pZ + 3], [p1X + Math.cos(sa) * (p1R - 3), p1Y + Math.sin(sa) * (p1R - 3), pZ + 3], '#5EEAD4', 1.8, null, a3);
      }

      /* Glowing Dual 5W LED Lamps in Dry Zone (Stage 03) */
      var ledPulse = 0.75 + Math.sin(flowPhase * 3) * 0.25;
      [88, 104].forEach(function (lx) {
        var lp = project(lx, -2, 54);
        ctx.save();
        ctx.globalAlpha = a3;
        var grad = ctx.createRadialGradient(lp.x, lp.y, 1, lp.x, lp.y, 18 * lp.p * ledPulse);
        grad.addColorStop(0, 'rgba(254, 240, 138, 0.98)');
        grad.addColorStop(0.45, 'rgba(251, 191, 36, 0.55)');
        grad.addColorStop(1, 'rgba(251, 191, 36, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(lp.x, lp.y, 18 * lp.p * ledPulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FEF08A';
        ctx.beginPath();
        ctx.arc(lp.x, lp.y, Math.max(3.5, 4.8 * lp.p), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      /* Update Floating 3D Hotspot Pin Positions */
      ['1', '2', '3'].forEach(function (k) {
        var w = STAGE_ANCHORS[k];
        var pr = project(w[0], w[1], w[2]);
        projectedAnchors[k] = pr;
        var pinEl = pins[k];
        if (pinEl) {
          var clampedX = Math.max(58, Math.min(cw - 58, pr.x));
          var clampedY = Math.max(24, Math.min(ch - 48, pr.y));
          pinEl.style.left = clampedX.toFixed(1) + 'px';
          pinEl.style.top = clampedY.toFixed(1) + 'px';
        }
      });

      ctx.restore();
    }

    requestAnimationFrame(renderFrame);
  })();
})();
