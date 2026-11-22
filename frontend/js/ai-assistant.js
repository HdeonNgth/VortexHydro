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

  /* Session-scoped storage: clears cleanly when browser closes & never piles up across reloads */
  var store = (function () {
    var mem = {};
    return {
      get: function (k) { try { return sessionStorage.getItem(k); } catch (e) { return mem[k] || null; } },
      set: function (k, v) { try { sessionStorage.setItem(k, v); } catch (e) { mem[k] = v; } },
      del: function (k) { try { sessionStorage.removeItem(k); } catch (e) { delete mem[k]; } }
    };
  })();

  // Clean up any legacy localStorage keys & always reset active conversation on every browser refresh
  try {
    localStorage.removeItem('vxai_token');
    localStorage.removeItem('vxai_conv');
    localStorage.removeItem(SESS_KEY);
    localStorage.removeItem(CONV_KEY);
  } catch (e) {}
  store.del(CONV_KEY);
  // Also rotate anonymous session on every fresh browser reload so chats never pile up
  store.del(SESS_KEY);

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
    s = s.replace(/`([^`\n]+)`/g, '$1');
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
    text = text.replace(/```[\s\S]*?```/g, 'Maaf ya, aku tidak bisa memberikan kode pemrograman 😅😊');
    var lines = text.split('\n'), out = [], i = 0;
    function isRow(l) { return /^\s*\|.*\|\s*$/.test(l); }
    function isHr(l) { return /^\s*(?:---+|___+|\*\*\*+)\s*$/.test(l); }
    while (i < lines.length) {
      var l = lines[i], m;
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

  /* Minimalist Stylized Voxxy Mini Avatar (for FAB, Header & Assistant Bubbles) */
  var VOXXY_MINI =
    '<svg viewBox="0 0 36 36" aria-hidden="true" focusable="false" fill="none">' +
      '<path d="M8 14L6 6.5C6 5.4 7.2 4.8 8 5.5L13.5 9.8C15 9.3 16.5 9 18 9C19.5 9 21 9.3 22.5 9.8L28 5.5C28.8 4.8 30 5.4 30 6.5L28 14C29.3 16 30 18.4 30 21C30 27.2 24.8 31 18 31C11.2 31 6 27.2 6 21C6 18.4 6.7 16 8 14Z" fill="currentColor"/>' +
      '<ellipse cx="18" cy="22.8" rx="9.5" ry="6.4" fill="#FFFFFF" fill-opacity="0.92"/>' +
      '<circle cx="14.2" cy="21.4" r="1.55" fill="#0B1F3A"/>' +
      '<circle cx="21.8" cy="21.4" r="1.55" fill="#0B1F3A"/>' +
      '<circle cx="14.7" cy="20.9" r="0.5" fill="#FFFFFF"/>' +
      '<circle cx="22.3" cy="20.9" r="0.5" fill="#FFFFFF"/>' +
      '<path d="M16.2 24.1C16.8 25 19.2 25 19.8 24.1" stroke="#0B1F3A" stroke-width="1.35" stroke-linecap="round"/>' +
      '<ellipse cx="11.6" cy="23.2" rx="1.6" ry="0.95" fill="#FF8FAB" fill-opacity="0.72"/>' +
      '<ellipse cx="24.4" cy="23.2" rx="1.6" ry="0.95" fill="#FF8FAB" fill-opacity="0.72"/>' +
    '</svg>';

  /* Interactive Lounging Pet Mascot — Stylized Flat-Cute Voxxy Resting on Chat Panel Roof */
  var VOXXY_PET =
    '<svg class="vxpet__svg" viewBox="0 0 132 62" fill="none" aria-hidden="true">' +
      '<defs>' +
        '<linearGradient id="vxPetBody" x1="20" y1="10" x2="112" y2="54" gradientUnits="userSpaceOnUse">' +
          '<stop offset="0%" stop-color="var(--cyan)"/>' +
          '<stop offset="100%" stop-color="var(--blue)"/>' +
        '</linearGradient>' +
      '</defs>' +
      /* Cute swishing tail on the left */
      '<path class="vxpet__tail" d="M26 44C14 45 8 36 13 28C15.5 24 21 25 22 30C23 34 20 38 26 39" fill="url(#vxPetBody)"/>' +
      /* Cozy lounging rounded body */
      '<g class="vxpet__body">' +
        '<path d="M24 44C24 29 37 20 56 20H78C96 20 109 29 109 44C109 50.5 103 53 95 53H37C29 53 24 50.5 24 44Z" fill="url(#vxPetBody)"/>' +
        /* Cute rounded water-cat ears */
        '<path class="vxpet__ear vxpet__ear--l" d="M68 23L65 11.5C64.6 9.8 66.5 8.6 68 9.6L78 16.8Z" fill="url(#vxPetBody)"/>' +
        '<path class="vxpet__ear vxpet__ear--r" d="M98 24L103 13C103.8 11.4 102 9.8 100.4 10.7L90 17.2Z" fill="url(#vxPetBody)"/>' +
        '<path d="M69 20.2L67.3 13.8L74.2 18.2Z" fill="#FFFFFF" fill-opacity="0.45"/>' +
        '<path d="M96.8 20.6L99.8 14.5L92.6 18.6Z" fill="#FFFFFF" fill-opacity="0.45"/>' +
        /* Soft glossy droplet highlight on back */
        '<ellipse cx="47" cy="30" rx="11" ry="4.5" transform="rotate(-10 47 30)" fill="#FFFFFF" fill-opacity="0.28"/>' +
        /* Soft cream face patch */
        '<ellipse cx="83" cy="36" rx="20" ry="13.5" fill="#FFFFFF" fill-opacity="0.95"/>' +
        /* Cheeks */
        '<ellipse class="vxpet__cheek" cx="69" cy="39.5" rx="3.4" ry="2" fill="#FF8FAB"/>' +
        '<ellipse class="vxpet__cheek" cx="97" cy="39.5" rx="3.4" ry="2" fill="#FF8FAB"/>' +
        /* FACE: SLEEP (peaceful closed eyes) */
        '<g class="vxpet__face vxpet__face--sleep">' +
          '<path d="M72 36.2C73.5 38.2 76.5 38.2 78 36.2" stroke="#13294B" stroke-width="1.9" stroke-linecap="round"/>' +
          '<path d="M88 36.2C89.5 38.2 92.5 38.2 94 36.2" stroke="#13294B" stroke-width="1.9" stroke-linecap="round"/>' +
          '<path d="M81 40.5C82 41.7 84 41.7 85 40.5" stroke="#13294B" stroke-width="1.6" stroke-linecap="round"/>' +
        '</g>' +
        /* FACE: AWAKE (bright cute eyes) */
        '<g class="vxpet__face vxpet__face--awake">' +
          '<circle cx="75" cy="35.5" r="2.7" fill="#13294B"/>' +
          '<circle cx="91" cy="35.5" r="2.7" fill="#13294B"/>' +
          '<circle cx="75.9" cy="34.5" r="0.95" fill="#FFFFFF"/>' +
          '<circle cx="91.9" cy="34.5" r="0.95" fill="#FFFFFF"/>' +
          '<path d="M80.5 39.8C81.8 41.6 84.2 41.6 85.5 39.8" stroke="#13294B" stroke-width="1.7" stroke-linecap="round"/>' +
        '</g>' +
        /* FACE: HAPPY (squinty blissful ^ ^ eyes) */
        '<g class="vxpet__face vxpet__face--happy">' +
          '<path d="M72 36.5C73.5 33.8 76.5 33.8 78 36.5" stroke="#13294B" stroke-width="2" stroke-linecap="round"/>' +
          '<path d="M88 36.5C89.5 33.8 92.5 33.8 94 36.5" stroke="#13294B" stroke-width="2" stroke-linecap="round"/>' +
          '<path d="M79.8 39.4C81.4 42.2 84.6 42.2 86.2 39.4" stroke="#13294B" stroke-width="1.8" stroke-linecap="round"/>' +
        '</g>' +
        /* FACE: PEEK (curious eyes looking down at user typing) */
        '<g class="vxpet__face vxpet__face--peek">' +
          '<circle cx="75" cy="37.2" r="2.6" fill="#13294B"/>' +
          '<circle cx="91" cy="37.2" r="2.6" fill="#13294B"/>' +
          '<circle cx="75.8" cy="36.4" r="0.85" fill="#FFFFFF"/>' +
          '<circle cx="91.8" cy="36.4" r="0.85" fill="#FFFFFF"/>' +
          '<circle cx="83" cy="41.4" r="1.4" fill="#13294B"/>' +
        '</g>' +
        /* FACE: THINK (thoughtful eyes looking up-right) */
        '<g class="vxpet__face vxpet__face--think">' +
          '<circle cx="76.2" cy="34.2" r="2.4" fill="#13294B"/>' +
          '<circle cx="92.2" cy="34.2" r="2.4" fill="#13294B"/>' +
          '<circle cx="77" cy="33.4" r="0.8" fill="#FFFFFF"/>' +
          '<circle cx="93" cy="33.4" r="0.8" fill="#FFFFFF"/>' +
          '<path d="M81 40.6H85" stroke="#13294B" stroke-width="1.7" stroke-linecap="round"/>' +
        '</g>' +
      '</g>' +
      /* Cute stubby paws resting gently over the top edge of the chat panel */
      '<ellipse class="vxpet__paw vxpet__paw--l" cx="69" cy="52.5" rx="7" ry="4.5" fill="#FFFFFF" stroke="var(--blue)" stroke-width="1.5"/>' +
      '<ellipse class="vxpet__paw vxpet__paw--r" cx="95" cy="52.5" rx="7" ry="4.5" fill="#FFFFFF" stroke="var(--blue)" stroke-width="1.5"/>' +
    '</svg>';

  var LOCK_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';
  var EDIT_ICON = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
  var CLOSE_ICON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  var CLOSE_ICON_SM = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';

  var root = document.createElement('div');
  root.className = 'vai';
  root.innerHTML =
    '<button type="button" class="vai__fab" id="vaiFab" aria-label="Tanya Voxxy" aria-expanded="false" aria-controls="vaiPanel">' +
      '<span class="vai__fab-ic">' + VOXXY_MINI + '</span><span class="vai__fab-lbl">Tanya Voxxy</span>' +
    '</button>' +
    '<section class="vai__panel" id="vaiPanel" role="dialog" aria-label="Voxxy AI Assistant" hidden>' +
      /* Interactive Lounging Pet Mascot Perched Peacefully on Top of the Chat Roof */
      '<div class="vxpet-dock">' +
        '<button type="button" class="vxpet" id="vxPet" data-mood="sleep" aria-label="Sentuh atau elus Voxxy" title="Sentuh atau elus Voxxy~">' +
          '<span class="vxpet__zzz" aria-hidden="true"><i>z</i><i>z</i></span>' +
          '<span class="vxpet__think" aria-hidden="true">?</span>' +
          '<span class="vxpet__fx" id="vxPetFx" aria-hidden="true"></span>' +
          VOXXY_PET +
        '</button>' +
        '<span class="vxpet__say" id="vxPetSay" aria-live="polite" hidden></span>' +
      '</div>' +
      '<div class="vai__box">' +
        '<header class="vai__head">' +
          '<span class="vai__logo">' + VOXXY_MINI + '</span>' +
          '<div class="vai__id"><b>Voxxy</b><small><i class="vai__dot" id="vaiDot"></i><span id="vaiStatus">Online</span></small></div>' +
          '<button type="button" class="vai__ib" id="vaiHist" aria-label="Riwayat percakapan" title="Riwayat sesi ini"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 7v5l3 2M3.5 12a8.5 8.5 0 1 0 2.6-6.1M3.5 4v4h4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
          '<button type="button" class="vai__ib" id="vaiNew" aria-label="Percakapan baru" title="Percakapan baru"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>' +
          '<button type="button" class="vai__ib vai__ib--close" id="vaiClose" aria-label="Tutup panel" title="Tutup">' + CLOSE_ICON + '</button>' +
        '</header>' +
        '<div class="vai__priv" title="Percakapan bersifat privat dan otomatis direset setiap kali halaman dimuat ulang agar tidak menumpuk.">' +
          '<span class="vai__priv-ic" aria-hidden="true">' + LOCK_ICON + '</span>' +
          '<span class="vai__priv-txt">Percakapan privat · Reset otomatis saat dimuat ulang.</span>' +
        '</div>' +
        '<div class="vai__body"><div class="vai__log" id="vaiLog" role="log" aria-live="polite"></div>' +
          '<aside class="vai__drawer" id="vaiDrawer" hidden>' +
            '<div class="vai__dh"><b>Riwayat Voxxy</b><button type="button" class="vai__ib vai__ib--close" id="vaiDrawerClose" aria-label="Tutup riwayat">' + CLOSE_ICON + '</button></div>' +
            '<ul id="vaiList"></ul>' +
            '<div class="vai__df"><button type="button" class="vai__delall" id="vaiDelAll">Hapus Semua Riwayat</button></div>' +
          '</aside></div>' +
        '<form class="vai__form" id="vaiForm">' +
          '<div class="vai__input-pill">' +
            '<label class="vai__sr" for="vaiInput">Pesan</label>' +
            '<textarea id="vaiInput" rows="1" maxlength="2000" placeholder="Ngobrol dengan Voxxy…" autocomplete="off"></textarea>' +
            '<button type="submit" class="vai__send" id="vaiSend" aria-label="Kirim"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12l16-8-6 16-2.5-6.5L4 12z" fill="currentColor"/></svg></button>' +
          '</div>' +
        '</form>' +
        '<p class="vai__note">Voxxy · Tanpa login · Didukung Gemini</p>' +
      '</div>' +
    '</section>';
  document.body.appendChild(root);

  var $ = function (id) { return document.getElementById(id); };
  var fab = $('vaiFab'), panel = $('vaiPanel'), log = $('vaiLog'), input = $('vaiInput'), send = $('vaiSend'),
      drawer = $('vaiDrawer'), list = $('vaiList'), dot = $('vaiDot'), statusEl = $('vaiStatus'), delAllBtn = $('vaiDelAll'),
      petEl = $('vxPet'), petFx = $('vxPetFx'), petSay = $('vxPetSay');
  /* Always start clean on every browser page load / refresh */
  var state = { conv: null, busy: false, loaded: false };

  /* ---------- Interactive Pet ("Voxxy") Touch, Petting & Mood Engine ---------- */
  var petState = { mood: 'sleep', pets: 0, sleepTimer: null, sayTimer: null, lastRub: 0 };
  var PET_LINES = [
    'Zzz… eh halo! 😊',
    'Hehe geli~ 😄',
    'Makasih elusannya! 🥰',
    'Lagi santai nih~',
    'Yuk ngobrol sama Voxxy!',
    'Siap bantu kamu! 😎'
  ];

  function setPetMood(mood, autoSleepMs) {
    if (!petEl) return;
    petState.mood = mood;
    petEl.setAttribute('data-mood', mood);
    clearTimeout(petState.sleepTimer);
    if (autoSleepMs && !state.busy) {
      petState.sleepTimer = setTimeout(function () {
        if (!state.busy && document.activeElement !== input) {
          petState.mood = 'sleep';
          petEl.setAttribute('data-mood', 'sleep');
        }
      }, autoSleepMs);
    }
  }

  function spawnPetSpark(symbol) {
    if (!petFx) return;
    var sp = document.createElement('i');
    sp.className = 'vxpet__spark';
    sp.textContent = symbol || '♡';
    sp.style.left = (38 + Math.random() * 44) + '%';
    petFx.appendChild(sp);
    setTimeout(function () { sp.remove(); }, 950);
  }

  function sayPet(msg) {
    if (!petSay) return;
    petSay.textContent = msg;
    petSay.hidden = false;
    petSay.classList.remove('is-show');
    void petSay.offsetWidth;
    petSay.classList.add('is-show');
    clearTimeout(petState.sayTimer);
    petState.sayTimer = setTimeout(function () {
      petSay.classList.remove('is-show');
      setTimeout(function () { if (!petSay.classList.contains('is-show')) petSay.hidden = true; }, 220);
    }, 2300);
  }

  function petVoxxy(isRub) {
    if (!petEl) return;
    var now = Date.now();
    if (isRub && now - petState.lastRub < 700) return;
    petState.lastRub = now;
    petState.pets++;
    var nextMood = (petState.mood === 'sleep' && !isRub) ? 'awake' : 'happy';
    setPetMood(nextMood, 8500);
    petEl.classList.remove('is-boop');
    void petEl.offsetWidth;
    petEl.classList.add('is-boop');
    spawnPetSpark(nextMood === 'happy' ? '♡' : '✦');
    if (petState.pets % 2 === 0 || !isRub) {
      var line = PET_LINES[(petState.pets - 1) % PET_LINES.length];
      sayPet(line);
    }
  }

  if (petEl) {
    petEl.addEventListener('click', function () { petVoxxy(false); });
    petEl.addEventListener('pointermove', function (e) {
      if (e.buttons === 1 || e.pointerType === 'touch') petVoxxy(true);
    });
  }

  var ERR = {
    invalid_session: 'Sesi diperbarui secara otomatis. Silakan kirim ulang pesan Anda.',
    rate_limited: 'Terlalu banyak permintaan. Mohon tunggu sebentar lalu coba lagi.',
    ai_busy: 'Asisten AI sedang sibuk. Silakan coba lagi dalam beberapa detik.',
    ai_failed: 'Asisten AI belum dapat menjawab saat ini. Silakan coba lagi.',
    not_configured: 'Asisten belum dikonfigurasi oleh pengelola situs.',
    message_too_long: 'Pesan terlalu panjang (maksimal 2.000 karakter).',
    not_found: 'Percakapan tidak ditemukan pada sesi Anda.',
    server_error: 'Terjadi gangguan pada server. Silakan coba lagi nanti.',
    network: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.'
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
    log.innerHTML = '<div class="vai__empty"><span class="vai__badge">' + VOXXY_MINI + '</span><h3>Halo! Aku Voxxy 😊</h3>' +
      '<p>Asisten pintar untuk proyek mikro-hidro Vortex Hydro UM 😄 Tanyakan apa saja soal cara kerja, komponen, atau alirannya! <span class="vai__pet-hint">Psst, sentuh Voxxy yang lagi tiduran di atas~</span></p>' +
      '<div class="vai__sug"></div></div>';
    var box = log.querySelector('.vai__sug');
    [
      '😊 Bagaimana alur kerja Vortex Hydro secara singkat?',
      '🤔 Apa fungsi transmisi pulley 1:4 di zona kering?',
      '😮 Mengapa turbin pusaran cocok untuk head rendah?',
      '😄 Apa saja komponen utama prototipe Vortex Hydro?'
    ].forEach(function (q) {
      var b = document.createElement('button'); b.type = 'button'; b.textContent = q;
      b.addEventListener('click', function () { submit(q); }); box.appendChild(b);
    });
  }

  function addMsg(role, content) {
    var empty = log.querySelector('.vai__empty'); if (empty) log.innerHTML = '';
    var w = document.createElement('div'); w.className = 'vai__m vai__m--' + role;
    if (role === 'assistant') {
      w.innerHTML = '<span class="vai__av">' + VOXXY_MINI + '</span><div class="vai__bub"><div class="vai__txt"></div><button type="button" class="vai__copy" aria-label="Salin jawaban">Salin</button></div>';
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
    w.innerHTML = '<span class="vai__av">' + VOXXY_MINI + '</span><div class="vai__bub"><div class="vai__dots" aria-label="Voxxy sedang mengetik"><i></i><i></i><i></i></div></div>';
    log.appendChild(w); scroll(); return w;
  }

  function showError(code, retryPayload, detail) {
    var w = document.createElement('div'); w.className = 'vai__err'; w.setAttribute('role', 'alert');
    w.innerHTML = '<span></span><button type="button">Coba lagi</button>';
    w.firstChild.textContent = (ERR[code] || ERR.server_error) + (detail ? ' (' + detail + ')' : '');
    w.querySelector('button').addEventListener('click', function () { w.remove(); if (retryPayload && retryPayload.text) submit(retryPayload.text, true); });
    log.appendChild(w); scroll();
  }

  function setBusy(b) {
    state.busy = b; send.disabled = b; panel.classList.toggle('is-busy', b); setStatus(b ? 'busy' : 'ok');
    if (b) setPetMood('think');
    else setPetMood('awake', 7000);
  }

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
      spawnPetSpark('✦');
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
        var del = document.createElement('button'); del.type = 'button'; del.className = 'vai__mini vai__mini--del'; del.setAttribute('aria-label', 'Hapus percakapan'); del.innerHTML = CLOSE_ICON_SM;
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
      state.conv = null;
      store.del(CONV_KEY);
      welcome();
      getSessionToken(false).catch(function () {});
    }
    setTimeout(function () { input.focus(); }, 60);
  }
  /* Also reset chat cleanly if restored from browser back-forward cache */
  window.addEventListener('pageshow', function (ev) {
    if (ev.persisted) {
      state.conv = null;
      state.loaded = false;
      store.del(CONV_KEY);
      store.del(SESS_KEY);
      drawer.hidden = true;
      welcome();
    }
  });
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
  input.addEventListener('input', function () {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    if (!state.busy && input.value.trim()) setPetMood('peek', 6500);
  });
  input.addEventListener('blur', function () {
    if (!state.busy && petState.mood === 'peek') setPetMood('sleep');
  });
})();
