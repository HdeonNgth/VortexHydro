/* ==========================================================================
   Vortex Hydro — Consolidated Simulation Engine, Admin Auth & Dashboard
   Combines: api-config + vx-engine + auth + dashglass + telemetry analyzer
   ========================================================================== */
(function () {
  'use strict';

  /* ---------- 1. API & Demo Mode Config ---------- */
  window.VX_API_BASE = window.VX_API_BASE || '';
  window.VX_DEMO_MODE =
    window.VX_DEMO_MODE !== false &&
    (!window.VX_API_BASE ||
      /(^|\.)(github\.io|vercel\.app|localhost|127\.0\.0\.1)$/i.test(window.location.hostname));

  /* ---------- 2. Prototype Physics Engine (VXSim) ---------- */
  var CFG = {
    eta: 0.30, kRpm: 150, ratio: 2.2, ledW: 0.75,
    leak: 0.6, belt: 0.5,
    chg: 0.003, drain: 0.0006, fastDrain: 0.02,
    vRest0: 10.6, vRestSpan: 2.4, vChg: 0.6
  };
  var S = { on: true, q: 0.5, h: 0.5, fault: 'none', qe: 0, rpm: 0, rpmg: 0, tr: 0, pe: 0, soc: 0.7, vbat: 0 };
  S.vbat = CFG.vRest0 + CFG.vRestSpan * S.soc;
  var simListeners = [], simHist = [], simLast = Date.now();

  function ratioNow() { return CFG.ratio * (S.fault === 'belt' ? CFG.belt : 1); }
  function stepSim(dt) {
    var inflow = S.on ? S.q : 0;
    S.qe += (inflow - S.qe) * (1 - Math.exp(-dt * 2.2));
    var qt = S.qe * (S.fault === 'leak' ? 1 - CFG.leak : 1);
    S.tr = S.fault === 'jam' ? 0 : CFG.kRpm * Math.sqrt(S.h / 0.5) * Math.pow(qt / 0.5, 0.7);
    S.rpm += (S.tr - S.rpm) * (1 - Math.exp(-dt * (S.fault === 'jam' ? 5 : 1.6)));
    S.rpmg += (S.rpm * ratioNow() - S.rpmg) * (1 - Math.exp(-dt * 4));
    var pe = S.tr > 0.5 ? CFG.eta * 9.81 * qt * S.h * Math.min(1, S.rpm / S.tr) : 0;
    if (S.fault === 'belt') pe *= CFG.belt;
    S.pe = pe;
    S.soc += (pe * CFG.chg - (S.on ? CFG.drain : CFG.drain * 0.5) - (S.fault === 'batt' ? CFG.fastDrain : 0)) * dt;
    S.soc = Math.max(0, Math.min(1, S.soc));
    var target = CFG.vRest0 + CFG.vRestSpan * S.soc + CFG.vChg * Math.min(1, pe / CFG.ledW);
    S.vbat += (target - S.vbat) * (1 - Math.exp(-dt * 3));
  }
  function readingSim(noise) {
    var j = function (v, a) { return noise && v > 0 ? v * (1 + (Math.random() - 0.5) * a) : v; };
    var v = S.vbat;
    return {
      debit: j(S.qe, 0.02),
      vbat: noise ? v + (Math.random() - 0.5) * 0.02 : v,
      rpmShaft: j(S.rpm, 0.015),
      rpmGen: j(S.rpmg, 0.015),
      head: S.h, daya: j(S.pe, 0.02),
      led: S.rpmg > 60 ? Math.min(1, S.pe / CFG.ledW) : 0,
      on: S.on, fault: S.fault, ts: Date.now()
    };
  }
  setInterval(function () {
    var now = Date.now(), dt = Math.min(0.5, (now - simLast) / 1000);
    simLast = now; stepSim(dt);
  }, 100);
  setInterval(function () {
    simHist.push(readingSim(true));
    if (simHist.length > 60) simHist.shift();
  }, 1000);

  window.VXSim = {
    CFG: CFG, state: S,
    read: function () { return readingSim(true); },
    history: function () { return simHist.slice(); },
    set: function (o) {
      var ch = {};
      ['on', 'q', 'h', 'fault'].forEach(function (k) {
        if (o[k] != null && o[k] !== S[k]) { ch[k] = o[k]; S[k] = o[k]; }
      });
      if (Object.keys(ch).length) simListeners.forEach(function (f) { try { f(ch, S); } catch (e) {} });
    },
    onChange: function (f) { simListeners.push(f); }
  };

  /* ---------- 3. Admin Authentication (Demo & API) ---------- */
  var apiBase = String(window.VX_API_BASE || '').replace(/\/+$/, '');
  var isDemo = window.VX_DEMO_MODE === true;
  var demoSessionKey = 'vx-demo-role-v2';
  var demoAdminPassword = 'pakcikiniv2';
  var authState = { authenticated: false, role: null, displayName: '', offline: false };
  var forceOpen = false;
  var svgNs = 'http://www.w3.org/2000/svg';

  function make(tag, cls, text) {
    var el = document.createElement(tag);
    if (cls) el.className = cls;
    if (text !== undefined) el.textContent = text;
    return el;
  }

  function request(path, options) {
    if (isDemo) return Promise.reject(new Error('Backend tidak tersedia di mode demo.'));
    options = options || {};
    options.credentials = 'include';
    options.headers = Object.assign({}, options.headers || {});
    if (options.body && !options.headers['Content-Type']) options.headers['Content-Type'] = 'application/json';
    return fetch(apiBase + '/api/' + path, options).then(function (response) {
      if (response.status === 204) return null;
      return response.json().catch(function () { return {}; }).then(function (body) {
        if (!response.ok) {
          var err = new Error(body.error || 'Permintaan gagal (' + response.status + ').');
          err.status = response.status;
          throw err;
        }
        return body;
      });
    });
  }

  function makeIcon(name) {
    var svg = document.createElementNS(svgNs, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.8');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    if (name === 'eye') {
      var p1 = document.createElementNS(svgNs, 'path'); p1.setAttribute('d', 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z');
      var c1 = document.createElementNS(svgNs, 'circle'); c1.setAttribute('cx', '12'); c1.setAttribute('cy', '12'); c1.setAttribute('r', '3');
      svg.appendChild(p1); svg.appendChild(c1);
    } else {
      var r1 = document.createElementNS(svgNs, 'rect'); r1.setAttribute('x', '4'); r1.setAttribute('y', '10'); r1.setAttribute('width', '16'); r1.setAttribute('height', '11'); r1.setAttribute('rx', '2.5');
      var p2 = document.createElementNS(svgNs, 'path'); p2.setAttribute('d', 'M8 10V7a4 4 0 0 1 8 0v3');
      svg.appendChild(r1); svg.appendChild(p2);
    }
    return svg;
  }

  var dialog = make('section', 'vx-auth');
  dialog.id = 'vx-auth'; dialog.hidden = true;
  dialog.setAttribute('role', 'dialog'); dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-labelledby', 'vx-auth-admin-title');

  var card = make('div', 'vx-auth__card');
  var closeBtn = make('button', 'vx-auth__close', '\u00d7');
  closeBtn.type = 'button'; closeBtn.setAttribute('aria-label', 'Tutup');
  card.appendChild(closeBtn);

  var adminForm = make('form', 'vx-auth__pane');
  var headRow = make('div', 'vx-auth__head');
  var badge = make('span', 'vx-auth__badge'); badge.appendChild(makeIcon('lock'));
  headRow.appendChild(badge);
  var htxt = make('div', 'vx-auth__htxt');
  var adminTitle = make('h2', '', 'Login Admin'); adminTitle.id = 'vx-auth-admin-title';
  htxt.appendChild(adminTitle);
  htxt.appendChild(make('p', 'vx-auth__sub', isDemo
    ? 'Masukkan kata sandi demo untuk membuka Dashboard simulasi.'
    : 'Gunakan akun admin untuk membuka Dashboard pemantauan.'));
  headRow.appendChild(htxt);
  adminForm.appendChild(headRow);

  var statusEl = make('p', 'vx-auth__flash', '');
  statusEl.setAttribute('role', 'status'); statusEl.setAttribute('aria-live', 'polite');
  adminForm.appendChild(statusEl);

  var field = make('div', 'vx-auth__field');
  var lbl = make('label', 'vx-auth__label', isDemo ? 'Kata sandi demo' : 'Kata sandi');
  lbl.htmlFor = 'vx-auth-pass';
  var wrap = make('div', 'vx-auth__input-wrap');
  var password = make('input', 'vx-auth__input');
  password.id = 'vx-auth-pass'; password.type = 'password'; password.required = true;
  password.placeholder = 'Masukkan kata sandi (pakcikiniv2)';
  var eye = make('button', 'vx-auth__eye', '');
  eye.type = 'button'; eye.setAttribute('aria-label', 'Tampilkan kata sandi'); eye.setAttribute('aria-pressed', 'false');
  eye.appendChild(makeIcon('eye'));
  wrap.appendChild(password); wrap.appendChild(eye);
  field.appendChild(lbl); field.appendChild(wrap);
  adminForm.appendChild(field);

  var actions = make('div', 'vx-auth__actions');
  var backBtn = make('button', 'vx-auth__button vx-auth__button--ghost', 'Batal'); backBtn.type = 'button';
  var adminSubmit = make('button', 'vx-auth__button vx-auth__button--primary', 'Masuk ke Dashboard'); adminSubmit.type = 'submit';
  actions.appendChild(backBtn); actions.appendChild(adminSubmit);
  adminForm.appendChild(actions);
  card.appendChild(adminForm); dialog.appendChild(card); document.body.appendChild(dialog);

  var logoutBtn = make('button', 'lg__logout', 'Keluar');
  logoutBtn.type = 'button'; logoutBtn.hidden = true;
  logoutBtn.addEventListener('click', function () {
    try { window.sessionStorage.removeItem(demoSessionKey); } catch (e) {}
    if (location.hash === '#dashboard') location.hash = '#beranda';
    setState({ authenticated: true, role: 'guest', displayName: '', offline: true });
  });
  var navActions = document.querySelector('.hdr__actions');
  if (navActions) navActions.appendChild(logoutBtn);

  function snapshot() {
    return { authenticated: authState.authenticated, role: authState.role, displayName: authState.displayName, offline: authState.offline };
  }
  function updateAuthUi() {
    var isAdmin = authState.authenticated && authState.role === 'admin';
    logoutBtn.hidden = !isAdmin;
    dialog.hidden = !forceOpen;
    document.body.classList.toggle('vx-auth-open', !dialog.hidden);
  }
  function setStatus(msg, isErr) {
    statusEl.textContent = msg; statusEl.hidden = !msg;
    statusEl.classList.toggle('is-error', !!isErr);
  }
  function setState(next) {
    authState.authenticated = next.authenticated === true;
    authState.role = authState.authenticated ? next.role : null;
    authState.displayName = authState.authenticated ? next.displayName : '';
    authState.offline = next.offline === true;
    forceOpen = false;
    updateAuthUi();
    window.dispatchEvent(new CustomEvent('vx:authchange', { detail: snapshot() }));
  }

  var lastFocus = null;
  function showLogin() {
    if (dialog.hidden) lastFocus = document.activeElement;
    password.value = ''; password.type = 'password';
    forceOpen = true; updateAuthUi();
    setStatus('Mode Demo · Kata sandi demo: pakcikiniv2', false);
    setTimeout(function () { password.focus(); }, 30);
  }
  function closeLogin() {
    if (dialog.hidden) return;
    forceOpen = false; password.value = ''; updateAuthUi();
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  backBtn.addEventListener('click', closeLogin);
  closeBtn.addEventListener('click', closeLogin);
  dialog.addEventListener('mousedown', function (e) { if (e.target === dialog) closeLogin(); });
  eye.addEventListener('click', function () {
    var vis = password.type === 'password';
    password.type = vis ? 'text' : 'password';
    eye.setAttribute('aria-pressed', String(vis));
    password.focus();
  });
  adminForm.addEventListener('submit', function (e) {
    e.preventDefault();
    if (password.value !== demoAdminPassword) {
      password.value = ''; setStatus('Kata sandi demo salah. Gunakan: pakcikiniv2', true);
      password.focus(); return;
    }
    password.value = '';
    try { window.sessionStorage.setItem(demoSessionKey, 'admin'); } catch (_) {}
    setState({ authenticated: true, role: 'admin', displayName: 'Admin Demo', offline: true });
    location.hash = '#dashboard';
  });

  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('[data-vx-admin-login]');
    if (!btn) return;
    e.preventDefault();
    if (authState.authenticated && authState.role === 'admin') location.hash = '#dashboard';
    else showLogin();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !dialog.hidden) closeLogin(); });

  var savedRole = null;
  try { savedRole = window.sessionStorage.getItem(demoSessionKey); } catch (_) {}
  authState.authenticated = true;
  authState.role = savedRole === 'admin' ? 'admin' : 'guest';
  authState.displayName = savedRole === 'admin' ? 'Admin Demo' : '';
  authState.offline = true;
  updateAuthUi();

  window.VXAuth = {
    ready: Promise.resolve(snapshot()),
    state: snapshot,
    request: request,
    track: function () { return Promise.resolve(null); },
    showLogin: showLogin,
    expire: function () {
      try { window.sessionStorage.removeItem(demoSessionKey); } catch (_) {}
      setState({ authenticated: true, role: 'guest', displayName: '', offline: true });
      showLogin();
    },
    url: function (p) { return apiBase + '/api/' + p; }
  };

  /* ---------- 4. Dashboard View Controller & Live Telemetry ---------- */
  var $ = function (id) { return document.getElementById(id); };
  var B = document.body;
  var page = $('dashboard'), bar = $('dsbn'), lens = $('dsbl');
  var dashEl = page && page.querySelector('.dash');
  if (!page || !dashEl) return;

  var locked = make('section', 'dashboard-locked');
  locked.hidden = true;
  locked.innerHTML =
    '<div class="dashboard-locked__card">' +
      '<span class="dashboard-locked__icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="10" width="16" height="11" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg></span>' +
      '<span class="eyebrow">Akses Terbatas</span>' +
      '<h1>Dashboard Khusus Admin</h1>' +
      '<p>Panel telemetri sensor simulasi, grafik 60 detik, dan diagnostik prototipe hanya dapat dibuka menggunakan akses Administrator.</p>' +
      '<div class="dashboard-locked__actions">' +
        '<button class="c-btn c-btn--primary" type="button" data-vx-admin-login>Login Admin</button>' +
        '<a class="c-btn c-btn--outline" href="#beranda">Kembali ke Beranda</a>' +
      '</div>' +
      '<small class="dashboard-locked__hint">Mode Demo · Kata sandi: <code>pakcikiniv2</code></small>' +
    '</div>';
  page.insertBefore(locked, dashEl);

  var VIEWS = {
    ringkasan: ['Ringkasan', 'sekilas', 'Kondisi prototipe saat ini: sensor, tren, dan peringatan. Diperbarui setiap detik.'],
    sensor: ['Sensor', 'langsung', 'Debit air, tegangan baterai, RPM poros utama, dan RPM generator lengkap dengan log kejadian.'],
    grafik: ['Grafik', 'pemantauan', 'Tren sensor 60 detik terakhir. Arahkan kursor ke grafik untuk melihat nilainya.'],
    riwayat: ['Riwayat', 'kunjungan', 'Catatan akses halaman pada mode demo.']
  };
  var btns = bar ? [].slice.call(bar.querySelectorAll('button[data-v]')) : [];
  function filterPane() {
    var v = dashEl.dataset.pane || 'ringkasan';
    [].forEach.call(dashEl.querySelectorAll('[data-sec]'), function (el) { el.hidden = el.dataset.sec.split(' ').indexOf(v) < 0; });
    [].forEach.call(dashEl.querySelectorAll('.drow'), function (row) {
      var n = 0; [].forEach.call(row.children, function (c) { if (!c.hidden) n++; });
      row.dataset.n = n; row.hidden = n === 0;
    });
  }
  function placeLens() {
    if (!bar || !lens) return;
    var a = bar.querySelector('[aria-current]');
    if (!a || !a.offsetWidth) return;
    lens.style.width = a.offsetWidth + 'px'; lens.style.height = a.offsetHeight + 'px';
    lens.style.transform = 'translate(' + a.offsetLeft + 'px,' + a.offsetTop + 'px)';
    lens.classList.add('on');
  }
  function showPane(v) {
    if (!VIEWS[v]) v = 'ringkasan';
    dashEl.dataset.pane = v;
    btns.forEach(function (b) { if (b.dataset.v === v) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    var t = VIEWS[v];
    if ($('dtitle')) { $('dtitle').innerHTML = t[0] + ' <em>' + t[1] + '</em>'; }
    if ($('dsub')) $('dsub').textContent = t[2];
    if ($('dcrumb')) $('dcrumb').textContent = t[0];
    filterPane(); placeLens();
  }
  if (bar) bar.addEventListener('click', function (e) { var b = e.target.closest('button[data-v]'); if (b) showPane(b.dataset.v); });
  if ($('dlogout')) $('dlogout').addEventListener('click', function () { logoutBtn.click(); });
  window.addEventListener('resize', placeLens);
  showPane('ringkasan');

  /* Telemetry Analyzer & Chart */
  var K = ['debit', 'vbat', 'rpmShaft', 'rpmGen'], D = {}, N = 60, hist = {}, run = true, timer = null, tab = 'debit', initialized = false, cardLv = {}, act = {}, cnt = {};
  K.forEach(function (k) { hist[k] = []; });
  var fmt = { debit: 2, vbat: 2, rpmShaft: 0, rpmGen: 0 };
  var CC = { debit: '#00A8E8', vbat: '#F59E0B', rpmShaft: '#8B5CF6', rpmGen: '#10B981' };
  var CU = { debit: 'L/s', vbat: 'V', rpmShaft: 'RPM', rpmGen: 'RPM' };
  var LVN = ['NORMAL', 'WASPADA', 'BAHAYA'], LVC = ['o', 'w', 'd'], hovX = null;

  function logEvt(m, c) {
    var ul = $('dlog'); if (!ul) return;
    var li = document.createElement('li'); li.className = c || '';
    li.innerHTML = '<time>' + new Date().toLocaleTimeString('id-ID') + '</time><span>' + m + '</span>';
    ul.insertBefore(li, ul.firstChild);
    while (ul.children.length > 35) ul.lastChild.remove();
  }
  function spark(k) {
    var a = hist[k], mn = Math.min.apply(0, a), mx = Math.max.apply(0, a), r = mx - mn || 1;
    return a.map(function (v, i) { return (i / (N - 1) * 100).toFixed(1) + ',' + (30 - (v - mn) / r * 26).toFixed(1); }).join(' ');
  }
  function smooth(p) {
    if (p.length < 2) return '';
    var d = 'M' + p[0][0].toFixed(1) + ',' + p[0][1].toFixed(1);
    for (var i = 0; i < p.length - 1; i++) {
      var p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p2, t = 0.2;
      d += 'C' + (p1[0] + (p2[0] - p0[0]) * t).toFixed(1) + ',' + (p1[1] + (p2[1] - p0[1]) * t).toFixed(1) + ' ' +
           (p2[0] - (p3[0] - p1[0]) * t).toFixed(1) + ',' + (p2[1] - (p3[1] - p1[1]) * t).toFixed(1) + ' ' +
           p2[0].toFixed(1) + ',' + p2[1].toFixed(1);
    }
    return d;
  }
  function chart() {
    var a = hist[tab], dch = $('dch'); if (!a || !a.length || !dch) return;
    var W = 600, Hh = 250, L = 50, R = 16, T = 16, Bm = 30, col = CC[tab], dec = (tab === 'debit' || tab === 'vbat') ? 2 : 0;
    var mn = Math.min.apply(0, a), mx = Math.max.apply(0, a), pad = (mx - mn || 1) * 0.3;
    mn = Math.max(0, mn - pad); mx += pad;
    var X = function (i) { return L + i / (N - 1) * (W - L - R); };
    var Y = function (v) { return T + (1 - (v - mn) / (mx - mn)) * (Hh - T - Bm); };
    var base = Hh - Bm, g = '', pts = a.map(function (v, j) { return [X(j + N - a.length), Y(v)]; }), ln = smooth(pts);
    for (var i = 0; i <= 4; i++) {
      var yy = T + i * (Hh - T - Bm) / 4, val = mx - i * (mx - mn) / 4;
      g += '<line class="gl" x1="' + L + '" x2="' + (W - R) + '" y1="' + yy.toFixed(1) + '" y2="' + yy.toFixed(1) + '"/><text x="' + (L - 8) + '" y="' + (yy + 4).toFixed(1) + '" text-anchor="end">' + val.toFixed(dec) + '</text>';
    }
    [['-60 dtk', 0, 'start'], ['-40', (N - 1) / 3, 'middle'], ['-20', (N - 1) * 2 / 3, 'middle'], ['sekarang', N - 1, 'end']].forEach(function (t) {
      g += '<text x="' + X(t[1]).toFixed(1) + '" y="' + (Hh - 8) + '" text-anchor="' + t[2] + '">' + t[0] + '</text>';
    });
    var hv = '';
    if (hovX != null) {
      var k = 0, dd = 1e9;
      pts.forEach(function (q, j) { var e = Math.abs(q[0] - hovX); if (e < dd) { dd = e; k = j; } });
      var hx = pts[k][0], hy = pts[k][1], ago = a.length - 1 - k, tw = 114, tx = Math.max(L, Math.min(W - R - tw, hx - tw / 2)), ty = hy > T + 64 ? hy - 56 : hy + 14;
      hv = '<line class="cl" x1="' + hx.toFixed(1) + '" x2="' + hx.toFixed(1) + '" y1="' + T + '" y2="' + base + '"/><circle cx="' + hx.toFixed(1) + '" cy="' + hy.toFixed(1) + '" r="5" fill="#fff" stroke="' + col + '" stroke-width="2.4"/><g class="tt"><rect x="' + tx.toFixed(1) + '" y="' + ty.toFixed(1) + '" width="' + tw + '" height="42" rx="10"/><text class="t1" x="' + (tx + 10).toFixed(1) + '" y="' + (ty + 18).toFixed(1) + '">' + a[k].toFixed(dec) + ' ' + CU[tab] + '</text><text class="t2" x="' + (tx + 10).toFixed(1) + '" y="' + (ty + 34).toFixed(1) + '">' + (ago ? ago + ' dtk lalu' : 'sekarang') + '</text></g>';
    }
    var xe = pts[pts.length - 1][0], ye = pts[pts.length - 1][1], xs = pts[0][0];
    dch.innerHTML = '<defs><linearGradient id="dg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + col + '" stop-opacity=".35"/><stop offset="1" stop-color="' + col + '" stop-opacity="0"/></linearGradient></defs>' + g +
      '<path d="' + ln + 'L' + xe.toFixed(1) + ',' + base + 'L' + xs.toFixed(1) + ',' + base + 'Z" fill="url(#dg)"/>' +
      '<path d="' + ln + '" fill="none" stroke="' + col + '" stroke-width="2.6" stroke-linecap="round"/>' +
      '<circle cx="' + xe.toFixed(1) + '" cy="' + ye.toFixed(1) + '" r="4.5" fill="#fff" stroke="' + col + '" stroke-width="2.4"/>' + hv;
  }
  var dchEl = $('dch');
  if (dchEl) {
    dchEl.addEventListener('pointermove', function (e) { var r = dchEl.getBoundingClientRect(); hovX = (e.clientX - r.left) / r.width * 600; chart(); });
    dchEl.addEventListener('pointerleave', function () { hovX = null; chart(); });
  }
  function stepDash() {
    if (!run || authState.role !== 'admin') return;
    if ($('dclk')) $('dclk').textContent = new Date().toLocaleTimeString('id-ID');
    var o = window.VXSim.read();
    K.forEach(function (k) { D[k] = o[k] || 0; hist[k].push(D[k]); if (hist[k].length > N) hist[k].shift(); });
    K.forEach(function (k) {
      var c = document.querySelector('[data-c="' + k + '"]');
      if (c) { c.querySelector('b span').textContent = D[k].toFixed(fmt[k]); c.querySelector('polyline').setAttribute('points', spark(k)); }
    });
    if ($('grpm')) $('grpm').style.strokeDashoffset = 75 - Math.min(1, D.rpmShaft / 400) * 75;
    if ($('grpmt')) $('grpmt').textContent = Math.round(D.rpmShaft);
    if ($('geff')) $('geff').style.strokeDashoffset = 75 - Math.min(1, D.rpmGen / 900) * 75;
    if ($('geft')) $('geft').textContent = Math.round(D.rpmGen);
    var st = $('dst');
    if (st) { st.classList.remove('off'); st.classList.add('ok'); st.lastChild.textContent = 'LIVE · SIMULASI · NORMAL'; }
    chart();
  }
  function initDash() {
    if (initialized) return;
    initialized = true;
    var seed = window.VXSim.history();
    if (!seed.length) seed = [window.VXSim.read()];
    seed.forEach(function (r) { K.forEach(function (k) { hist[k].push(r[k] || 0); }); });
    logEvt('Dashboard terhubung ke mesin simulasi prototipe', 'o');
    if ($('dpause')) {
      $('dpause').onclick = function () {
        run = !run; this.textContent = run ? 'Jeda' : 'Lanjut';
        if (!run && $('dst')) { $('dst').classList.add('off'); $('dst').lastChild.textContent = 'DIJEDA'; }
      };
    }
    if ($('dtabs')) {
      $('dtabs').onclick = function (e) {
        var b = e.target.closest('button'); if (!b) return;
        tab = b.dataset.k;
        this.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        chart();
      };
    }
    if ($('dwho')) $('dwho').textContent = authState.displayName || 'Admin';
    if ($('dav')) $('dav').textContent = (authState.displayName || 'A').charAt(0).toUpperCase();
  }

  function syncDashboardRoute() {
    var isDashHash = location.hash === '#dashboard';
    var isAdmin = authState.authenticated && authState.role === 'admin';
    var siteMain = $('site-main');
    page.hidden = !isDashHash;
    if (siteMain) siteMain.hidden = isDashHash;
    var footer = document.querySelector('.footer');
    if (footer) footer.hidden = isDashHash;

    if (isDashHash) {
      locked.hidden = isAdmin;
      dashEl.hidden = !isAdmin;
      B.classList.toggle('is-dash', isAdmin);
      if (isAdmin) {
        initDash();
        if (!timer) { timer = setInterval(stepDash, 1000); stepDash(); }
        requestAnimationFrame(placeLens);
      }
      window.scrollTo(0, 0);
    } else {
      B.classList.remove('is-dash');
      if (timer) { clearInterval(timer); timer = null; }
    }
  }

  window.addEventListener('hashchange', syncDashboardRoute);
  window.addEventListener('vx:authchange', syncDashboardRoute);
  syncDashboardRoute();
})();
