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
  var PAGES = ['beranda', 'eksplorasi', 'tentang', 'dokumentasi', 'tentang-kami', 'dashboard'];
  var TITLES = {
    beranda: 'Vortex Hydro — Pembangkit Listrik Mikro-Hidro Pusaran Air',
    eksplorasi: 'Eksplorasi 3D | Vortex Hydro',
    tentang: 'Cara Kerja Sistem | Vortex Hydro',
    dokumentasi: 'Dokumentasi & Spesifikasi | Vortex Hydro',
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
    if (!active || !active.offsetWidth) {
      lgnLens.classList.remove('is-ready');
      prevLensRect = null;
      return;
    }
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

  var navBurger = $('nav-burger');
  var navMobile = $('nav-mobile');
  function closeMobileNav() {
    if (navMobile) navMobile.hidden = true;
    if (navBurger) navBurger.setAttribute('aria-expanded', 'false');
  }
  if (navBurger && navMobile) {
    navBurger.addEventListener('click', function () {
      var willOpen = navMobile.hidden;
      navMobile.hidden = !willOpen;
      navBurger.setAttribute('aria-expanded', String(willOpen));
    });
    document.addEventListener('click', function (e) {
      if (!navMobile.hidden && hdr && !hdr.contains(e.target)) closeMobileNav();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !navMobile.hidden) closeMobileNav();
    });
  }

  function updateHeaderState(routeId) {
    if (!hdr) return;
    var solid = window.scrollY > 28;
    hdr.classList.toggle('is-scrolled', solid);
    hdr.classList.toggle('is-dark-page', routeId === 'tentang-kami');
  }

  var firstRoute = true;
  function route() {
    closeMobileNav();
    var raw = (location.hash || '#beranda').slice(1);
    var scrollFaq = false;
    var scrollKontak = false;
    if (raw === 'faq') { raw = 'dokumentasi'; scrollFaq = true; }
    else if (raw === 'kontak') { raw = 'beranda'; scrollKontak = true; }
    else if (raw === 'struktur-tim' || raw === 'tim') { raw = 'tentang-kami'; }
    else if (raw === 'teknologi' || raw === 'cara-kerja' || raw === 'inovasi') { raw = 'tentang'; }
    else if (raw === '3d' || raw === 'eksplorasi-3d' || raw === 'model-3d') { raw = 'eksplorasi'; }

    var active = PAGES.indexOf(raw) >= 0 ? raw : 'beranda';
    PAGES.forEach(function (id) {
      var el = $(id);
      if (el) el.hidden = (id !== active);
    });

    var navActiveKey = scrollKontak ? 'kontak' : active;
    $$('[data-nav-link]').forEach(function (a) {
      var k = a.getAttribute('data-k');
      if (k === navActiveKey) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });

    var footer = document.querySelector('.footer');
    if (footer) footer.hidden = (active === 'dashboard' || active === 'eksplorasi');

    if (active !== 'eksplorasi') {
      document.body.classList.remove('vx3d-sheet-open');
    }

    document.title = TITLES[active] || TITLES.beranda;
    updateHeaderState(active);
    requestAnimationFrame(function () { placeNavLens(!firstRoute); firstRoute = false; });

    if (scrollFaq) {
      setTimeout(function () {
        var fq = $('faq-sec');
        if (fq) fq.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
      }, 40);
    } else if (scrollKontak) {
      setTimeout(function () {
        var kt = $('kontak');
        if (kt) kt.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
      }, 60);
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
    if (active === 'beranda') {
      if (typeof window.__vxHeroResize === 'function') {
        requestAnimationFrame(window.__vxHeroResize);
        setTimeout(window.__vxHeroResize, 80);
      }
      if (!scrollKontak && typeof window.__vxReplayHero === 'function') {
        window.__vxReplayHero();
      }
    }
    if (active === 'eksplorasi' && typeof window.__vx3dResize === 'function') {
      requestAnimationFrame(window.__vx3dResize);
      setTimeout(window.__vx3dResize, 80);
    }
  }

  window.addEventListener('hashchange', route);
  window.addEventListener('resize', function () {
    if (window.innerWidth > 920) closeMobileNav();
    prevLensRect = null;
    placeNavLens(false);
  });
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

  /* ---------- 3. Scroll Animations Engine (Hero IN/OUT + Bi-Directional Desktop Scroll Reveals) ---------- */
  (function initScrollAnimations() {
    var progressBar = $('scroll-progress');
    var heroEl = document.querySelector('.hero');
    var heroImg = document.querySelector('.hero__media img');
    var heroRing = document.querySelector('.hero__vortex-ring');
    var heroTop = document.querySelector('.hero__top');
    var heroBottom = document.querySelector('.hero__bottom');
    var heroCue = document.querySelector('.hero__scroll-cue');
    var berandaEl = $('beranda');

    /* 3a. Bi-Directional Scroll Reveal Observer (Smooth IN on enter, resets OUT on leave) */
    var revObs = null;
    if ('IntersectionObserver' in window) {
      revObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add('is-visible');
          } else {
            en.target.classList.remove('is-visible');
          }
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    }
    function observeReveals() {
      $$('[data-reveal]').forEach(function (el) {
        if (revObs) {
          revObs.unobserve(el);
          revObs.observe(el);
        } else {
          el.classList.add('is-visible');
        }
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

    /* Smooth scroll cue button inside Hero (does not hijack SPA hash) */
    if (heroCue) {
      heroCue.addEventListener('click', function (e) {
        e.preventDefault();
        var target = $('manifesto');
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }

    /* 3c. Unified rAF Scroll Tick (Hero Scroll-OUT / Scroll-IN + Parallax + Word Illumination) */
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

      /* Hero Scroll-OUT & Scroll-Back-IN Animation */
      if (heroEl && berandaEl && !berandaEl.hidden) {
        var heroH = heroEl.offsetHeight || vh;
        var outProg = Math.min(1, Math.max(0, sy / Math.max(260, heroH * 0.78)));

        if (heroImg && sy < heroH * 1.3) {
          var imgScale = 1.04 + outProg * 0.1;
          heroImg.style.transform = 'translate3d(0,' + (sy * 0.22).toFixed(1) + 'px,0) scale(' + imgScale.toFixed(3) + ')';
        }
        if (heroRing && sy < heroH * 1.3) {
          heroRing.style.opacity = (0.85 * (1 - outProg)).toFixed(3);
          heroRing.style.transform = 'translate(-50%, -50%) scale(' + (1 + outProg * 0.22).toFixed(3) + ')';
        }
        if (heroTop) {
          if (outProg <= 0.002) {
            heroTop.style.transform = '';
            heroTop.style.opacity = '';
            heroTop.style.filter = '';
          } else {
            var topOp = Math.max(0, 1 - outProg * 1.28);
            var topScale = 1 - outProg * 0.06;
            heroTop.style.transform = 'translate3d(0,' + (-outProg * 72).toFixed(1) + 'px,0) scale(' + topScale.toFixed(3) + ')';
            heroTop.style.opacity = topOp.toFixed(3);
            heroTop.style.filter = 'blur(' + (outProg * 5).toFixed(1) + 'px)';
          }
        }
        if (heroBottom) {
          if (outProg <= 0.002) {
            heroBottom.style.transform = '';
            heroBottom.style.opacity = '';
          } else {
            heroBottom.style.transform = 'translate3d(0,' + (-outProg * 48).toFixed(1) + 'px,0)';
            heroBottom.style.opacity = Math.max(0, 1 - outProg * 1.55).toFixed(3);
          }
        }
        if (heroCue) {
          if (outProg <= 0.002) {
            heroCue.style.transform = '';
            heroCue.style.opacity = '';
          } else {
            heroCue.style.transform = 'translate3d(0,' + (-outProg * 28).toFixed(1) + 'px,0)';
            heroCue.style.opacity = Math.max(0, 1 - outProg * 2.4).toFixed(3);
          }
        }
      }

      /* Scroll-Scrubbed Word Illumination */
      for (var i = 0; i < wordBlocks.length; i++) {
        var wb = wordBlocks[i];
        var page = wb.el.closest('.page');
        if (page && page.hidden) continue;
        var rect = wb.el.getBoundingClientRect();
        var start = vh * 0.92;
        var end = vh * 0.22;
        var prog = (start - rect.top) / Math.max(1, start - end + rect.height * 0.45);
        prog = Math.min(1, Math.max(0, prog));
        var n = wb.words.length;
        for (var w = 0; w < n; w++) {
          var threshold = w / n;
          var local = Math.min(1, Math.max(0, (prog - threshold) * (n * 0.32 + 2.4)));
          wb.words[w].style.opacity = (0.18 + local * 0.82).toFixed(2);
        }
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
        window.dispatchEvent(new CustomEvent('vx:palettechange', { detail: { pal: pal } }));
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

  /* ---------- 5. Redesigned Interactive Editorial How It Works (#tentang) ---------- */
  (function initHowItWorks() {
    var root = $('hiw-root');
    if (!root) return;

    var STAGES = [
      {
        num: '01',
        phase: 'Tahap Pertama',
        code: 'TAHAP 01 · PEMETAAN ALIRAN',
        title: 'Eksplorasi Ide',
        lead: 'Menemukan potensi dan solusi dari setiap tantangan.',
        body: 'Memetakan potensi aliran ber-head rendah, merumuskan mekanisme pusaran air sirkulasi tertutup, dan mengidentifikasi kebutuhan daya tanpa bendungan besar.',
        tags: ['Head Rendah', 'Analisis Debit', 'Konsep Sirkulasi']
      },
      {
        num: '02',
        phase: 'Tahap Kedua',
        code: 'TAHAP 02 · REKAYASA & SIMULASI',
        title: 'Proses Teknologi',
        lead: 'Mengembangkan ide melalui teknologi dan pendekatan yang tepat.',
        body: 'Memodelkan geometri saluran akrilik 3D di AutoCAD, mensimulasikan dinamika aliran fluida di ANSYS Fluent, dan memvalidasi perhitungan daya dengan MATLAB.',
        tags: ['AutoCAD 3D', 'ANSYS Fluent', 'MATLAB']
      },
      {
        num: '03',
        phase: 'Tahap Ketiga',
        code: 'TAHAP 03 · FABRIKASI PROTOTIPE',
        title: 'Implementasi',
        lead: 'Mengubah konsep menjadi solusi nyata.',
        body: 'Merakit rangka laboratorium 2,0 × 0,8 m, kincir 6 sudu Ø 330 mm, transmisi pulley step-up 1:4 pada zona kering, dan Generator DC XD 3240.',
        tags: ['Kincir 6 Sudu', 'Pulley 1:4', 'Generator DC']
      },
      {
        num: '04',
        phase: 'Tahap Keempat',
        code: 'TAHAP 04 · ENERGI BERKELANJUTAN',
        title: 'Dampak Nyata',
        lead: 'Menciptakan manfaat untuk masa depan yang lebih baik.',
        body: 'Menghasilkan listrik DC bersih 12 V untuk beban LED sekaligus menjadi referensi edukasi dan riset energi terbarukan skala mikro tanpa bendungan besar.',
        tags: ['Output 12 V DC', 'Tanpa Bendungan', 'Riset Terbuka']
      }
    ];

    var steps = $$('.hiw__step', root);
    var arts = $$('.hiw__art', root);
    var railWrap = $('hiw-rail-wrap');
    var progressEl = $('hiw-progress');
    var counterEl = $('hiw-counter');
    var specCodeEl = $('hiw-spec-code');
    var panelEl = $('hiw-panel');
    var detailBox = root.querySelector('.hiw__detail');
    var dNum = $('hiw-detail-num'), dPhase = $('hiw-detail-phase'), dTitle = $('hiw-detail-title'),
        dLead = $('hiw-detail-lead'), dBody = $('hiw-detail-body'), dTags = $('hiw-detail-tags'),
        dBar = $('hiw-bar-fill'), prevBtn = $('hiw-prev'), nextBtn = $('hiw-next'),
        canvasEl = $('hiw-canvas');

    var activeIdx = 0;
    var swapTimer = null;

    function updateProgress(idx) {
      var pct = ((idx + 1) / STAGES.length) * 100;
      if (progressEl) progressEl.style.width = pct + '%';
      if (railWrap) railWrap.style.setProperty('--hiw-mob-prog', pct + '%');
      if (dBar) dBar.style.width = pct + '%';
      if (counterEl) counterEl.textContent = STAGES[idx].num + ' / 0' + STAGES.length;
    }

    function activate(idx, immediate) {
      idx = ((idx % STAGES.length) + STAGES.length) % STAGES.length;
      activeIdx = idx;
      var st = STAGES[idx];

      steps.forEach(function (el, i) {
        var isAct = i === idx;
        el.classList.toggle('is-active', isAct);
        el.classList.toggle('is-passed', i < idx);
        var btn = el.querySelector('.hiw__step-btn');
        if (btn) btn.setAttribute('aria-selected', String(isAct));
      });

      arts.forEach(function (svg, i) {
        svg.classList.toggle('is-active', i === idx);
      });

      updateProgress(idx);
      if (panelEl) panelEl.setAttribute('aria-labelledby', 'hiw-tab-' + idx);
      if (specCodeEl) specCodeEl.textContent = st.code;

      function applyText() {
        if (dNum) dNum.textContent = st.num;
        if (dPhase) dPhase.textContent = st.phase;
        if (dTitle) dTitle.textContent = st.title;
        if (dLead) dLead.textContent = st.lead;
        if (dBody) dBody.textContent = st.body;
        if (dTags) {
          dTags.innerHTML = '';
          st.tags.forEach(function (t) {
            var li = document.createElement('li');
            li.textContent = t;
            dTags.appendChild(li);
          });
        }
        if (detailBox) detailBox.classList.remove('is-switching');
      }

      clearTimeout(swapTimer);
      if (immediate || reducedMotion || !detailBox) {
        applyText();
      } else {
        detailBox.classList.add('is-switching');
        swapTimer = setTimeout(applyText, 120);
      }
    }

    steps.forEach(function (el, i) {
      var btn = el.querySelector('.hiw__step-btn');
      if (!btn) return;
      btn.addEventListener('click', function () { activate(i, false); });
      btn.addEventListener('mouseenter', function () {
        if (progressEl && window.innerWidth > 760) {
          var hoverPct = Math.max(((activeIdx + 1) / STAGES.length) * 100, ((i + 1) / STAGES.length) * 100);
          progressEl.style.width = hoverPct + '%';
        }
      });
      btn.addEventListener('mouseleave', function () {
        if (progressEl && window.innerWidth > 760) {
          progressEl.style.width = (((activeIdx + 1) / STAGES.length) * 100) + '%';
        }
      });
      btn.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          activate(i + 1, false);
          var nb = steps[activeIdx] && steps[activeIdx].querySelector('.hiw__step-btn');
          if (nb) nb.focus();
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          activate(i - 1, false);
          var pb = steps[activeIdx] && steps[activeIdx].querySelector('.hiw__step-btn');
          if (pb) pb.focus();
        }
      });
    });

    if (prevBtn) prevBtn.addEventListener('click', function () { activate(activeIdx - 1, false); });
    if (nextBtn) nextBtn.addEventListener('click', function () { activate(activeIdx + 1, false); });

    /* Subtle lightweight scroll parallax on the technical illustration canvas */
    if (canvasEl && !reducedMotion) {
      var artStack = canvasEl.querySelector('.hiw__art-stack');
      var rafPending = false;
      function onScrollParallax() {
        if (rafPending || $('tentang').hidden) return;
        rafPending = true;
        requestAnimationFrame(function () {
          rafPending = false;
          if (!artStack) return;
          var r = canvasEl.getBoundingClientRect();
          var vh = window.innerHeight || 800;
          if (r.bottom < 0 || r.top > vh) return;
          var norm = ((r.top + r.height * 0.5) / vh - 0.5) * 2;
          var shift = Math.max(-10, Math.min(10, norm * -8));
          artStack.style.transform = 'translate3d(0,' + shift.toFixed(1) + 'px,0)';
        });
      }
      window.addEventListener('scroll', onScrollParallax, { passive: true });
    }

    /* Deep links from Beranda component cards -> activate matching stage on #tentang */
    document.addEventListener('click', function (e) {
      var link = e.target.closest && e.target.closest('[data-go-hotspot]');
      if (!link) return;
      var hs = +link.getAttribute('data-go-hotspot');
      var targetStep = hs >= 8 ? 3 : (hs >= 2 ? 2 : 0);
      setTimeout(function () { activate(targetStep, true); }, 60);
    });

    activate(0, true);
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
      'mukhamad-nur-alfan': 'assets/team/mekanikal/mukhamad-nur-alfan.jpg',
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
    var media = $('doc-mod-media'), thumbsEl = $('doc-mod-thumbs'), tagEl = $('doc-mod-tag'),
        titleEl = $('doc-mod-title'), descEl = $('doc-mod-desc'), chipsEl = $('doc-mod-chips'), actEl = $('doc-mod-actions');
    if (!ov) return;

    var ARCHIVE = {
      journey: {
        tag: '01 / REKAP DOKUMENTASI · 16:9',
        title: 'Perjalanan Kami — Dokumenter Vortex Hydro',
        badge: 'REKAP DOKUMENTER · PROYEK LAB',
        photos: ['assets/images/hero-turbine.jpg'],
        desc: 'Rekaman lengkap perjalanan tim Fakultas Vokasi Universitas Negeri Malang dalam merancang, memfabrikasi, dan menguji prototipe pembangkit listrik mikro-hidro pusaran air sirkulasi tertutup di atas rangka 2,0 × 0,8 m.',
        chips: ['Rangka 2,0 × 0,8 m', 'Kincir 6 Sudu Ø 330 mm', 'Transmisi 1:4', 'Generator DC XD 3240'],
        goHref: '#tentang',
        goLabel: 'Lihat Diagram Cara Kerja →'
      },
      process: {
        tag: '02 / DI BALIK PROSES · 1:1',
        title: 'Di Balik Setiap Karya — Film Proses',
        badge: 'PROSES KOLABORASI · 7 DIVISI',
        photos: ['assets/images/team-group.jpg'],
        desc: 'Di balik setiap pengujian prototipe terdapat kolaborasi lintas divisi: mulai dari pemodelan CAD/CFD dan hidrodinamika, perakitan mekanikal, instalasi kelistrikan zona kering, hingga pengembangan web dan AI.',
        chips: ['ANSYS Fluent', 'AutoCAD', 'MATLAB', 'VS Code', 'Uji Lab UM'],
        goHref: '#tentang-kami',
        goLabel: 'Kenali Tim Kepemimpinan →'
      },
      pengurus: {
        tag: '01 / ARSIP DIVISI',
        title: 'Pengurus Inti',
        badge: 'KOORDINASI & MANAJEMEN PROYEK',
        photos: [
          'assets/images/documentation/Pengurus%20inti/Badan%20Pengurus.jpg',
          'assets/images/documentation/Pengurus%20inti/IMG-20261104-WA0079.jpg',
          'assets/images/documentation/Pengurus%20inti/IMG-20261104-WA0081.jpg',
          'assets/images/documentation/Pengurus%20inti/IMG-20261104-WA0087.jpg',
          'assets/images/documentation/Pengurus%20inti/IMG-20261104-WA0106.jpg'
        ],
        desc: 'Menyelaraskan jadwal kerja seluruh divisi teknis, administrasi proyek kelas Mekanika Fluida, serta pengelolaan anggaran dan kesiapan presentasi prototipe Vortex Hydro.',
        chips: ['Koordinasi Lintas Divisi', 'Administrasi', 'Anggaran & Jadwal'],
        divId: 'pengurus'
      },
      'math-modelling': {
        tag: '02 / ARSIP DIVISI',
        title: 'Divisi Math & Modelling',
        badge: 'CAD 3D · CFD · HIDRODINAMIKA',
        photos: [
          'assets/images/documentation/Math%20%26%20modelling/Desain.jpg',
          'assets/images/documentation/Math%20%26%20modelling/IMG-20261104-WA0201.jpg',
          'assets/images/documentation/Math%20%26%20modelling/IMG-20261110-WA0059.jpg',
          'assets/images/documentation/Math%20%26%20modelling/IMG-20261110-WA0099.jpg',
          'assets/images/documentation/Math%20%26%20modelling/IMG-20261110-WA0178.jpg'
        ],
        desc: 'Menggabungkan pemodelan geometri 3D rangka dan saluran akrilik (AutoCAD & ANSYS Fluent CFD) dengan perhitungan matematis aliran fluida, head rendah, serta kajian pemilihan material tahan air di MATLAB.',
        chips: ['AutoCAD 3D', 'ANSYS Fluent CFD', 'MATLAB', 'Kajian Material'],
        divId: 'modeling'
      },
      software: {
        tag: '03 / ARSIP DIVISI',
        title: 'Divisi Software',
        badge: 'WEBSITE, 3D INTERAKTIF & AI',
        photos: [
          'assets/images/documentation/Software/Software.jpg',
          'assets/images/documentation/Software/IMG-20261117-WA0024.jpg',
          'assets/images/documentation/Software/IMG-20261117-WA0033.jpg',
          'assets/images/documentation/Software/IMG-20261117-WA0052.jpg',
          'assets/images/documentation/Software/IMG_5705.png'
        ],
        desc: 'Merancang antarmuka website interaktif Vortex Hydro, visualisasi eksplorasi 3D, diagram penampang animasi, Dashboard Admin telemetri, serta integrasi asisten cerdas Vortex Hydro AI.',
        chips: ['VS Code', 'Eksplorasi 3D WebGL', 'Dashboard Simulasi', 'Vortex Hydro AI'],
        divId: 'software'
      },
      electrical: {
        tag: '04 / ARSIP DIVISI',
        title: 'Divisi Electrical',
        badge: 'PEMBANGKITAN DC & BEBAN LED',
        photos: [
          'assets/images/documentation/Electrical/Elektrikal.jpg',
          'assets/images/documentation/Electrical/IMG-20261105-WA0176.jpg',
          'assets/images/documentation/Electrical/IMG-20261109-WA0212.jpg',
          'assets/images/documentation/Electrical/IMG-20261113-WA0247(1).jpg',
          'assets/images/documentation/Electrical/IMG-20261113-WA0339.jpg'
        ],
        desc: 'Merakit sistem kelistrikan pada zona kering: Generator DC XD 3240, pengontrol pengisian baterai 12 V, rangkaian beban 2× lampu LED 12 V / 5 W (total 10 W), serta pengujian output tegangan.',
        chips: ['Generator DC XD 3240', 'Baterai 12 V', '2× LED 5 W (10 W)'],
        divId: 'electrical'
      },
      mekanikal: {
        tag: '05 / ARSIP DIVISI',
        title: 'Divisi Mekanikal',
        badge: 'FABRIKASI & TRANSMISI 1:4',
        photos: [
          'assets/images/documentation/Mekanikal/Mekanikal.jpg',
          'assets/images/documentation/Mekanikal/IMG-20261027-WA0315.jpg',
          'assets/images/documentation/Mekanikal/IMG-20261027-WA0359.jpg',
          'assets/images/documentation/Mekanikal/IMG-20261106-WA0156.jpg',
          'assets/images/documentation/Mekanikal/IMG-20261116-WA0122.jpg'
        ],
        desc: 'Mengerjakan fabrikasi rangka utama, perakitan saluran akrilik miring, kincir air 6 sudu pada poros stainless steel Ø 30 mm, serta transmisi pulley & V-belt step-up 1:4 (Ø 270 → Ø 67,5 mm).',
        chips: ['Kincir 6 Sudu', 'Poros Ø 30 mm', 'Pulley Step-Up 1:4'],
        divId: 'mekanikal'
      },
      perlengkapan: {
        tag: '06 / ARSIP DIVISI',
        title: 'Divisi Perlengkapan',
        badge: 'SIRKULASI POMPA & LOGISTIK',
        photos: [
          'assets/images/documentation/Perlengkapan/Perlengkapan.jpg',
          'assets/images/documentation/Perlengkapan/IMG-20261101-WA0077.jpg',
          'assets/images/documentation/Perlengkapan/IMG-20261109-WA0051.jpg',
          'assets/images/documentation/Perlengkapan/IMG-20261116-WA0126.jpg',
          'assets/images/documentation/Perlengkapan/motion_photo_2897976322469664644.jpg'
        ],
        desc: 'Mengelola pengadaan komponen teknis dan kesiapan sirkulasi hidrolik: pompa celup 100 W, ember penampung 60 liter, perpipaan Ø 45 mm + flow meter, dan logistik uji lab.',
        chips: ['Pompa Sirkulasi 100 W', 'Ember 60 Liter', 'Pipa Ø 45 mm & Flow Meter'],
        divId: 'perlengkapan'
      },
      pdd: {
        tag: '07 / ARSIP DIVISI',
        title: 'Divisi PDD',
        badge: 'MEDIA, VISUAL & DOKUMENTASI',
        photos: [
          'assets/images/documentation/Pdd/PDD.jpg',
          'assets/images/documentation/Pdd/IMG-20261027-WA0187.jpg',
          'assets/images/documentation/Pdd/IMG-20261103-WA0142.jpg',
          'assets/images/documentation/Pdd/IMG_5708.png',
          'assets/images/documentation/Pdd/IMG_5709.png'
        ],
        desc: 'Mendokumentasikan seluruh momen perakitan hingga pengujian laboratorium dalam bentuk foto, video dokumenter, identitas visual, dan publikasi media sosial @Vortexa.Team.',
        chips: ['Dokumentasi Foto/Video', 'Desain Visual', 'Publikasi @Vortexa.Team'],
        divId: 'pdd'
      }
    };

    var curItem = null, curPhotoIdx = 0;

    function renderDocPhoto(idx) {
      if (!curItem || !curItem.photos || !curItem.photos.length) return;
      var total = curItem.photos.length;
      curPhotoIdx = ((idx % total) + total) % total;
      var src = curItem.photos[curPhotoIdx];
      var html = '<img src="' + src + '" alt="' + curItem.title + ' (' + (curPhotoIdx + 1) + '/' + total + ')">'
        + '<span class="doc-mod__badge">' + curItem.badge + '</span>';
      if (total > 1) {
        html += '<span class="doc-mod__count">' + (curPhotoIdx + 1) + ' / ' + total + '</span>'
          + '<button type="button" class="doc-mod__nav doc-mod__nav--prev" data-doc-step="-1" aria-label="Foto sebelumnya">‹</button>'
          + '<button type="button" class="doc-mod__nav doc-mod__nav--next" data-doc-step="1" aria-label="Foto berikutnya">›</button>';
      }
      media.innerHTML = html;

      if (thumbsEl) {
        if (total > 1) {
          thumbsEl.hidden = false;
          thumbsEl.innerHTML = curItem.photos.map(function (p, i) {
            return '<button type="button" class="doc-mod__thumb' + (i === curPhotoIdx ? ' is-active' : '') + '" data-doc-idx="' + i + '" aria-label="Lihat foto ' + (i + 1) + '">'
              + '<img src="' + p + '" alt="" loading="lazy" decoding="async">'
              + '</button>';
          }).join('');
        } else {
          thumbsEl.hidden = true;
          thumbsEl.innerHTML = '';
        }
      }
    }

    function closeDoc() {
      if (ov.hidden) return;
      ov.hidden = true;
      curItem = null;
      document.body.style.overflow = '';
    }

    function openDoc(key) {
      var item = ARCHIVE[key];
      if (!item) return;
      curItem = item;
      renderDocPhoto(0);
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

    media.addEventListener('click', function (e) {
      var stepBtn = e.target.closest && e.target.closest('[data-doc-step]');
      if (stepBtn) renderDocPhoto(curPhotoIdx + (+stepBtn.getAttribute('data-doc-step') || 0));
    });
    if (thumbsEl) {
      thumbsEl.addEventListener('click', function (e) {
        var tBtn = e.target.closest && e.target.closest('[data-doc-idx]');
        if (tBtn) renderDocPhoto(+tBtn.getAttribute('data-doc-idx') || 0);
      });
    }

    document.addEventListener('click', function (e) {
      var btn = e.target.closest && e.target.closest('[data-doc-open]');
      if (btn) openDoc(btn.getAttribute('data-doc-open'));
    });
    if (closeBtn) closeBtn.addEventListener('click', closeDoc);
    ov.addEventListener('mousedown', function (e) { if (e.target === ov) closeDoc(); });
    document.addEventListener('keydown', function (e) {
      if (ov.hidden) return;
      if (e.key === 'Escape') closeDoc();
      else if (e.key === 'ArrowLeft') renderDocPhoto(curPhotoIdx - 1);
      else if (e.key === 'ArrowRight') renderDocPhoto(curPhotoIdx + 1);
    });
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

  /* ---------- 10. Minimalist Interactive 3D Exploration Stage (Three.js WebGL · Desktop + Mobile Touch) ---------- */
  (function initVortexThreeSimulator() {
    var root = $('vx3d-root');
    var viewport = $('vx3d-viewport');
    var canvas = $('vx3d-canvas');
    if (!root || !viewport || !canvas) return;

    var loadingEl = $('vx3d-loading');
    var errorEl = $('vx3d-error');
    function show3dError() {
      if (loadingEl) loadingEl.hidden = true;
      if (errorEl) errorEl.hidden = false;
    }
    if (typeof window.THREE === 'undefined') {
      show3dError();
      return;
    }
    var THREE = window.THREE;

    /* 5 Pure Prototype Objects — Concise Indonesian, Zero Math Formulas */
    var OBJECT_DATA = {
      chute: {
        short: 'Saluran Akrilik',
        tag: 'KOMPONEN 01 · SALURAN UTAMA',
        title: 'Saluran Akrilik Miring',
        img: 'assets/images/components/cad-prototype.png',
        desc: 'Saluran terbuka berbahan akrilik bening dengan bak penenang hulu, bidang luncur miring, dan ruang keluar hilir.',
        func: 'Menampung air di bagian atas lalu mengarahkan dan mempercepat luncuran air menuju sudu kincir sebelum jatuh ke ember penampung.',
        extra: [
          '<strong>Ukuran Saluran:</strong> Panjang total 1700 mm · Lebar 400 mm',
          '<strong>Tinggi Dinding:</strong> 250 mm dengan sekat penenang di hulu'
        ],
        anchor: [-3.2, 3.55, 0.9],
        view: { theta: 0.48, phi: 1.04, radius: 18.0, target: [-1.2, 2.2, 0.0] }
      },
      wheel: {
        short: 'Kincir Air 6 Sudu',
        tag: 'KOMPONEN 02 · TURBIN UTAMA',
        title: 'Kincir Air 6 Sudu Melengkung',
        img: 'assets/images/components/comp-wheel.jpg',
        desc: 'Rotor turbin berwarna biru dengan 6 bilah sudu melengkung yang terpasang rapi di dalam saluran miring.',
        func: 'Menangkap dorongan aliran air yang meluncur di saluran dan mengubahnya menjadi gerak putar pada poros utama.',
        extra: [
          '<strong>Jumlah Bilah:</strong> 6 sudu melengkung penangkap arus',
          '<strong>Poros Utama:</strong> Stainless steel berdiameter 30 mm'
        ],
        anchor: [3.6, 2.05, 1.25],
        view: { theta: 0.44, phi: 1.06, radius: 11.2, target: [3.8, 2.15, 0.0] }
      },
      pulley: {
        short: 'Pulley 1:4 & V-Belt',
        tag: 'KOMPONEN 03 · TRANSMISI PUTARAN',
        title: 'Transmisi Pulley 4-Jari (1 : 4) & V-Belt',
        img: 'assets/images/components/comp-pulley.jpg?v=2',
        desc: 'Roda pulley besar berjari empat di sisi luar saluran yang dihubungkan sabuk V-belt ke pulley kecil generator.',
        func: 'Melipatgandakan kecepatan putaran poros kincir menjadi empat kali lebih cepat agar generator bekerja optimal.',
        extra: [
          '<strong>Pulley Penggerak:</strong> Diameter 270 mm di sisi luar saluran',
          '<strong>Pulley Generator:</strong> Diameter 67,5 mm (perbandingan 1 : 4)'
        ],
        anchor: [3.9, 3.55, -2.32],
        view: { theta: 2.38, phi: 1.12, radius: 12.0, target: [5.7, 1.85, -2.2] }
      },
      generator: {
        short: 'Generator DC',
        tag: 'KOMPONEN 04 · PEMBANGKIT LISTRIK',
        title: 'Generator DC XD 3240',
        img: 'assets/images/components/comp-generator.jpg?v=2',
        desc: 'Unit generator arus searah (DC) berukuran ringkas yang ditempatkan di ujung hilir di luar jalur air.',
        func: 'Mengubah putaran cepat dari sabuk transmisi pulley menjadi energi listrik arus searah (DC).',
        extra: [
          '<strong>Tipe Unit:</strong> Permanent Magnet Generator DC XD 3240',
          '<strong>Penempatan:</strong> Zona kering di ujung hilir saluran'
        ],
        anchor: [8.85, 1.45, -1.25],
        view: { theta: 1.85, phi: 1.10, radius: 9.8, target: [8.5, 1.35, -1.4] }
      },
      tank: {
        short: 'Ember Air 60 L',
        tag: 'KOMPONEN 05 · PENAMPUNG SIRKULASI',
        title: 'Ember Penampung Air 60 Liter & Pompa',
        img: 'assets/images/components/comp-pump.jpg?v=2',
        desc: 'Ember silinder berwarna hijau berkapasitas 60 liter yang berada tepat di bawah bukaan keluar saluran.',
        func: 'Menampung air yang jatuh dari ujung saluran agar dapat dipompa kembali dalam siklus aliran tertutup.',
        extra: [
          '<strong>Kapasitas Wadah:</strong> 60 liter dengan pompa celup 100 W',
          '<strong>Posisi:</strong> Tepat di bawah bibir keluaran saluran hilir'
        ],
        anchor: [7.35, -2.05, 1.42],
        view: { theta: 0.62, phi: 1.18, radius: 13.5, target: [7.1, -1.8, 0.0] }
      }
    };

    var DEFAULT_VIEW = { theta: 0.60, phi: 1.06, radius: 22.0, target: [0.6, 0.45, 0.0] };
    var PAN_MIN = new THREE.Vector3(-9.5, -4.5, -5.0);
    var PAN_MAX = new THREE.Vector3(10.5, 5.5, 5.0);

    /* UI Elements */
    var panel = $('vx3d-panel');
    var pTag = $('vx3d-p-tag');
    var pTitle = $('vx3d-p-title');
    var pImg = $('vx3d-p-img');
    var pDesc = $('vx3d-p-desc');
    var pFunc = $('vx3d-p-func');
    var pExtra = $('vx3d-p-extra');
    var pClose = $('vx3d-p-close');
    var tooltip = $('vx3d-tooltip');
    var hintEl = $('vx3d-hint');
    var hotspotsWrap = $('vx3d-hotspots');
    var spotBtns = {};
    if (hotspotsWrap) {
      $$('[data-spot]', hotspotsWrap).forEach(function (b) {
        spotBtns[b.getAttribute('data-spot')] = b;
      });
    }

    /* Three.js Scene & Renderer with WebGL Error Guard */
    var scene = new THREE.Scene();
    scene.background = null;
    var camera = new THREE.PerspectiveCamera(39, 16 / 9, 0.1, 160);
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
    } catch (_) {
      show3dError();
      return;
    }
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(1.75, window.devicePixelRatio || 1));

    /* Clean Studio Lighting (Light & Dark Theme Balanced) */
    scene.add(new THREE.HemisphereLight(0xeef8ff, 0x1e3a5f, 1.1));

    var keyLight = new THREE.DirectionalLight(0xffffff, 1.15);
    keyLight.position.set(12, 22, 16);
    scene.add(keyLight);

    var backRimLight = new THREE.DirectionalLight(0x38bdf8, 0.72);
    backRimLight.position.set(-14, 10, -14);
    scene.add(backRimLight);

    /* Registry for Raycasting & Emissive Highlighting */
    var interactiveMeshes = [];
    var originalEmissives = new Map();

    function registerMesh(mesh, key) {
      mesh.userData.objKey = key;
      if (mesh.material && mesh.material.emissive) {
        originalEmissives.set(mesh.uuid, {
          hex: mesh.material.emissive.getHex(),
          intensity: mesh.material.emissiveIntensity || 0
        });
      }
      interactiveMeshes.push(mesh);
    }

    function createGroup(key) {
      var g = new THREE.Group();
      g.userData.objKey = key;
      scene.add(g);
      return g;
    }

    function addEdges(mesh, color, opacity) {
      var edges = new THREE.EdgesGeometry(mesh.geometry, 15);
      var lineMat = new THREE.LineBasicMaterial({
        color: color || 0x0284c7,
        transparent: true,
        opacity: opacity == null ? 0.72 : opacity
      });
      mesh.add(new THREE.LineSegments(edges, lineMat));
    }

    function addBox(group, key, w, h, d, x, y, z, mat, rx, ry, rz) {
      var geom = new THREE.BoxGeometry(w, h, d);
      var m = mat.clone ? mat.clone() : mat;
      var mesh = new THREE.Mesh(geom, m);
      mesh.position.set(x, y, z);
      if (rx) mesh.rotation.x = rx;
      if (ry) mesh.rotation.y = ry;
      if (rz) mesh.rotation.z = rz;
      group.add(mesh);
      registerMesh(mesh, key);
      return mesh;
    }

    /* Materials */
    var matAcrylic = new THREE.MeshPhysicalMaterial({
      color: 0xbceeff,
      transparent: true,
      opacity: 0.34,
      roughness: 0.1,
      metalness: 0.05,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    var matAcrylicFloor = new THREE.MeshPhysicalMaterial({
      color: 0x93dff7,
      transparent: true,
      opacity: 0.44,
      roughness: 0.14,
      metalness: 0.05,
      side: THREE.DoubleSide
    });
    var matWater = new THREE.MeshStandardMaterial({
      color: 0x00a8e8,
      transparent: true,
      opacity: 0.74,
      roughness: 0.18,
      metalness: 0.08,
      emissive: 0x004a77,
      emissiveIntensity: 0.32
    });
    var matBlade = new THREE.MeshStandardMaterial({
      color: 0x00b4d8,
      metalness: 0.28,
      roughness: 0.24,
      emissive: 0x00527a,
      emissiveIntensity: 0.28
    });
    var matShaft = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85, roughness: 0.2 });
    var matPulley = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.55, roughness: 0.28 });
    var matBelt = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.15, roughness: 0.75 });
    var matGenBody = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.72, roughness: 0.28 });
    var matGenCap  = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6, roughness: 0.35 });

    /* Green 60-Liter Bucket Materials ("warna embernya hijau, jangan terlalu lebar") */
    var matBucketGreen = new THREE.MeshStandardMaterial({
      color: 0x16a34a,
      transparent: true,
      opacity: 0.86,
      roughness: 0.32,
      metalness: 0.08,
      emissive: 0x064e22,
      emissiveIntensity: 0.18,
      side: THREE.DoubleSide
    });
    var matBucketRim = new THREE.MeshStandardMaterial({
      color: 0x15803d,
      roughness: 0.28,
      metalness: 0.12,
      emissive: 0x052e16,
      emissiveIntensity: 0.15
    });
    var matPump = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.45, roughness: 0.28 });

    /* =====================================================================
       OBJECT 01: SALURAN AKRILIK MIRING (1:100 True Millimetric Scale from PDF)
       - Total Length: 1700.00 mm -> 17.00 units (X: -8.50 to +8.50)
       - Width: 400.00 mm -> 4.00 units (Z: -2.00 to +2.00)
       ===================================================================== */
    var gChute = createGroup('chute');

    var wallShape = new THREE.Shape();
    wallShape.moveTo(-8.50, 2.35);
    wallShape.lineTo(-3.50, 2.35);
    wallShape.lineTo(6.50, 0.50);
    wallShape.lineTo(6.50, 0.00);
    wallShape.lineTo(8.50, 0.00);
    wallShape.lineTo(8.50, 3.00);
    wallShape.lineTo(6.50, 3.00);
    wallShape.lineTo(-3.50, 4.85);
    wallShape.lineTo(-8.50, 4.85);
    wallShape.closePath();

    var wallGeom = new THREE.ExtrudeGeometry(wallShape, { depth: 0.08, bevelEnabled: false });

    var sideWallFront = new THREE.Mesh(wallGeom, matAcrylic.clone());
    sideWallFront.position.z = 1.92;
    addEdges(sideWallFront, 0x0284c7, 0.8);
    gChute.add(sideWallFront);
    registerMesh(sideWallFront, 'chute');

    var sideWallBack = new THREE.Mesh(wallGeom, matAcrylic.clone());
    sideWallBack.position.z = -2.00;
    addEdges(sideWallBack, 0x0284c7, 0.8);
    gChute.add(sideWallBack);
    registerMesh(sideWallBack, 'chute');

    var floorUpper = addBox(gChute, 'chute', 5.00, 0.08, 3.84, -6.00, 2.39, 0, matAcrylicFloor);
    addEdges(floorUpper, 0x0284c7, 0.65);

    var slopeAngle = -Math.atan2(1.85, 10.00);
    var floorSlope = addBox(gChute, 'chute', 10.1697, 0.08, 3.84, 1.50, 1.465, 0, matAcrylicFloor, 0, 0, slopeAngle);
    addEdges(floorSlope, 0x0284c7, 0.65);

    var endWallBack = addBox(gChute, 'chute', 0.08, 2.50, 3.84, -8.46, 3.60, 0, matAcrylic);
    addEdges(endWallBack, 0x0284c7, 0.75);

    var endWallFront = addBox(gChute, 'chute', 0.08, 3.00, 3.84, 8.46, 1.50, 0, matAcrylic);
    addEdges(endWallFront, 0x0284c7, 0.75);

    var dropStepWall = addBox(gChute, 'chute', 0.08, 0.50, 3.84, 6.50, 0.25, 0, matAcrylic);
    addEdges(dropStepWall, 0x0284c7, 0.65);

    var weirBaffle = addBox(gChute, 'chute', 0.95, 1.05, 3.84, -8.025, 4.325, 0, matAcrylicFloor);
    addEdges(weirBaffle, 0x0284c7, 0.8);

    addBox(gChute, 'chute', 4.90, 0.24, 3.80, -6.00, 2.54, 0, matWater);
    addBox(gChute, 'chute', 10.12, 0.22, 3.80, 1.50, 1.60, 0, matWater, 0, 0, slopeAngle);

    /* =====================================================================
       OBJECT 02: KINCIR AIR 6 SUDU MELENGKUNG (Proportionally Inside Channel)
       ===================================================================== */
    var gWheel = createGroup('wheel');
    var rotorPivot = new THREE.Group();
    rotorPivot.position.set(3.80, 2.18, 0.0);
    gWheel.add(rotorPivot);

    var mainShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 5.20, 20), matShaft.clone());
    mainShaft.rotation.x = Math.PI / 2;
    rotorPivot.add(mainShaft);
    registerMesh(mainShaft, 'wheel');

    var rotorHub = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 3.68, 20), matPump.clone());
    rotorHub.rotation.x = Math.PI / 2;
    rotorPivot.add(rotorHub);
    registerMesh(rotorHub, 'wheel');

    var bladeShape = new THREE.Shape();
    bladeShape.moveTo(0.32, -0.04);
    bladeShape.quadraticCurveTo(0.72, -0.02, 1.04, 0.26);
    bladeShape.lineTo(0.99, 0.34);
    bladeShape.quadraticCurveTo(0.68, 0.07, 0.32, 0.05);
    bladeShape.closePath();

    var bladeGeom = new THREE.ExtrudeGeometry(bladeShape, { depth: 3.64, bevelEnabled: false });
    bladeGeom.translate(0, 0, -1.82);

    for (var bi = 0; bi < 6; bi++) {
      var bladeMesh = new THREE.Mesh(bladeGeom, matBlade.clone());
      bladeMesh.rotation.z = (bi * Math.PI) / 3;
      addEdges(bladeMesh, 0x00e5ff, 0.7);
      rotorPivot.add(bladeMesh);
      registerMesh(bladeMesh, 'wheel');
    }

    /* =====================================================================
       OBJECT 03: TRANSMISI PULLEY 4-JARI (Ø 270 mm) & V-BELT (1 : 4)
       ===================================================================== */
    var gPulley = createGroup('pulley');
    var pulleyZ = -2.32;

    var pulley1Pivot = new THREE.Group();
    pulley1Pivot.position.set(3.80, 2.18, pulleyZ);
    gPulley.add(pulley1Pivot);

    var p1Ring = new THREE.Mesh(new THREE.TorusGeometry(1.32, 0.08, 14, 36), matPulley.clone());
    pulley1Pivot.add(p1Ring);
    registerMesh(p1Ring, 'pulley');

    var p1Boss = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.16, 18), matPulley.clone());
    p1Boss.rotation.x = Math.PI / 2;
    pulley1Pivot.add(p1Boss);
    registerMesh(p1Boss, 'pulley');

    var spokeH = addBox(pulley1Pivot, 'pulley', 2.52, 0.12, 0.09, 0, 0, 0, matPulley);
    var spokeV = addBox(pulley1Pivot, 'pulley', 0.12, 2.52, 0.09, 0, 0, 0, matPulley);
    addEdges(spokeH, 0x334155, 0.6);
    addEdges(spokeV, 0x334155, 0.6);

    var p2X = 8.85, p2Y = 1.35, p2R = 0.34, p1R = 1.32;
    var pulley2Pivot = new THREE.Group();
    pulley2Pivot.position.set(p2X, p2Y, pulleyZ);
    gPulley.add(pulley2Pivot);

    var p2Wheel = new THREE.Mesh(new THREE.CylinderGeometry(p2R, p2R, 0.16, 20), matPulley.clone());
    p2Wheel.rotation.x = Math.PI / 2;
    pulley2Pivot.add(p2Wheel);
    registerMesh(p2Wheel, 'pulley');

    var dxP = p2X - 3.80;
    var dyP = p2Y - 2.18;
    var distP = Math.hypot(dxP, dyP);
    var baseAng = Math.atan2(dyP, dxP);
    var spreadAng = Math.asin((p1R - p2R) / distP);

    var nTopAngle = baseAng + Math.PI / 2 - spreadAng;
    var t1TopX = 3.80 + Math.cos(nTopAngle) * p1R;
    var t1TopY = 2.18 + Math.sin(nTopAngle) * p1R;
    var t2TopX = p2X + Math.cos(nTopAngle) * p2R;
    var t2TopY = p2Y + Math.sin(nTopAngle) * p2R;
    var lenTop = Math.hypot(t2TopX - t1TopX, t2TopY - t1TopY);
    var angTop = Math.atan2(t2TopY - t1TopY, t2TopX - t1TopX);
    addBox(gPulley, 'pulley', lenTop, 0.07, 0.10, (t1TopX + t2TopX) * 0.5, (t1TopY + t2TopY) * 0.5, pulleyZ, matBelt, 0, 0, angTop);

    var nBotAngle = baseAng - Math.PI / 2 + spreadAng;
    var t1BotX = 3.80 + Math.cos(nBotAngle) * p1R;
    var t1BotY = 2.18 + Math.sin(nBotAngle) * p1R;
    var t2BotX = p2X + Math.cos(nBotAngle) * p2R;
    var t2BotY = p2Y + Math.sin(nBotAngle) * p2R;
    var lenBot = Math.hypot(t2BotX - t1BotX, t2BotY - t1BotY);
    var angBot = Math.atan2(t2BotY - t1BotY, t2BotX - t1BotX);
    addBox(gPulley, 'pulley', lenBot, 0.07, 0.10, (t1BotX + t2BotX) * 0.5, (t1BotY + t2BotY) * 0.5, pulleyZ, matBelt, 0, 0, angBot);

    /* =====================================================================
       OBJECT 04: COMPACT GENERATOR DC XD 3240
       ===================================================================== */
    var gGen = createGroup('generator');
    var genBody = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 1.10, 24), matGenBody.clone());
    genBody.rotation.x = Math.PI / 2;
    genBody.position.set(p2X, p2Y, -1.42);
    addEdges(genBody, 0x0284c7, 0.55);
    gGen.add(genBody);
    registerMesh(genBody, 'generator');

    var genCap1 = addBox(gGen, 'generator', 0.78, 0.78, 0.10, p2X, p2Y, -1.94, matGenCap);
    var genCap2 = addBox(gGen, 'generator', 0.78, 0.78, 0.10, p2X, p2Y, -0.90, matGenCap);
    addEdges(genCap1, 0x0f172a, 0.7);
    addEdges(genCap2, 0x0f172a, 0.7);

    var genShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.55, 14), matShaft.clone());
    genShaft.rotation.x = Math.PI / 2;
    genShaft.position.set(p2X, p2Y, -2.14);
    gGen.add(genShaft);
    registerMesh(genShaft, 'generator');

    /* =====================================================================
       OBJECT 05: EMBER PENAMPUNG AIR 60 LITER HIJAU & POMPA
       - Green bucket ("warna embernya hijau, jngn dibuat terlalu lebar")
       - Top Radius = 1.42, Bottom Radius = 1.24, Height = 3.25 (Y: -3.60 to -0.35)
       ===================================================================== */
    var gTank = createGroup('tank');
    var tankX = 7.35, tankZ = 0.0;
    var tankTopR = 1.42, tankBotR = 1.24, tankH = 3.25;
    var tankBottomY = -3.60;
    var tankCenterY = tankBottomY + tankH * 0.5;

    /* Water inside Green 60L Bucket */
    var waterH = 2.45;
    var tankWater = new THREE.Mesh(
      new THREE.CylinderGeometry(tankTopR - 0.10, tankBotR - 0.06, waterH, 32),
      matWater.clone()
    );
    tankWater.position.set(tankX, tankBottomY + waterH * 0.5 + 0.06, tankZ);
    gTank.add(tankWater);
    registerMesh(tankWater, 'tank');

    /* Outer Tapered Green Bucket Body */
    var tankShell = new THREE.Mesh(
      new THREE.CylinderGeometry(tankTopR, tankBotR, tankH, 36, 1, true),
      matBucketGreen.clone()
    );
    tankShell.position.set(tankX, tankCenterY, tankZ);
    addEdges(tankShell, 0x22c55e, 0.55);
    gTank.add(tankShell);
    registerMesh(tankShell, 'tank');

    /* Green Bucket Solid Bottom Base */
    var tankBottom = new THREE.Mesh(
      new THREE.CylinderGeometry(tankBotR, tankBotR, 0.08, 36),
      matBucketRim.clone()
    );
    tankBottom.position.set(tankX, tankBottomY, tankZ);
    gTank.add(tankBottom);
    registerMesh(tankBottom, 'tank');

    /* Green Bucket Top Lip & Upper Reinforcement Rib */
    var tankRim = new THREE.Mesh(new THREE.TorusGeometry(tankTopR + 0.02, 0.075, 12, 36), matBucketRim.clone());
    tankRim.rotation.x = Math.PI / 2;
    tankRim.position.set(tankX, tankBottomY + tankH, tankZ);
    gTank.add(tankRim);
    registerMesh(tankRim, 'tank');

    var tankRib = new THREE.Mesh(new THREE.TorusGeometry(tankTopR - 0.01, 0.045, 10, 36), matBucketRim.clone());
    tankRib.rotation.x = Math.PI / 2;
    tankRib.position.set(tankX, tankBottomY + tankH - 0.28, tankZ);
    gTank.add(tankRib);
    registerMesh(tankRib, 'tank');

    /* Submerged Circulation Pump inside 60L Green Bucket */
    var pumpBody = addBox(gTank, 'tank', 0.72, 0.62, 0.62, tankX - 0.25, tankBottomY + 0.36, 0.15, matPump);
    addEdges(pumpBody, 0x80f0ff, 0.65);

    /* =====================================================================
       LIGHTWEIGHT 3D WATER STREAM PARTICLES (Headbox -> Slope -> Wheel -> Green Bucket)
       ===================================================================== */
    var PARTICLE_COUNT = 75;
    var pGeom = new THREE.BufferGeometry();
    var pPositions = new Float32Array(PARTICLE_COUNT * 3);
    var pPhases = new Float32Array(PARTICLE_COUNT);
    var pLanes = new Float32Array(PARTICLE_COUNT);
    for (var pi = 0; pi < PARTICLE_COUNT; pi++) {
      pPhases[pi] = pi / PARTICLE_COUNT;
      pLanes[pi] = (Math.random() - 0.5) * 2.1;
    }
    pGeom.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    var pMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.16,
      transparent: true,
      opacity: 0.9
    });
    var waterParticles = new THREE.Points(pGeom, pMat);
    scene.add(waterParticles);

    function updateWaterParticles(time) {
      var posArr = pGeom.attributes.position.array;
      for (var i = 0; i < PARTICLE_COUNT; i++) {
        var t = (pPhases[i] + time * 0.22) % 1;
        var lane = pLanes[i];
        var x = 0, y = 0, z = lane;
        if (t < 0.22) {
          var u1 = t / 0.22;
          x = -8.2 + u1 * 4.7;
          y = 2.68;
        } else if (t < 0.76) {
          var u2 = (t - 0.22) / 0.54;
          x = -3.5 + u2 * 10.0;
          y = 2.68 - u2 * 1.86;
        } else {
          /* Drop straight into the narrower green 60L bucket (X ~ 7.35) */
          var u3 = (t - 0.76) / 0.24;
          x = 6.95 + (i % 4) * 0.24;
          y = 0.55 - u3 * 1.95;
          z = lane * 0.48;
        }
        posArr[i * 3] = x;
        posArr[i * 3 + 1] = y;
        posArr[i * 3 + 2] = z;
      }
      pGeom.attributes.position.needsUpdate = true;
    }

    /* =====================================================================
       CAMERA ORBIT / ZOOM / PAN (Mouse + Touch), RAYCASTING, INFO PANEL
       ===================================================================== */
    var selectedKey = null;
    var hoveredKey = null;
    var MIN_R = 6.5, MAX_R = 40;
    var MIN_PHI = 0.30, MAX_PHI = 1.50;

    function isMobileLayout() { return window.innerWidth <= 768; }

    /* Portrait screens need the camera slightly further away to fit the 17-unit wide model cleanly */
    function fitFactor(isFocus) {
      var aspect = camera.aspect || 1.6;
      var f = Math.min(2.25, Math.max(1, 1.48 / aspect));
      return isFocus ? Math.sqrt(f) : f;
    }

    var cam = {
      theta: DEFAULT_VIEW.theta, phi: DEFAULT_VIEW.phi, radius: DEFAULT_VIEW.radius,
      target: new THREE.Vector3().fromArray(DEFAULT_VIEW.target)
    };
    var goal = {
      theta: DEFAULT_VIEW.theta, phi: DEFAULT_VIEW.phi, radius: DEFAULT_VIEW.radius,
      target: new THREE.Vector3().fromArray(DEFAULT_VIEW.target)
    };
    /* Screen-space offset so the 3D model stays visible beside the desktop panel / above the mobile bottom sheet */
    var viewShift = { x: 0, y: 0 }, viewShiftGoal = { x: 0, y: 0 };

    function setGoalView(v, isFocus) {
      goal.theta = v.theta;
      goal.phi = v.phi;
      goal.radius = v.radius * fitFactor(isFocus);
      goal.target.fromArray(v.target);
    }

    function applyCamera() {
      var sinPhi = Math.sin(cam.phi);
      camera.position.set(
        cam.target.x + cam.radius * sinPhi * Math.sin(cam.theta),
        cam.target.y + cam.radius * Math.cos(cam.phi),
        cam.target.z + cam.radius * sinPhi * Math.cos(cam.theta)
      );
      camera.lookAt(cam.target);
      if (Math.abs(viewShift.x) > 0.5 || Math.abs(viewShift.y) > 0.5) {
        camera.setViewOffset(vw, vh, viewShift.x, viewShift.y, vw, vh);
      } else if (camera.view && camera.view.enabled) {
        camera.clearViewOffset();
      }
      camera.updateMatrixWorld();
    }

    function updatePanelShift() {
      if (!selectedKey || !panel || panel.hidden) {
        viewShiftGoal.x = 0;
        viewShiftGoal.y = 0;
        return;
      }
      if (isMobileLayout()) {
        var stageRect = viewport.getBoundingClientRect();
        var sheetRect = panel.getBoundingClientRect();
        var covered = Math.max(0, stageRect.bottom - sheetRect.top);
        viewShiftGoal.x = 0;
        viewShiftGoal.y = Math.min(vh * 0.30, covered * 0.52);
      } else {
        viewShiftGoal.x = Math.min(vw * 0.22, (panel.offsetWidth + 32) * 0.5);
        viewShiftGoal.y = 0;
      }
    }

    function dismissHint() {
      if (hintEl && !hintEl.classList.contains('is-dismissed')) {
        hintEl.classList.add('is-dismissed');
      }
    }

    function applyHighlightState() {
      interactiveMeshes.forEach(function (m) {
        if (!m.material || !m.material.emissive) return;
        var orig = originalEmissives.get(m.uuid) || { hex: 0x000000, intensity: 0 };
        var k = m.userData.objKey;
        if (k === selectedKey) {
          m.material.emissive.setHex(0xff7a2f);
          m.material.emissiveIntensity = 0.42;
        } else if (k === hoveredKey) {
          m.material.emissive.setHex(0xffa25c);
          m.material.emissiveIntensity = 0.26;
        } else {
          m.material.emissive.setHex(orig.hex);
          m.material.emissiveIntensity = orig.intensity;
        }
      });

      Object.keys(spotBtns).forEach(function (k) {
        var b = spotBtns[k];
        if (!b) return;
        b.classList.toggle('is-active', k === selectedKey);
        b.classList.toggle('is-hover', k === hoveredKey && k !== selectedKey);
        b.setAttribute('aria-pressed', String(k === selectedKey));
      });
    }

    function closePanel() {
      selectedKey = null;
      if (panel) panel.hidden = true;
      document.body.classList.remove('vx3d-sheet-open');
      setGoalView(DEFAULT_VIEW, false);
      updatePanelShift();
      applyHighlightState();
    }

    function selectObject(key) {
      dismissHint();
      if (!key || !OBJECT_DATA[key]) {
        closePanel();
        return;
      }
      selectedKey = key;
      var d = OBJECT_DATA[key];
      if (pTag) pTag.textContent = d.tag;
      if (pTitle) pTitle.textContent = d.title;
      if (pImg) { pImg.src = d.img; pImg.alt = d.title; }
      if (pDesc) pDesc.textContent = d.desc;
      if (pFunc) pFunc.textContent = d.func;
      if (pExtra) {
        pExtra.innerHTML = d.extra.map(function (item) { return '<li>' + item + '</li>'; }).join('');
      }
      if (panel) {
        panel.hidden = false;
        panel.scrollTop = 0;
      }
      document.body.classList.toggle('vx3d-sheet-open', isMobileLayout());
      setGoalView(d.view, true);
      requestAnimationFrame(updatePanelShift);
      applyHighlightState();
    }

    /* ---------- Pointer Handling: 1 pointer = orbit (or pan with right-click / Shift), 2 pointers = pinch zoom + pan ---------- */
    var raycaster = new THREE.Raycaster();
    var pointerNDC = new THREE.Vector2();
    var pointers = new Map();
    var dragMoved = 0, dragMode = 'orbit', lastPinchDist = 0, lastMid = null;

    function pickAt(clientX, clientY) {
      var rect = canvas.getBoundingClientRect();
      pointerNDC.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointerNDC.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointerNDC, camera);
      var hits = raycaster.intersectObjects(interactiveMeshes, false);
      return hits.length ? hits[0].object.userData.objKey : null;
    }

    function panBy(dx, dy) {
      var scale = cam.radius * 0.0019;
      var forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      var right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();
      var up = new THREE.Vector3().crossVectors(right, forward).normalize();
      goal.target.addScaledVector(right, -dx * scale);
      goal.target.addScaledVector(up, dy * scale);
      goal.target.clamp(PAN_MIN, PAN_MAX);
    }

    function pinchState() {
      var pts = Array.from(pointers.values());
      var dx = pts[0].x - pts[1].x, dy = pts[0].y - pts[1].y;
      return { dist: Math.hypot(dx, dy), mid: { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 } };
    }

    canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

    canvas.addEventListener('pointerdown', function (e) {
      if (canvas.setPointerCapture) canvas.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      dragMoved = 0;
      dragMode = (e.button === 2 || e.shiftKey) ? 'pan' : 'orbit';
      if (pointers.size === 2) {
        var ps = pinchState();
        lastPinchDist = ps.dist;
        lastMid = ps.mid;
      }
      if (tooltip) tooltip.hidden = true;
    });

    canvas.addEventListener('pointermove', function (e) {
      var p = pointers.get(e.pointerId);
      if (p) {
        var dx = e.clientX - p.x, dy = e.clientY - p.y;
        p.x = e.clientX;
        p.y = e.clientY;
        dragMoved += Math.abs(dx) + Math.abs(dy);
        if (dragMoved > 6) dismissHint();

        if (pointers.size >= 2) {
          var ps = pinchState();
          if (lastPinchDist > 0) {
            goal.radius = Math.max(MIN_R, Math.min(MAX_R, goal.radius * (lastPinchDist / Math.max(1, ps.dist))));
          }
          if (lastMid) panBy(ps.mid.x - lastMid.x, ps.mid.y - lastMid.y);
          lastPinchDist = ps.dist;
          lastMid = ps.mid;
          dragMoved += 10;
        } else if (dragMode === 'pan') {
          panBy(dx, dy);
        } else {
          goal.theta -= dx * 0.0068;
          goal.phi = Math.max(MIN_PHI, Math.min(MAX_PHI, goal.phi - dy * 0.0058));
        }
        if (dragMoved > 6) canvas.classList.add('is-dragging');
        return;
      }

      /* Hover highlight (desktop mouse only) */
      if (e.pointerType !== 'mouse') return;
      var hitKey = pickAt(e.clientX, e.clientY);
      if (hitKey !== hoveredKey) {
        hoveredKey = hitKey;
        canvas.classList.toggle('is-hovering', !!hoveredKey);
        applyHighlightState();
      }
      if (tooltip) {
        if (hoveredKey && OBJECT_DATA[hoveredKey]) {
          var rect = canvas.getBoundingClientRect();
          tooltip.textContent = OBJECT_DATA[hoveredKey].short;
          tooltip.style.left = (e.clientX - rect.left) + 'px';
          tooltip.style.top = (e.clientY - rect.top) + 'px';
          tooltip.hidden = false;
        } else {
          tooltip.hidden = true;
        }
      }
    });

    function endPointer(e) {
      var wasTap = pointers.size === 1 && dragMoved < 7 && (e.pointerType !== 'mouse' || e.button === 0);
      pointers.delete(e.pointerId);
      if (pointers.size < 2) { lastPinchDist = 0; lastMid = null; }
      if (pointers.size === 0) canvas.classList.remove('is-dragging');
      if (wasTap && e.type === 'pointerup') {
        var key = pickAt(e.clientX, e.clientY);
        if (key) selectObject(key);
        else if (selectedKey) closePanel();
      }
    }
    canvas.addEventListener('pointerup', endPointer);
    canvas.addEventListener('pointercancel', endPointer);

    canvas.addEventListener('pointerleave', function (e) {
      if (e.pointerType !== 'mouse') return;
      if (hoveredKey) {
        hoveredKey = null;
        canvas.classList.remove('is-hovering');
        applyHighlightState();
      }
      if (tooltip) tooltip.hidden = true;
    });

    canvas.addEventListener('wheel', function (e) {
      e.preventDefault();
      dismissHint();
      var factor = Math.exp(e.deltaY * 0.0012);
      goal.radius = Math.max(MIN_R, Math.min(MAX_R, goal.radius * factor));
    }, { passive: false });

    /* ---------- Hotspots, Panel Close & Camera Controls ---------- */
    Object.keys(spotBtns).forEach(function (k) {
      spotBtns[k].addEventListener('click', function (e) {
        e.stopPropagation();
        if (selectedKey === k) closePanel();
        else selectObject(k);
      });
    });

    if (pClose) pClose.addEventListener('click', closePanel);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && selectedKey) closePanel();
    });

    var btnZoomIn = $('vx3d-zoom-in'), btnZoomOut = $('vx3d-zoom-out');
    var btnReset = $('vx3d-reset'), btnFs = $('vx3d-fullscreen');
    if (btnZoomIn) btnZoomIn.addEventListener('click', function () { dismissHint(); goal.radius = Math.max(MIN_R, goal.radius * 0.8); });
    if (btnZoomOut) btnZoomOut.addEventListener('click', function () { dismissHint(); goal.radius = Math.min(MAX_R, goal.radius * 1.25); });
    if (btnReset) btnReset.addEventListener('click', function () {
      if (selectedKey) closePanel();
      else setGoalView(DEFAULT_VIEW, false);
    });

    var canFullscreen = !!(root.requestFullscreen || root.webkitRequestFullscreen);
    if (btnFs) {
      if (!canFullscreen) {
        btnFs.hidden = true;
      } else {
        btnFs.addEventListener('click', function () {
          var fsEl = document.fullscreenElement || document.webkitFullscreenElement;
          if (!fsEl) {
            var req = root.requestFullscreen || root.webkitRequestFullscreen;
            var r = req.call(root);
            if (r && typeof r.catch === 'function') r.catch(function () {});
          } else {
            var ex = document.exitFullscreen || document.webkitExitFullscreen;
            if (ex) ex.call(document);
          }
        });
        var syncFs = function () {
          var on = !!(document.fullscreenElement || document.webkitFullscreenElement);
          root.classList.toggle('is-fullscreen', on);
          btnFs.setAttribute('aria-label', on ? 'Keluar layar penuh' : 'Layar penuh');
          btnFs.setAttribute('title', on ? 'Keluar layar penuh' : 'Layar penuh');
          setTimeout(handleResize, 80);
        };
        document.addEventListener('fullscreenchange', syncFs);
        document.addEventListener('webkitfullscreenchange', syncFs);
      }
    }

    /* ---------- Live Camera-Tracking Hotspot Projection ---------- */
    var vw = 1000, vh = 650;
    var projVec = new THREE.Vector3();
    var camDir = new THREE.Vector3();
    var toAnchor = new THREE.Vector3();

    function updateHotspots() {
      camera.getWorldDirection(camDir);
      Object.keys(OBJECT_DATA).forEach(function (k) {
        var btn = spotBtns[k];
        if (!btn) return;
        var a = OBJECT_DATA[k].anchor;
        projVec.set(a[0], a[1], a[2]);
        toAnchor.subVectors(projVec, camera.position).normalize();
        projVec.project(camera);
        var offscreen = projVec.z > 1 || Math.abs(projVec.x) > 1.04 || Math.abs(projVec.y) > 1.04;
        if (offscreen || toAnchor.dot(camDir) < 0.2) {
          btn.classList.add('is-off');
          return;
        }
        btn.classList.remove('is-off');
        var halfW = (btn.offsetWidth || 116) * 0.5 + 8;
        var sx = Math.max(halfW, Math.min(vw - halfW, (projVec.x * 0.5 + 0.5) * vw));
        var sy = Math.max(76, Math.min(vh - 36, (-projVec.y * 0.5 + 0.5) * vh));
        btn.style.transform = 'translate3d(' + sx.toFixed(1) + 'px,' + sy.toFixed(1) + 'px,0) translate(-50%,-50%)';
      });
    }

    var isInView = true;
    var hasRendered = false;
    function handleResize() {
      var r = viewport.getBoundingClientRect();
      if (!r.width || !r.height) return;
      isInView = true;
      vw = r.width;
      vh = r.height;
      var mobile = isMobileLayout();
      renderer.setPixelRatio(Math.min(mobile ? 1.5 : 1.75, window.devicePixelRatio || 1));
      renderer.setSize(vw, vh, false);
      camera.aspect = vw / vh;
      camera.updateProjectionMatrix();
      if (selectedKey) setGoalView(OBJECT_DATA[selectedKey].view, true);
      else setGoalView(DEFAULT_VIEW, false);
      if (!hasRendered) {
        cam.theta = goal.theta;
        cam.phi = goal.phi;
        cam.radius = goal.radius;
        cam.target.copy(goal.target);
      }
      document.body.classList.toggle('vx3d-sheet-open', !!selectedKey && mobile);
      updatePanelShift();
    }
    window.__vx3dResize = handleResize;
    window.addEventListener('resize', handleResize);

    /* Pause WebGL Rendering When Scrolled Off-Screen to Save GPU/CPU */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) { isInView = entry.isIntersecting; });
      }, { threshold: 0.02 }).observe(root);
    }

    /* ---------- Main Render Loop (Desktop + Mobile Touch on #eksplorasi) ---------- */
    var simClock = 0, lastT = 0;
    function animate(t) {
      requestAnimationFrame(animate);
      var page = $('eksplorasi');
      if (!isInView || (page && page.hidden) || document.hidden) { lastT = t; return; }
      var dt = Math.min(0.05, Math.max(0.001, ((t - lastT) || 16) / 1000));
      lastT = t;

      var k = 1 - Math.pow(0.0009, dt); /* frame-rate independent smooth damping */
      cam.theta += (goal.theta - cam.theta) * k;
      cam.phi += (goal.phi - cam.phi) * k;
      cam.radius += (goal.radius - cam.radius) * k;
      cam.target.lerp(goal.target, k);
      viewShift.x += (viewShiftGoal.x - viewShift.x) * k;
      viewShift.y += (viewShiftGoal.y - viewShift.y) * k;

      simClock += dt;
      rotorPivot.rotation.z -= 2.4 * dt;
      pulley1Pivot.rotation.z -= 2.4 * dt;
      pulley2Pivot.rotation.z -= 9.6 * dt; /* 1:4 step-up ratio */
      updateWaterParticles(simClock);

      applyCamera();
      renderer.render(scene, camera);
      updateHotspots();

      if (!hasRendered) {
        hasRendered = true;
        root.classList.add('is-ready');
        if (loadingEl) loadingEl.hidden = true;
      }
    }

    handleResize();
    requestAnimationFrame(animate);
  })();
})();
