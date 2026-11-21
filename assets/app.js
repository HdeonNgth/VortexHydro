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

    /* Smooth scroll cue button inside Hero (does not hijack SPA hash) */
    var cue = document.querySelector('.hero__scroll-cue');
    if (cue) {
      cue.addEventListener('click', function (e) {
        e.preventDefault();
        var target = $('manifesto');
        if (target) target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
      });
    }

    /* 3c. Unified rAF Scroll Tick */
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

  /* ---------- 10. Fullscreen Interactive 3D Simulator (Three.js WebGL + Raycasting) ---------- */
  (function initVortexThreeSimulator() {
    var root = $('vx3d-root');
    var viewport = $('vx3d-viewport');
    var canvas = $('vx3d-canvas');
    if (!root || !viewport || !canvas || typeof window.THREE === 'undefined') return;
    var THREE = window.THREE;

    /* Concise, general-friendly object information (NO math formulas or equations) */
    var OBJECT_DATA = {
      tank: {
        tag: 'OBJEK 01 · SIRKULASI AIR',
        title: 'Penampung Air 60 Liter & Pompa',
        img: 'assets/images/components/comp-pump.jpg?v=2',
        desc: 'Wadah silinder berkapasitas 60 liter di bagian kolong rangka bawah yang dilengkapi pompa sirkulasi celup.',
        func: 'Menampung seluruh air yang jatuh dari ujung saluran keluar dan memompanya kembali ke bagian atas agar aliran air berlangsung terus-menerus tanpa terbuang.',
        extra: [
          '<strong>Kapasitas Penampung:</strong> 60 Liter di rak bawah',
          '<strong>Penggerak Sirkulasi:</strong> Pompa air listrik 100 W',
          '<strong>Sistem Operasi:</strong> Siklus air tertutup hemat air'
        ],
        anchor: [3.2, -1.5, 0.2],
        cam: { theta: 0.62, phi: 1.12, radius: 9.2, target: [2.6, -1.2, 0.0] }
      },
      pipe: {
        tag: 'OBJEK 02 · DISTRIBUSI HULU',
        title: 'Pipa Sirkulasi & Bak Penenang Hulu',
        img: 'assets/images/components/comp-pipe.jpg?v=2',
        desc: 'Jalur pipa PVC pengantar air dari penampung bawah menuju bak penenang bagian atas (seksi hulu 500 mm) yang memiliki sekat pengarah aliran.',
        func: 'Mengalirkan air naik ke bagian hulu dan menenangkan gejolak air sebelum meluncur ke bidang miring agar aliran lebih rata dan stabil.',
        extra: [
          '<strong>Jalur Pipa:</strong> Pipa PVC Ø 45 mm di sisi rangka',
          '<strong>Dimensi Bak Hulu:</strong> Panjang 500 mm × Lebar 400 mm',
          '<strong>Sekat Internal:</strong> Pengarah aliran 95 × 105 mm'
        ],
        anchor: [-4.6, 1.85, 0.0],
        cam: { theta: -0.65, phi: 1.02, radius: 9.4, target: [-4.0, 1.3, 0.0] }
      },
      chute: {
        tag: 'OBJEK 03 · SALURAN UTAMA',
        title: 'Saluran Akrilik Miring (1700 × 400 mm)',
        img: 'assets/images/components/cad-prototype.png',
        desc: 'Saluran terbuka berbahan akrilik transparan dengan bidang miring sepanjang 1016,97 mm yang menghubungkan bak hulu ke ruang kincir.',
        func: 'Mengarahkan dan mempercepat luncuran air dari bagian atas menuju sudu-sudu kincir, sekaligus memudahkan pengamatan visual aliran air dari luar.',
        extra: [
          '<strong>Panjang Total:</strong> 1700 mm (Hulu 500 · Miring 1016,97 · Hilir 200 mm)',
          '<strong>Lebar & Dinding:</strong> Lebar 400 mm × Tinggi dinding 250 mm',
          '<strong>Material:</strong> Akrilik transparan dengan bukaan keluar bawah'
        ],
        anchor: [-0.8, 1.05, 0.0],
        cam: { theta: 0.48, phi: 1.00, radius: 10.6, target: [-0.6, 0.5, 0.0] }
      },
      wheel: {
        tag: 'OBJEK 04 · TURBIN UTAMA',
        title: 'Kincir Air 6 Sudu Melengkung',
        img: 'assets/images/components/comp-wheel.jpg',
        desc: 'Rotor turbin berwarna biru dengan 6 bilah sudu melengkung yang terpasang pada poros utama stainless steel menembus dinding saluran.',
        func: 'Menangkap dorongan aliran air yang meluncur dari saluran miring dan mengubahnya menjadi gerak putar pada poros utama.',
        extra: [
          '<strong>Jumlah Bilah:</strong> 6 sudu melengkung penangkap arus',
          '<strong>Dimensi Rotor:</strong> Diameter 330 mm × Lebar 250 mm',
          '<strong>Poros Utama:</strong> Stainless steel Ø 30 mm tahan karat'
        ],
        anchor: [1.65, 0.05, 0.0],
        cam: { theta: 0.55, phi: 1.04, radius: 7.8, target: [1.65, 0.0, 0.0] }
      },
      pulley: {
        tag: 'OBJEK 05 · TRANSMISI PUTARAN',
        title: 'Transmisi Pulley 4-Jari (1 : 4) & V-Belt',
        img: 'assets/images/components/comp-pulley.jpg',
        desc: 'Roda pulley besar berjari-jari empat di sisi luar dinding saluran yang dihubungkan sabuk V-belt ke pulley kecil pada poros generator.',
        func: 'Melipatgandakan kecepatan putaran dari poros kincir menjadi empat kali lebih cepat agar generator dapat menghasilkan listrik secara optimal.',
        extra: [
          '<strong>Pulley Penggerak:</strong> Roda 4-jari diameter 270 mm',
          '<strong>Pulley Tujuan:</strong> Diameter 67,5 mm (perbandingan 1 : 4)',
          '<strong>Penempatan:</strong> Sisi luar dinding saluran (bebas aliran air)'
        ],
        anchor: [2.4, -0.05, -1.65],
        cam: { theta: 2.35, phi: 1.08, radius: 7.8, target: [2.8, -0.2, -1.5] }
      },
      generator: {
        tag: 'OBJEK 06 · PEMBANGKIT & BEBAN',
        title: 'Generator DC XD 3240 & Lampu LED',
        img: 'assets/images/components/comp-generator.jpg?v=2',
        desc: 'Unit generator arus searah berbentuk silinder yang terpasang kokoh di ujung rangka depan beserta lampu indikator LED 12 V.',
        func: 'Mengubah putaran cepat dari transmisi pulley menjadi energi listrik DC 12 V untuk menyalakan lampu LED sebagai indikator daya.',
        extra: [
          '<strong>Tipe Pembangkit:</strong> Generator magnet permanen DC XD 3240',
          '<strong>Beban Listrik:</strong> 2 unit lampu LED (total 10 W / 12 V)',
          '<strong>Keamanan:</strong> Terpasang di zona kering ujung rangka'
        ],
        anchor: [4.55, -0.45, -0.75],
        cam: { theta: 1.85, phi: 1.05, radius: 7.5, target: [4.4, -0.5, -0.5] }
      },
      frame: {
        tag: 'OBJEK 07 · STRUKTUR PENOPANG',
        title: 'Rangka Besi Hollow Bertingkat',
        img: 'assets/images/components/cad-prototype.png',
        desc: 'Struktur meja rangka baja hollow dua tingkat berwarna gelap yang menopang seluruh saluran akrilik, transmisi, generator, dan tangki bawah.',
        func: 'Memberikan kemiringan elevasi yang presisi bagi saluran air sekaligus menjaga kestabilan alat dari getaran saat beroperasi.',
        extra: [
          '<strong>Konstruksi:</strong> Rangka besi hollow bertingkat (dek atas & bawah)',
          '<strong>Dimensi Rangka:</strong> Panjang 2,0 m × Lebar 0,8 m',
          '<strong>Elevasi Hulu:</strong> Tinggi total saluran 485 mm'
        ],
        anchor: [-2.2, -0.8, 1.35],
        cam: { theta: 0.72, phi: 1.08, radius: 13.0, target: [0.0, -0.3, 0.0] }
      }
    };

    var DEFAULT_CAM = { theta: 0.68, phi: 1.04, radius: 13.2, target: [0.1, -0.2, 0.0] };

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
    $$('[data-spot]', hotspotsWrap).forEach(function (b) {
      spotBtns[b.getAttribute('data-spot')] = b;
    });
    var navPills = $$('[data-vx3d-select]', root);

    /* Three.js Scene, Camera & Renderer Setup */
    var scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020813, 0.024);

    var camera = new THREE.PerspectiveCamera(42, 16 / 9, 0.1, 120);
    var renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    if (renderer.shadowMap) {
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    /* Realistic Futuristic 3D Lighting */
    var hemiLight = new THREE.HemisphereLight(0x90e0ef, 0x041226, 0.85);
    scene.add(hemiLight);

    var dirLight = new THREE.DirectionalLight(0xffffff, 1.15);
    dirLight.position.set(8, 14, 10);
    dirLight.castShadow = true;
    scene.add(dirLight);

    var rimLight = new THREE.DirectionalLight(0x00e5ff, 0.75);
    rimLight.position.set(-10, 6, -9);
    scene.add(rimLight);

    var hydroGlowLight = new THREE.PointLight(0x00d4ff, 1.3, 18);
    hydroGlowLight.position.set(0.5, 1.2, 0);
    scene.add(hydroGlowLight);

    var ledPointLight = new THREE.PointLight(0xfbbf24, 1.6, 8);
    ledPointLight.position.set(4.6, 0.1, 0.85);
    scene.add(ledPointLight);

    /* Subtle High-Tech Floor Grid */
    var gridHelper = new THREE.GridHelper(26, 26, 0x00a8e8, 0x0b2545);
    gridHelper.position.y = -2.38;
    if (gridHelper.material) {
      gridHelper.material.transparent = true;
      gridHelper.material.opacity = 0.35;
    }
    scene.add(gridHelper);

    /* Component Group Registry for Raycasting & Highlighting */
    var componentGroups = {};
    var interactiveMeshes = [];
    var originalEmissives = new Map();

    function registerMesh(mesh, key) {
      mesh.userData.objKey = key;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
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
      componentGroups[key] = g;
      return g;
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

    function addEdges(parentMesh, color, opacity) {
      var edges = new THREE.EdgesGeometry(parentMesh.geometry);
      var lineMat = new THREE.LineBasicMaterial({
        color: color || 0x00e5ff,
        transparent: true,
        opacity: opacity == null ? 0.55 : opacity
      });
      var line = new THREE.LineSegments(edges, lineMat);
      parentMesh.add(line);
    }

    /* Materials */
    var matFrame = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.65, roughness: 0.35 });
    var matDeck  = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.5, roughness: 0.45 });
    var matTankShell = new THREE.MeshPhysicalMaterial({
      color: 0xdbeafe, transparent: true, opacity: 0.32, roughness: 0.15, metalness: 0.05, side: THREE.DoubleSide
    });
    var matTankWater = new THREE.MeshStandardMaterial({
      color: 0x00a8e8, transparent: true, opacity: 0.72, roughness: 0.2, metalness: 0.1, emissive: 0x004e7c, emissiveIntensity: 0.35
    });
    var matPump = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.45, roughness: 0.3 });
    var matPipe = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.25, roughness: 0.3 });
    var matAcrylic = new THREE.MeshPhysicalMaterial({
      color: 0xe0f7fc, transparent: true, opacity: 0.28, roughness: 0.1, metalness: 0.05, side: THREE.DoubleSide
    });
    var matBlade = new THREE.MeshStandardMaterial({
      color: 0x00b4d8, metalness: 0.3, roughness: 0.25, emissive: 0x005073, emissiveIntensity: 0.25
    });
    var matShaft = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85, roughness: 0.2 });
    var matPulley = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.55, roughness: 0.3 });
    var matBelt = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.2, roughness: 0.7 });
    var matGen = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.7, roughness: 0.3 });

    /* =====================================================================
       BUILD 07: TWO-TIER DARK STEEL HOLLOW FRAME (Exact Match to CAD PNG)
       ===================================================================== */
    var gFrame = createGroup('frame');
    /* Left Upper Tier Deck (X: -5.6..-1.8, Y: 0.15, Z: -1.4..1.4) */
    var upperDeck = addBox(gFrame, 'frame', 3.8, 0.14, 2.8, -3.7, 0.15, 0, matDeck);
    addEdges(upperDeck, 0x0f172a, 0.7);
    /* Upper Left Brackets holding the Acrylic Flume */
    addBox(gFrame, 'frame', 0.12, 0.9, 2.75, -5.55, 0.65, 0, matFrame);
    addBox(gFrame, 'frame', 1.4, 0.75, 0.12, -3.1, 0.58, 1.32, matFrame);
    addBox(gFrame, 'frame', 1.4, 0.75, 0.12, -3.1, 0.58, -1.32, matFrame);

    /* Right Lower Tier Deck (X: -1.8..4.8, Y: -1.05) with Center Cutout for 60L Tank Outlet */
    addBox(gFrame, 'frame', 6.6, 0.14, 0.55, 1.5, -1.05, 1.12, matDeck);
    addBox(gFrame, 'frame', 6.6, 0.14, 0.55, 1.5, -1.05, -1.12, matDeck);
    addBox(gFrame, 'frame', 1.5, 0.14, 1.7, -1.05, -1.05, 0, matDeck);
    addBox(gFrame, 'frame', 0.7, 0.14, 1.7, 4.45, -1.05, 0, matDeck);

    /* Bottom Base Frame Rails (Y: -2.3) */
    addBox(gFrame, 'frame', 10.4, 0.14, 0.14, -0.4, -2.3, 1.33, matFrame);
    addBox(gFrame, 'frame', 10.4, 0.14, 0.14, -0.4, -2.3, -1.33, matFrame);
    addBox(gFrame, 'frame', 0.14, 0.14, 2.8, -5.55, -2.3, 0, matFrame);
    addBox(gFrame, 'frame', 0.14, 0.14, 2.8, 4.75, -2.3, 0, matFrame);
    /* Middle Longitudinal Support Bars */
    addBox(gFrame, 'frame', 10.4, 0.12, 0.12, -0.4, -1.65, 1.33, matFrame);
    addBox(gFrame, 'frame', 10.4, 0.12, 0.12, -0.4, -1.65, -1.33, matFrame);

    /* Vertical Hollow Legs */
    [-1.33, 1.33].forEach(function (zPos) {
      addBox(gFrame, 'frame', 0.15, 2.5, 0.15, -5.55, -1.05, zPos, matFrame);
      addBox(gFrame, 'frame', 0.15, 2.5, 0.15, -1.85, -1.05, zPos, matFrame);
      addBox(gFrame, 'frame', 0.15, 1.3, 0.15, 4.75, -1.65, zPos, matFrame);
    });

    /* =====================================================================
       BUILD 01: 60-LITER CYLINDRICAL WATER RESERVOIR TANK & SUBMERGED PUMP
       Positioned directly underneath the lower outlet opening
       ===================================================================== */
    var gTank = createGroup('tank');
    var tankWaterMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(1.28, 1.28, 0.95, 32),
      matTankWater.clone()
    );
    tankWaterMesh.position.set(3.0, -1.78, 0);
    gTank.add(tankWaterMesh);
    registerMesh(tankWaterMesh, 'tank');

    var tankShellMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(1.36, 1.36, 1.25, 32, 1, true),
      matTankShell.clone()
    );
    tankShellMesh.position.set(3.0, -1.64, 0);
    addEdges(tankShellMesh, 0x00e5ff, 0.45);
    gTank.add(tankShellMesh);
    registerMesh(tankShellMesh, 'tank');

    /* Tank Top & Bottom Rim Rings */
    var rimGeom = new THREE.TorusGeometry(1.36, 0.035, 12, 36);
    var topRim = new THREE.Mesh(rimGeom, matPipe.clone());
    topRim.rotation.x = Math.PI / 2;
    topRim.position.set(3.0, -1.02, 0);
    gTank.add(topRim);
    registerMesh(topRim, 'tank');

    /* Submerged 100W Circulation Pump inside 60L Tank */
    var pumpMesh = addBox(gTank, 'tank', 0.65, 0.52, 0.55, 2.65, -1.96, 0.25, matPump);
    addEdges(pumpMesh, 0x7ceeff, 0.6);

    /* =====================================================================
       BUILD 02: RISING PVC PIPE (Ø 45 mm) & UPPER HEADBOX (500 x 400 mm)
       ===================================================================== */
    var gPipe = createGroup('pipe');
    /* Horizontal Lower PVC Pipe from 60L Tank to Back-Left Leg */
    var pipeHoriz = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 8.0, 16), matPipe.clone());
    pipeHoriz.rotation.z = Math.PI / 2;
    pipeHoriz.position.set(-1.35, -1.5, 1.05);
    gPipe.add(pipeHoriz);
    registerMesh(pipeHoriz, 'pipe');

    /* Vertical Rising PVC Pipe up the Back-Left Corner */
    var pipeVert = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 3.9, 16), matPipe.clone());
    pipeVert.position.set(-5.35, 0.45, 1.05);
    gPipe.add(pipeVert);
    registerMesh(pipeVert, 'pipe');

    /* Top Elbow & Inlet Pipe into the 500mm Upper Headbox */
    var pipeInlet = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 1.1, 16), matPipe.clone());
    pipeInlet.rotation.x = Math.PI / 2;
    pipeInlet.position.set(-5.35, 2.4, 0.5);
    gPipe.add(pipeInlet);
    registerMesh(pipeInlet, 'pipe');

    /* Upper Headbox Section (500 x 400 x 250 mm + Internal 95 x 105 mm Weir Baffle) */
    var hbFloor = addBox(gPipe, 'pipe', 2.2, 0.06, 1.76, -4.3, 1.15, 0, matAcrylic);
    var hbBack  = addBox(gPipe, 'pipe', 0.06, 1.1, 1.76, -5.38, 1.7, 0, matAcrylic);
    var hbSideF = addBox(gPipe, 'pipe', 2.2, 1.1, 0.06, -4.3, 1.7, 0.86, matAcrylic);
    var hbSideB = addBox(gPipe, 'pipe', 2.2, 1.1, 0.06, -4.3, 1.7, -0.86, matAcrylic);
    /* Internal Weir Baffle Box (95 x 105 mm from PDF Drawing) */
    var hbBaffle = addBox(gPipe, 'pipe', 0.45, 0.48, 1.7, -5.12, 1.96, 0, matAcrylic);
    [hbFloor, hbBack, hbSideF, hbSideB, hbBaffle].forEach(function (m) { addEdges(m, 0x00e5ff, 0.65); });

    /* =====================================================================
       BUILD 03: INCLINED ACRYLIC FLUME (1700 x 400 mm, Slope 1016.97 mm, Outlet 200 mm)
       ===================================================================== */
    var gChute = createGroup('chute');
    /* Inclined Middle Slope Section (X: -3.2..2.5, sloping from Y=1.15 down to Y=-0.72) */
    var slopeLen = 6.02;
    var slopeAngle = -0.318; /* ~18.2 deg matching 235mm drop over 1016.97mm */
    var slopeGroup = new THREE.Group();
    slopeGroup.position.set(-0.35, 0.21, 0);
    slopeGroup.rotation.z = slopeAngle;
    gChute.add(slopeGroup);

    var slFloor = addBox(slopeGroup, 'chute', slopeLen, 0.06, 1.76, 0, 0, 0, matAcrylic);
    var slWallF = addBox(slopeGroup, 'chute', slopeLen, 1.1, 0.06, 0, 0.55, 0.86, matAcrylic);
    var slWallB = addBox(slopeGroup, 'chute', slopeLen, 1.1, 0.06, 0, 0.55, -0.86, matAcrylic);
    /* Flowing Translucent Water Sheet inside Slope */
    var slWater = addBox(slopeGroup, 'chute', slopeLen - 0.1, 0.16, 1.66, 0, 0.11, 0, matTankWater);
    [slFloor, slWallF, slWallB].forEach(function (m) { addEdges(m, 0x00e5ff, 0.65); });

    /* Lower Horizontal Outlet Section (200 mm long + 50 mm bottom drop lip over 60L Tank) */
    var outWallF = addBox(gChute, 'chute', 1.15, 1.25, 0.06, 3.05, -0.22, 0.86, matAcrylic);
    var outWallB = addBox(gChute, 'chute', 1.15, 1.25, 0.06, 3.05, -0.22, -0.86, matAcrylic);
    var outEnd   = addBox(gChute, 'chute', 0.06, 1.25, 1.76, 3.62, -0.22, 0, matAcrylic);
    [outWallF, outWallB, outEnd].forEach(function (m) { addEdges(m, 0x00e5ff, 0.65); });

    /* =====================================================================
       BUILD 04: 6-BLADE CURVED BRIGHT-BLUE WATERWHEEL & STAINLESS SHAFT
       ===================================================================== */
    var gWheel = createGroup('wheel');
    var rotorPivot = new THREE.Group();
    rotorPivot.position.set(1.65, -0.02, 0);
    gWheel.add(rotorPivot);

    /* Horizontal Stainless Steel Main Shaft (Ø 30 mm) protruding through both walls */
    var mainShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 3.4, 20), matShaft.clone());
    mainShaft.rotation.x = Math.PI / 2;
    rotorPivot.add(mainShaft);
    registerMesh(mainShaft, 'wheel');

    /* Central Blue Rotor Hub */
    var hubMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 1.56, 24), matPump.clone());
    hubMesh.rotation.x = Math.PI / 2;
    rotorPivot.add(hubMesh);
    registerMesh(hubMesh, 'wheel');

    /* 6 Curved Bright-Blue Blades (2-segment curved paddle per blade matching CAD PNG) */
    for (var bi = 0; bi < 6; bi++) {
      var bHolder = new THREE.Group();
      bHolder.rotation.z = (bi * Math.PI) / 3;
      rotorPivot.add(bHolder);

      var innerBlade = addBox(bHolder, 'wheel', 0.48, 0.06, 1.52, 0.52, 0, 0, matBlade);
      var outerBlade = addBox(bHolder, 'wheel', 0.36, 0.06, 1.52, 0.88, 0.12, 0, matBlade, 0, 0, 0.52);
      addEdges(innerBlade, 0x7ceeff, 0.7);
      addEdges(outerBlade, 0x7ceeff, 0.7);
    }

    /* =====================================================================
       BUILD 05: 4-SPOKE LARGE PULLEY (Ø 270 mm) + V-BELT + SMALL PULLEY (1:4)
       Mounted on the outer side of the acrylic channel wall (Z = -1.35)
       ===================================================================== */
    var gPulley = createGroup('pulley');
    var pulley1Pivot = new THREE.Group();
    pulley1Pivot.position.set(1.65, -0.02, -1.35);
    gPulley.add(pulley1Pivot);

    /* Large Pulley Outer Ring (Ø 270 mm) */
    var p1Ring = new THREE.Mesh(new THREE.TorusGeometry(0.96, 0.07, 14, 36), matPulley.clone());
    pulley1Pivot.add(p1Ring);
    registerMesh(p1Ring, 'pulley');

    /* 4 Cross Spokes (Exact 4-spoke geometry from PDF Drawing & CAD PNG) */
    var spoke1 = addBox(pulley1Pivot, 'pulley', 1.88, 0.11, 0.08, 0, 0, 0, matPulley);
    var spoke2 = addBox(pulley1Pivot, 'pulley', 0.11, 1.88, 0.08, 0, 0, 0, matPulley);
    addEdges(spoke1, 0x0f172a, 0.5);
    addEdges(spoke2, 0x0f172a, 0.5);

    /* Small Driven Pulley (Ø 67.5 mm — Step-Up 1:4) at Generator Shaft */
    var pulley2Pivot = new THREE.Group();
    pulley2Pivot.position.set(4.35, -0.62, -1.35);
    gPulley.add(pulley2Pivot);

    var p2Wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.12, 24), matPulley.clone());
    p2Wheel.rotation.x = Math.PI / 2;
    pulley2Pivot.add(p2Wheel);
    registerMesh(p2Wheel, 'pulley');

    /* Dual V-Belt Strands connecting Large Pulley to Small Pulley */
    var beltTop = addBox(gPulley, 'pulley', 2.82, 0.06, 0.08, 3.0, 0.08, -1.35, matBelt, 0, 0, -0.44);
    var beltBot = addBox(gPulley, 'pulley', 2.82, 0.06, 0.08, 3.0, -0.62, -1.35, matBelt, 0, 0, -0.01);

    /* =====================================================================
       BUILD 06: GENERATOR DC XD 3240 & LED INDICATOR MODULE
       ===================================================================== */
    var gGen = createGroup('generator');
    /* Horizontal Cylindrical Generator Body */
    var genBody = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 1.05, 28), matGen.clone());
    genBody.rotation.x = Math.PI / 2;
    genBody.position.set(4.35, -0.62, -0.68);
    addEdges(genBody, 0x00e5ff, 0.4);
    gGen.add(genBody);
    registerMesh(genBody, 'generator');

    /* Generator Square Mounting Flanges (as seen in CAD PNG) */
    var flange1 = addBox(gGen, 'generator', 0.88, 0.88, 0.1, 4.35, -0.62, -1.18, matDeck);
    var flange2 = addBox(gGen, 'generator', 0.88, 0.88, 0.1, 4.35, -0.62, -0.18, matDeck);
    addEdges(flange1, 0x0f172a, 0.7);
    addEdges(flange2, 0x0f172a, 0.7);

    /* Glowing 2x 5W LED Output Indicator Module on Front Right Corner */
    var ledBase = addBox(gGen, 'generator', 0.55, 0.35, 0.65, 4.55, -0.8, 0.75, matFrame);
    var matBulb = new THREE.MeshStandardMaterial({
      color: 0xfef08a, emissive: 0xf59e0b, emissiveIntensity: 1.4, roughness: 0.15
    });
    var bulb1 = new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 20), matBulb);
    bulb1.position.set(4.55, -0.48, 0.58);
    gGen.add(bulb1);
    registerMesh(bulb1, 'generator');

    var bulb2 = new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 20), matBulb.clone());
    bulb2.position.set(4.55, -0.48, 0.92);
    gGen.add(bulb2);
    registerMesh(bulb2, 'generator');

    /* =====================================================================
       3D ANIMATED WATER FLOW PARTICLES (Closed-Loop Hydro Stream)
       ===================================================================== */
    var PARTICLE_COUNT = 110;
    var pGeom = new THREE.BufferGeometry();
    var pPositions = new Float32Array(PARTICLE_COUNT * 3);
    var pPhases = new Float32Array(PARTICLE_COUNT);
    var pLanes = new Float32Array(PARTICLE_COUNT);
    for (var pi = 0; pi < PARTICLE_COUNT; pi++) {
      pPhases[pi] = pi / PARTICLE_COUNT;
      pLanes[pi] = (Math.random() - 0.5) * 1.3;
    }
    pGeom.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    var pMat = new THREE.PointsMaterial({
      color: 0x7ceeff,
      size: 0.14,
      transparent: true,
      opacity: 0.88
    });
    var waterParticles = new THREE.Points(pGeom, pMat);
    scene.add(waterParticles);

    function updateWaterParticles(time) {
      var posArr = pGeom.attributes.position.array;
      for (var i = 0; i < PARTICLE_COUNT; i++) {
        var t = (pPhases[i] + time * 0.18) % 1;
        var lane = pLanes[i];
        var x = 0, y = 0, z = lane;
        if (t < 0.22) {
          /* Rising up the back-left PVC pipe */
          var u = t / 0.22;
          x = -5.35;
          y = -1.5 + u * 3.9;
          z = 1.05;
        } else if (t < 0.36) {
          /* Calm flow across 500mm upper headbox */
          var u2 = (t - 0.22) / 0.14;
          x = -5.2 + u2 * 2.0;
          y = 1.32;
        } else if (t < 0.82) {
          /* Fast flow down 1016.97mm inclined acrylic chute through 6-blade wheel */
          var u3 = (t - 0.36) / 0.46;
          x = -3.2 + u3 * 5.8;
          y = 1.25 - u3 * 1.92;
        } else {
          /* Waterfall dropping from 200mm outlet straight into the 60L bottom reservoir tank */
          var u4 = (t - 0.82) / 0.18;
          x = 2.8 + (i % 3) * 0.14;
          y = -0.68 - u4 * 1.15;
        }
        posArr[i * 3] = x;
        posArr[i * 3 + 1] = y;
        posArr[i * 3 + 2] = z;
      }
      pGeom.attributes.position.needsUpdate = true;
    }

    /* =====================================================================
       CAMERA ORBIT, ZOOM, PAN & SMOOTH FLY-TO SYSTEM
       ===================================================================== */
    var camState = {
      theta: DEFAULT_CAM.theta,
      phi: DEFAULT_CAM.phi,
      radius: DEFAULT_CAM.radius,
      target: new THREE.Vector3(DEFAULT_CAM.target[0], DEFAULT_CAM.target[1], DEFAULT_CAM.target[2])
    };
    var camGoal = {
      theta: DEFAULT_CAM.theta,
      phi: DEFAULT_CAM.phi,
      radius: DEFAULT_CAM.radius,
      target: new THREE.Vector3(DEFAULT_CAM.target[0], DEFAULT_CAM.target[1], DEFAULT_CAM.target[2])
    };

    var selectedKey = null;
    var hoveredKey = null;
    var flowRunning = true;
    var pinsVisible = true;

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
          m.material.emissive.setHex(0x00e5ff);
          m.material.emissiveIntensity = 0.52;
        } else if (k === hoveredKey) {
          m.material.emissive.setHex(0x00b4d8);
          m.material.emissiveIntensity = 0.36;
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
      });

      navPills.forEach(function (p) {
        var pk = p.getAttribute('data-vx3d-select');
        p.classList.toggle('is-active', (selectedKey ? pk === selectedKey : pk === 'all'));
      });
    }

    function selectObject(key) {
      dismissHint();
      if (!key || key === 'all' || !OBJECT_DATA[key]) {
        selectedKey = null;
        if (panel) panel.hidden = true;
        camGoal.theta = DEFAULT_CAM.theta;
        camGoal.phi = DEFAULT_CAM.phi;
        camGoal.radius = DEFAULT_CAM.radius;
        camGoal.target.set(DEFAULT_CAM.target[0], DEFAULT_CAM.target[1], DEFAULT_CAM.target[2]);
        applyHighlightState();
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
      if (panel) panel.hidden = false;

      camGoal.theta = d.cam.theta;
      camGoal.phi = d.cam.phi;
      camGoal.radius = d.cam.radius;
      camGoal.target.set(d.cam.target[0], d.cam.target[1], d.cam.target[2]);
      applyHighlightState();
    }

    /* Pointer Raycasting + Orbit / Pan / Zoom */
    var raycaster = new THREE.Raycaster();
    var pointerNDC = new THREE.Vector2();
    var isDragging = false, dragMode = 'orbit', dragMoved = 0, prevX = 0, prevY = 0;

    function updatePointerNDC(e) {
      var rect = canvas.getBoundingClientRect();
      pointerNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      return rect;
    }

    canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

    canvas.addEventListener('pointerdown', function (e) {
      isDragging = true;
      dragMoved = 0;
      prevX = e.clientX;
      prevY = e.clientY;
      dragMode = (e.button === 2 || e.shiftKey) ? 'pan' : 'orbit';
      if (canvas.setPointerCapture) canvas.setPointerCapture(e.pointerId);
    });

    canvas.addEventListener('pointermove', function (e) {
      var rect = updatePointerNDC(e);
      if (isDragging) {
        var dx = e.clientX - prevX;
        var dy = e.clientY - prevY;
        dragMoved += Math.abs(dx) + Math.abs(dy);
        prevX = e.clientX;
        prevY = e.clientY;
        if (dragMoved > 4) dismissHint();

        if (dragMode === 'orbit') {
          camGoal.theta -= dx * 0.0075;
          camGoal.phi = Math.max(0.28, Math.min(1.48, camGoal.phi - dy * 0.0065));
        } else {
          var panScale = camGoal.radius * 0.0018;
          var right = new THREE.Vector3();
          var up = new THREE.Vector3(0, 1, 0);
          camera.getWorldDirection(right);
          right.cross(up).normalize();
          camGoal.target.addScaledVector(right, -dx * panScale);
          camGoal.target.y += dy * panScale;
        }
        if (tooltip) tooltip.hidden = true;
        return;
      }

      /* Hover Raycast Highlight */
      raycaster.setFromCamera(pointerNDC, camera);
      var hits = raycaster.intersectObjects(interactiveMeshes, false);
      var hitKey = (hits.length > 0 && hits[0].object.userData.objKey) ? hits[0].object.userData.objKey : null;

      if (hitKey !== hoveredKey) {
        hoveredKey = hitKey;
        canvas.classList.toggle('is-hovering', !!hoveredKey);
        applyHighlightState();
      }
      if (tooltip) {
        if (hoveredKey && OBJECT_DATA[hoveredKey]) {
          tooltip.textContent = OBJECT_DATA[hoveredKey].title;
          tooltip.style.left = (e.clientX - rect.left) + 'px';
          tooltip.style.top = (e.clientY - rect.top) + 'px';
          tooltip.hidden = false;
        } else {
          tooltip.hidden = true;
        }
      }
    });

    function handlePointerUp(e) {
      if (!isDragging) return;
      isDragging = false;
      if (dragMoved < 6 && e.button === 0) {
        updatePointerNDC(e);
        raycaster.setFromCamera(pointerNDC, camera);
        var hits = raycaster.intersectObjects(interactiveMeshes, false);
        if (hits.length > 0 && hits[0].object.userData.objKey) {
          selectObject(hits[0].object.userData.objKey);
        } else if (selectedKey) {
          selectObject('all');
        }
      }
    }
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointercancel', function () { isDragging = false; });

    /* Wheel Zoom */
    canvas.addEventListener('wheel', function (e) {
      e.preventDefault();
      dismissHint();
      camGoal.radius = Math.max(5.2, Math.min(20.0, camGoal.radius + e.deltaY * 0.008));
    }, { passive: false });

    /* Hotspot & Header Button Listeners */
    Object.keys(spotBtns).forEach(function (k) {
      spotBtns[k].addEventListener('click', function (e) {
        e.stopPropagation();
        selectObject(k);
      });
    });

    navPills.forEach(function (btn) {
      btn.addEventListener('click', function () {
        selectObject(btn.getAttribute('data-vx3d-select'));
      });
    });

    if (pClose) {
      pClose.addEventListener('click', function () { selectObject('all'); });
    }
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && selectedKey) selectObject('all');
    });

    var btnZoomIn = $('vx3d-zoom-in');
    var btnZoomOut = $('vx3d-zoom-out');
    var btnResetCam = $('vx3d-reset-cam');
    var btnTogglePins = $('vx3d-toggle-pins');
    var btnToggleFlow = $('vx3d-toggle-flow');
    var btnFullscreen = $('vx3d-fullscreen');

    if (btnZoomIn) btnZoomIn.addEventListener('click', function () { camGoal.radius = Math.max(5.2, camGoal.radius - 1.3); });
    if (btnZoomOut) btnZoomOut.addEventListener('click', function () { camGoal.radius = Math.min(20.0, camGoal.radius + 1.3); });
    if (btnResetCam) btnResetCam.addEventListener('click', function () { selectObject('all'); });

    if (btnTogglePins && hotspotsWrap) {
      btnTogglePins.addEventListener('click', function () {
        pinsVisible = !pinsVisible;
        btnTogglePins.classList.toggle('is-on', pinsVisible);
        hotspotsWrap.classList.toggle('is-hidden', !pinsVisible);
      });
    }
    if (btnToggleFlow) {
      btnToggleFlow.addEventListener('click', function () {
        flowRunning = !flowRunning;
        btnToggleFlow.classList.toggle('is-on', flowRunning);
        waterParticles.visible = flowRunning;
      });
    }
    if (btnFullscreen) {
      btnFullscreen.addEventListener('click', function () {
        if (!document.fullscreenElement) {
          if (root.requestFullscreen) root.requestFullscreen().catch(function () {});
          else root.classList.toggle('is-fullscreen');
        } else if (document.exitFullscreen) {
          document.exitFullscreen().catch(function () {});
        }
      });
    }

    /* Resize Handler */
    var vw = 1000, vh = 650;
    function handleResize() {
      var r = viewport.getBoundingClientRect();
      if (!r.width || !r.height) return;
      vw = r.width;
      vh = r.height;
      camera.aspect = vw / vh;
      camera.updateProjectionMatrix();
      renderer.setSize(vw, vh, false);
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    document.addEventListener('fullscreenchange', function () { setTimeout(handleResize, 60); });

    /* Project 3D Hotspot World Anchors to 2D Overlay Coordinates */
    var projVec = new THREE.Vector3();
    function updateHotspots() {
      if (!pinsVisible) return;
      Object.keys(OBJECT_DATA).forEach(function (k) {
        var btn = spotBtns[k];
        if (!btn) return;
        var a = OBJECT_DATA[k].anchor;
        projVec.set(a[0], a[1], a[2]).project(camera);
        if (projVec.z > 1) {
          btn.style.display = 'none';
          return;
        }
        btn.style.display = 'inline-flex';
        var sx = (projVec.x * 0.5 + 0.5) * vw;
        var sy = (-projVec.y * 0.5 + 0.5) * vh;
        sx = Math.max(64, Math.min(vw - 64, sx));
        sy = Math.max(76, Math.min(vh - 46, sy));
        btn.style.left = sx.toFixed(1) + 'px';
        btn.style.top = sy.toFixed(1) + 'px';
      });
    }

    /* Main WebGL Animation Loop */
    var simClock = 0;
    function animate() {
      requestAnimationFrame(animate);
      var beranda = $('beranda');
      if (beranda && beranda.hidden) return;

      if (flowRunning && !reducedMotion) {
        simClock += 0.016;
        rotorPivot.rotation.z -= 0.045;
        pulley1Pivot.rotation.z -= 0.045;
        pulley2Pivot.rotation.z -= 0.18; /* 1:4 Step-Up ratio */
        updateWaterParticles(simClock);
      }

      /* Smooth Camera Spring Interpolation */
      camState.theta += (camGoal.theta - camState.theta) * 0.09;
      camState.phi += (camGoal.phi - camState.phi) * 0.09;
      camState.radius += (camGoal.radius - camState.radius) * 0.09;
      camState.target.lerp(camGoal.target, 0.09);

      var sinPhi = Math.sin(camState.phi);
      camera.position.x = camState.target.x + camState.radius * sinPhi * Math.sin(camState.theta);
      camera.position.y = camState.target.y + camState.radius * Math.cos(camState.phi);
      camera.position.z = camState.target.z + camState.radius * sinPhi * Math.cos(camState.theta);
      camera.lookAt(camState.target);

      renderer.render(scene, camera);
      updateHotspots();
    }

    requestAnimationFrame(animate);
  })();
})();
