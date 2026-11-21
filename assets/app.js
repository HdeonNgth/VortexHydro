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
      'all': 'MODEL 3D CAD · PROTOTIPE 1700 × 400 MM + TANGKI 60 L',
      '1': 'TAHAP 01 · PENAMPUNG AIR 60 LITER & SIRKULASI ATAS',
      '2': 'TAHAP 02 · SALURAN 1700 MM (LERENG 1016,97 MM) & KINCIR',
      '3': 'TAHAP 03 · PULLEY 4-JARI (1:4) & GENERATOR DC XD 3240'
    };
    var STAGE_DETAILS = {
      '1': {
        chap: 'BAB 01 / 03 · ENERGI POTENSIAL & SIRKULASI',
        bookTitle: 'Sirkulasi Penampung 60 L',
        bookIntro: 'Di kolong rangka bawah terdapat <strong>penampung air 60 liter</strong>. Pompa celup mengangkat air menuju bak penenang atas (500 × 400 mm) untuk menciptakan energi potensial gravitasi.',
        pill: '<strong>1 / 3</strong> · Penampung 60 L &amp; Sirkulasi',
        img: 'assets/images/components/comp-pump.jpg?v=2',
        chain: 'ENERGI LISTRIK 100 W → ENERGI POTENSIAL GRAVITASI (60 L)',
        title: '01 · Penampung Air 60 Liter & Pompa Sirkulasi',
        desc: 'Penampung air 60 liter ditempatkan tepat di bawah ujung keluar saluran (200 mm) agar air jatuh langsung kembali ke tangki dan dipompa naik secara tertutup menuju bak hulu 500 mm.',
        metrics: [
          ['Penampung Bawah', 'Tangki Air 60 Liter'],
          ['Bak Hulu Atas', '500 × 400 × 250 mm'],
          ['Sekat Pengarah', '95 mm · Step 105 mm'],
          ['Elevasi Saluran', 'Tinggi Total 485 mm']
        ],
        formula: 'E_p = m · g · h   |   P_h = ρ · g · Q · H',
        vars: [
          '<strong>V_tangki</strong> = Penampung bawah 60 Liter (Ø 520 mm)',
          '<strong>H_total</strong> = Elevasi saluran 485 mm (235 + 250 mm)',
          '<strong>P_pompa</strong> = Pompa sirkulasi 100 W via pipa Ø 45 mm'
        ],
        calcTag: 'PERHITUNGAN ENERGI POTENSIAL · TAHAP 01',
        calcMath: 'E_p = m · g · h = 60 kg · 9,81 m/s² · 0,485 m = 285,47 J\nH_hulu = 235 mm (kolong) + 250 mm (dinding) = 485 mm',
        calcNote: 'Air dari penampung bawah 60 liter dipompa naik setinggi 485 mm menuju seksi hulu saluran (500 × 400 mm).',
        hotspot: '2'
      },
      '2': {
        chap: 'BAB 02 / 03 · ENERGI KINETIK & HIDRODINAMIKA',
        bookTitle: 'Saluran 1700 mm & Kincir 6 Sudu',
        bookIntro: 'Air dari bak hulu (500 mm) meluncur turun melewati bidang miring sepanjang <strong>1016,97 mm</strong> dan menumbuk <strong>kincir 6 sudu melengkung biru</strong> sebelum keluar melalui ujung hilir (200 mm) kembali ke penampung 60 L.',
        pill: '<strong>2 / 3</strong> · Saluran 1700 mm &amp; Kincir 6 Sudu',
        img: 'assets/images/components/cad-prototype.png',
        chain: 'ENERGI KINETIK ALIRAN → TORSI MEKANIS KINCIR 6 SUDU',
        title: '02 · Saluran Akrilik 1700 × 400 mm & Kincir 6 Sudu Biru',
        desc: 'Sesuai gambar kerja PDF, saluran memiliki panjang total 1700 mm (hulu 500 mm, bidang miring 1016,97 mm, hilir 200 mm, lebar 400 mm, tinggi dinding 250 mm) yang mengarahkan aliran tepat ke sudu kincir.',
        metrics: [
          ['Dimensi Saluran', '1700 × 400 × 250 mm'],
          ['Bidang Miring', 'Panjang Lereng 1016,97 mm'],
          ['Seksi Hulu & Hilir', 'Hulu 500 mm · Hilir 200 mm'],
          ['Rotor Turbin', '6 Sudu Melengkung · Ø 330 mm']
        ],
        formula: 'E_k = ½ · m · v²   |   P_m = τ · ω_turbin',
        vars: [
          '<strong>L_total</strong> = 1700,00 mm (500 + 1016,97 miring + 200 mm)',
          '<strong>W × H</strong> = Lebar 400,00 mm × Dinding 250,00 mm',
          '<strong>Bibir Buang</strong> = Drop bawah 50,00 mm ke Tangki 60 L'
        ],
        calcTag: 'PERHITUNGAN KINETIK & DIMENSI CAD · TAHAP 02',
        calcMath: 'v = √(2 · g · Δh) = √(2 · 9,81 · 0,235) ≈ 2,15 m/s\nL_saluran = 500 (hulu) + 1016,97 (miring) + 200 (hilir)',
        calcNote: 'Aliran air menumbuk 6 sudu melengkung lalu langsung jatuh dari bukaan bawah seksi 200 mm kembali ke penampung 60 liter.',
        hotspot: '6'
      },
      '3': {
        chap: 'BAB 03 / 03 · TRANSMISI MEKANIK & DAYA LISTRIK',
        bookTitle: 'Pulley 4-Jari (1:4) & Generator DC',
        bookIntro: 'Poros kincir menembus dinding samping saluran menuju <strong>pulley besar berjari-jari 4 (Ø 270 mm)</strong> yang memutar pulley kecil (Ø 67,5 mm) dan <strong>Generator DC XD 3240</strong> di ujung depan rangka.',
        pill: '<strong>3 / 3</strong> · Pulley 1:4 &amp; Generator DC',
        img: 'assets/images/components/comp-generator.jpg?v=2',
        chain: 'TRANSMISI STEP-UP 1:4 → ENERGI LISTRIK DC 12 V (2×5W LED)',
        title: '03 · Pulley 4-Jari 1:4, Generator DC XD 3240 & Beban LED',
        desc: 'Transmisi V-belt di sisi luar dinding akrilik melipatgandakan putaran poros 4 kali lipat ke Generator DC XD 3240 yang terpasang di rangka depan untuk menyalakan beban lampu LED 12 V.',
        metrics: [
          ['Pulley Penggerak', 'Roda 4-Jari Ø 270 mm'],
          ['Pulley Generator', 'Ø 67,5 mm (Step-Up 1 : 4)'],
          ['Unit Pembangkit', 'Generator DC XD 3240'],
          ['Beban Output', '2 × 5 W Lampu LED (10 W)']
        ],
        formula: 'ω_gen = 4 · ω_kincir   |   η = P_output / P_input',
        vars: [
          '<strong>Rasio Pulley</strong> = Ø 270 mm : Ø 67,5 mm = 1 : 4 (4× RPM)',
          '<strong>Generator</strong> = Permanent Magnet DC XD 3240 (12–24 V)',
          '<strong>Output Beban</strong> = Baterai 12 V & 2 × 5 W Lampu LED'
        ],
        calcTag: 'PERHITUNGAN TRANSMISI & LISTRIK · TAHAP 03',
        calcMath: 'N_gen = 4 × N_kincir  (Step-up Ø 270 → Ø 67,5 mm)\nP_out = V · I = 12 V × 0,83 A ≈ 10 W (2 × 5 W LED)',
        calcNote: 'Generator DC terpasang di rangka depan kanan di luar jalur air sehingga bebas cipratan (zona kering).',
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

    /* 3c. Stepper Activation (scroll + click + 3D pin/object click + Physics Book UI) */
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
    var bookChap = $('pbook-chap');
    var bookTitle = $('pbook-title');
    var bookIntro = $('pbook-intro');
    var bookVars = $('pbook-vars');
    var pillLabel = $('pbook-pill-label');
    var calcPop = $('pbook-calc-pop');
    var calcTag = $('pbook-calc-tag');
    var calcMath = $('pbook-calc-math');
    var calcNote = $('pbook-calc-note');
    var calcClose = $('pbook-calc-close');
    var calcToggle = $('pbook-calc-toggle');
    var flapBtn = $('pbook-flap-btn');
    var prevStageBtn = $('pbook-prev');
    var nextStageBtn = $('pbook-next');

    function setStage(stage, fromUser) {
      if (!stepper) return;
      var s = String(stage);
      if (fromUser) manualStepUntil = Date.now() + 11000;
      if (curStage === s) {
        if (fromUser && calcPop) calcPop.hidden = false;
        return;
      }
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
      if (d) {
        if (bookChap) bookChap.textContent = d.chap;
        if (bookTitle) bookTitle.textContent = d.bookTitle;
        if (bookIntro) bookIntro.innerHTML = d.bookIntro;
        if (pillLabel) pillLabel.innerHTML = d.pill;
        if (infoFormula) infoFormula.textContent = d.formula;
        if (bookVars && d.vars) {
          bookVars.innerHTML = d.vars.map(function (v) { return '<li>' + v + '</li>'; }).join('');
        }
        if (calcTag) calcTag.textContent = d.calcTag;
        if (calcMath) calcMath.innerHTML = d.calcMath.replace(/\n/g, '<br>');
        if (calcNote) calcNote.textContent = d.calcNote;
        if (fromUser && calcPop) calcPop.hidden = false;
      }
      if (d && infoPanel) {
        if (fromUser && flapBtn) {
          infoPanel.hidden = false;
          flapBtn.setAttribute('aria-expanded', 'true');
        }
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
    if (flapBtn && infoPanel) {
      flapBtn.addEventListener('click', function () {
        var open = !infoPanel.hidden;
        infoPanel.hidden = open;
        flapBtn.setAttribute('aria-expanded', open ? 'false' : 'true');
      });
    }
    if (calcClose && calcPop) {
      calcClose.addEventListener('click', function () { calcPop.hidden = true; });
    }
    if (calcToggle && calcPop) {
      calcToggle.addEventListener('click', function () { calcPop.hidden = !calcPop.hidden; });
    }
    if (prevStageBtn) {
      prevStageBtn.addEventListener('click', function () {
        var n = curStage === '2' ? '1' : (curStage === '3' ? '2' : '3');
        setStage(n, true);
      });
    }
    if (nextStageBtn) {
      nextStageBtn.addEventListener('click', function () {
        var n = curStage === '1' ? '2' : (curStage === '2' ? '3' : '1');
        setStage(n, true);
      });
    }

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

  /* ---------- 10. Interactive 3D Physics Book & CAD Prototype Lab (#hydro-3d-canvas) ---------- */
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

    /* Camera presets tuned to match the CAD isometric view & stage close-ups */
    var PRESETS = {
      'all': { yaw: -0.54, pitch: 0.42, zoom: 1.00, tx: -4,  ty: -6, tz: 0 },
      '1':   { yaw: -0.42, pitch: 0.38, zoom: 1.16, tx: 36,  ty: 24, tz: 4 },
      '2':   { yaw: -0.56, pitch: 0.44, zoom: 1.20, tx: -12, ty: -14, tz: 0 },
      '3':   { yaw: -0.76, pitch: 0.38, zoom: 1.28, tx: 68,  ty: 2,  tz: -14 }
    };

    var activeStage = '1';
    var cam = { yaw: -0.54, pitch: 0.42, zoom: 1.00, tx: -4, ty: -6, tz: 0 };
    var target = { yaw: -0.42, pitch: 0.38, zoom: 1.16, tx: 36, ty: 24, tz: 4 };

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

    /* Flow Rate Scrubber & Play/Pause Controls (Video Interactive Scrubber) */
    var flowRate = 0.85;
    var isPlaying = true;
    var flowInput = $('h3d-flow-range');
    var flowVal = $('h3d-flow-val');
    var playBtn = $('pbook-play');

    if (flowInput) {
      flowInput.addEventListener('input', function () {
        var v = Math.max(0, Math.min(100, Number(flowInput.value) || 0));
        flowRate = v / 100;
        if (flowVal) flowVal.textContent = v + '%';
      });
    }
    if (playBtn) {
      playBtn.addEventListener('click', function () {
        isPlaying = !isPlaying;
        playBtn.classList.toggle('is-playing', isPlaying);
        playBtn.textContent = isPlaying ? '❚❚' : '▶';
      });
    }

    /* High-DPI resize */
    var cw = 720, ch = 470, dpr = 1;
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
      var fov = 620;
      var persp = fov / Math.max(160, fov + z2);
      return {
        x: cw * 0.5 + x1 * scale * persp,
        y: ch * 0.50 + y2 * scale * persp,
        z: z2,
        p: persp * scale
      };
    }

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
        { idx: [0, 1, 5, 4], fill: cols.top,    stroke: cols.stroke },
        { idx: [3, 2, 6, 7], fill: cols.bottom, stroke: cols.stroke },
        { idx: [4, 5, 6, 7], fill: cols.front,  stroke: cols.stroke },
        { idx: [0, 1, 2, 3], fill: cols.back,   stroke: cols.stroke },
        { idx: [1, 5, 6, 2], fill: cols.right,  stroke: cols.stroke },
        { idx: [0, 4, 7, 3], fill: cols.left,   stroke: cols.stroke }
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

    function pushQuad(faces, p1, p2, p3, p4, fill, stroke, stageTag, alpha, zBias) {
      var a = project(p1[0], p1[1], p1[2]);
      var b = project(p2[0], p2[1], p2[2]);
      var c = project(p3[0], p3[1], p3[2]);
      var d = project(p4[0], p4[1], p4[2]);
      faces.push({
        pts: [a, b, c, d],
        z: (a.z + b.z + c.z + d.z) * 0.25 + (zBias || 0),
        fill: fill,
        stroke: stroke,
        stage: stageTag,
        alpha: alpha == null ? 1 : alpha
      });
    }

    function pushCylinderY(faces, cx, cz, yTop, yBot, rad, segs, fillSide, fillTop, stroke, stageTag, alpha) {
      var topPts = [];
      for (var i = 0; i < segs; i++) {
        var a1 = (i / segs) * Math.PI * 2;
        var a2 = ((i + 1) / segs) * Math.PI * 2;
        var x1 = cx + Math.cos(a1) * rad, z1 = cz + Math.sin(a1) * rad;
        var x2 = cx + Math.cos(a2) * rad, z2 = cz + Math.sin(a2) * rad;
        pushQuad(faces, [x1, yTop, z1], [x2, yTop, z2], [x2, yBot, z2], [x1, yBot, z1], fillSide, stroke, stageTag, alpha);
        topPts.push(project(x1, yTop, z1));
      }
      var zSum = 0;
      for (var k = 0; k < topPts.length; k++) zSum += topPts[k].z;
      faces.push({
        pts: topPts,
        z: zSum / topPts.length - 1.5,
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

    /* 3D Hotspot World Anchors for Stage 01 (60L Tank), Stage 02 (1700mm Flume & Blue Wheel), Stage 03 (4-Spoke Pulley & Generator DC) */
    var STAGE_ANCHORS = {
      '1': [74, 66, 18],
      '2': [8, -18, 24],
      '3': [88, 12, -36]
    };
    var projectedAnchors = {};

    /* Pointer Orbit Drag + Direct 3D Stage Picking */
    var dragging = false, moved = 0, lastX = 0, lastY = 0;
    canvas.addEventListener('pointerdown', function (e) {
      dragging = true;
      moved = 0;
      lastX = e.clientX;
      lastY = e.clientY;
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
      target.pitch = Math.max(-0.1, Math.min(0.88, target.pitch + dy * 0.006));
    });
    function endDrag(e) {
      if (!dragging) return;
      dragging = false;
      if (moved < 7 && e && e.clientX != null) {
        var r = canvas.getBoundingClientRect();
        var mx = e.clientX - r.left;
        var my = e.clientY - r.top;
        var bestS = null, bestD = 96;
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
    if (btnOut) btnOut.addEventListener('click', function () { target.zoom = Math.max(0.72, target.zoom - 0.14); });
    if (btnReset) btnReset.addEventListener('click', function () {
      if (typeof window.__vxSelectStage === 'function') window.__vxSelectStage('all');
      else window.__vxFocus3DStage('all');
    });

    var wheelAngle = 0;
    var flowPhase = 0;

    function stageAlpha(st) {
      if (!st || activeStage === 'all') return 1;
      return String(st) === activeStage ? 1 : 0.42;
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

    function draw3DLabel(pt3d, text, sub, color) {
      var p = project(pt3d[0], pt3d[1], pt3d[2]);
      ctx.save();
      ctx.font = '700 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = color || '#EAF4FF';
      ctx.fillText(text, p.x, p.y);
      if (sub) {
        ctx.font = '500 9px "Source Sans 3", sans-serif';
        ctx.fillStyle = 'rgba(226, 232, 240, 0.78)';
        ctx.fillText(sub, p.x, p.y + 11);
      }
      ctx.restore();
    }

    var FRAME_COLS = {
      top: '#64748B', bottom: '#1E293B', front: '#475569', back: '#334155', right: '#475569', left: '#334155',
      stroke: '#0F172A'
    };

    function renderFrame() {
      requestAnimationFrame(renderFrame);
      var beranda = $('beranda');
      if (beranda && beranda.hidden) return;

      var idleSpin = dragging ? 0 : Math.sin(flowPhase * 0.3) * 0.0006;
      cam.yaw += (target.yaw - cam.yaw) * 0.11 + idleSpin;
      cam.pitch += (target.pitch - cam.pitch) * 0.11;
      cam.zoom += (target.zoom - cam.zoom) * 0.11;
      cam.tx += (target.tx - cam.tx) * 0.11;
      cam.ty += (target.ty - cam.ty) * 0.11;
      cam.tz += (target.tz - cam.tz) * 0.11;

      cosY = Math.cos(cam.yaw); sinY = Math.sin(cam.yaw);
      cosP = Math.cos(cam.pitch); sinP = Math.sin(cam.pitch);
      scale = Math.min(cw / 440, ch / 290) * cam.zoom;

      var spd = (isPlaying && !reducedMotion) ? (0.15 + flowRate * 0.85) : 0;
      wheelAngle += 0.048 * spd;
      flowPhase += 0.040 * spd;

      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cw, ch);

      var faces = [];
      var a1 = stageAlpha('1');
      var a2 = stageAlpha('2');
      var a3 = stageAlpha('3');

      /* =====================================================================
         0. VIDEO-STYLE 3D ENERGY STORE CYLINDERS (Floating Top Rack)
         Just like the 3 glass beakers in the Physics Book video (E_p, E_k, E_DC)
         ===================================================================== */
      var stores = [
        { x: -56, label: 'E_p · Potensial', sub: 'Tangki 60 L', lvl: 0.35 + flowRate * 0.58, side: 'rgba(139, 92, 246, 0.55)', top: 'rgba(167, 139, 250, 0.85)', st: '1' },
        { x: -12, label: 'E_k · Kinetik',   sub: 'Kincir 6 Sudu', lvl: (0.20 + flowRate * 0.68) * (isPlaying ? 1 : 0.35), side: 'rgba(0, 168, 232, 0.58)', top: 'rgba(56, 189, 248, 0.88)', st: '2' },
        { x: 32,  label: 'E_DC · Listrik',  sub: 'Pulley 1:4 · 12V', lvl: (0.15 + flowRate * 0.76) * (isPlaying ? 1 : 0.25), side: 'rgba(245, 158, 11, 0.62)', top: 'rgba(251, 191, 36, 0.92)', st: '3' }
      ];
      /* Glass Beaker Rack Stand */
      pushBox(faces, -12, -74, -52, 132, 4, 28, {
        top: 'rgba(226, 232, 240, 0.28)', bottom: 'rgba(15, 23, 42, 0.5)',
        front: 'rgba(148, 163, 184, 0.35)', back: 'rgba(100, 116, 139, 0.3)',
        right: 'rgba(148, 163, 184, 0.3)', left: 'rgba(100, 116, 139, 0.3)',
        stroke: 'rgba(226, 232, 240, 0.5)'
      }, null, 0.9);

      for (var si = 0; si < stores.length; si++) {
        var st = stores[si];
        var bBot = -76, bTop = -114;
        var fillY = bBot - (bBot - bTop - 3) * st.lvl;
        /* Colored Energy Liquid inside Beaker */
        pushCylinderY(faces, st.x, -52, fillY, bBot, 13, 12, st.side, st.top, 'rgba(255,255,255,0.35)', st.st, 0.95);
        /* Outer Glass Cylinder Beaker */
        pushCylinderY(faces, st.x, -52, bTop, bBot, 14.5, 12, 'rgba(255,255,255,0.10)', 'rgba(255,255,255,0.16)', 'rgba(226,232,240,0.55)', st.st, 0.85);
      }

      /* =====================================================================
         1. TWO-TIER DARK STEEL HOLLOW FRAME (Exact Match to CAD PNG)
         ===================================================================== */
      /* Left Upper Tier Deck Panel (Supports 500 mm Headbox + Upper Slope) */
      pushBox(faces, -94, -4, 0, 92, 5, 68, FRAME_COLS, null, 0.92);
      /* Upper Left Guide Brackets on Deck (as shown in CAD PNG) */
      pushBox(faces, -138, -18, 0, 4, 24, 66, FRAME_COLS, null, 0.92);
      pushBox(faces, -78, -14, 28, 36, 18, 4, FRAME_COLS, null, 0.92);

      /* Right Lower Tier Deck Panel (Around Outlet & Generator Mount) */
      pushBox(faces, 38, 36, -27, 152, 5, 14, FRAME_COLS, null, 0.92);
      pushBox(faces, 38, 36, 27, 152, 5, 14, FRAME_COLS, null, 0.92);
      pushBox(faces, 108, 36, 0, 14, 5, 40, FRAME_COLS, null, 0.92);
      pushBox(faces, -22, 36, 0, 32, 5, 40, FRAME_COLS, null, 0.92);

      /* Bottom Base Shelf Frame (Y = 86, holds the 60-Liter Water Reservoir Tank) */
      pushBox(faces, -14, 86, -32, 256, 5, 5, FRAME_COLS, null, 0.9);
      pushBox(faces, -14, 86, 32, 256, 5, 5, FRAME_COLS, null, 0.9);
      pushBox(faces, -140, 86, 0, 5, 5, 64, FRAME_COLS, null, 0.9);
      pushBox(faces, 112, 86, 0, 5, 5, 64, FRAME_COLS, null, 0.9);

      /* Vertical Hollow Steel Frame Legs */
      [-31, 31].forEach(function (lz) {
        pushBox(faces, -138, 41, lz, 5, 90, 5, FRAME_COLS, null, 0.9);
        pushBox(faces, -48,  41, lz, 5, 90, 5, FRAME_COLS, null, 0.9);
        pushBox(faces, 112,  61, lz, 5, 50, 5, FRAME_COLS, null, 0.9);
      });

      /* =====================================================================
         2. STAGE 01: 60-LITER WATER RESERVOIR TANK (Underneath Outlet) + PIPE
         ===================================================================== */
      var tX = 68, tZ = 0, tR = 34;
      var waveDy = Math.sin(flowPhase * 2) * 1.8;
      /* 60-Liter Water Volume inside Bottom Cylindrical Tank */
      pushCylinderY(
        faces, tX, tZ, 52 + waveDy, 85, tR - 2.5, 16,
        'rgba(0, 168, 232, 0.50)', 'rgba(0, 198, 184, 0.68)', 'rgba(144, 224, 239, 0.55)', '1', a1
      );
      /* 60-Liter Cylindrical Tank Shell (Penampung Air 60 Liter) */
      pushCylinderY(
        faces, tX, tZ, 41, 86, tR, 16,
        'rgba(226, 232, 240, 0.24)', 'rgba(144, 224, 239, 0.14)', 'rgba(144, 224, 239, 0.72)', '1', a1
      );
      /* Submerged 100W Circulation Pump inside 60L Tank */
      pushBox(faces, tX - 8, 74, tZ, 18, 16, 16, {
        top: '#0096C7', bottom: '#023E8A', front: '#0077B6', back: '#005F92', right: '#0084B8', left: '#00669E',
        stroke: '#90E0EF'
      }, '1', a1);

      /* =====================================================================
         3. STAGE 02: EXACT CAD ACRYLIC FLUME (1700 x 400 x 250 mm) + 6-BLADE ROTOR
         - Upper Horizontal Headbox: 500 mm (X: -134..-76, Y_bot: -48, Y_top: -86)
         - Internal Weir Baffle: 95 x 105 mm (X: -134..-116, Y: -86..-66)
         - Inclined Middle Slope: 1016.97 mm (X: -76..+60, Y_bot: -48..+24, Y_top: -86..-14)
         - Lower Horizontal Outlet: 200 mm (X: +60..+88, Y_bot: +24, Y_top: -14, +50mm drop)
         ===================================================================== */
      var fZ1 = -22, fZ2 = 22;

      /* Flowing Water Sheet along 500mm Headbox & 1016.97mm Slope */
      pushQuad(faces,
        [-132, -55, fZ1 + 1], [-76, -55, fZ1 + 1],
        [-76, -55, fZ2 - 1],  [-132, -55, fZ2 - 1],
        'rgba(0, 180, 236, 0.50)', 'rgba(144, 224, 239, 0.5)', '2', a2
      );
      pushQuad(faces,
        [-76, -55, fZ1 + 1], [60, 18, fZ1 + 1],
        [60, 18, fZ2 - 1],   [-76, -55, fZ2 - 1],
        'rgba(0, 168, 232, 0.54)', 'rgba(144, 224, 239, 0.6)', '2', a2
      );

      /* Acrylic Flume Floor Plates (500mm Upper, 1016.97mm Slope, 200mm Lower) */
      pushQuad(faces, [-134, -48, fZ1], [-76, -48, fZ1], [-76, -48, fZ2], [-134, -48, fZ2], 'rgba(226, 238, 248, 0.28)', '#0F172A', '2', a2);
      pushQuad(faces, [-76, -48, fZ1],  [60, 24, fZ1],   [60, 24, fZ2],   [-76, -48, fZ2],  'rgba(226, 238, 248, 0.28)', '#0F172A', '2', a2);
      pushQuad(faces, [60, 24, fZ1],    [88, 24, fZ1],   [88, 24, fZ2],   [60, 24, fZ2],    'rgba(226, 238, 248, 0.24)', '#0F172A', '2', a2);

      /* Internal Headbox Weir / Baffle Box (95 x 105 mm from PDF Drawing) */
      pushBox(faces, -125, -75, 0, 18, 20, 44, {
        top: 'rgba(241, 245, 249, 0.48)', bottom: 'rgba(148, 163, 184, 0.42)',
        front: 'rgba(226, 232, 240, 0.40)', back: 'rgba(203, 213, 225, 0.40)',
        right: 'rgba(226, 232, 240, 0.45)', left: 'rgba(203, 213, 225, 0.45)',
        stroke: '#0F172A'
      }, '2', a2);

      /* 6-Blade Curved Bright-Blue Waterwheel (Exact Match to Blue Rotor in CAD PNG) */
      var wX = 36, wY = 2, wZ = 0, wR = 23;
      /* Protruding Stainless Steel Main Shaft (Ø 30 mm) through both side walls */
      pushCylinderZ(
        faces, wX, wY, -40, 38, 3.2, 10,
        '#94A3B8', '#F8FAFC', '#0F172A', '2', Math.max(a2, a3), wheelAngle
      );
      /* Central Rotor Hub */
      pushCylinderZ(
        faces, wX, wY, fZ1 + 3, fZ2 - 3, 7, 12,
        '#0284C7', '#38BDF8', '#0F172A', '2', a2, wheelAngle
      );
      /* 6 Curved Cyan-Blue Paddles */
      for (var b = 0; b < 6; b++) {
        var ang = wheelAngle + (b * Math.PI) / 3;
        var rIn = 7, rMid = 16, rOut = wR;
        var xIn = wX + Math.cos(ang) * rIn, yIn = wY + Math.sin(ang) * rIn;
        var xMid = wX + Math.cos(ang + 0.16) * rMid, yMid = wY + Math.sin(ang + 0.16) * rMid;
        var xOut = wX + Math.cos(ang + 0.38) * rOut, yOut = wY + Math.sin(ang + 0.38) * rOut;
        pushQuad(faces,
          [xIn, yIn, fZ1 + 3], [xMid, yMid, fZ1 + 3],
          [xMid, yMid, fZ2 - 3], [xIn, yIn, fZ2 - 3],
          '#0096C7', '#041B36', '2', a2
        );
        pushQuad(faces,
          [xMid, yMid, fZ1 + 3], [xOut, yOut, fZ1 + 3],
          [xOut, yOut, fZ2 - 3], [xMid, yMid, fZ2 - 3],
          '#00B4D8', '#041B36', '2', a2
        );
      }

      /* Translucent Acrylic Side Walls (Back Z = -22 & Front Z = +22) + End Walls */
      [fZ1, fZ2].forEach(function (wz) {
        var wFill = wz === fZ2 ? 'rgba(241, 245, 249, 0.22)' : 'rgba(203, 213, 225, 0.25)';
        var bias = wz === fZ2 ? -4 : 4;
        /* 500mm Upper Wall */
        pushQuad(faces, [-134, -86, wz], [-76, -86, wz], [-76, -48, wz], [-134, -48, wz], wFill, '#0F172A', '2', a2, bias);
        /* 1016.97mm Inclined Wall */
        pushQuad(faces, [-76, -86, wz], [60, -14, wz], [60, 24, wz], [-76, -48, wz], wFill, '#0F172A', '2', a2, bias);
        /* 200mm Lower Wall + 50mm Drop Lip */
        pushQuad(faces, [60, -14, wz], [88, -14, wz], [88, 32, wz], [60, 32, wz], wFill, '#0F172A', '2', a2, bias);
      });
      /* Back End Wall (X = -134) & Front Lower End Wall (X = +88) */
      pushQuad(faces, [-134, -86, fZ1], [-134, -86, fZ2], [-134, -48, fZ2], [-134, -48, fZ1], 'rgba(226, 232, 240, 0.34)', '#0F172A', '2', a2);
      pushQuad(faces, [88, -14, fZ1],   [88, -14, fZ2],   [88, 32, fZ2],    [88, 32, fZ1],    'rgba(226, 232, 240, 0.30)', '#0F172A', '2', a2);

      /* =====================================================================
         4. STAGE 03: 4-SPOKE LARGE PULLEY (Ø 270 mm) + V-BELT + GENERATOR DC + BULB
         Exact match to PDF Drawing & CAD PNG
         ===================================================================== */
      var pZ = -34;
      var p1X = wX, p1Y = wY, p1R = 22;
      /* Large Driver Pulley Rim (Ø 270 mm, 4-spoke wheel on outer side of channel) */
      pushCylinderZ(
        faces, p1X, p1Y, pZ - 2.5, pZ + 2.5, p1R, 18,
        '#CBD5E1', 'rgba(248, 250, 252, 0.28)', '#0F172A', '3', a3, wheelAngle
      );

      /* Small Driven Pulley (Ø 67.5 mm — 1:4 Step-Up, spins 4x faster) */
      var p2X = 98, p2Y = 18, p2R = 7.5;
      pushCylinderZ(
        faces, p2X, p2Y, pZ - 2.5, pZ + 2.5, p2R, 14,
        '#94A3B8', '#F1F5F9', '#0F172A', '3', a3, wheelAngle * 4
      );

      /* Horizontal Cylindrical Generator DC XD 3240 (Mounted on front-right frame beam) */
      pushCylinderZ(
        faces, p2X, p2Y, -28, -4, 10.5, 14,
        '#94A3B8', '#CBD5E1', '#0F172A', '3', a3, 0
      );
      /* Generator Mounting End-Brackets (Square flanges as in CAD PNG) */
      pushBox(faces, p2X, p2Y, -28, 22, 22, 3, {
        top: '#94A3B8', bottom: '#475569', front: '#CBD5E1', back: '#64748B', right: '#94A3B8', left: '#64748B',
        stroke: '#0F172A'
      }, '3', a3);
      pushBox(faces, p2X, p2Y, -4, 22, 22, 3, {
        top: '#94A3B8', bottom: '#475569', front: '#CBD5E1', back: '#64748B', right: '#94A3B8', left: '#64748B',
        stroke: '#0F172A'
      }, '3', a3);

      /* 3D Output Lamp Stand (Like the glowing bulb apparatus in the video at 00:32) */
      pushBox(faces, 114, 26, 22, 18, 14, 18, {
        top: '#475569', bottom: '#0F172A', front: '#334155', back: '#1E293B', right: '#334155', left: '#1E293B',
        stroke: '#FBBF24'
      }, '3', a3);

      /* Depth-Sort all 3D Polygons (Painter's Algorithm) */
      faces.sort(function (a, b) { return b.z - a.z; });

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
          ctx.lineWidth = (activeStage === face.stage || activeStage === 'all') ? 1.3 : 0.85;
          ctx.stroke();
        }
        ctx.restore();
      }

      /* 4 Spokes of the Large Pulley Wheel (Exact 4-cross spokes from PDF Drawing & PNG) */
      for (var spk = 0; spk < 4; spk++) {
        var sa = wheelAngle + (spk * Math.PI) / 2;
        draw3DLine(
          [p1X, p1Y, pZ],
          [p1X + Math.cos(sa) * (p1R - 2), p1Y + Math.sin(sa) * (p1R - 2), pZ],
          '#E2E8F0', 3.2, null, a3
        );
      }

      /* Black V-Belt connecting Large 4-Spoke Pulley (Ø 270) to Small Generator Pulley (Ø 67.5) */
      var beltTop1 = [p1X + 4, p1Y - p1R + 1, pZ];
      var beltTop2 = [p2X + 1, p2Y - p2R + 1, pZ];
      var beltBot1 = [p1X - 4, p1Y + p1R - 1, pZ];
      var beltBot2 = [p2X - 1, p2Y + p2R - 1, pZ];
      draw3DLine(beltTop1, beltTop2, '#0F172A', 3.5, null, a3);
      draw3DLine(beltBot1, beltBot2, '#0F172A', 3.5, null, a3);
      draw3DLine(beltTop1, beltTop2, '#38BDF8', 1.4, [6, 5], a3);
      draw3DLine(beltBot1, beltBot2, '#38BDF8', 1.4, [6, 5], a3);

      /* Rising PVC Circulation Pipe from 60L Bottom Tank along Lower Frame up to 500mm Headbox (Stage 01) */
      var pipePts = [
        [tX - 12, 72, 24],
        [-130, 56, 24],
        [-130, -90, 24],
        [-124, -90, 8],
        [-124, -78, 8]
      ];
      for (var pi = 0; pi < pipePts.length - 1; pi++) {
        draw3DLine(pipePts[pi], pipePts[pi + 1], 'rgba(226, 232, 240, 0.72)', 6.5 * cam.zoom, null, a1);
        draw3DLine(pipePts[pi], pipePts[pi + 1], '#00A8E8', 2.8 * cam.zoom, null, a1);
      }

      /* Animated 3D Water Droplets inside Rising PVC Pipe (Stage 01) */
      if (flowRate > 0.02) {
        for (var wp = 0; wp < 10; wp++) {
          var tp = ((wp / 10) + flowPhase * 0.22) % 1;
          var px, py, pz = 24;
          if (tp < 0.45) {
            var u1 = tp / 0.45;
            px = (tX - 12) + (-130 - (tX - 12)) * u1;
            py = 72 + (56 - 72) * u1;
          } else if (tp < 0.88) {
            var u2 = (tp - 0.45) / 0.43;
            px = -130;
            py = 56 + (-90 - 56) * u2;
          } else {
            var u3 = (tp - 0.88) / 0.12;
            px = -124;
            py = -90 + u3 * 16;
            pz = 24 - u3 * 16;
          }
          var sp = project(px, py, pz);
          ctx.save();
          ctx.globalAlpha = a1;
          ctx.fillStyle = '#E0F7FC';
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, Math.max(2, 3 * sp.p), 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        /* Animated 3D Water Stream & Splash Particles down the 1016.97 mm Slope & into 60L Tank (Stage 02) */
        for (var cp = 0; cp < 14; cp++) {
          var tc = ((cp / 14) + flowPhase * 0.36) % 1;
          var cxP, cyP, czP = ((cp % 3) - 1) * 9;
          if (tc < 0.78) {
            var uSlope = tc / 0.78;
            cxP = -76 + (60 - (-76)) * uSlope;
            cyP = -54 + (20 - (-54)) * uSlope;
          } else {
            /* Waterfall dropping from 200mm outlet straight down into the 60-Liter Reservoir Tank */
            var uFall = (tc - 0.78) / 0.22;
            cxP = 68 + (cp % 2) * 5;
            cyP = 24 + uFall * 32;
          }
          var scp = project(cxP, cyP, czP);
          ctx.save();
          ctx.globalAlpha = a2;
          ctx.fillStyle = '#90E0EF';
          ctx.beginPath();
          ctx.arc(scp.x, scp.y, Math.max(2, 3.1 * scp.p), 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      /* Glowing Bulb Apparatus (Video 00:32 Style Glowing Energy Sphere + Bulb Halo) */
      var bulbPt = project(114, 10, 22);
      var glowRadius = (10 + flowRate * 24) * bulbPt.p * (0.85 + Math.sin(flowPhase * 3) * 0.15);
      ctx.save();
      ctx.globalAlpha = a3;
      if (flowRate > 0.02) {
        var grad = ctx.createRadialGradient(bulbPt.x, bulbPt.y, 2, bulbPt.x, bulbPt.y, glowRadius);
        grad.addColorStop(0, 'rgba(254, 240, 138, 0.98)');
        grad.addColorStop(0.45, 'rgba(251, 191, 36, 0.58)');
        grad.addColorStop(1, 'rgba(251, 191, 36, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(bulbPt.x, bulbPt.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = flowRate > 0.02 ? '#FEF08A' : '#64748B';
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(bulbPt.x, bulbPt.y, Math.max(5, 7 * bulbPt.p), 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      /* 3D Labels for Energy Store Cylinders & 60L Tank */
      for (var li = 0; li < stores.length; li++) {
        draw3DLabel([stores[li].x, -124, -52], stores[li].label, stores[li].sub, '#F8FAFC');
      }
      draw3DLabel([tX, 98, tZ], 'PENAMPUNG 60 LITER', 'Sirkulasi Bawah', '#90E0EF');

      /* Update Floating 3D Hotspot Pin Positions */
      ['1', '2', '3'].forEach(function (k) {
        var w = STAGE_ANCHORS[k];
        var pr = project(w[0], w[1], w[2]);
        projectedAnchors[k] = pr;
        var pinEl = pins[k];
        if (pinEl) {
          var clampedX = Math.max(64, Math.min(cw - 64, pr.x));
          var clampedY = Math.max(26, Math.min(ch - 56, pr.y));
          pinEl.style.left = clampedX.toFixed(1) + 'px';
          pinEl.style.top = clampedY.toFixed(1) + 'px';
        }
      });

      ctx.restore();
    }

    requestAnimationFrame(renderFrame);
  })();
})();
