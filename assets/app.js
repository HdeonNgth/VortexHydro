/* ==========================================================================
   Vortex Hydro — Core Interactive Application
   Scroll-spy, Reveal Animations, Water Flow Simulator, Diagram, Team & Search
   ========================================================================== */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var H = document.documentElement;
  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. Theme Toggle (Light / Dark) ---------- */
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

  /* ---------- 2. Sticky Header State & Scroll-Spy ---------- */
  var hdr = $('hdr');
  var sections = ['beranda', 'simulasi', 'cara-kerja', 'dokumentasi', 'tim', 'faq'];

  function updateHeaderScroll() {
    if (!hdr) return;
    var scrolled = window.scrollY > 40 || location.hash === '#dashboard';
    hdr.classList.toggle('is-scrolled', scrolled);
  }
  window.addEventListener('scroll', updateHeaderScroll, { passive: true });
  window.addEventListener('hashchange', updateHeaderScroll);
  updateHeaderScroll();

  function setActiveNav(id) {
    $$('[data-nav-link]').forEach(function (a) {
      var k = a.getAttribute('data-k');
      if (k === id) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }

  if ('IntersectionObserver' in window) {
    var spyObs = new IntersectionObserver(function (entries) {
      if (location.hash === '#dashboard') return;
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setActiveNav(entry.target.id);
      });
    }, { rootMargin: '-35% 0px -55% 0px' });
    sections.forEach(function (id) {
      var el = $(id);
      if (el) spyObs.observe(el);
    });
  }

  /* Smooth anchor links that also exit #dashboard cleanly */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var targetId = (a.getAttribute('href') || '').slice(1);
    if (!targetId || targetId === 'dashboard') return;
    if (location.hash === '#dashboard') {
      e.preventDefault();
      location.hash = '#' + targetId;
      setTimeout(function () {
        var el = $(targetId);
        if (el) el.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
      }, 60);
    }
  });

  /* ---------- 3. Virya-Style Scroll Reveal & Counter Animation ---------- */
  var reveals = $$('[data-reveal]');
  if ('IntersectionObserver' in window && !reducedMotion) {
    var revObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-visible');
        revObs.unobserve(en.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { revObs.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- 4. Interactive Water Flow & Vortex Turbine Simulator ---------- */
  (function initWaterSimulator() {
    var qIn = $('sim-q'), hIn = $('sim-h'), eIn = $('sim-e');
    var qVal = $('sim-qv'), hVal = $('sim-hv'), eVal = $('sim-ev');
    var outW = $('sim-w'), outHyd = $('sim-hyd'), outRpm = $('sim-rpm'), outDay = $('sim-day');
    var rotor = $('sim-rotor'), ledGlow = $('sim-led-glow'), ledText = $('sim-led-txt');
    var canvas = $('sim-canvas');
    if (!qIn || !hIn || !eIn) return;

    var flowState = { q: 50, h: 1.5, eff: 40, rpm: 180, watts: 294.3, angle: 0 };

    function compute() {
      var q = Math.max(0.5, +qIn.value || 0.5);
      var h = Math.max(0.2, +hIn.value || 0.2);
      var eff = Math.min(80, Math.max(15, +eIn.value || 40));
      var pHyd = 9.81 * q * h;
      var pElec = pHyd * (eff / 100);
      var rpm = Math.round(55 * Math.sqrt(h) * Math.pow(q, 0.32));

      flowState.q = q;
      flowState.h = h;
      flowState.eff = eff;
      flowState.rpm = rpm;
      flowState.watts = pElec;

      if (qVal) qVal.textContent = q.toFixed(q < 10 ? 1 : 0) + ' L/s';
      if (hVal) hVal.textContent = h.toFixed(1) + ' m';
      if (eVal) eVal.textContent = Math.round(eff) + '%';
      if (outW) outW.textContent = pElec >= 1000 ? (pElec / 1000).toFixed(2) + ' kW' : pElec.toFixed(1) + ' W';
      if (outHyd) outHyd.textContent = pHyd >= 1000 ? (pHyd / 1000).toFixed(2) + ' kW' : pHyd.toFixed(1) + ' W';
      if (outRpm) outRpm.textContent = rpm + ' RPM';
      if (outDay) {
        var wh = pElec * 24;
        outDay.textContent = wh >= 1000 ? (wh / 1000).toFixed(1) + ' kWh' : Math.round(wh) + ' Wh';
      }
      var glow = Math.min(1, pElec / 40);
      if (ledGlow) {
        ledGlow.style.opacity = (0.18 + glow * 0.82).toFixed(2);
        ledGlow.style.transform = 'scale(' + (0.85 + glow * 0.3).toFixed(2) + ')';
      }
      if (ledText) {
        ledText.textContent = pElec >= 10 ? 'LED 10W Menyala Penuh' : pElec >= 2 ? 'LED 10W Menyala Redup' : 'Daya Rendah';
      }
    }

    [qIn, hIn, eIn].forEach(function (el) { el.addEventListener('input', compute); });
    $$('[data-sim-preset]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        qIn.value = btn.getAttribute('data-q');
        hIn.value = btn.getAttribute('data-h');
        eIn.value = btn.getAttribute('data-e');
        $$('[data-sim-preset]').forEach(function (b) { b.classList.toggle('is-active', b === btn); });
        compute();
      });
    });
    compute();

    /* Live Water Stream Particles + Spinning Turbine Rotor */
    var ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;
    var particles = [];
    for (var i = 0; i < 42; i++) {
      particles.push({
        x: Math.random(),
        y: 0.25 + Math.random() * 0.5,
        len: 14 + Math.random() * 26,
        spd: 0.6 + Math.random() * 0.8,
        alpha: 0.25 + Math.random() * 0.55
      });
    }

    var lastT = performance.now();
    function tick(now) {
      var dt = Math.min(0.05, (now - lastT) / 1000);
      lastT = now;

      /* Spin 6-blade SVG rotor */
      if (rotor && !reducedMotion) {
        var degPerSec = Math.min(720, Math.max(25, flowState.rpm * 1.4));
        flowState.angle = (flowState.angle + degPerSec * dt) % 360;
        rotor.setAttribute('transform', 'rotate(' + flowState.angle.toFixed(1) + ' 110 110)');
      }

      /* Draw animated water current streaks on canvas */
      if (ctx && canvas) {
        var w = canvas.width, h = canvas.height;
        ctx.clearRect(0, 0, w, h);
        var speedMult = 0.22 + (flowState.q / 150) * 1.65;
        for (var j = 0; j < particles.length; j++) {
          var p = particles[j];
          if (!reducedMotion) {
            p.x += dt * speedMult * p.spd;
            if (p.x > 1.15) { p.x = -0.15; p.y = 0.22 + Math.random() * 0.56; }
          }
          var px = p.x * w;
          var py = p.y * h + Math.sin(p.x * 7 + now * 0.002) * 5;
          var grad = ctx.createLinearGradient(px - p.len, py, px + p.len, py);
          grad.addColorStop(0, 'rgba(0, 180, 216, 0)');
          grad.addColorStop(0.5, 'rgba(144, 224, 239, ' + p.alpha.toFixed(2) + ')');
          grad.addColorStop(1, 'rgba(0, 168, 232, 0)');
          ctx.strokeStyle = grad;
          ctx.lineWidth = 2.2;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(px - p.len, py);
          ctx.lineTo(px + p.len, py);
          ctx.stroke();
        }
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
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
    show(1);
  })();

  /* ---------- 6. Compact Team Cards with Division Filter ---------- */
  (function initTeam() {
    var host = $('team-grid'), tabs = $('team-tabs');
    if (!host) return;

    var GROUPS = [
      {
        id: 'pengurus', label: 'Pengurus Inti', desc: 'Koordinasi utama, administrasi, dan anggaran proyek kelas.',
        members: [
          { name: 'Mochammad Ardiansyah Tri Wicaksono', role: 'Ketua Tim', lead: true },
          { name: "Mohammad Miftah Yusron Hana'i", role: 'Sekretaris 1' },
          { name: 'Mohamad Supriyadi', role: 'Sekretaris 2' },
          { name: 'Khalidatul Aliyah Safitri', role: 'Bendahara 1' },
          { name: 'Loudy Firza Aulia', role: 'Bendahara 2' },
          { name: 'Maritza Aprilia Putri', role: 'Bendahara 3' }
        ]
      },
      {
        id: 'modeling', label: 'Modeling', desc: 'Pemodelan 3D & simulasi CFD aliran fluida.',
        members: [
          { name: 'Kristoforus Rizkiano Tembang Langit', role: 'Ketua Divisi', lead: true },
          { name: 'Muhammad Firdhie Andalas', role: 'Anggota' },
          { name: 'M. Rangga Satria Noorfando', role: 'Anggota' },
          { name: 'Rakha Aribawa Rahman', role: 'Anggota' },
          { name: 'Lutfi Ahmad Suriyana', role: 'Anggota' }
        ]
      },
      {
        id: 'mat-model', label: 'Mat Model', desc: 'Pemodelan matematis & kajian material.',
        members: [
          { name: 'Muhammad Alfian Firmansyah', role: 'Ketua Divisi', lead: true },
          { name: 'Muhammad Iqbal Maulana', role: 'Anggota' },
          { name: 'Khalidatul Aliyah Safitri', role: 'Anggota' },
          { name: 'Muhamad Ferly Farnando', role: 'Anggota' }
        ]
      },
      {
        id: 'software', label: 'Software', desc: 'Web interaktif, dashboard telemetri, dan asisten AI.',
        members: [
          { name: 'Fattar Davino Aulia Rahman', role: 'Ketua Divisi', lead: true },
          { name: 'Muhamad Supriyadi', role: 'Anggota' },
          { name: 'Muhammad Aryaputra Manda', role: 'Anggota' },
          { name: 'M. Nauval Al-Ghafary Wardoyo', role: 'Anggota' },
          { name: "Haudh Al Maa'uun", role: 'Anggota' }
        ]
      },
      {
        id: 'electrical', label: 'Electrical', desc: 'Generator DC, sistem daya, sensor, dan beban LED.',
        members: [
          { name: 'Muhammad Nur Faizin', role: 'Ketua Divisi', lead: true },
          { name: 'Muhammad Farrel Caesar', role: 'Anggota' },
          { name: 'Mokhamad Rayhan Faturahman', role: 'Anggota' },
          { name: 'Dava Maulana Yudha', role: 'Anggota' },
          { name: 'Iltizamul Haqqi', role: 'Anggota' },
          { name: 'Mexcelino Perwira Dirganesia', role: 'Anggota' },
          { name: 'Mochammad Ardiansyah Tri Wicaksono', role: 'Anggota' }
        ]
      },
      {
        id: 'mekanikal', label: 'Mekanikal', desc: 'Rangka 2 × 0,8 m, kincir 6 sudu, poros & pulley.',
        members: [
          { name: 'M. Salman Alfarizi Ramadani', role: 'Ketua Divisi', lead: true },
          { name: 'Mukhamad Nur Alfan', role: 'Anggota' },
          { name: "Mohammad Miftah Yusron Hana'i", role: 'Anggota' },
          { name: 'Febrian Patria Yoni', role: 'Anggota' },
          { name: 'Muhammad Fadil', role: 'Anggota' },
          { name: 'Mohamad Rizky Fadilah', role: 'Anggota' },
          { name: 'Mohammad Hisyam Rifai', role: 'Anggota' }
        ]
      },
      {
        id: 'perlengkapan', label: 'Perlengkapan', desc: 'Pengadaan komponen & logistik laboratorium.',
        members: [
          { name: 'Handhika Hidayatullah', role: 'Ketua Divisi', lead: true },
          { name: 'Loudy Firza Aulia', role: 'Anggota' },
          { name: 'Keihan Daafa Parsya', role: 'Anggota' },
          { name: 'Girendra Hangestubrata', role: 'Anggota' },
          { name: 'Jalalludin Satriya Nayaka', role: 'Anggota' }
        ]
      },
      {
        id: 'pdd', label: 'PDD', desc: 'Publikasi, desain visual, dan dokumentasi uji.',
        members: [
          { name: "Mohammad Miftah Yusron Hana'i", role: 'Ketua Divisi', lead: true },
          { name: 'Legison Satria Manik Allo', role: 'Anggota' },
          { name: 'Maritza Aprilia Putri', role: 'Anggota' }
        ]
      }
    ];

    var PHOTOS = {
      'mexcelino-perwira-dirganesia': 'assets/team/electrical/mexcelino-perwira-dirganesia.jpg',
      'mokhamad-rayhan-faturahman': 'assets/team/electrical/mokhamad-rayhan-faturahman.jpg',
      'muhammad-farrel-caesar': 'assets/team/electrical/muhammad-farrel-caesar.jpg',
      'muhammad-nur-faizin': 'assets/team/electrical/muhammad-nur-faizin.jpg',
      'khalidatul-aliyah-safitri': 'assets/team/mat-model/khalidatul-aliyah-safitri.jpg',
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
      'maritza-aprilia-putri': 'assets/team/pdd/maritza-aprilia-putri.jpg',
      'mohamad-supriyadi': 'assets/team/pengurus/mohamad-supriyadi.jpg',
      'muhamad-supriyadi': 'assets/team/pengurus/mohamad-supriyadi.jpg',
      'handhika-hidayatullah': 'assets/team/perlengkapan/handhika-hidayatullah.jpg',
      'jalalludin-satriya-nayaka': 'assets/team/perlengkapan/jalalludin-satriya-nayaka.jpg',
      'keihan-daafa-parsya': 'assets/team/perlengkapan/keihan-daafa-parsya.jpg',
      'loudy-firza-aulia': 'assets/team/perlengkapan/loudy-firza-aulia.jpg'
    };

    function slug(s) { return s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
    function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
    function init(s) { var p = s.replace(/[^A-Za-z\s]/g, '').trim().split(/\s+/).filter(Boolean); return p.length > 1 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : (p[0] || 'VH').slice(0, 2).toUpperCase(); }

    function renderGroup(id) {
      var list = id === 'all' ? GROUPS : GROUPS.filter(function (g) { return g.id === id; });
      host.innerHTML = list.map(function (g) {
        var people = g.members.map(function (m) {
          var photo = PHOTOS[slug(m.name)];
          var av = photo
            ? '<span class="t-av"><img src="' + photo + '" alt="' + esc(m.name) + '" loading="lazy" decoding="async"></span>'
            : '<span class="t-av t-av--init" aria-hidden="true">' + esc(init(m.name)) + '</span>';
          return '<div class="t-person' + (m.lead ? ' is-lead' : '') + '">' + av + '<div><strong>' + esc(m.name) + '</strong><span>' + esc(m.role) + '</span></div></div>';
        }).join('');
        return '<article class="t-card"><header class="t-card__head"><div><h3>' + esc(g.label) + '</h3><p>' + esc(g.desc) + '</p></div><span class="t-card__cnt">' + g.members.length + '</span></header><div class="t-card__list">' + people + '</div></article>';
      }).join('');
    }

    if (tabs) {
      var tabHtml = '<button type="button" class="t-tab is-active" data-g="all">Semua Divisi</button>' +
        GROUPS.map(function (g) { return '<button type="button" class="t-tab" data-g="' + g.id + '">' + esc(g.label) + '</button>'; }).join('');
      tabs.innerHTML = tabHtml;
      tabs.addEventListener('click', function (e) {
        var b = e.target.closest('button[data-g]'); if (!b) return;
        $$('.t-tab', tabs).forEach(function (x) { x.classList.toggle('is-active', x === b); });
        renderGroup(b.dataset.g);
      });
    }
    renderGroup('all');
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
      $$('#site-main section[id]').forEach(function (sec) {
        var secName = sec.getAttribute('data-title') || sec.id;
        $$('h1,h2,h3,p,li,td,summary,strong', sec).forEach(function (el) {
          var t = (el.textContent || '').replace(/\s+/g, ' ').trim();
          if (t.length < 3 || seen[t]) return;
          seen[t] = 1;
          idx.push({ sec: sec.id, pn: secName, el: el, t: t, n: t.toLowerCase(), h: /^H/.test(el.tagName) });
        });
      });
    }
    function render() {
      var q = inp.value.trim();
      var tok = q.toLowerCase().split(/\s+/).filter(Boolean);
      if (q.length < 2) {
        items = []; ul.innerHTML = '';
        hint.textContent = 'Ketik minimal 2 huruf. Pintasan: Ctrl+K atau tombol /.';
        return;
      }
      items = idx.filter(function (e) { return tok.every(function (k) { return e.n.indexOf(k) >= 0; }); })
        .sort(function (a, b) { return (b.h ? 3 : 0) - (a.h ? 3 : 0); }).slice(0, 10);
      act = items.length ? 0 : -1;
      if (!items.length) { ul.innerHTML = ''; hint.textContent = 'Tidak ada hasil untuk “' + q + '”.'; return; }
      hint.textContent = items.length + ' hasil ditemukan. Tekan Enter untuk menuju bagian.';
      ul.innerHTML = items.map(function (e, i) {
        var sn = esc(e.t.slice(0, 120) + (e.t.length > 120 ? '…' : ''));
        return '<li role="option" data-i="' + i + '" aria-selected="' + (i === act) + '"><small>' + esc(e.pn) + '</small><span>' + sn + '</span></li>';
      }).join('');
    }
    function open() { back = document.activeElement; build(); ov.hidden = false; inp.value = ''; render(); inp.focus(); }
    function close() { ov.hidden = true; if (back && back.focus) back.focus(); }
    function go(item) {
      close();
      if (location.hash === '#dashboard') location.hash = '#' + item.sec;
      setTimeout(function () {
        item.el.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
        item.el.classList.add('vs-flash');
        setTimeout(function () { item.el.classList.remove('vs-flash'); }, 1800);
      }, 60);
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
})();
