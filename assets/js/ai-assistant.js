/* Vortex Hydro AI Assistant — antarmuka chat (vanilla JS, tanpa library).
   Semua jawaban datang dari Edge Function chat-with-ai (Gemini di sisi server). */
(function () {
  'use strict';
  var cfg = window.VX_AI_CONFIG;
  if (!cfg || !cfg.endpoint) return;

  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var store = (function () {
    var mem = {};
    return {
      get: function (k) { try { return localStorage.getItem(k); } catch (e) { return mem[k] || null; } },
      set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { mem[k] = v; } },
      del: function (k) { try { localStorage.removeItem(k); } catch (e) { delete mem[k]; } }
    };
  })();

  function token() {
    var t = store.get('vxai_token');
    if (!t || !/^[A-Za-z0-9-]{32,80}$/.test(t)) {
      t = (crypto.randomUUID ? crypto.randomUUID() : (Date.now().toString(16) + Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2) + '0000000000')).replace(/[^A-Za-z0-9-]/g, '');
      if (t.length < 32) t = (t + '00000000000000000000000000000000').slice(0, 36);
      store.set('vxai_token', t);
    }
    return t;
  }

  /* ---------- Markdown aman: escape dulu, baru ubah sintaks ---------- */
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function inline(s) {
    var codes = [];
    s = s.replace(/`([^`\n]+)`/g, function (_, c) { codes.push('<code>' + c + '</code>'); return '\u0000' + (codes.length - 1) + '\u0000'; });
    s = s.replace(/\$\$?([^$\n]+?)\$\$?/g, function (_, c) { codes.push('<span class="vai-math">' + c.replace(/\^(\{[^}]+\}|[\w+-]+)/g, function (_, x) { return '<sup>' + x.replace(/^\{|\}$/g, '') + '</sup>'; }).replace(/_(\{[^}]+\}|\w+)/g, function (_, x) { return '<sub>' + x.replace(/^\{|\}$/g, '') + '</sub>'; }) + '</span>'); return '\u0000' + (codes.length - 1) + '\u0000'; });
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
    while (i < lines.length) {
      var l = lines[i], m;
      if ((m = l.match(/^\u0001(\d+)\u0001$/))) { out.push(blocks[+m[1]]); i++; continue; }
      if (!l.trim()) { i++; continue; }
      if ((m = l.match(/^(#{1,4})\s+(.*)$/))) { var h = Math.min(m[1].length + 2, 6); out.push('<h' + h + '>' + inline(m[2]) + '</h' + h + '>'); i++; continue; }
      if (isRow(l) && lines[i + 1] && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
        var cells = function (r) { return r.trim().replace(/^\||\|$/g, '').split('|').map(function (c) { return inline(c.trim()); }); };
        var html = '<div class="vai-tw"><table><thead><tr>' + cells(l).map(function (c) { return '<th>' + c + '</th>'; }).join('') + '</tr></thead><tbody>';
        i += 2;
        while (i < lines.length && isRow(lines[i])) { html += '<tr>' + cells(lines[i]).map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>'; i++; }
        out.push(html + '</tbody></table></div>'); continue;
      }
      if (/^\s*[-*]\s+/.test(l)) { var ul = '<ul>'; while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) { ul += '<li>' + inline(lines[i].replace(/^\s*[-*]\s+/, '')) + '</li>'; i++; } out.push(ul + '</ul>'); continue; }
      if (/^\s*\d+[.)]\s+/.test(l)) { var ol = '<ol>'; while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) { ol += '<li>' + inline(lines[i].replace(/^\s*\d+[.)]\s+/, '')) + '</li>'; i++; } out.push(ol + '</ol>'); continue; }
      var p = [];
      while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|\s*[-*]\s|\s*\d+[.)]\s|\u0001)/.test(lines[i]) && !isRow(lines[i])) { p.push(lines[i]); i++; }
      if (!p.length) { p.push(lines[i]); i++; }
      out.push('<p>' + inline(p.join('<br>')) + '</p>');
    }
    return out.join('');
  }

  /* ---------- DOM ---------- */
  var ICON = '<svg viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path d="M16 4c-6.6 0-12 5.4-12 12s5.4 12 12 12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M16 9c-3.9 0-7 3.1-7 7s3.1 7 7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><circle cx="16" cy="16" r="2.6" fill="currentColor"/><path d="M22 6.5c3.1 2.2 5 5.7 5 9.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" opacity=".55"/></svg>';
  var root = document.createElement('div');
  root.className = 'vai';
  root.innerHTML =
    '<button type="button" class="vai__fab" id="vaiFab" aria-label="Ask Vortex AI" aria-expanded="false" aria-controls="vaiPanel">' + ICON + '<span class="vai__tip" role="tooltip">Ask Vortex AI</span></button>' +
    '<section class="vai__panel" id="vaiPanel" role="dialog" aria-label="Vortex Hydro AI Assistant" hidden>' +
      '<header class="vai__head"><span class="vai__logo">' + ICON + '</span><div class="vai__id"><b>Vortex Hydro AI</b><small><i class="vai__dot" id="vaiDot"></i><span id="vaiStatus">Online</span></small></div>' +
        '<button type="button" class="vai__ib" id="vaiHist" aria-label="Riwayat percakapan" title="Riwayat"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 7v5l3 2M3.5 12a8.5 8.5 0 1 0 2.6-6.1M3.5 4v4h4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
        '<button type="button" class="vai__ib" id="vaiNew" aria-label="New Chat" title="New Chat"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>' +
        '<button type="button" class="vai__ib" id="vaiClose" aria-label="Tutup panel" title="Tutup"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button></header>' +
      '<div class="vai__body"><div class="vai__log" id="vaiLog" role="log" aria-live="polite"></div>' +
        '<aside class="vai__drawer" id="vaiDrawer" hidden><div class="vai__dh"><b>Riwayat</b><button type="button" class="vai__ib" id="vaiDrawerClose" aria-label="Tutup riwayat"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button></div><ul id="vaiList"></ul></aside></div>' +
      '<form class="vai__form" id="vaiForm"><label class="vai__sr" for="vaiInput">Pesan</label><textarea id="vaiInput" rows="1" maxlength="2000" placeholder="Tanya apa saja…" autocomplete="off"></textarea>' +
        '<button type="submit" class="vai__send" id="vaiSend" aria-label="Kirim"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12l16-8-6 16-2.5-6.5L4 12z" fill="currentColor"/></svg></button></form>' +
      '<p class="vai__note">AI dapat keliru. Periksa informasi penting.</p>' +
    '</section>';
  document.body.appendChild(root);

  var $ = function (id) { return document.getElementById(id); };
  var fab = $('vaiFab'), panel = $('vaiPanel'), log = $('vaiLog'), input = $('vaiInput'), send = $('vaiSend'),
      drawer = $('vaiDrawer'), list = $('vaiList'), dot = $('vaiDot'), statusEl = $('vaiStatus');
  var state = { conv: store.get('vxai_conv') || null, busy: false, loaded: false, last: null };

  var ERR = {
    rate_limited: 'Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi.',
    ai_busy: 'AI sedang sibuk. Coba lagi beberapa detik lagi.',
    ai_failed: 'AI belum bisa menjawab saat ini. Pesanmu tidak hilang, silakan coba lagi.',
    not_configured: 'Asisten belum dikonfigurasi oleh pemilik situs (kunci Gemini belum dipasang).',
    message_too_long: 'Pesan terlalu panjang (maksimal 2000 karakter).',
    not_found: 'Percakapan tidak ditemukan.',
    server_error: 'Terjadi gangguan pada server. Coba lagi nanti.',
    network: 'Tidak dapat terhubung. Periksa koneksi internet lalu coba lagi.'
  };

  function api(body) {
    body.token = token();
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 40000);
    return fetch(cfg.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': cfg.publishableKey || '' },
      body: JSON.stringify(body),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) {
        if (!r.ok) { var e = new Error(d.error || 'server_error'); e.code = d.error || 'server_error'; e.conv = d.conversation_id; e.detail = d.detail; throw e; }
        return d;
      });
    }, function () { var e = new Error('network'); e.code = 'network'; throw e; }).finally(function () { clearTimeout(timer); });
  }

  function setStatus(s) {
    dot.className = 'vai__dot' + (s === 'busy' ? ' is-busy' : s === 'off' ? ' is-off' : '');
    statusEl.textContent = s === 'busy' ? 'Sedang berpikir…' : s === 'off' ? 'Tidak tersambung' : 'Online';
  }
  function scroll() { log.scrollTop = log.scrollHeight; }

  function welcome() {
    log.innerHTML = '<div class="vai__empty"><span class="vai__badge">' + ICON + '</span><h3>Hello! I’m Vortex Hydro AI.</h3>' +
      '<p>Your intelligent companion for exploring vortex technology, renewable energy, and the science behind our world.</p>' +
      '<div class="vai__sug"></div></div>';
    var box = log.querySelector('.vai__sug');
    ['What is a Vortex Turbine?', 'How does hydropower generate electricity?', 'Explain the science behind water vortex.', 'Tell me about Vortex Hydro.'].forEach(function (q) {
      var b = document.createElement('button'); b.type = 'button'; b.textContent = q;
      b.addEventListener('click', function () { submit(q); }); box.appendChild(b);
    });
  }

  function addMsg(role, content, opts) {
    var empty = log.querySelector('.vai__empty'); if (empty) log.innerHTML = '';
    var w = document.createElement('div'); w.className = 'vai__m vai__m--' + role;
    if (role === 'assistant') {
      w.innerHTML = '<span class="vai__av">' + ICON + '</span><div class="vai__bub"><div class="vai__txt"></div><button type="button" class="vai__copy" aria-label="Salin jawaban">Salin</button></div>';
      var t = w.querySelector('.vai__txt'); t.innerHTML = md(content);
      w.querySelector('.vai__copy').addEventListener('click', function (e) {
        var b = e.currentTarget, done = function () { b.textContent = 'Tersalin'; setTimeout(function () { b.textContent = 'Salin'; }, 1500); };
        if (navigator.clipboard) navigator.clipboard.writeText(content).then(done, function () { b.textContent = 'Gagal'; }); else b.textContent = 'Gagal';
      });
    } else {
      w.innerHTML = '<div class="vai__bub"><div class="vai__txt"></div></div>';
      w.querySelector('.vai__txt').textContent = content;
    }
    log.appendChild(w); scroll(); return w;
  }

  function typeInto(w, content) {
    // Efek mengetik; dilewati jika reduced-motion. Isi akhir selalu dirender penuh.
    var t = w.querySelector('.vai__txt');
    if (reduce || content.length > 1800) { t.innerHTML = md(content); scroll(); return Promise.resolve(); }
    return new Promise(function (res) {
      var i = 0, step = Math.max(2, Math.ceil(content.length / 110));
      (function tick() {
        i = Math.min(content.length, i + step);
        t.innerHTML = md(content.slice(0, i)); scroll();
        if (i >= content.length) return res();
        setTimeout(tick, 16);
      })();
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
    w.querySelector('button').addEventListener('click', function () { w.remove(); submit(retryPayload.text, true); });
    log.appendChild(w); scroll();
  }

  function setBusy(b) { state.busy = b; send.disabled = b; panel.classList.toggle('is-busy', b); setStatus(b ? 'busy' : 'ok'); }

  function submit(text, retry) {
    text = (text || '').trim();
    if (!text || state.busy) return;
    if (!retry) addMsg('user', text);
    setBusy(true);
    var tp = typing();
    var page = (location.hash || '#beranda').slice(1);
    api({ action: 'send', conversation_id: state.conv, message: text, retry: !!retry, context: { page: page } }).then(function (d) {
      state.conv = d.conversation_id; store.set('vxai_conv', state.conv);
      tp.remove();
      var w = addMsg('assistant', '');
      return typeInto(w, d.message.content).then(function () { w.querySelector('.vai__txt').innerHTML = md(d.message.content); w.querySelector('.vai__copy').onclick = null; rebindCopy(w, d.message.content); });
    }).catch(function (e) {
      tp.remove();
      if (e.conv) { state.conv = e.conv; store.set('vxai_conv', state.conv); }
      if (e.code === 'not_found') { state.conv = null; store.del('vxai_conv'); }
      setStatus(e.code === 'network' ? 'off' : 'ok');
      showError(e.code, { text: text }, e.detail);
    }).finally(function () { setBusy(false); if (panel.hidden === false) input.focus(); });
  }
  function rebindCopy(w, content) {
    var b = w.querySelector('.vai__copy'), n = b.cloneNode(true); b.replaceWith(n);
    n.addEventListener('click', function () {
      var done = function () { n.textContent = 'Tersalin'; setTimeout(function () { n.textContent = 'Salin'; }, 1500); };
      if (navigator.clipboard) navigator.clipboard.writeText(content).then(done, function () { n.textContent = 'Gagal'; }); else n.textContent = 'Gagal';
    });
  }

  function loadConversation(id) {
    log.innerHTML = '<div class="vai__load">Memuat percakapan…</div>';
    return api({ action: 'history', conversation_id: id }).then(function (d) {
      state.conv = id; store.set('vxai_conv', id);
      log.innerHTML = '';
      if (!d.messages.length) return welcome();
      d.messages.forEach(function (m) { addMsg(m.role, m.content); });
    }).catch(function (e) {
      if (e.code === 'not_found') { state.conv = null; store.del('vxai_conv'); welcome(); }
      else { log.innerHTML = ''; showError(e.code, { text: '' }); var b = log.querySelector('.vai__err button'); if (b) b.onclick = function () { loadConversation(id); }; }
    });
  }

  function newChat() {
    if (state.busy) return;
    state.conv = null; store.del('vxai_conv'); closeDrawer(); welcome(); input.focus();
  }

  function openDrawer() {
    drawer.hidden = false; list.innerHTML = '<li class="vai__muted">Memuat…</li>';
    api({ action: 'list' }).then(function (d) {
      list.innerHTML = '';
      if (!d.conversations.length) { list.innerHTML = '<li class="vai__muted">Belum ada percakapan.</li>'; return; }
      d.conversations.forEach(function (c) {
        var li = document.createElement('li'); if (c.id === state.conv) li.className = 'is-on';
        var open = document.createElement('button'); open.type = 'button'; open.className = 'vai__open'; open.textContent = c.title;
        open.addEventListener('click', function () { if (state.busy) return; closeDrawer(); loadConversation(c.id); });
        var rn = document.createElement('button'); rn.type = 'button'; rn.className = 'vai__mini'; rn.setAttribute('aria-label', 'Ganti judul'); rn.textContent = '✎';
        rn.addEventListener('click', function () {
          var t = prompt('Judul baru', c.title); if (t === null) return;
          api({ action: 'rename', conversation_id: c.id, title: t }).then(function (r) { c.title = r.title; open.textContent = r.title; }).catch(function (e) { alert(ERR[e.code] || ERR.server_error); });
        });
        var del = document.createElement('button'); del.type = 'button'; del.className = 'vai__mini'; del.setAttribute('aria-label', 'Hapus percakapan'); del.textContent = '×';
        del.addEventListener('click', function () {
          if (!confirm('Hapus percakapan ini secara permanen?')) return;
          api({ action: 'delete', conversation_id: c.id }).then(function () {
            li.remove(); if (c.id === state.conv) { state.conv = null; store.del('vxai_conv'); welcome(); }
            if (!list.children.length) list.innerHTML = '<li class="vai__muted">Belum ada percakapan.</li>';
          }).catch(function (e) { alert(ERR[e.code] || ERR.server_error); });
        });
        li.appendChild(open); li.appendChild(rn); li.appendChild(del); list.appendChild(li);
      });
    }).catch(function (e) { list.innerHTML = ''; var li = document.createElement('li'); li.className = 'vai__muted'; li.textContent = ERR[e.code] || ERR.server_error; list.appendChild(li); });
  }
  function closeDrawer() { drawer.hidden = true; }

  function openPanel() {
    panel.hidden = false; root.classList.add('is-open'); fab.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(function () { panel.classList.add('is-in'); });
    if (!state.loaded) { state.loaded = true; if (state.conv) loadConversation(state.conv); else welcome(); }
    setTimeout(function () { input.focus(); }, 60);
  }
  function closePanel() {
    panel.classList.remove('is-in'); root.classList.remove('is-open'); fab.setAttribute('aria-expanded', 'false');
    setTimeout(function () { panel.hidden = true; }, reduce ? 0 : 220); fab.focus();
  }

  fab.addEventListener('click', function () { panel.hidden ? openPanel() : closePanel(); });
  $('vaiClose').addEventListener('click', closePanel);
  $('vaiNew').addEventListener('click', newChat);
  $('vaiHist').addEventListener('click', function () { drawer.hidden ? openDrawer() : closeDrawer(); });
  $('vaiDrawerClose').addEventListener('click', closeDrawer);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) { if (!drawer.hidden) closeDrawer(); else closePanel(); } });

  $('vaiForm').addEventListener('submit', function (e) {
    e.preventDefault(); var t = input.value; if (!t.trim() || state.busy) return;
    input.value = ''; autosize(); submit(t);
  });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); $('vaiForm').requestSubmit(); }
  });
  function autosize() { input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 140) + 'px'; }
  input.addEventListener('input', autosize);
})();
