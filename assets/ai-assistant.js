/* ==========================================================================
   Vortex Hydro Private AI Assistant — Supabase Auth + RLS + Edge Function
   Zero service_role or Gemini API key in frontend. All history isolated per user.
   ========================================================================== */
window.VX_AI_CONFIG = {
  supabaseUrl: 'https://gzzwjmcedymcdazckgbc.supabase.co',
  endpoint: 'https://gzzwjmcedymcdazckgbc.supabase.co/functions/v1/chat-with-ai',
  publishableKey: 'sb_publishable_7jdLcpH7rK8GX1uxN8dSxw_9utM-GG9'
};

(function () {
  'use strict';
  var cfg = window.VX_AI_CONFIG;
  if (!cfg || !cfg.endpoint || !cfg.supabaseUrl) return;

  var AUTH_KEY = 'vx_auth_session';
  var CONV_KEY = 'vxai_conv';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  var store = (function () {
    var mem = {};
    return {
      get: function (k) { try { return localStorage.getItem(k); } catch (e) { return mem[k] || null; } },
      set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { mem[k] = v; } },
      del: function (k) { try { localStorage.removeItem(k); } catch (e) { delete mem[k]; } }
    };
  })();

  // Clean up any legacy anonymous token so old keys never linger
  store.del('vxai_token');

  /* ---------- Supabase Auth REST Helpers (Publishable Key Only) ---------- */
  function readSession() {
    var raw = store.get(AUTH_KEY);
    if (!raw) return null;
    try {
      var s = JSON.parse(raw);
      if (s && s.access_token && s.user && s.user.id) return s;
    } catch (e) {}
    return null;
  }

  function saveSession(data) {
    if (!data || !data.access_token || !data.user) return null;
    var s = {
      access_token: data.access_token,
      refresh_token: data.refresh_token || '',
      expires_at: data.expires_at || (Math.floor(Date.now() / 1000) + (data.expires_in || 3600)),
      user: { id: data.user.id, email: data.user.email || '' }
    };
    store.set(AUTH_KEY, JSON.stringify(s));
    return s;
  }

  function wipeSessionAndCache() {
    store.del(AUTH_KEY);
    store.del(CONV_KEY);
    store.del('vxai_token');
    try { sessionStorage.removeItem(AUTH_KEY); sessionStorage.removeItem(CONV_KEY); } catch (e) {}
  }

  function authRequest(path, body, bearer) {
    var headers = { 'Content-Type': 'application/json', 'apikey': cfg.publishableKey };
    if (bearer) headers.Authorization = 'Bearer ' + bearer;
    return fetch(cfg.supabaseUrl + '/auth/v1' + path, {
      method: 'POST',
      headers: headers,
      body: body ? JSON.stringify(body) : undefined
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) {
        if (!r.ok) {
          var msg = d.error_description || d.msg || d.message || d.error || 'Autentikasi gagal.';
          var err = new Error(msg);
          err.status = r.status;
          throw err;
        }
        return d;
      });
    });
  }

  function getValidAccessToken() {
    var s = readSession();
    if (!s) return Promise.resolve(null);
    var now = Math.floor(Date.now() / 1000);
    if (s.expires_at && s.expires_at - now > 45) return Promise.resolve(s.access_token);
    if (!s.refresh_token) { wipeSessionAndCache(); return Promise.resolve(null); }
    return authRequest('/token?grant_type=refresh_token', { refresh_token: s.refresh_token })
      .then(function (d) {
        var next = saveSession(d);
        return next ? next.access_token : null;
      })
      .catch(function () {
        wipeSessionAndCache();
        return null;
      });
  }

  /* ---------- Markdown Renderer ---------- */
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function inline(s) {
    var codes = [];
    s = s.replace(/`([^`\n]+)`/g, function (_, c) { codes.push('<code>' + c + '</code>'); return '\u0000' + (codes.length - 1) + '\u0000'; });
    s = s.replace(/\$\$?([^$\n]+?)\$\$?/g, function (_, c) {
      var clean = c.replace(/\\rightarrow/g, '→').replace(/\\times/g, '×').replace(/\\cdot/g, '·')
        .replace(/\^(\{[^}]+\}|[\w+-]+)/g, function (_, x) { return '<sup>' + x.replace(/^\{|\}$/g, '') + '</sup>'; })
        .replace(/_(\{[^}]+\}|\w+)/g, function (_, x) { return '<sub>' + x.replace(/^\{|\}$/g, '') + '</sub>'; });
      codes.push('<span class="vai-math">' + clean + '</span>');
      return '\u0000' + (codes.length - 1) + '\u0000';
    });
    s = s.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
         .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>')
         .replace(/\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    return s.replace(/\u0000(\d+)\u0000/g, function (_, i) { return codes[+i]; });
  }
  function md(src) {
    var text = esc(String(src).replace(/\r\n/g, '\n'));
    var blocks = [];
    text = text.replace(/```[^\n]*\n([\s\S]*?)```/g, function (_, c) { blocks.push('<pre><code>' + c.replace(/\n$/, '') + '</code></pre>'); return '\n\u0001' + (blocks.length - 1) + '\u0001\n'; });
    var lines = text.split('\n'), out = [], i = 0;
    function isRow(l) { return /^\s*\|.*\|\s*$/.test(l); }
    function isHr(l) { return /^\s*(?:---+|___+|\*\*\*+)\s*$/.test(l); }
    while (i < lines.length) {
      var l = lines[i], m;
      if ((m = l.match(/^\u0001(\d+)\u0001$/))) { out.push(blocks[+m[1]]); i++; continue; }
      if (!l.trim()) { i++; continue; }
      if (isHr(l)) { out.push('<hr class="vai-hr">'); i++; continue; }
      if ((m = l.match(/^(#{1,4})\s+(.*)$/))) { var h = Math.min(m[1].length + 2, 6); out.push('<h' + h + '>' + inline(m[2]) + '</h' + h + '>'); i++; continue; }
      if (isRow(l) && lines[i + 1] && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
        var cells = function (r) { return r.trim().replace(/^\||\|$/g, '').split('|').map(function (c) { return inline(c.trim()); }); };
        var html = '<div class="vai-tw"><table><thead><tr>' + cells(l).map(function (c) { return '<th>' + c + '</th>'; }).join('') + '</tr></thead><tbody>';
        i += 2;
        while (i < lines.length && isRow(lines[i])) { html += '<tr>' + cells(lines[i]).map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>'; i++; }
        out.push(html + '</tbody></table></div>'); continue;
      }
      if (/^\s*[-*]\s+/.test(l)) { var ul = '<ul>'; while (i < lines.length && /^\s*[-*]\s+/.test(lines[i]) && !isHr(lines[i])) { ul += '<li>' + inline(lines[i].replace(/^\s*[-*]\s+/, '')) + '</li>'; i++; } out.push(ul + '</ul>'); continue; }
      if (/^\s*\d+[.)]\s+/.test(l)) { var ol = '<ol>'; while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) { ol += '<li>' + inline(lines[i].replace(/^\s*\d+[.)]\s+/, '')) + '</li>'; i++; } out.push(ol + '</ol>'); continue; }
      var p = [];
      while (i < lines.length && lines[i].trim() && !isHr(lines[i]) && !/^(#{1,4}\s|\s*[-*]\s|\s*\d+[.)]\s|\u0001)/.test(lines[i]) && !isRow(lines[i])) { p.push(lines[i]); i++; }
      if (!p.length) { p.push(lines[i]); i++; }
      out.push('<p>' + inline(p.join('<br>')) + '</p>');
    }
    return out.join('');
  }

  /* ---------- UI Shell (Preserving Vortex Hydro AI Design + Minimalist Privacy Bar) ---------- */
  var ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>';
  var LOCK_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';
  var EDIT_ICON = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
  var LOGOUT_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>';

  var root = document.createElement('div');
  root.className = 'vai';
  root.innerHTML =
    '<button type="button" class="vai__fab" id="vaiFab" aria-label="Tanya Vortex AI" aria-expanded="false" aria-controls="vaiPanel">' +
      '<span class="vai__fab-ic">' + ICON + '</span><span class="vai__fab-lbl">Tanya AI</span>' +
    '</button>' +
    '<section class="vai__panel" id="vaiPanel" role="dialog" aria-label="Vortex Hydro AI Assistant" hidden>' +
      '<header class="vai__head"><span class="vai__logo">' + ICON + '</span><div class="vai__id"><b>Vortex Hydro AI</b><small><i class="vai__dot" id="vaiDot"></i><span id="vaiStatus">Online</span></small></div>' +
        '<button type="button" class="vai__ib" id="vaiHist" aria-label="Riwayat percakapan" title="Riwayat pribadi" hidden><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 7v5l3 2M3.5 12a8.5 8.5 0 1 0 2.6-6.1M3.5 4v4h4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
        '<button type="button" class="vai__ib" id="vaiNew" aria-label="Percakapan baru" title="Percakapan baru" hidden><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>' +
        '<button type="button" class="vai__ib" id="vaiLogout" aria-label="Keluar dari akun AI" title="Keluar" hidden>' + LOGOUT_ICON + '</button>' +
        '<button type="button" class="vai__ib" id="vaiClose" aria-label="Tutup panel" title="Tutup"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button></header>' +
      '<div class="vai__priv" title="Riwayat percakapan hanya dapat diakses oleh akun Anda.">' +
        '<span class="vai__priv-ic" aria-hidden="true">' + LOCK_ICON + '</span>' +
        '<span class="vai__priv-txt" id="vaiPrivTxt">Percakapan Anda bersifat pribadi.</span>' +
      '</div>' +
      '<div class="vai__body"><div class="vai__log" id="vaiLog" role="log" aria-live="polite"></div>' +
        '<aside class="vai__drawer" id="vaiDrawer" hidden>' +
          '<div class="vai__dh"><b>Riwayat Pribadi</b><button type="button" class="vai__ib" id="vaiDrawerClose" aria-label="Tutup riwayat"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button></div>' +
          '<ul id="vaiList"></ul>' +
          '<div class="vai__df"><button type="button" class="vai__delall" id="vaiDelAll">Hapus Semua Riwayat</button></div>' +
        '</aside></div>' +
      '<form class="vai__form" id="vaiForm"><label class="vai__sr" for="vaiInput">Pesan</label><textarea id="vaiInput" rows="1" maxlength="2000" placeholder="Tanya seputar Vortex Hydro…" autocomplete="off"></textarea>' +
        '<button type="submit" class="vai__send" id="vaiSend" aria-label="Kirim"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12l16-8-6 16-2.5-6.5L4 12z" fill="currentColor"/></svg></button></form>' +
      '<p class="vai__note">Privat &amp; terisolasi per akun · Didukung Gemini.</p>' +
    '</section>';
  document.body.appendChild(root);

  var $ = function (id) { return document.getElementById(id); };
  var fab = $('vaiFab'), panel = $('vaiPanel'), log = $('vaiLog'), input = $('vaiInput'), send = $('vaiSend'),
      drawer = $('vaiDrawer'), list = $('vaiList'), dot = $('vaiDot'), statusEl = $('vaiStatus'),
      histBtn = $('vaiHist'), newBtn = $('vaiNew'), logoutBtn = $('vaiLogout'), privTxt = $('vaiPrivTxt'),
      formEl = $('vaiForm'), delAllBtn = $('vaiDelAll');

  var state = { session: readSession(), conv: null, busy: false, loaded: false, authMode: 'login' };

  var ERR = {
    unauthorized: 'Sesi Anda telah berakhir. Silakan masuk kembali.',
    forbidden_user_mismatch: 'Akses ditolak: identitas akun tidak sesuai.',
    rate_limited: 'Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi.',
    ai_busy: 'AI sedang sibuk. Coba lagi beberapa detik lagi.',
    ai_failed: 'AI belum bisa menjawab saat ini. Silakan coba lagi.',
    not_configured: 'Asisten belum dikonfigurasi oleh pemilik situs.',
    message_too_long: 'Pesan terlalu panjang (maksimal 2000 karakter).',
    not_found: 'Percakapan tidak ditemukan atau bukan milik akun Anda.',
    server_error: 'Terjadi gangguan pada server. Coba lagi nanti.',
    network: 'Tidak dapat terhubung. Periksa koneksi internet Anda.'
  };

  function api(body) {
    return getValidAccessToken().then(function (jwt) {
      if (!jwt) {
        var ue = new Error('unauthorized'); ue.code = 'unauthorized'; throw ue;
      }
      var ctrl = window.AbortController ? new AbortController() : null;
      var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 40000);
      return fetch(cfg.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': cfg.publishableKey,
          'Authorization': 'Bearer ' + jwt
        },
        body: JSON.stringify(body),
        signal: ctrl ? ctrl.signal : undefined
      }).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (d) {
          if (!r.ok) {
            var e = new Error(d.error || 'server_error');
            e.code = d.error || 'server_error';
            e.conv = d.conversation_id;
            e.detail = d.detail;
            if (r.status === 401) { handleForcedLogout(); }
            throw e;
          }
          return d;
        });
      }, function () {
        var e = new Error('network'); e.code = 'network'; throw e;
      }).finally(function () { clearTimeout(timer); });
    });
  }

  function setStatus(s) {
    dot.className = 'vai__dot' + (s === 'busy' ? ' is-busy' : s === 'off' ? ' is-off' : '');
    statusEl.textContent = s === 'busy' ? 'Sedang berpikir…' : s === 'off' ? 'Perlu masuk' : 'Privat · Aktif';
  }
  function scroll() { log.scrollTop = log.scrollHeight; }

  function syncAuthControls() {
    var authed = !!(state.session && state.session.user);
    histBtn.hidden = !authed;
    newBtn.hidden = !authed;
    logoutBtn.hidden = !authed;
    formEl.hidden = !authed;
    if (authed) {
      var email = state.session.user.email || 'Akun Anda';
      privTxt.textContent = 'Privat · ' + email;
      setStatus(state.busy ? 'busy' : 'ok');
    } else {
      privTxt.textContent = 'Percakapan Anda bersifat pribadi.';
      setStatus('off');
    }
  }

  function renderAuthGate(flashMsg, isOk) {
    drawer.hidden = true;
    list.innerHTML = '';
    syncAuthControls();
    var isReg = state.authMode === 'signup';
    log.innerHTML =
      '<div class="vai__auth">' +
        '<span class="vai__badge">' + LOCK_ICON + '</span>' +
        '<h3>' + (isReg ? 'Buat Akun Privat' : 'Masuk ke Vortex Hydro AI') + '</h3>' +
        '<p>Riwayat percakapan dilindungi autentikasi &amp; Row Level Security sehingga hanya dapat diakses oleh akun Anda.</p>' +
        '<div class="vai__tabs">' +
          '<button type="button" data-am="login" class="' + (!isReg ? 'is-on' : '') + '">Masuk</button>' +
          '<button type="button" data-am="signup" class="' + (isReg ? 'is-on' : '') + '">Daftar</button>' +
        '</div>' +
        (flashMsg ? '<div class="vai__aflash' + (isOk ? ' is-ok' : '') + '">' + esc(flashMsg) + '</div>' : '') +
        '<form class="vai__aform" id="vaiAuthForm">' +
          '<input type="email" id="vaiEmail" required autocomplete="email" placeholder="Email Anda">' +
          '<input type="password" id="vaiPass" required minlength="6" autocomplete="' + (isReg ? 'new-password' : 'current-password') + '" placeholder="Kata sandi (min. 6 karakter)">' +
          '<button type="submit" id="vaiAuthSubmit">' + (isReg ? 'Daftar &amp; Mulai Chat' : 'Masuk') + '</button>' +
        '</form>' +
      '</div>';

    log.querySelectorAll('[data-am]').forEach(function (b) {
      b.addEventListener('click', function () {
        state.authMode = b.getAttribute('data-am');
        renderAuthGate();
      });
    });

    var af = $('vaiAuthForm');
    af.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = ($('vaiEmail').value || '').trim();
      var pass = $('vaiPass').value || '';
      var subBtn = $('vaiAuthSubmit');
      if (!email || pass.length < 6) return;
      subBtn.disabled = true;
      subBtn.textContent = isReg ? 'Mendaftar…' : 'Memverifikasi…';

      var req = isReg
        ? authRequest('/signup', { email: email, password: pass })
        : authRequest('/token?grant_type=password', { email: email, password: pass });

      req.then(function (d) {
        if (d.access_token && d.user) {
          state.session = saveSession(d);
          state.conv = null;
          store.del(CONV_KEY);
          syncAuthControls();
          welcome();
          setTimeout(function () { input.focus(); }, 60);
        } else if (isReg) {
          state.authMode = 'login';
          renderAuthGate('Akun dibuat! Cek kotak masuk email Anda untuk konfirmasi sebelum masuk.', true);
        } else {
          renderAuthGate('Gagal memuat sesi. Silakan coba lagi.');
        }
      }).catch(function (err) {
        renderAuthGate(err && err.message ? err.message : 'Email atau kata sandi tidak valid.');
      });
    });
  }

  function handleForcedLogout() {
    wipeSessionAndCache();
    state.session = null;
    state.conv = null;
    state.busy = false;
    log.innerHTML = '';
    list.innerHTML = '';
    drawer.hidden = true;
    renderAuthGate('Sesi Anda telah berakhir. Silakan masuk kembali.');
  }

  function performLogout() {
    var cur = readSession();
    // Immediately clear all client state & cache first
    wipeSessionAndCache();
    state.session = null;
    state.conv = null;
    state.busy = false;
    log.innerHTML = '';
    list.innerHTML = '';
    drawer.hidden = true;
    renderAuthGate('Anda telah keluar. Riwayat lokal dibersihkan.', true);
    if (cur && cur.access_token) {
      authRequest('/logout', null, cur.access_token).catch(function () {});
    }
  }

  function welcome() {
    syncAuthControls();
    log.innerHTML = '<div class="vai__empty"><span class="vai__badge">' + ICON + '</span><h3>Halo! Aku Vortex Hydro AI 🌊</h3>' +
      '<p>Partner cerdas proyek mikro-hidro Vortex Hydro UM ✨ Percakapan ini tersimpan privat khusus untuk akun Anda.</p>' +
      '<div class="vai__sug"></div></div>';
    var box = log.querySelector('.vai__sug');
    [
      '🌊 Bagaimana alur kerja Vortex Hydro secara singkat?',
      '⚙️ Apa fungsi transmisi pulley 1:4 di zona kering?',
      '⚡ Kenapa turbin pusaran cocok untuk head rendah?',
      '💡 Bagaimana rumus cepat hitung daya mikro-hidro?'
    ].forEach(function (q) {
      var b = document.createElement('button'); b.type = 'button'; b.textContent = q;
      b.addEventListener('click', function () { submit(q); }); box.appendChild(b);
    });
  }

  function addMsg(role, content) {
    var empty = log.querySelector('.vai__empty'); if (empty) log.innerHTML = '';
    var w = document.createElement('div'); w.className = 'vai__m vai__m--' + role;
    if (role === 'assistant') {
      w.innerHTML = '<span class="vai__av">' + ICON + '</span><div class="vai__bub"><div class="vai__txt"></div><button type="button" class="vai__copy" aria-label="Salin jawaban">Salin</button></div>';
      w.querySelector('.vai__txt').innerHTML = md(content);
      rebindCopy(w, content);
    } else {
      w.innerHTML = '<div class="vai__bub"><div class="vai__txt"></div></div>';
      w.querySelector('.vai__txt').textContent = content;
    }
    log.appendChild(w); scroll(); return w;
  }

  function rebindCopy(w, content) {
    var b = w.querySelector('.vai__copy'); if (!b) return;
    var n = b.cloneNode(true); b.replaceWith(n);
    n.addEventListener('click', function () {
      var done = function () { n.textContent = 'Tersalin'; setTimeout(function () { n.textContent = 'Salin'; }, 1500); };
      if (navigator.clipboard) navigator.clipboard.writeText(content).then(done, function () { n.textContent = 'Gagal'; });
    });
  }

  function typing() {
    var w = document.createElement('div'); w.className = 'vai__m vai__m--assistant';
    w.innerHTML = '<span class="vai__av">' + ICON + '</span><div class="vai__bub"><div class="vai__dots" aria-label="AI sedang mengetik"><i></i><i></i><i></i></div></div>';
    log.appendChild(w); scroll(); return w;
  }

  function showError(code, retryPayload, detail) {
    var w = document.createElement('div'); w.className = 'vai__err'; w.setAttribute('role', 'alert');
    w.innerHTML = '<span></span><button type="button">Coba lagi</button>';
    w.firstChild.textContent = (ERR[code] || ERR.server_error) + (detail ? ' (' + detail + ')' : '');
    w.querySelector('button').addEventListener('click', function () { w.remove(); if (retryPayload && retryPayload.text) submit(retryPayload.text, true); });
    log.appendChild(w); scroll();
  }

  function setBusy(b) { state.busy = b; send.disabled = b; panel.classList.toggle('is-busy', b); setStatus(b ? 'busy' : (state.session ? 'ok' : 'off')); }

  function submit(text, retry) {
    if (!state.session) return renderAuthGate();
    text = (text || '').trim();
    if (!text || state.busy) return;
    if (!retry) addMsg('user', text);
    setBusy(true);
    var tp = typing();
    api({ action: 'send', conversation_id: state.conv, message: text, retry: !!retry, context: { page: (location.hash || '#beranda').slice(1) } }).then(function (d) {
      state.conv = d.conversation_id; store.set(CONV_KEY, state.conv);
      tp.remove();
      addMsg('assistant', d.message.content);
    }).catch(function (e) {
      tp.remove();
      if (e.code === 'unauthorized') return;
      if (e.conv) { state.conv = e.conv; store.set(CONV_KEY, state.conv); }
      if (e.code === 'not_found') { state.conv = null; store.del(CONV_KEY); }
      showError(e.code, { text: text }, e.detail);
    }).finally(function () { setBusy(false); if (!panel.hidden && state.session) input.focus(); });
  }

  function loadConversation(id) {
    if (!state.session) return renderAuthGate();
    log.innerHTML = '<div class="vai__load">Memuat percakapan pribadi…</div>';
    return api({ action: 'history', conversation_id: id }).then(function (d) {
      state.conv = id; store.set(CONV_KEY, id);
      log.innerHTML = '';
      if (!d.messages || !d.messages.length) return welcome();
      d.messages.forEach(function (m) { addMsg(m.role, m.content); });
    }).catch(function (e) {
      if (e.code === 'unauthorized') return;
      if (e.code === 'not_found') { state.conv = null; store.del(CONV_KEY); welcome(); }
      else { log.innerHTML = ''; showError(e.code, { text: '' }); }
    });
  }

  function openDrawer() {
    if (!state.session) return;
    drawer.hidden = false; list.innerHTML = '<li class="vai__muted">Memuat…</li>';
    api({ action: 'list' }).then(function (d) {
      list.innerHTML = '';
      var convs = d.conversations || [];
      delAllBtn.disabled = convs.length === 0;
      if (!convs.length) { list.innerHTML = '<li class="vai__muted">Belum ada percakapan tersimpan.</li>'; return; }
      convs.forEach(function (c) {
        var li = document.createElement('li'); if (c.id === state.conv) li.className = 'is-on';
        var open = document.createElement('button'); open.type = 'button'; open.className = 'vai__open'; open.textContent = c.title;
        open.addEventListener('click', function () { if (state.busy) return; drawer.hidden = true; loadConversation(c.id); });
        var rn = document.createElement('button'); rn.type = 'button'; rn.className = 'vai__mini'; rn.setAttribute('aria-label', 'Ganti judul'); rn.innerHTML = EDIT_ICON;
        rn.addEventListener('click', function () {
          var t = prompt('Judul baru', c.title); if (t === null || !t.trim()) return;
          api({ action: 'rename', conversation_id: c.id, title: t.trim() }).then(function (r) { c.title = r.title; open.textContent = r.title; });
        });
        var del = document.createElement('button'); del.type = 'button'; del.className = 'vai__mini'; del.setAttribute('aria-label', 'Hapus percakapan'); del.textContent = '×';
        del.addEventListener('click', function () {
          if (!confirm('Hapus percakapan ini secara permanen?')) return;
          api({ action: 'delete', conversation_id: c.id }).then(function () {
            li.remove();
            if (c.id === state.conv) { state.conv = null; store.del(CONV_KEY); welcome(); }
            if (!list.children.length) { list.innerHTML = '<li class="vai__muted">Belum ada percakapan tersimpan.</li>'; delAllBtn.disabled = true; }
          });
        });
        li.appendChild(open); li.appendChild(rn); li.appendChild(del); list.appendChild(li);
      });
    }).catch(function (e) {
      if (e.code === 'unauthorized') return;
      list.innerHTML = '<li class="vai__muted">' + (ERR[e.code] || ERR.server_error) + '</li>';
    });
  }

  function bootAuthedView() {
    getValidAccessToken().then(function (jwt) {
      if (!jwt) {
        state.session = null;
        renderAuthGate();
        return;
      }
      state.session = readSession();
      syncAuthControls();
      var savedConv = store.get(CONV_KEY);
      if (savedConv) loadConversation(savedConv);
      else welcome();
    });
  }

  function openPanel() {
    panel.hidden = false; root.classList.add('is-open'); fab.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(function () { panel.classList.add('is-in'); });
    if (!state.loaded) {
      state.loaded = true;
      bootAuthedView();
    } else if (!state.session) {
      renderAuthGate();
    }
    setTimeout(function () { if (state.session) input.focus(); }, 60);
  }
  function closePanel() {
    panel.classList.remove('is-in'); root.classList.remove('is-open'); fab.setAttribute('aria-expanded', 'false');
    setTimeout(function () { panel.hidden = true; }, reduce ? 0 : 180); fab.focus();
  }

  fab.addEventListener('click', function () { panel.hidden ? openPanel() : closePanel(); });
  $('vaiClose').addEventListener('click', closePanel);
  newBtn.addEventListener('click', function () { if (state.busy || !state.session) return; state.conv = null; store.del(CONV_KEY); drawer.hidden = true; welcome(); input.focus(); });
  histBtn.addEventListener('click', function () { if (!state.session) return; drawer.hidden ? openDrawer() : (drawer.hidden = true); });
  logoutBtn.addEventListener('click', function () { if (!state.busy) performLogout(); });
  $('vaiDrawerClose').addEventListener('click', function () { drawer.hidden = true; });
  delAllBtn.addEventListener('click', function () {
    if (state.busy || !state.session) return;
    if (!confirm('Hapus SELURUH riwayat percakapan akun Anda secara permanen?')) return;
    delAllBtn.disabled = true;
    api({ action: 'delete_all' }).then(function () {
      state.conv = null;
      store.del(CONV_KEY);
      list.innerHTML = '<li class="vai__muted">Belum ada percakapan tersimpan.</li>';
      drawer.hidden = true;
      welcome();
    }).catch(function (e) {
      delAllBtn.disabled = false;
      if (e.code !== 'unauthorized') alert(ERR[e.code] || ERR.server_error);
    });
  });

  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) { if (!drawer.hidden) drawer.hidden = true; else closePanel(); } });
  formEl.addEventListener('submit', function (e) { e.preventDefault(); var t = input.value; if (!t.trim() || state.busy) return; input.value = ''; input.style.height = 'auto'; submit(t); });
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); formEl.requestSubmit(); } });
  input.addEventListener('input', function () { input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 120) + 'px'; });

  // Sync logout across browser tabs immediately
  window.addEventListener('storage', function (ev) {
    if (ev.key === AUTH_KEY && !ev.newValue) {
      state.session = null; state.conv = null;
      if (!panel.hidden) renderAuthGate('Sesi ditutup dari tab lain.');
    }
  });
})();
