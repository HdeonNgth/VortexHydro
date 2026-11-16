
/* Pemilih palet warna + efek tools (menggantikan tool "Ukuran teks") */
(function () {
  var H = document.documentElement;
  var PALS = [
    { id: 'biru', name: 'Vortex Biru', note: 'Palet asli situs', sw: ['#03045E', '#0077B6', '#00B4D8', '#90E0EF', '#CAF0F8'] },
    { id: 'carousel', name: 'Karusel', note: 'Bistre · Goldfinch · Garnet', sw: ['#210100', '#8C0902', '#B14A36', '#E6A341', '#FECE79'] },
    { id: 'sakura', name: 'Sakura Malam', note: 'Rose Garden · Mulled Wine', sw: ['#2B1F21', '#423048', '#553758', '#D09DB8', '#FCEFFA'] },
    { id: 'teratai', name: 'Teratai', note: 'Dark Green · Moss · Rosy Brown', sw: ['#0A3323', '#105666', '#839958', '#D3968C', '#F7F4D5'] }
  ];
  var CK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  var cur = H.dataset.pal || 'biru';
  var busy = false;
  var $ = function (i) { return document.getElementById(i); };
  var noanim = function () { return H.classList.contains('vx-noanim') || !document.body.animate; };

  function build() {
    var box = $('pall'); if (!box || box.children.length) return;
    box.innerHTML = PALS.map(function (p, ci) {
      var s = p.sw, pie = 'conic-gradient(from -90deg,' + s.map(function (c, k) { return c + ' ' + k * 20 + '% ' + (k + 1) * 20 + '%'; }).join(',') + ')';
      return '<button type="button" class="pal__c" data-p="' + p.id + '" aria-pressed="' + (p.id === cur) + '" aria-label="Palet ' + p.name + '" title="' + p.name + '" style="--c:' + ci + '">' +
        '<span class="pal__dot" style="--pie:' + pie + '"></span><span class="pal__ck">' + CK + '</span></button>';
    }).join('') + '<p class="pal__cap" id="palcap"></p>';
    mark();
  }
  function mark() {
    var box = $('pall'); if (!box) return;
    Array.prototype.forEach.call(box.querySelectorAll('.pal__c'), function (b) { b.setAttribute('aria-pressed', b.dataset.p === cur); });
    var cap = $('palcap'), p = PALS.filter(function (x) { return x.id === cur; })[0];
    if (cap && p) cap.innerHTML = '<b>' + p.name + '</b><span>' + p.note + '</span>';
  }
  function apply(id) {
    cur = id;
    if (id === 'biru') H.removeAttribute('data-pal'); else H.setAttribute('data-pal', id);
    try { localStorage.setItem('vxpal', id); } catch (e) {}
    mark();
  }

  /* percikan warna palet */
  function confetti(ox, oy, colors, n, spread, grav) {
    if (noanim()) return;
    for (var i = 0; i < n; i++) {
      var d = document.createElement('i'); d.className = 'vxfx';
      var sz = 5 + Math.random() * 7, c = colors[i % colors.length];
      d.style.cssText = 'width:' + sz + 'px;height:' + sz * (Math.random() < .5 ? 1 : .55) + 'px;border-radius:' + (Math.random() < .5 ? '50%' : '2px') + ';background:' + c + ';left:' + ox + 'px;top:' + oy + 'px;box-shadow:0 0 8px ' + c;
      document.body.appendChild(d);
      var ang = Math.PI * (1 + Math.random() * .62) + (spread === 'all' ? Math.random() * Math.PI * 2 : 0);
      var dist = 90 + Math.random() * (spread === 'all' ? 90 : 300), dx = Math.cos(ang) * dist, dy = Math.sin(ang) * dist;
      var g = grav || 0, rot = (Math.random() - .5) * 720;
      d.animate([
        { transform: 'translate(-50%,-50%) translate(0,0) rotate(0) scale(0)', opacity: 1 },
        { transform: 'translate(-50%,-50%) translate(' + dx * .7 + 'px,' + dy * .7 + 'px) rotate(' + rot * .6 + 'deg) scale(1)', opacity: 1, offset: .45 },
        { transform: 'translate(-50%,-50%) translate(' + dx + 'px,' + (dy + g) + 'px) rotate(' + rot + 'deg) scale(.4)', opacity: 0 }
      ], { duration: 800 + Math.random() * 700, easing: 'cubic-bezier(.2,.7,.3,1)', delay: Math.random() * 120 }).onfinish = (function (e) { return function () { e.remove(); }; })(d);
    }
  }

  /* ganti palet dengan gelombang membesar dari tombol */
  function swap(id, ox, oy) {
    if (busy || id === cur) return;
    var p = PALS.filter(function (x) { return x.id === id; })[0];
    if (noanim()) { apply(id); return; }
    busy = true;
    var W = innerWidth, Hh = innerHeight, r = Math.hypot(Math.max(ox, W - ox), Math.max(oy, Hh - oy)) + 60;
    var o = document.createElement('div'); o.className = 'vxwave';
    o.style.cssText = 'left:' + (ox - r) + 'px;top:' + (oy - r) + 'px;width:' + 2 * r + 'px;height:' + 2 * r + 'px;background:radial-gradient(circle at center,' + p.sw[4] + ' 0,' + p.sw[3] + ' 22%,' + p.sw[2] + ' 46%,' + p.sw[1] + ' 74%,' + p.sw[0] + ' 100%)';
    var ring = document.createElement('div'); ring.className = 'vxwring';
    ring.style.cssText = 'left:' + (ox - r) + 'px;top:' + (oy - r) + 'px;width:' + 2 * r + 'px;height:' + 2 * r + 'px';
    document.body.appendChild(o); document.body.appendChild(ring);
    var dur = 900, ease = 'cubic-bezier(.65,0,.25,1)';
    ring.animate([{ transform: 'scale(0)', opacity: 1 }, { transform: 'scale(1)', opacity: .9, offset: .95 }, { transform: 'scale(1)', opacity: 0 }], { duration: dur, easing: ease, fill: 'forwards' });
    var a = o.animate([{ transform: 'scale(0)', opacity: 1 }, { transform: 'scale(1)', opacity: 1 }], { duration: dur, easing: ease, fill: 'forwards' });
    confetti(ox, oy, p.sw.concat(['#ffffff']), 34, 'up', 160);
    setTimeout(function () { H.classList.add('vx-theming'); apply(id); }, dur * .72);
    a.onfinish = function () {
      var f = o.animate([{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(1.06)' }], { duration: 750, easing: 'ease-out', fill: 'forwards' });
      f.onfinish = function () { o.remove(); ring.remove(); busy = false; setTimeout(function () { H.classList.remove('vx-theming'); }, 300); };
    };
  }

  function center(el) { var r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }
  function fab() { return $('vxb'); }

  window.VXPAL = {
    toggle: function (btn) {
      build();
      var pan = $('vxpal'), calc = $('vxp'), on = !pan.classList.contains('show');
      if (calc) calc.classList.remove('show');
      var c = document.querySelector('.vxt__it[data-a=calc]'); if (c) c.classList.remove('on');
      pan.classList.toggle('show', on);
      if (btn) btn.classList.toggle('on', on);
    },
    close: function () {
      var pan = $('vxpal'); if (pan) pan.classList.remove('show');
      var b = document.querySelector('.vxt__it[data-a=palette]'); if (b) b.classList.remove('on');
    },
    set: swap
  };

  document.addEventListener('click', function (e) {
    var card = e.target.closest && e.target.closest('.pal__c');
    if (card) { var c = center(fab() || card); swap(card.dataset.p, c[0], c[1]); return; }
    if (e.target.closest && e.target.closest('#vxpc')) VXPAL.close();
  });

  /* ripple + percikan pada klik tombol alat */
  document.addEventListener('click', function (e) {
    var it = e.target.closest && e.target.closest('.vxt__it'); if (!it || noanim()) return;
    var rip = document.createElement('i'); rip.className = 'vxt__rip'; it.appendChild(rip);
    setTimeout(function () { rip.remove(); }, 800);
    var c = center(it);
    var cs = getComputedStyle(H);
    var col = ['#ffffff'];
    ['--cyan', '--sky', '--lite'].forEach(function (v) { col.push(cs.getPropertyValue(v).trim() || '#00B4D8'); });
    confetti(c[0], c[1], col, 12, 'all', 0);
  }, true);

  /* tombol utama: percikan saat dibuka */
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('#vxb'); if (!b || noanim()) return;
    var c = center(b), cs = getComputedStyle(H);
    setTimeout(function () {
      if (!$('vxt').classList.contains('open')) return;
      confetti(c[0], c[1], [cs.getPropertyValue('--cyan').trim(), cs.getPropertyValue('--sky').trim(), '#ffffff', cs.getPropertyValue('--lite').trim()], 16, 'up', 40);
    }, 120);
  }, true);

  /* kalkulator: angka berdenyut saat berubah */
  document.addEventListener('input', function (e) {
    if (!e.target.closest || !e.target.closest('#vxp')) return;
    var r = $('vr'); if (!r) return; r.classList.add('pulse'); clearTimeout(r._t); r._t = setTimeout(function () { r.classList.remove('pulse'); }, 160);
  });

  if (document.readyState !== 'loading') build(); else document.addEventListener('DOMContentLoaded', build);
})();
