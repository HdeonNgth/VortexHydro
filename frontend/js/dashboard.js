/* ==========================================================================
   Vortex Hydro — Unified Admin Auth (Supabase Auth + Backend Role Verify),
   Dashboard V35 Telemetry + Integrated Admin AI Chat Monitor
   ========================================================================== */
(function () {
  'use strict';

  var SUPA_URL = 'https://gzzwjmcedymcdazckgbc.supabase.co';
  var PUB_KEY = 'sb_publishable_7jdLcpH7rK8GX1uxN8dSxw_9utM-GG9';
  var ADMIN_API = SUPA_URL + '/functions/v1/admin-ai-monitor';
  var SESSION_KEY = 'vx_admin_monitor_session';

  /* ---------- 1. Real Sensor Telemetry State (Tanpa Simulasi / Tanpa Angka Acak) ---------- */
  var liveData = { debit: 0, vbat: 0, rpmShaft: 0, rpmGen: 0, daya: 0, ts: 0, online: false };

  /* ---------- 2. Unified Backend-Verified Admin Auth (Supabase Auth + Role Check) ---------- */
  var authState = { authenticated: false, role: 'guest', email: '', displayName: '', session: null };
  var forceOpen = false;
  var svgNs = 'http://www.w3.org/2000/svg';

  function make(tag, cls, text) {
    var el = document.createElement(tag);
    if (cls) el.className = cls;
    if (text !== undefined) el.textContent = text;
    return el;
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fmtTime(iso) {
    if (!iso) return '-';
    try { return new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }); } catch (e) { return iso; }
  }

  function readAdminSession() {
    try {
      var raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      var s = JSON.parse(raw);
      return s && s.access_token ? s : null;
    } catch (e) { return null; }
  }
  function saveAdminSession(d) {
    var s = {
      access_token: d.access_token,
      refresh_token: d.refresh_token || '',
      expires_at: d.expires_at || (Math.floor(Date.now() / 1000) + (d.expires_in || 3600)),
      user: { id: d.user.id, email: d.user.email || '' }
    };
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch (e) {}
    return s;
  }
  function wipeAdminSession(revokeToken) {
    try { sessionStorage.removeItem(SESSION_KEY); sessionStorage.removeItem('vx-demo-role-v2'); } catch (e) {}
    if (revokeToken) {
      fetch(SUPA_URL + '/auth/v1/logout', {
        method: 'POST',
        headers: { apikey: PUB_KEY, Authorization: 'Bearer ' + revokeToken }
      }).catch(function () {});
    }
  }

  function getValidAdminJwt() {
    var s = authState.session || readAdminSession();
    if (!s) return Promise.resolve(null);
    var now = Math.floor(Date.now() / 1000);
    if (s.expires_at && s.expires_at - now > 45) return Promise.resolve(s.access_token);
    if (!s.refresh_token) return Promise.resolve(null);
    return fetch(SUPA_URL + '/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: PUB_KEY },
      body: JSON.stringify({ refresh_token: s.refresh_token })
    }).then(function (r) { return r.ok ? r.json() : Promise.reject(); })
      .then(function (d) { authState.session = saveAdminSession(d); return authState.session.access_token; })
      .catch(function () { wipeAdminSession(); return null; });
  }

  function adminApi(payload, explicitJwt) {
    var tokenP = explicitJwt ? Promise.resolve(explicitJwt) : getValidAdminJwt();
    return tokenP.then(function (jwt) {
      if (!jwt) { var ue = new Error('unauthorized'); ue.status = 401; throw ue; }
      return fetch(ADMIN_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: PUB_KEY, Authorization: 'Bearer ' + jwt },
        body: JSON.stringify(payload)
      }).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (d) {
          if (!r.ok) { var e = new Error(d.error || 'error'); e.status = r.status; throw e; }
          return d;
        });
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

  /* Unified Admin Login Modal (Email + Password, verified via Supabase Auth + admin-ai-monitor) */
  var dialog = make('section', 'vx-auth');
  dialog.id = 'vx-auth'; dialog.hidden = true;
  dialog.setAttribute('role', 'dialog'); dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-labelledby', 'vx-auth-admin-title');

  var card = make('div', 'vx-auth__card');
  var closeBtn = make('button', 'vx-auth__close', '');
  closeBtn.type = 'button'; closeBtn.setAttribute('aria-label', 'Tutup');
  closeBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  card.appendChild(closeBtn);

  var adminForm = make('form', 'vx-auth__pane');
  var headRow = make('div', 'vx-auth__head');
  var badge = make('span', 'vx-auth__badge'); badge.appendChild(makeIcon('lock'));
  headRow.appendChild(badge);
  var htxt = make('div', 'vx-auth__htxt');
  var adminTitle = make('h2', '', 'Login Administrator'); adminTitle.id = 'vx-auth-admin-title';
  htxt.appendChild(adminTitle);
  htxt.appendChild(make('p', 'vx-auth__sub', 'Masuk dengan akun Administrator terverifikasi untuk membuka Dashboard & Riwayat Chat AI.'));
  headRow.appendChild(htxt);
  adminForm.appendChild(headRow);

  var statusEl = make('p', 'vx-auth__flash', '');
  statusEl.setAttribute('role', 'status'); statusEl.setAttribute('aria-live', 'polite');
  statusEl.hidden = true;
  adminForm.appendChild(statusEl);

  var emailField = make('div', 'vx-auth__field');
  var emailLbl = make('label', 'vx-auth__label', 'Email Administrator'); emailLbl.htmlFor = 'vx-auth-email';
  var emailInput = make('input', 'vx-auth__input');
  emailInput.id = 'vx-auth-email'; emailInput.type = 'email'; emailInput.required = true;
  emailInput.autocomplete = 'email'; emailInput.placeholder = 'admin@vortexhydro.app';
  emailField.appendChild(emailLbl); emailField.appendChild(emailInput);
  adminForm.appendChild(emailField);

  var passField = make('div', 'vx-auth__field');
  passField.style.marginTop = '12px';
  var passLbl = make('label', 'vx-auth__label', 'Kata sandi'); passLbl.htmlFor = 'vx-auth-pass';
  var wrap = make('div', 'vx-auth__input-wrap');
  var password = make('input', 'vx-auth__input');
  password.id = 'vx-auth-pass'; password.type = 'password'; password.required = true;
  password.autocomplete = 'current-password'; password.placeholder = 'Masukkan kata sandi admin';
  var eye = make('button', 'vx-auth__eye', '');
  eye.type = 'button'; eye.setAttribute('aria-label', 'Tampilkan kata sandi'); eye.setAttribute('aria-pressed', 'false');
  eye.appendChild(makeIcon('eye'));
  wrap.appendChild(password); wrap.appendChild(eye);
  passField.appendChild(passLbl); passField.appendChild(wrap);
  adminForm.appendChild(passField);

  var actions = make('div', 'vx-auth__actions');
  var backBtn = make('button', 'vx-auth__button vx-auth__button--ghost', 'Batal'); backBtn.type = 'button';
  var adminSubmit = make('button', 'vx-auth__button vx-auth__button--primary', 'Verifikasi & Masuk'); adminSubmit.type = 'submit';
  actions.appendChild(backBtn); actions.appendChild(adminSubmit);
  adminForm.appendChild(actions);
  card.appendChild(adminForm); dialog.appendChild(card); document.body.appendChild(dialog);

  function snapshot() {
    return { authenticated: authState.authenticated, role: authState.role, email: authState.email, displayName: authState.displayName };
  }
  function syncAdminNavVisibility() {
    var isAdmin = authState.authenticated && authState.role === 'admin';
    document.body.classList.toggle('is-admin', isAdmin);
    document.querySelectorAll('[data-admin-only]').forEach(function (el) {
      el.hidden = !isAdmin;
    });
    // Recalculate Liquid Glass navbar lens cleanly
    window.dispatchEvent(new Event('resize'));
  }
  function updateAuthUi() {
    dialog.hidden = !forceOpen;
    document.body.classList.toggle('vx-auth-open', !dialog.hidden);
    syncAdminNavVisibility();
  }
  function setStatus(msg, isErr) {
    statusEl.textContent = msg || '';
    statusEl.hidden = !msg;
    statusEl.classList.toggle('is-error', !!isErr);
  }
  function setState(next) {
    authState.authenticated = next.authenticated === true;
    authState.role = authState.authenticated ? (next.role || 'guest') : 'guest';
    authState.email = authState.authenticated ? (next.email || '') : '';
    authState.displayName = authState.authenticated ? (next.displayName || '') : '';
    authState.session = authState.authenticated ? (next.session || null) : null;
    forceOpen = false;
    updateAuthUi();
    window.dispatchEvent(new CustomEvent('vx:authchange', { detail: snapshot() }));
  }

  function performAdminLogout() {
    var tok = authState.session && authState.session.access_token;
    wipeAdminSession(tok);
    setState({ authenticated: false, role: 'guest', email: '', displayName: '', session: null });
    if (location.hash === '#dashboard') location.hash = '#beranda';
  }

  var lastFocus = null;
  function showLogin() {
    if (dialog.hidden) lastFocus = document.activeElement;
    password.value = ''; password.type = 'password';
    forceOpen = true; updateAuthUi();
    setStatus('', false);
    setTimeout(function () { (emailInput.value ? password : emailInput).focus(); }, 30);
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
    var em = emailInput.value.trim();
    var pw = password.value;
    if (!em || !pw) return;
    adminSubmit.disabled = true;
    adminSubmit.textContent = 'Memverifikasi…';
    setStatus('', false);

    fetch(SUPA_URL + '/auth/v1/token?grant_type=password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: PUB_KEY },
      body: JSON.stringify({ email: em, password: pw })
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) {
        if (!r.ok || !d.access_token) {
          throw new Error('Email atau kata sandi tidak valid.');
        }
        // Strictly verify role=admin on the backend Edge Function
        return adminApi({ action: 'verify' }, d.access_token).then(function (v) {
          var saved = saveAdminSession(d);
          password.value = '';
          var label = (v.admin && v.admin.email) || em;
          setState({ authenticated: true, role: 'admin', email: label, displayName: label.split('@')[0], session: saved });
          location.hash = '#dashboard';
        }, function (verErr) {
          // Non-admin user: immediately revoke session and keep Dashboard navbar hidden!
          wipeAdminSession(d.access_token);
          if (verErr && verErr.status === 403) {
            throw new Error('Akses ditolak (403): akun ini tidak memiliki hak akses Administrator.');
          }
          throw new Error('Gagal memverifikasi hak akses Administrator di server.');
        });
      });
    }).catch(function (err) {
      password.value = '';
      setStatus(err && err.message ? err.message : 'Autentikasi gagal.', true);
      password.focus();
    }).finally(function () {
      adminSubmit.disabled = false;
      adminSubmit.textContent = 'Verifikasi & Masuk';
    });
  });

  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('[data-vx-admin-login]');
    if (!btn) return;
    e.preventDefault();
    if (authState.authenticated && authState.role === 'admin') location.hash = '#dashboard';
    else showLogin();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !dialog.hidden) closeLogin(); });

  // Restore existing verified admin session on page reload (never trusts sessionStorage without backend verify!)
  var existingSess = readAdminSession();
  if (existingSess) {
    authState.session = existingSess;
    adminApi({ action: 'verify' }).then(function (v) {
      var label = (v.admin && v.admin.email) || existingSess.user.email || 'Admin';
      setState({ authenticated: true, role: 'admin', email: label, displayName: label.split('@')[0], session: authState.session });
    }).catch(function () {
      wipeAdminSession();
      setState({ authenticated: false, role: 'guest', email: '', displayName: '', session: null });
    });
  } else {
    syncAdminNavVisibility();
  }

  window.VXAuth = {
    state: snapshot,
    showLogin: showLogin,
    logout: performAdminLogout
  };

  /* ---------- 3. Dashboard V35 View Controller, Telemetry & Integrated AI Monitor ---------- */
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
      '<span class="eyebrow">Akses Khusus Administrator</span>' +
      '<h1>Dashboard &amp; AI Monitor</h1>' +
      '<p>Panel telemetri prototipe, laporan harian, dan pemantauan riwayat chat AI pengunjung dilindungi verifikasi hak akses Administrator di server.</p>' +
      '<div class="dashboard-locked__actions">' +
        '<button class="c-btn c-btn--navy" type="button" data-vx-admin-login>Login Administrator</button>' +
        '<a class="c-btn c-btn--outline" href="#beranda">Kembali ke Beranda</a>' +
      '</div>' +
    '</div>';
  page.insertBefore(locked, dashEl);

  var VIEWS = {
    ringkasan: ['Selamat Datang Kembali,', 'Admin Vortex', 'Pantau telemetri prototipe turbin pusaran, laporan harian, dan aktivitas Vortex Hydro AI secara terpadu.', 'Ringkasan'],
    sensor: ['Sensor', 'Langsung', 'Debit air, tegangan baterai, RPM poros utama, RPM generator, serta monitor langsung prototipe.', 'Sensor'],
    grafik: ['Grafik', '60 Detik', 'Tren sensor prototipe selama 60 detik terakhir. Arahkan kursor pada kurva untuk melihat nilai detail.', 'Grafik'],
    laporan: ['Laporan', '24 Jam Terakhir', 'Ringkasan singkat kejadian hari ini: aktivitas chat AI, deteksi percakapan tidak pantas, gangguan sistem, dan log admin.', 'Laporan Harian'],
    'ai-chat': ['Riwayat', 'Chat AI', 'Pantau seluruh percakapan pengunjung berdasarkan sesi, cari kata kunci, filter tanggal, atau bersihkan data lama.', 'Riwayat Chat AI'],
    audit: ['Audit Log', '& Pembersihan', 'Catatan transparansi aktivitas pemantauan dan moderasi Administrator beserta kontrol pembersihan log.', 'Audit Log']
  };

  var btns = bar ? [].slice.call(bar.querySelectorAll('button[data-v]')) : [];
  function filterPane() {
    var v = dashEl.dataset.pane || 'ringkasan';
    [].forEach.call(dashEl.querySelectorAll('[data-sec]'), function (el) {
      el.hidden = el.dataset.sec.split(' ').indexOf(v) < 0;
    });
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
    if ($('dtitle')) {
      var label = (v === 'ringkasan' && authState.displayName) ? authState.displayName : t[1];
      $('dtitle').innerHTML = esc(t[0]) + ' <em>' + esc(label) + '</em>';
    }
    if ($('dsub')) $('dsub').textContent = t[2];
    if ($('dcrumb')) $('dcrumb').textContent = t[3];
    filterPane();
    requestAnimationFrame(placeLens);
    if (authState.role === 'admin') {
      if (v === 'ai-chat') { loadAiStats(); loadAiList(); }
      else if (v === 'audit') { loadAiAudit(); }
      else if (v === 'laporan') { loadDailyReport(false); }
    }
  }
  if (bar) bar.addEventListener('click', function (e) { var b = e.target.closest('button[data-v]'); if (b) showPane(b.dataset.v); });
  if ($('dlogout')) $('dlogout').addEventListener('click', performAdminLogout);
  if ($('dopenAiBtn')) $('dopenAiBtn').addEventListener('click', function () { showPane('ai-chat'); });
  if ($('dopenRepBtn')) $('dopenRepBtn').addEventListener('click', function () { showPane('laporan'); });
  if ($('dkpiAi')) $('dkpiAi').addEventListener('click', function () { showPane('ai-chat'); });
  if ($('dviewAllAi')) $('dviewAllAi').addEventListener('click', function () { showPane('ai-chat'); });
  if ($('drepGoChat')) $('drepGoChat').addEventListener('click', function () { showPane('ai-chat'); });
  if ($('drepGoAudit')) $('drepGoAudit').addEventListener('click', function () { showPane('audit'); });
  if ($('dquickSearch')) {
    $('dquickSearch').addEventListener('submit', function (e) {
      e.preventDefault();
      var q = ($('dquickIn') && $('dquickIn').value || '').trim();
      if ($('aiQ')) $('aiQ').value = q;
      showPane('ai-chat');
    });
  }
  window.addEventListener('resize', placeLens);

  /* ---------- 4. Integrated Admin AI Monitor Controller ---------- */
  var aiSelectedId = null;

  function loadAiStats() {
    if (authState.role !== 'admin') return;
    adminApi({ action: 'stats' }).then(function (d) {
      var st = d.stats || {};
      if ($('dkpiAiCnt')) $('dkpiAiCnt').textContent = st.total_conversations || 0;
      if ($('dkpiAiSub')) $('dkpiAiSub').textContent = (st.total_sessions || 0) + ' sesi · ' + (st.total_messages || 0) + ' pesan';
      if ($('aiStSess')) $('aiStSess').textContent = st.total_sessions || 0;
      if ($('aiStConv')) $('aiStConv').textContent = st.total_conversations || 0;
      if ($('aiStTodayC')) $('aiStTodayC').textContent = (st.today_conversations || 0) + ' hari ini';
      if ($('aiStMsg')) $('aiStMsg').textContent = st.total_messages || 0;
      if ($('aiStSplit')) $('aiStSplit').textContent = (st.user_messages || 0) + ' pengguna · ' + (st.assistant_messages || 0) + ' AI';
      if ($('aiStAudit')) $('aiStAudit').textContent = st.audit_logs_count || 0;
      if ($('aiStTodayM')) $('aiStTodayM').textContent = (st.today_messages || 0) + ' pesan hari ini';
    }).catch(function () {});
  }

  function loadAiList(updateRecentOnly) {
    if (authState.role !== 'admin') return;
    var payload = updateRecentOnly ? { action: 'list', limit: 6 } : {
      action: 'list',
      q: ($('aiQ') && $('aiQ').value || '').trim(),
      session_id: ($('aiSessSel') && $('aiSessSel').value) || undefined,
      date_from: ($('aiFrom') && $('aiFrom').value) || undefined,
      date_to: ($('aiTo') && $('aiTo').value) || undefined,
      limit: 80
    };
    if (!updateRecentOnly && $('aiListMeta')) $('aiListMeta').textContent = 'Memuat percakapan…';
    adminApi(payload).then(function (d) {
      var convs = d.conversations || [];
      var sessions = d.sessions || [];

      // Update recent feed on Ringkasan right rail
      var rec = $('drecentAi');
      if (rec) {
        rec.innerHTML = convs.length ? convs.slice(0, 4).map(function (c) {
          return '<button type="button" class="drec-item" data-open-conv="' + esc(c.id) + '">' +
            '<strong>' + esc(c.title) + '</strong>' +
            '<small>' + esc(c.owner_label) + ' · ' + c.message_count + ' pesan</small>' +
          '</button>';
        }).join('') : '<p style="margin:0;font-size:.82rem;color:var(--muted)">Belum ada percakapan AI.</p>';
      }

      if (updateRecentOnly) return;

      // Populate session filter dropdown (preserve selection)
      var sel = $('aiSessSel');
      if (sel) {
        var cur = sel.value;
        sel.innerHTML = '<option value="">Semua Sesi (' + sessions.length + ')</option>' +
          sessions.map(function (s) {
            return '<option value="' + esc(s.id) + '">Sesi #' + esc(s.ref) + ' (' + s.conversation_count + ' chat)</option>';
          }).join('');
        sel.value = cur;
      }

      if ($('aiListMeta')) $('aiListMeta').textContent = 'Menampilkan ' + convs.length + ' dari ' + (d.total || 0) + ' percakapan';
      var listEl = $('aiConvList');
      if (!listEl) return;
      if (!convs.length) {
        listEl.innerHTML = '<div class="dc dai__empty">Tidak ada percakapan yang sesuai filter.</div>';
        return;
      }
      listEl.innerHTML = convs.map(function (c) {
        return '<button type="button" class="dai__item' + (c.id === aiSelectedId ? ' is-on' : '') + '" data-cid="' + esc(c.id) + '">' +
          '<div class="dai__itop"><span class="dai__owner">' + esc(c.owner_label) + '</span><span class="dai__cnt">' + c.message_count + ' pesan</span></div>' +
          '<strong>' + esc(c.title) + '</strong>' +
          '<p>' + esc(c.last_preview || '—') + '</p>' +
          '<time>' + esc(fmtTime(c.updated_at)) + '</time>' +
        '</button>';
      }).join('');
    }).catch(function () {
      if (!updateRecentOnly && $('aiListMeta')) $('aiListMeta').textContent = 'Gagal memuat percakapan.';
    });
  }

  function loadAiDetail(id) {
    if (authState.role !== 'admin' || !id) return;
    aiSelectedId = id;
    var listEl = $('aiConvList');
    if (listEl) listEl.querySelectorAll('.dai__item').forEach(function (b) { b.classList.toggle('is-on', b.getAttribute('data-cid') === id); });
    var pane = $('aiDetailPane');
    if (!pane) return;
    pane.innerHTML = '<div class="dai__empty">Memuat detail percakapan…</div>';

    adminApi({ action: 'detail', conversation_id: id }).then(function (d) {
      var c = d.conversation, msgs = d.messages || [];
      pane.innerHTML =
        '<div class="dai__dhead">' +
          '<div><h3>' + esc(c.title) + '</h3><small class="mono">' + esc(c.owner_label) + ' · ' + esc(fmtTime(c.created_at)) + '</small></div>' +
          '<div class="dai__dact">' +
            (c.session_id ? '<button type="button" class="dpill dai__danger" id="aiDelSess">Hapus Sesi</button>' : '') +
            '<button type="button" class="dpill dai__danger" id="aiDelConv">Hapus Chat</button>' +
          '</div>' +
        '</div>' +
        '<div class="dai__msgs">' +
          (msgs.length ? msgs.map(function (m) {
            var isU = m.role === 'user';
            return '<div class="dai__msg dai__msg--' + (isU ? 'u' : 'a') + '">' +
              '<div class="dai__mhd"><span>' + (isU ? 'PENGUNJUNG' : 'VOXXY AI' + (m.model ? ' · ' + esc(m.model) : '')) + '</span><time>' + esc(fmtTime(m.created_at)) + '</time></div>' +
              '<div>' + esc(m.content) + '</div>' +
            '</div>';
          }).join('') : '<div class="dai__empty">Belum ada pesan.</div>') +
        '</div>';

      var delConv = $('aiDelConv');
      if (delConv) delConv.addEventListener('click', function () {
        if (!confirm('Hapus percakapan "' + c.title + '" secara permanen?')) return;
        adminApi({ action: 'delete', conversation_id: id }).then(function () {
          aiSelectedId = null;
          pane.innerHTML = '<div class="dai__empty">Percakapan berhasil dihapus dan tercatat di audit log.</div>';
          loadAiStats(); loadAiList(false);
        });
      });

      var delSess = $('aiDelSess');
      if (delSess && c.session_id) delSess.addEventListener('click', function () {
        if (!confirm('Hapus SELURUH sesi #' + c.owner_ref + ' beserta semua percakapannya secara permanen?')) return;
        adminApi({ action: 'delete_session', session_id: c.session_id }).then(function () {
          aiSelectedId = null;
          pane.innerHTML = '<div class="dai__empty">Sesi pengunjung dan seluruh percakapannya berhasil dihapus.</div>';
          loadAiStats(); loadAiList(false);
        });
      });
    }).catch(function () {
      pane.innerHTML = '<div class="dai__empty">Gagal memuat detail percakapan.</div>';
    });
  }

  function loadAiAudit() {
    if (authState.role !== 'admin') return;
    var tbody = $('aiAuditBody'); if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="4" style="color:var(--muted)">Memuat…</td></tr>';
    adminApi({ action: 'audit_logs' }).then(function (d) {
      var rows = d.logs || [];
      if (!rows.length) { tbody.innerHTML = '<tr><td colspan="4" style="color:var(--muted)">Belum ada catatan audit.</td></tr>'; return; }
      tbody.innerHTML = rows.map(function (r) {
        return '<tr><td class="mono">' + esc(fmtTime(r.created_at)) + '</td><td>' + esc(r.admin_label) + '</td><td class="mono">' + esc(r.action) + '</td><td class="mono">' + esc(r.target_conversation_id ? r.target_conversation_id.slice(0, 8) + '…' : '—') + '</td></tr>';
      }).join('');
    }).catch(function () {
      tbody.innerHTML = '<tr><td colspan="4" style="color:var(--muted)">Gagal memuat audit log.</td></tr>';
    });
  }

  /* ---------- 4b. Dedicated 24-Hour Daily Report & Moderation Scanner ---------- */
  var lastDailyReport = null;
  var peakStats = { debit: 0, rpmGen: 0, daya: 0, cleanups: 0 };

  function renderTelemetrySummaryIntoReport() {
    var box = $('drepTelemetry');
    if (!box) return;
    box.innerHTML =
      '<div class="drep__kv"><span>Debit Puncak</span><b>' + Math.max(peakStats.debit, liveData.debit || 0).toFixed(2) + ' L/s</b></div>' +
      '<div class="drep__kv"><span>RPM Gen Puncak</span><b>' + Math.round(Math.max(peakStats.rpmGen, liveData.rpmGen || 0)) + ' RPM</b></div>' +
      '<div class="drep__kv"><span>Tegangan Baterai</span><b>' + (liveData.vbat || 0).toFixed(2) + ' V</b></div>' +
      '<div class="drep__kv"><span>Status Sensor</span><b>' + (liveData.online ? 'Terhubung' : 'Menunggu Data') + '</b></div>';
  }

  function renderDailyReport(rep) {
    lastDailyReport = rep;
    var s = rep.summary || {};
    var status = rep.status || 'aman';

    var badgeEl = $('drepStatusBadge');
    if (badgeEl) {
      badgeEl.className = 'drep__status is-' + status;
      badgeEl.textContent = status === 'waspada' ? 'WASPADA MODERASI' : (status === 'perhatian' ? 'PERLU PERHATIAN' : 'KONDISI AMAN');
    }
    var sidebarDot = $('dsbReportBadge');
    if (sidebarDot) {
      sidebarDot.hidden = !(s.flagged_count > 0 || s.error_messages_24h > 0);
      sidebarDot.className = 'dsb__badge' + (status === 'waspada' ? ' is-high' : '');
    }

    if ($('drepUpdated')) $('drepUpdated').textContent = 'Diperbarui ' + fmtTime(rep.generated_at);
    if ($('drepHeadline')) $('drepHeadline').textContent = rep.headline || 'Ringkasan 24 jam terakhir siap ditinjau.';
    if ($('drepSess')) $('drepSess').textContent = s.sessions_24h || 0;
    if ($('drepConv')) $('drepConv').textContent = s.conversations_24h || 0;
    if ($('drepMsgs')) $('drepMsgs').textContent = (s.messages_24h || 0) + ' pesan (' + (s.user_messages_24h || 0) + ' pengguna · ' + (s.ai_messages_24h || 0) + ' AI)';
    if ($('drepFlagged')) $('drepFlagged').textContent = s.flagged_count || 0;
    if ($('drepFlagSub')) $('drepFlagSub').textContent = (s.high_severity_count || 0) + ' prioritas tinggi';
    if ($('drepAudit')) $('drepAudit').textContent = s.audit_actions_24h || 0;
    if ($('drepSysSub')) $('drepSysSub').textContent = (s.error_messages_24h || 0) + ' gangguan respons AI';
    if ($('drepFlagPill')) $('drepFlagPill').textContent = (s.flagged_count || 0) + ' Temuan';

    var hlEl = $('drepHighlights');
    if (hlEl) {
      var listItems = (rep.highlights || []).slice();
      listItems.push('Telemetri Prototipe: Debit puncak ' + peakStats.debit.toFixed(2) + ' L/s · RPM generator puncak ' + Math.round(peakStats.rpmGen) + ' RPM.');
      hlEl.innerHTML = listItems.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('');
    }

    var flEl = $('drepFlagList');
    if (flEl) {
      var flags = rep.flagged_items || [];
      if (!flags.length) {
        flEl.innerHTML = '<div class="drep__safe"><strong>Semua Percakapan Aman</strong><p>Tidak ditemukan kata kasar, spam, upaya manipulasi AI, maupun gangguan respons selama 24 jam terakhir.</p></div>';
      } else {
        flEl.innerHTML = flags.map(function (f) {
          var sevCls = f.severity === 'tinggi' ? 'is-high' : 'is-med';
          var sevLbl = f.severity === 'tinggi' ? 'PRIORITAS TINGGI' : 'PRIORITAS SEDANG';
          return '<article class="drep__flag">' +
            '<div class="drep__flag-top">' +
              '<span class="drep__sev ' + sevCls + '">' + sevLbl + '</span>' +
              '<strong>' + esc(f.category) + '</strong>' +
              '<time class="mono">' + esc(fmtTime(f.created_at)) + '</time>' +
            '</div>' +
            '<p class="drep__flag-why">' + esc(f.reason) + '</p>' +
            '<blockquote class="drep__quote">“' + esc(f.excerpt) + '”</blockquote>' +
            '<div class="drep__flag-foot">' +
              '<span class="mono">' + esc(f.owner_label) + ' · ' + esc(f.conversation_title) + '</span>' +
              (f.conversation_id ? '<button type="button" class="dpill dpill--sm" data-open-conv="' + esc(f.conversation_id) + '">Tinjau Chat →</button>' : '') +
            '</div>' +
          '</article>';
        }).join('');
      }
    }

    var rcEl = $('drepRecentConvs');
    if (rcEl) {
      var rc = rep.recent_conversations || [];
      rcEl.innerHTML = rc.length ? rc.map(function (c) {
        return '<button type="button" class="drec-item' + (c.flagged ? ' is-flagged' : '') + '" data-open-conv="' + esc(c.id) + '">' +
          '<div class="drec-item__top"><strong>' + esc(c.title) + '</strong>' +
          '<span class="drec-tag ' + (c.flagged ? 'is-warn' : 'is-ok') + '">' + (c.flagged ? 'Perlu Tinjauan' : 'Aman') + '</span></div>' +
          '<small>' + esc(c.owner_label) + ' · ' + c.message_count + ' pesan · ' + esc(fmtTime(c.updated_at)) + '</small>' +
        '</button>';
      }).join('') : '<p style="margin:0;font-size:.82rem;color:var(--muted)">Belum ada percakapan AI dalam 24 jam terakhir.</p>';
    }

    renderTelemetrySummaryIntoReport();

    var audEl = $('drepAuditList');
    if (audEl) {
      var ra = rep.recent_audits || [];
      audEl.innerHTML = ra.length ? ra.map(function (a) {
        return '<li><time>' + esc(fmtTime(a.created_at)) + '</time><span><b>' + esc(a.action) + '</b> · ' + esc(a.admin_label) + '</span></li>';
      }).join('') : '<li><time>—</time><span>Belum ada aktivitas audit dalam 24 jam terakhir.</span></li>';
    }
  }

  function loadDailyReport(silentBadgeOnly) {
    if (authState.role !== 'admin') return;
    if (!silentBadgeOnly && $('drepUpdated')) $('drepUpdated').textContent = 'Memindai data 24 jam terakhir…';
    adminApi({ action: 'daily_report' }).then(function (d) {
      if (d && d.report) renderDailyReport(d.report);
    }).catch(function () {
      if (!silentBadgeOnly && $('drepHeadline')) {
        $('drepHeadline').textContent = 'Gagal memuat laporan 24 jam dari server. Silakan klik Segarkan Laporan.';
      }
    });
  }

  /* ---------- 4c. Log Cleanup Actions (Telemetry Log, Audit Log, & Old AI Chats) ---------- */
  function showAuditFlash(msg, isErr) {
    var el = $('aiAuditFlash');
    if (!el) return;
    el.textContent = msg || '';
    el.hidden = !msg;
    el.classList.toggle('is-err', !!isErr);
  }

  if ($('dlogClear')) {
    $('dlogClear').addEventListener('click', function () {
      var ul = $('dlog');
      if (!ul) return;
      ul.innerHTML = '';
      peakStats.cleanups++;
      logEvt('Log aktivitas prototipe dibersihkan oleh Admin', 'o');
    });
  }

  if ($('aiAuditClearBtn')) {
    $('aiAuditClearBtn').addEventListener('click', function () {
      if (authState.role !== 'admin') return;
      var scopeEl = $('aiAuditClearScope');
      var scope = scopeEl ? scopeEl.value : 'older_7d';
      var desc = scope === 'all' ? 'SELURUH catatan audit log' : (scope === 'older_30d' ? 'audit log lebih dari 30 hari' : 'audit log lebih dari 7 hari');
      if (!confirm('Bersihkan ' + desc + ' secara permanen?')) return;
      var btn = $('aiAuditClearBtn');
      btn.disabled = true;
      btn.textContent = 'Membersihkan…';
      showAuditFlash('', false);
      adminApi({ action: 'clear_audit_logs', scope: scope }).then(function (d) {
        showAuditFlash('Berhasil membersihkan ' + (d.deleted_count || 0) + ' baris audit log.', false);
        logEvt('Admin membersihkan ' + (d.deleted_count || 0) + ' baris audit log', 'o');
        loadAiAudit();
        loadAiStats();
        loadDailyReport(true);
      }).catch(function () {
        showAuditFlash('Gagal membersihkan audit log. Silakan coba lagi.', true);
      }).finally(function () {
        btn.disabled = false;
        btn.textContent = 'Bersihkan Log';
      });
    });
  }

  if ($('aiCleanupBtn')) {
    $('aiCleanupBtn').addEventListener('click', function () {
      if (authState.role !== 'admin') return;
      var scopeEl = $('aiCleanupScope');
      var scope = scopeEl ? scopeEl.value : 'older_7d';
      var labels = {
        older_1d: 'riwayat chat AI lebih dari 24 jam',
        older_7d: 'riwayat chat AI lebih dari 7 hari',
        older_30d: 'riwayat chat AI lebih dari 30 hari',
        all: 'SELURUH riwayat chat AI dan sesi pengunjung'
      };
      if (!confirm('Hapus ' + (labels[scope] || 'riwayat chat lama') + ' secara permanen?')) return;
      var btn = $('aiCleanupBtn');
      var msgEl = $('aiCleanupMsg');
      btn.disabled = true;
      btn.textContent = 'Membersihkan…';
      if (msgEl) msgEl.textContent = '';
      adminApi({ action: 'cleanup_chats', scope: scope }).then(function (d) {
        if (msgEl) msgEl.textContent = 'Berhasil membersihkan ' + (d.deleted_conversations || 0) + ' percakapan AI.';
        aiSelectedId = null;
        if ($('aiDetailPane')) $('aiDetailPane').innerHTML = '<div class="dai__empty">Pembersihan selesai. Pilih percakapan lain di sebelah kiri jika tersedia.</div>';
        logEvt('Admin membersihkan ' + (d.deleted_conversations || 0) + ' percakapan AI', 'o');
        loadAiStats();
        loadAiList(false);
        loadDailyReport(true);
      }).catch(function () {
        if (msgEl) msgEl.textContent = 'Gagal membersihkan riwayat chat.';
      }).finally(function () {
        btn.disabled = false;
        btn.textContent = 'Bersihkan Chat';
      });
    });
  }

  if ($('drepRefresh')) $('drepRefresh').addEventListener('click', function () { loadDailyReport(false); });
  if ($('drepCopy')) {
    $('drepCopy').addEventListener('click', function () {
      if (!lastDailyReport) return;
      var r = lastDailyReport;
      var lines = [
        'LAPORAN HARIAN VORTEX HYDRO (24 JAM TERAKHIR)',
        'Status: ' + String(r.status || 'aman').toUpperCase(),
        'Ringkasan: ' + (r.headline || '-'),
        '',
        'Poin Utama:'
      ].concat((r.highlights || []).map(function (h) { return '- ' + h; }));
      if (r.flagged_items && r.flagged_items.length) {
        lines.push('', 'Temuan Moderasi (' + r.flagged_items.length + '):');
        r.flagged_items.slice(0, 10).forEach(function (f) {
          lines.push('- [' + f.severity.toUpperCase() + '] ' + f.category + ' (' + f.owner_label + '): "' + f.excerpt + '"');
        });
      }
      var text = lines.join('\n');
      var btn = $('drepCopy');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          btn.textContent = 'Ringkasan Tersalin';
          setTimeout(function () { btn.textContent = 'Salin Ringkasan'; }, 1800);
        });
      }
    });
  }

  document.addEventListener('click', function (e) {
    var openBtn = e.target.closest && e.target.closest('#drepFlagList [data-open-conv], #drepRecentConvs [data-open-conv]');
    if (!openBtn) return;
    var cid = openBtn.getAttribute('data-open-conv');
    if (!cid) return;
    showPane('ai-chat');
    setTimeout(function () { loadAiDetail(cid); }, 90);
  });

  if ($('aiFilterForm')) $('aiFilterForm').addEventListener('submit', function (e) { e.preventDefault(); loadAiList(false); });
  if ($('aiSessSel')) $('aiSessSel').addEventListener('change', function () { loadAiList(false); });
  if ($('aiReset')) $('aiReset').addEventListener('click', function () {
    if ($('aiQ')) $('aiQ').value = '';
    if ($('aiSessSel')) $('aiSessSel').value = '';
    if ($('aiFrom')) $('aiFrom').value = '';
    if ($('aiTo')) $('aiTo').value = '';
    loadAiList(false);
  });
  if ($('aiRefresh')) $('aiRefresh').addEventListener('click', function () { loadAiStats(); loadAiList(false); });
  if ($('aiAuditRefresh')) $('aiAuditRefresh').addEventListener('click', loadAiAudit);
  if ($('aiConvList')) $('aiConvList').addEventListener('click', function (e) {
    var b = e.target.closest('[data-cid]');
    if (b) loadAiDetail(b.getAttribute('data-cid'));
  });
  if ($('drecentAi')) $('drecentAi').addEventListener('click', function (e) {
    var b = e.target.closest('[data-open-conv]');
    if (!b) return;
    var cid = b.getAttribute('data-open-conv');
    showPane('ai-chat');
    setTimeout(function () { loadAiDetail(cid); }, 80);
  });

  /* ---------- 5. Telemetry Analyzer & Chart ---------- */
  var K = ['debit', 'vbat', 'rpmShaft', 'rpmGen'], D = {}, N = 60, hist = {}, run = true, timer = null, tab = 'debit', initialized = false, hovX = null;
  K.forEach(function (k) { hist[k] = []; });
  var fmt = { debit: 2, vbat: 2, rpmShaft: 0, rpmGen: 0 };
  var CC = { debit: '#00A8E8', vbat: '#F59E0B', rpmShaft: '#8B5CF6', rpmGen: '#10B981' };
  var CU = { debit: 'L/s', vbat: 'V', rpmShaft: 'RPM', rpmGen: 'RPM' };

  function logEvt(m, c) {
    var ul = $('dlog'); if (!ul) return;
    var li = document.createElement('li'); li.className = c || '';
    li.innerHTML = '<time>' + new Date().toLocaleTimeString('id-ID') + '</time><span>' + esc(m) + '</span>';
    ul.insertBefore(li, ul.firstChild);
    while (ul.children.length > 20) ul.lastChild.remove();
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
    dch.innerHTML = '<defs><linearGradient id="dg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + col + '" stop-opacity=".32"/><stop offset="1" stop-color="' + col + '" stop-opacity="0"/></linearGradient></defs>' + g +
      '<path d="' + ln + 'L' + xe.toFixed(1) + ',' + base + 'L' + xs.toFixed(1) + ',' + base + 'Z" fill="url(#dg)"/>' +
      '<path d="' + ln + '" fill="none" stroke="' + col + '" stroke-width="2.6" stroke-linecap="round"/>' +
      '<circle cx="' + xe.toFixed(1) + '" cy="' + ye.toFixed(1) + '" r="4.5" fill="#fff" stroke="' + col + '" stroke-width="2.4"/>' + hv;
  }
  var dchEl = $('dch');
  if (dchEl) {
    dchEl.addEventListener('pointermove', function (e) { var r = dchEl.getBoundingClientRect(); hovX = (e.clientX - r.left) / r.width * 600; chart(); });
    dchEl.addEventListener('pointerleave', function () { hovX = null; chart(); });
  }
  function renderTelemetry(recordPoint) {
    if (!run || authState.role !== 'admin') return;
    if ($('dclk')) $('dclk').textContent = new Date().toLocaleTimeString('id-ID');
    K.forEach(function (k) {
      D[k] = Number(liveData[k]) || 0;
      if (recordPoint) {
        hist[k].push(D[k]);
        if (hist[k].length > N) hist[k].shift();
      }
    });
    K.forEach(function (k) {
      var c = document.querySelector('[data-c="' + k + '"]');
      if (c) {
        c.querySelector('b span').textContent = D[k].toFixed(fmt[k]);
        c.querySelector('polyline').setAttribute('points', hist[k].length > 1 ? spark(k) : '');
      }
    });
    if ($('dvDebit')) $('dvDebit').textContent = D.debit.toFixed(2);
    if ($('dvRpmg')) $('dvRpmg').textContent = Math.round(D.rpmGen);
    if ($('dvVbat')) $('dvVbat').textContent = D.vbat.toFixed(2);
    if ($('dvDaya')) $('dvDaya').textContent = (Number(liveData.daya) || 0).toFixed(2);
    if (D.debit > peakStats.debit) peakStats.debit = D.debit;
    if (D.rpmGen > peakStats.rpmGen) peakStats.rpmGen = D.rpmGen;
    if ((Number(liveData.daya) || 0) > peakStats.daya) peakStats.daya = Number(liveData.daya) || 0;
    if (dashEl.dataset.pane === 'laporan') renderTelemetrySummaryIntoReport();
    if ($('grpm')) $('grpm').style.strokeDashoffset = 75 - Math.min(1, D.rpmShaft / 400) * 75;
    if ($('grpmt')) $('grpmt').textContent = Math.round(D.rpmShaft);
    if ($('geff')) $('geff').style.strokeDashoffset = 75 - Math.min(1, D.rpmGen / 900) * 75;
    if ($('geft')) $('geft').textContent = Math.round(D.rpmGen);
    var st = $('dst');
    if (st) {
      if (liveData.online) { st.classList.remove('off'); st.classList.add('ok'); st.lastChild.textContent = 'LIVE · SENSOR'; }
      else { st.classList.remove('ok'); st.classList.add('off'); st.lastChild.textContent = 'MENUNGGU SENSOR'; }
    }
    if (hist[tab].length) chart();
    else if ($('dch')) $('dch').innerHTML = '';
  }

  /* API bersih untuk menyuntikkan pembacaan sensor asli (Water Flow, INA219, RPM NJK) */
  window.VXTelemetry = {
    read: function () { return Object.assign({}, liveData); },
    push: function (sample) {
      if (!sample || typeof sample !== 'object') return;
      liveData.debit = Number(sample.debit) || 0;
      liveData.vbat = Number(sample.vbat) || 0;
      liveData.rpmShaft = Number(sample.rpmShaft != null ? sample.rpmShaft : sample.rpm_shaft) || 0;
      liveData.rpmGen = Number(sample.rpmGen != null ? sample.rpmGen : sample.rpm_gen) || 0;
      liveData.daya = Number(sample.daya != null ? sample.daya : sample.gen_out_w) || 0;
      liveData.ts = Number(sample.ts) || Date.now();
      liveData.online = true;
      renderTelemetry(true);
    },
    clear: function () {
      liveData = { debit: 0, vbat: 0, rpmShaft: 0, rpmGen: 0, daya: 0, ts: 0, online: false };
      K.forEach(function (k) { hist[k] = []; });
      renderTelemetry(false);
    }
  };

  function initDash() {
    if ($('dwho')) $('dwho').textContent = authState.email || 'Admin';
    if ($('dav')) $('dav').setAttribute('title', 'Profil Administrator · ' + (authState.email || 'Admin Vortex'));
    if (!initialized) {
      initialized = true;
      logEvt('Dashboard Admin aktif · Menunggu data sensor asli', 'o');
      if ($('dpause')) {
        $('dpause').onclick = function () {
          run = !run; this.textContent = run ? 'Jeda' : 'Lanjut';
          if (!run && $('dst')) { $('dst').classList.add('off'); $('dst').lastChild.textContent = 'DIJEDA'; }
          else renderTelemetry(false);
        };
      }
      if ($('dtabs')) {
        $('dtabs').onclick = function (e) {
          var b = e.target.closest('button'); if (!b) return;
          tab = b.dataset.k;
          this.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
          if (hist[tab].length) chart();
        };
      }
    }
    loadAiStats();
    loadAiList(true);
    loadDailyReport(true);
    showPane(dashEl.dataset.pane || 'ringkasan');
  }

  function syncDashboardRoute() {
    var isDashHash = location.hash === '#dashboard';
    var isAdmin = authState.authenticated && authState.role === 'admin';
    if (isDashHash) {
      locked.hidden = isAdmin;
      dashEl.hidden = !isAdmin;
      B.classList.toggle('is-dash', isAdmin);
      if (isAdmin) {
        initDash();
        renderTelemetry(false);
        requestAnimationFrame(placeLens);
      }
    } else {
      B.classList.remove('is-dash');
      if (timer) { clearInterval(timer); timer = null; }
    }
  }

  window.addEventListener('hashchange', syncDashboardRoute);
  window.addEventListener('vx:authchange', syncDashboardRoute);
  syncDashboardRoute();
})();
