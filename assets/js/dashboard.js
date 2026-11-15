
(function () {
  var $ = function (q, r) { return Array.prototype.slice.call((r || document).querySelectorAll(q)); };
  var store = { get: function (k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  var toast = document.createElement('div'); toast.className = 'toast'; toast.setAttribute('role', 'status'); document.body.appendChild(toast);
  function say(t) { toast.textContent = t; toast.classList.add('on'); clearTimeout(say.t); say.t = setTimeout(function () { toast.classList.remove('on'); }, 1800); }

  /* simulator saluran */
  var q = document.getElementById('sim-q');
  if (q) q.addEventListener('input', function () {
    var v = +q.value, root = q.closest('.sim');
    root.style.setProperty('--t', (6 / v).toFixed(2) + 's');
    document.getElementById('sim-qv').textContent = v + ' L/s';
    document.getElementById('sim-p').textContent = (0.35 * 9810 * (v / 1000) * 0.235).toFixed(1).replace('.', ',') + ' W';
  }), q.dispatchEvent(new Event('input'));

  /* bagian bisa diisi: tabel parameter dan nama tim */
  function editable(el, key, i, empty) {
    el.contentEditable = 'true'; el.spellcheck = false; el.setAttribute('role', 'textbox');
    var all = store.get(key) || {}; if (all[i]) el.textContent = all[i];
    el.addEventListener('focus', function () { if (el.textContent.trim() === empty) el.textContent = ''; });
    el.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); el.blur(); } });
    el.addEventListener('blur', function () { var t = el.textContent.trim(), a = store.get(key) || {}; if (!t) { el.textContent = empty; delete a[i]; } else { a[i] = t; } store.set(key, a); });
  }
  $('td.fill').forEach(function (td, i) { editable(td, 'vh-param', i, td.textContent.trim()); });
  $('.edit').forEach(function (el, i) { editable(el, 'vh-tim', i, el.textContent.trim()); });
  $('.division h3').forEach(function (el, i) { editable(el, 'vh-div', i, el.textContent.trim()); });
  [['.table-wrap', 'Klik kolom nilai untuk mengisi. Tersimpan di browser ini.'], ['.org', 'Klik nama divisi atau anggota untuk menggantinya.']].forEach(function (x) {
    var e = document.querySelector(x[0]); if (e) { var p = document.createElement('p'); p.className = 'hint'; p.textContent = x[1]; e.parentNode.insertBefore(p, e.nextSibling); }
  });

  /* diagram teknologi: klik nomor atau kartu */
  var cards = $('#teknologi .stack .fcard'), marks = $('.diagram svg > g > g');
  function pick(i) { if (cards[i]) cards[i].scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  marks.forEach(function (m, i) { m.addEventListener('click', function () { pick(i); }); });
  cards.forEach(function (c, i) { c.addEventListener('click', function () { cards.forEach(function (x) { x.classList.remove('cur'); }); c.classList.add('cur'); marks.forEach(function (m, j) { m.classList.toggle('is-on', j === i); }); }); });

  /* dokumentasi: kategori bisa dipilih */
  var grid = document.querySelector('#dokumentasi .docgrid');
  if (grid) {
    var panel = document.createElement('div'); panel.id = 'doc-panel'; panel.hidden = true; grid.parentNode.appendChild(panel);
    $('.tile', grid).forEach(function (t) { t.addEventListener('click', function (e) {
      e.preventDefault(); $('.tile', grid).forEach(function (x) { x.classList.remove('sel'); }); t.classList.add('sel');
      panel.hidden = false; panel.innerHTML = '<h3></h3><p class="hint">Belum ada tulisan di kategori ini. Isi dengan dokumentasi proyek saat sudah tersedia.</p>';
      panel.firstChild.textContent = t.textContent.trim();
    }); });
  }

  /* kontak: salin dan validasi */
  $('#kontak .stack .fcard').forEach(function (c) { c.dataset.copy = '1'; c.addEventListener('click', function () {
    var t = c.querySelector('h3').textContent.replace(/\.$/, '');
    if (navigator.clipboard) navigator.clipboard.writeText(t).then(function () { say('Tersalin: ' + t); }, function () { say('Tidak bisa menyalin'); }); else say(t);
  }); });
  var f = document.getElementById('contact-form');
  if (f) f.addEventListener('submit', function (e) {
    var bad = $('input, textarea', f).filter(function (x) { return !x.value.trim(); });
    if (bad.length) { e.stopImmediatePropagation(); e.preventDefault(); bad.forEach(function (x) { x.classList.remove('shake'); void x.offsetWidth; x.classList.add('shake'); }); bad[0].focus(); say('Lengkapi ' + bad[0].previousElementSibling.textContent.toLowerCase() + ' dulu'); }
  }, true);
})();
