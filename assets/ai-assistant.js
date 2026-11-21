/* ==========================================================================
   Vortex Hydro Public Private AI Assistant — No-Login Signed Anonymous Sessions
   Zero login required for visitors. Strict server-issued HMAC-signed sessions.
   Gemini API key stays strictly server-side in Supabase Secrets.
   ========================================================================== */
window.VX_AI_CONFIG = {
  endpoint: 'https://gzzwjmcedymcdazckgbc.supabase.co/functions/v1/chat-with-ai',
  publishableKey: 'sb_publishable_7jdLcpH7rK8GX1uxN8dSxw_9utM-GG9'
};

(function () {
  'use strict';
  var cfg = window.VX_AI_CONFIG;
  if (!cfg || !cfg.endpoint) return;

  var SESS_KEY = 'vx_anon_session_v1';
  var CONV_KEY = 'vx_anon_conv_v1';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  var store = (function () {
    var mem = {};
    return {
      get: function (k) { try { return localStorage.getItem(k); } catch (e) { return mem[k] || null; } },
      set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { mem[k] = v; } },
      del: function (k) { try { localStorage.removeItem(k); } catch (e) { delete mem[k]; } }
    };
  })();

  // Clean up any legacy token keys
  store.del('vxai_token');
  store.del('vxai_conv');

  var initPromise = null;
  function getSessionToken(forceNew) {
    if (!forceNew) {
      var existing = store.get(SESS_KEY);
      if (existing && /^vxs1\.[0-9a-f-]{36}\.[0-9a-f]{64}\.[0-9a-f]{64}$/i.test(existing)) {
        return Promise.resolve(existing);
      }
    }
    if (initPromise && !forceNew) return initPromise;
    initPromise = fetch(cfg.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': cfg.publishableKey || '' },
      body: JSON.stringify({ action: 'init_session' })
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) {
        if (!r.ok || !d.session_token) throw new Error(d.error || 'session_init_failed');
        store.set(SESS_KEY, d.session_token);
        if (forceNew) store.del(CONV_KEY);
        return d.session_token;
      });
    }).finally(function () { initPromise = null; });
    return initPromise;
  }

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

  var ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>';
  var LOCK_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';
  var EDIT_ICON = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';

  var root = document.createElement('div');
  root.className = 'vai';
  root.innerHTML =
    '<button type="button" class="vai__fab" id="vaiFab" aria-label="Tanya Vortex AI" aria-expanded="false" aria-controls="vaiPanel">' +
      '<span class="vai__fab-ic">' + ICON + '</span><span class="vai__fab-lbl">Tanya AI</span>' +
    '</button>' +
    '<section class="vai__panel" id="vaiPanel" role="dialog" aria-label="Vortex Hydro AI Assistant" hidden>' +
      '<header class="vai__head"><span class="vai__logo">' + ICON + '</span><div class="vai__id"><b>Vortex Hydro AI</b><small><i class="vai__dot" id="vaiDot"></i><span id="vaiStatus">Online</span></small></div>' +
        '<button type="button" class="vai__ib" id="vaiHist" aria-label="Riwayat percakapan" title="Riwayat sesi ini"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 7v5l3 2M3.5 12a8.5 8.5 0 1 0 2.6-6.1M3.5 4v4h4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
        '<button type="button" class="vai__ib" id="vaiNew" aria-label="Percakapan baru" title="Percakapan baru"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>' +
        '<button type="button" class="vai__ib" id="vaiClose" aria-label="Tutup panel" title="Tutup"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button></header>' +
      '<div class="vai__priv" title="Riwayat percakapan hanya dapat diakses dari sesi browser Anda dan terisolasi dari pengunjung lain.">' +
        '<span class="vai__priv-ic" aria-hidden="true">' + LOCK_ICON + '</span>' +
        '<span class="vai__priv-txt">Percakapan Anda bersifat privat.</span>' +
      '</div>' +
      '<div class="vai__body"><div class="vai__log" id="vaiLog" role="log" aria-live="polite"></div>' +
        '<aside class="vai__drawer" id="vaiDrawer" hidden>' +
          '<div class="vai__dh"><b>Riwayat Percakapan</b><button type="button" class="vai__ib" id="vaiDrawerClose" aria-label="Tutup riwayat"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button></div>' +
          '<ul id="vaiList"></ul>' +
          '<div class="vai__df"><button type="button" class="vai__delall" id="vaiDelAll">Hapus Semua Riwayat</button></div>' +
        '</aside></div>' +
      '<form class="vai__form" id="vaiForm"><label class="vai__sr" for="vaiInput">Pesan</label><textarea id="vaiInput" rows="1" maxlength="2000" placeholder="Tanya seputar Vortex Hydro…" autocomplete="off"></textarea>' +
        '<button type="submit" class="vai__send" id="vaiSend" aria-label="Kirim"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12l16-8-6 16-2.5-6.5L4 12z" fill="currentColor"/></svg></button></form>' +
      '<p class="vai__note">Langsung pakai tanpa login · Didukung Gemini.</p>' +
    '</section>';
  document.body.appendChild(root);

  var $ = function (id) { return document.getElementById(id); };
  var fab = $('vaiFab'), panel = $('vaiPanel'), log = $('vaiLog'), input = $('vaiInput'), send = $('vaiSend'),
      drawer = $('vaiDrawer'), list = $('vaiList'), dot = $('vaiDot'), statusEl = $('vaiStatus'), delAllBtn = $('vaiDelAll');
  var state = { conv: store.get(CONV_KEY) || null, busy: false, loaded: false };

  var ERR = {
    invalid_session: 'Sesi diperbarui otomatis. Silakan kirim ulang pesan Anda.',
    rate_limited: 'Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi.',
    ai_busy: 'AI sedang sibuk. Coba lagi beberapa detik lagi.',
    ai_failed: 'AI belum bisa menjawab saat ini. Silakan coba lagi.',
    not_configured: 'Asisten belum dikonfigurasi oleh pemilik situs.',
    message_too_long: 'Pesan terlalu panjang (maksimal 2000 karakter).',
    not_found: 'Percakapan tidak ditemukan pada sesi Anda.',
    server_error: 'Terjadi gangguan pada server. Coba lagi nanti.',
    network: 'Tidak dapat terhubung. Periksa koneksi internet Anda.'
  };

  function api(body, allowReinit) {
    if (allowReinit === undefined) allowReinit = true;
    return getSessionToken(false).then(function (sessTok) {
      var ctrl = window.AbortController ? new AbortController() : null;
      var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 40000);
      return fetch(cfg.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': cfg.publishableKey || '',
          'X-Session-Token': sessTok
        },
        body: JSON.stringify(body),
        signal: ctrl ? ctrl.signal : undefined
      }).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (d) {
          if (r.status === 401 && allowReinit) {
            state.conv = null;
            store.del(CONV_KEY);
            return getSessionToken(true).then(function () {
              var retryBody = Object.assign({}, body, { conversation_id: null });
              return api(retryBody, false);
            });
          }
          if (!r.ok) {
            var e = new Error(d.error || 'server_error');
            e.code = d.error || 'server_error';
            e.conv = d.conversation_id;
            e.detail = d.detail;
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
    statusEl.textContent = s === 'busy' ? 'Sedang berpikir…' : s === 'off' ? 'Tidak tersambung' : 'Online';
  }
  function scroll() { log.scrollTop = log.scrollHeight; }

  function welcome() {
    log.innerHTML = '<div class="vai__empty"><span class="vai__badge">' + ICON + '</span><h3>Halo! Aku Vortex Hydro AI 🌊</h3>' +
      '<p>Partner cerdas proyek mikro-hidro Vortex Hydro UM ✨ Langsung tanyakan apa saja soal cara kerja turbin, komponen, atau rumus fluida!</p>' +
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

  function setBusy(b) { state.busy = b; send.disabled = b; panel.classList.toggle('is-busy', b); setStatus(b ? 'busy' : 'ok'); }

  function submit(text, retry) {
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
      if (e.conv) { state.conv = e.conv; store.set(CONV_KEY, state.conv); }
      if (e.code === 'not_found') { state.conv = null; store.del(CONV_KEY); }
      setStatus(e.code === 'network' ? 'off' : 'ok');
      showError(e.code, { text: text }, e.detail);
    }).finally(function () { setBusy(false); if (!panel.hidden) input.focus(); });
  }

  function loadConversation(id) {
    log.innerHTML = '<div class="vai__load">Memuat percakapan…</div>';
    return api({ action: 'history', conversation_id: id }).then(function (d) {
      state.conv = id; store.set(CONV_KEY, id);
      log.innerHTML = '';
      if (!d.messages || !d.messages.length) return welcome();
      d.messages.forEach(function (m) { addMsg(m.role, m.content); });
    }).catch(function (e) {
      if (e.code === 'not_found' || e.code === 'invalid_session') {
        state.conv = null; store.del(CONV_KEY); welcome();
      } else {
        log.innerHTML = ''; showError(e.code, { text: '' });
      }
    });
  }

  function openDrawer() {
    drawer.hidden = false; list.innerHTML = '<li class="vai__muted">Memuat…</li>';
    api({ action: 'list' }).then(function (d) {
      list.innerHTML = '';
      var convs = d.conversations || [];
      delAllBtn.disabled = convs.length === 0;
      if (!convs.length) { list.innerHTML = '<li class="vai__muted">Belum ada percakapan di sesi ini.</li>'; return; }
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
            if (!list.children.length) { list.innerHTML = '<li class="vai__muted">Belum ada percakapan di sesi ini.</li>'; delAllBtn.disabled = true; }
          });
        });
        li.appendChild(open); li.appendChild(rn); li.appendChild(del); list.appendChild(li);
      });
    }).catch(function (e) { list.innerHTML = '<li class="vai__muted">' + (ERR[e.code] || ERR.server_error) + '</li>'; });
  }

  function openPanel() {
    panel.hidden = false; root.classList.add('is-open'); fab.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(function () { panel.classList.add('is-in'); });
    if (!state.loaded) {
      state.loaded = true;
      getSessionToken(false).then(function () {
        if (state.conv) loadConversation(state.conv);
        else welcome();
      }).catch(function () { welcome(); });
    }
    setTimeout(function () { input.focus(); }, 60);
  }
  function closePanel() {
    panel.classList.remove('is-in'); root.classList.remove('is-open'); fab.setAttribute('aria-expanded', 'false');
    setTimeout(function () { panel.hidden = true; }, reduce ? 0 : 180); fab.focus();
  }

  fab.addEventListener('click', function () { panel.hidden ? openPanel() : closePanel(); });
  $('vaiClose').addEventListener('click', closePanel);
  $('vaiNew').addEventListener('click', function () { if (state.busy) return; state.conv = null; store.del(CONV_KEY); drawer.hidden = true; welcome(); input.focus(); });
  $('vaiHist').addEventListener('click', function () { drawer.hidden ? openDrawer() : (drawer.hidden = true); });
  $('vaiDrawerClose').addEventListener('click', function () { drawer.hidden = true; });
  delAllBtn.addEventListener('click', function () {
    if (state.busy) return;
    if (!confirm('Hapus seluruh riwayat percakapan pada sesi ini?')) return;
    delAllBtn.disabled = true;
    api({ action: 'delete_all' }).then(function () {
      state.conv = null; store.del(CONV_KEY);
      list.innerHTML = '<li class="vai__muted">Belum ada percakapan di sesi ini.</li>';
      drawer.hidden = true; welcome();
    }).catch(function (e) { delAllBtn.disabled = false; alert(ERR[e.code] || ERR.server_error); });
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) { if (!drawer.hidden) drawer.hidden = true; else closePanel(); } });
  $('vaiForm').addEventListener('submit', function (e) { e.preventDefault(); var t = input.value; if (!t.trim() || state.busy) return; input.value = ''; input.style.height = 'auto'; submit(t); });
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); $('vaiForm').requestSubmit(); } });
  input.addEventListener('input', function () { input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 120) + 'px'; });
})();
