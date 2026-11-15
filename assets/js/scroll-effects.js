
/* Scroll FX: lapisan animasi tambahan. Tidak mengubah isi atau router halaman. */
(function () {
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
  var ease = function (t) { return 1 - Math.pow(1 - t, 3); };
  var canPin = window.innerWidth > 860 && window.innerHeight >= 620;

  /* ---- judul: kata di dalam masker ---- */
  var heads = $$('h1.h-xl, h2.h-lg, .lines h1, .lines h2, .sub, p.body').filter(function (h) {
    return !h.children.length && !h.matches('.hero .sub, .pagehead .sub');
  });
  heads.forEach(function (h) {
    var words = h.textContent.trim().split(/\s+/);
    h.setAttribute('aria-label', words.join(' '));
    h.textContent = '';
    words.forEach(function (w, i) {
      var m = document.createElement('span'), s = document.createElement('span');
      m.className = 'fx-m'; m.setAttribute('aria-hidden', 'true');
      s.className = 'fx-w'; s.style.setProperty('--i', i); s.textContent = w;
      m.appendChild(s); h.appendChild(m);
      if (i < words.length - 1) h.appendChild(document.createTextNode(' '));
    });
    h._w = h.querySelectorAll('.fx-w');
    if (h.matches('h1')) h.classList.add('fx-intro');
  });
  var scrub = heads.filter(function (h) { return !h.classList.contains('fx-intro'); });

  /* ---- seksi terkunci (kartu naik satu per satu mengikuti scroll) ---- */
  var pins = [];
  if (canPin) {
    $$('.dark--grad').forEach(function (sec) {
      var cards = $$('.gcard', sec);
      if (cards.length < 2) return;
      sec.classList.add('pin');
      sec.style.height = '280vh';
      pins.push({ sec: sec, cards: cards });
    });
  }

  /* ---- kartu naik biasa ---- */
  var seq = $$('#teknologi .stack .fcard');
  seq.forEach(function (el) { el.classList.add('fx-seq'); });
  var riseSel = '.stats, .photo, .checks li, .bento > *, .komp__grid > *, .why > *, .goal > *, .f3, .collage__sq, .mock, .pcard, .gcard, .cards3 > *, .node--top, .division, .diagram, .form, .table-wrap, .footer__grid > *, .panel .stack > *';
  var rise = $$(riseSel).filter(function (el) { return !el.closest('#teknologi .stack') && !el.closest('.pin'); });
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: .12, rootMargin: '0px 0px -6% 0px' }) : null;
  rise.forEach(function (el) {
    var sib = Array.prototype.indexOf.call(el.parentNode.children, el);
    el.classList.add('fx-rise');
    el.style.setProperty('--d', (sib % 4) * 0.1 + 's');
    el.style.setProperty('--r', ((sib % 3) - 1) * 2.4 + 'deg');
    if (io) io.observe(el); else el.classList.add('in');
  });

  var tSel = '.eyebrow, .fcard small, .fcard h3, .fcard p, .pcard small, .pcard h3, .pcard .lab, .pcard li, .gcard h3, .gcard p, .gcard li, .note-box, p.body, .node h3, .node small, .slot, .footer h4, .footer li, .footer__base > span, .stats strong, .stats span, .stats-note, .helper, .field label, figcaption, .tile strong';
  var texts = $$(tSel).filter(function (el) { return !el._w && !el.matches('.hero .eyebrow, .pagehead .eyebrow'); });
  texts.forEach(function (el) {
    var sib = Array.prototype.indexOf.call(el.parentNode.children, el);
    el.classList.add('fx-t');
    el.style.setProperty('--d', (.12 + (sib % 6) * .07).toFixed(2) + 's');
    if (io) io.observe(el); else el.classList.add('in');
  });

  /* ---- gelembung air ---- */
  function orb(sec, css, s) {
    if (!sec) return;
    var o = document.createElement('i');
    o.className = 'fx-orb'; o.setAttribute('aria-hidden', 'true'); o.dataset.s = s; o.style.cssText = css;
    sec.insertBefore(o, sec.firstChild);
  }
  var hero = document.querySelector('.hero'), dk = document.querySelector('.dark--plus');
  var floaters = $$('.hex, .fx-orb');
  floaters.forEach(function (el, i) { if (!el.dataset.s) el.dataset.s = i % 2 ? -.14 : .12; });

  var nav = document.querySelector('.nav');
  var heroWrap = document.querySelector('.hero > .wrap');
  var tiles = $$('.tile');
  var marks = $$('.diagram svg > g > g');
  var bar = document.createElement('div'); bar.className = 'fx-bar'; document.body.appendChild(bar);
  var ticking = false;

  /* ---- gelembung yang muncul setiap scroll ---- */
  var cv = document.createElement('canvas');
  cv.className = 'fx-bubbles'; cv.setAttribute('aria-hidden', 'true'); document.body.appendChild(cv);
  var cx = cv.getContext('2d'), dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, VH = 0, bubbles = [], running = false, svel = 0, lastY = window.pageYOffset, lastSpawn = 0;
  function fit() { W = window.innerWidth; VH = window.innerHeight; cv.width = W * dpr; cv.height = VH * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  fit();
  function spawn(n) {
    var pal = document.documentElement.dataset.pal;
    for (var i = 0; i < n && bubbles.length < 45; i++) {
      var edge = Math.random() < .75, left = Math.random() < .5, q = Math.random(), o = null;
      var ex = edge ? (left ? Math.random() * W * .25 : W - Math.random() * W * .25) : Math.random() * W;
      if (pal === 'sakura') o = { k: 'f', r: 6 + Math.random() * 7 };
      else if (pal === 'teratai') o = q < .45 ? { k: 'r', r: 4 } : { k: 'lp', r: 6 + Math.random() * 6 };
      else if (pal === 'carousel') o = q < .7 ? { k: 'cf', r: 3 + Math.random() * 3 } : { k: 'st', r: 4 + Math.random() * 5 };
      if (o) {
        var rp = o.k === 'r';
        o.p = 1; o.x = ex; o.y = rp ? VH * (.25 + Math.random() * .7) : -o.r * 1.5 + Math.random() * VH * .4;
        o.vy = rp ? 0 : -((o.k === 'lp' ? .3 : .5) + Math.random() * (o.k === 'lp' ? .6 : 1));
        o.ph = Math.random() * 6.28; o.f = .012 + Math.random() * .02; o.amp = rp ? 0 : .5 + Math.random() * .7;
        o.life = 0; o.d = rp ? 0 : .35 + o.r / 40; o.rot = Math.random() * 6.28;
        o.spin = (Math.random() - .5) * (o.k === 'cf' ? .12 : .05); o.tf = .03 + Math.random() * .04; o.tone = Math.random();
        bubbles.push(o); continue;
      }
      var r = 3 + Math.random() * Math.random() * 15, bottom = Math.random() < .55;
      bubbles.push({ x: ex, y: bottom ? VH + r : VH * (.3 + Math.random() * .65), r: r,
        vy: .6 + Math.random() * 1.3 + (30 - r) / 30, ph: Math.random() * 6.28, f: .015 + Math.random() * .03,
        amp: .2 + Math.random() * .5, life: 0, d: .35 + r / 40 });
    }
    if (!running) { running = true; requestAnimationFrame(tick); }
  }
  function vxc(n) { return (getComputedStyle(document.documentElement).getPropertyValue(n) || '0,180,216').trim(); }
  function rgba(c, a) { return 'rgba(' + c + ',' + a.toFixed(3) + ')'; }
  function tick() {
    cx.clearRect(0, 0, W, VH);
    svel *= .9;
    for (var i = bubbles.length - 1; i >= 0; i--) {
      var b = bubbles[i]; b.life++;
      b.y -= b.vy + svel * (b.p ? .05 : .25) * b.d;
      b.x += Math.sin(b.life * b.f + b.ph) * b.amp;
      var mid = Math.abs(b.x - W / 2) < Math.min(W * .4, 520) ? .3 : .9;
      if (b.p) {
        b.rot += b.spin;
        if (b.k === 'r') {
          var ar = Math.max(0, 1 - b.life / 80) * mid;
          if (ar <= 0) { bubbles.splice(i, 1); continue; }
          for (var j = 0; j < 2; j++) {
            var rr = b.r + b.life * .8 - j * 10; if (rr <= 0) continue;
            cx.beginPath(); cx.ellipse(b.x, b.y, rr, rr * .42, 0, 0, 6.283);
            cx.lineWidth = 1.4; cx.strokeStyle = rgba(vxc('--sky-rgb'), .6 * ar * (1 - j * .4)); cx.stroke();
          }
          continue;
        }
        var ap = Math.min(1, b.life / 18) * clamp((VH - b.y + b.r) / (VH * .22)) * mid;
        if (b.y > VH + 40 || b.y < -b.r * 8 || ap <= 0) { bubbles.splice(i, 1); continue; }
        var s1 = b.r * 1.6, fl = b.k === 'st' ? 1 : Math.max(.28, Math.abs(Math.cos(b.life * b.tf + b.ph)));
        cx.save(); cx.translate(b.x, b.y); cx.rotate(b.rot); cx.scale(fl, 1);
        if (b.k === 'f') {            /* bunga sakura: 5 kelopak bertakik */
          var gr = cx.createRadialGradient(0, 0, 0, 0, 0, s1);
          gr.addColorStop(0, 'rgba(236,128,170,' + .95 * ap + ')'); gr.addColorStop(.45, 'rgba(250,196,216,' + .95 * ap + ')'); gr.addColorStop(1, 'rgba(255,241,246,' + .95 * ap + ')');
          cx.fillStyle = gr; cx.strokeStyle = 'rgba(222,120,160,' + .45 * ap + ')'; cx.lineWidth = .7;
          for (var k = 0; k < 5; k++) {
            cx.save(); cx.rotate(k * 1.2566); cx.beginPath(); cx.moveTo(0, 0);
            cx.bezierCurveTo(-s1 * .62, -s1 * .3, -s1 * .58, -s1 * 1.02, -s1 * .13, -s1);
            cx.lineTo(0, -s1 * .8); cx.lineTo(s1 * .13, -s1);
            cx.bezierCurveTo(s1 * .58, -s1 * 1.02, s1 * .62, -s1 * .3, 0, 0); cx.closePath(); cx.fill(); cx.stroke(); cx.restore();
          }
          cx.strokeStyle = 'rgba(214,84,132,' + .8 * ap + ')'; cx.lineWidth = .8; cx.beginPath();
          for (k = 0; k < 5; k++) { var an = k * 1.2566 + .3; cx.moveTo(0, 0); cx.lineTo(Math.sin(an) * s1 * .34, -Math.cos(an) * s1 * .34); }
          cx.stroke(); cx.fillStyle = 'rgba(206,64,114,' + ap + ')'; cx.beginPath(); cx.arc(0, 0, s1 * .08, 0, 6.283); cx.fill();
        } else if (b.k === 'lp') {    /* kelopak teratai */
          var lg = cx.createLinearGradient(0, s1, 0, -s1);
          lg.addColorStop(0, rgba(vxc('--cyan-rgb'), .95 * ap)); lg.addColorStop(1, 'rgba(255,244,246,' + .95 * ap + ')');
          cx.beginPath(); cx.moveTo(0, s1); cx.bezierCurveTo(-s1 * .75, s1 * .3, -s1 * .5, -s1 * .6, 0, -s1);
          cx.bezierCurveTo(s1 * .5, -s1 * .6, s1 * .75, s1 * .3, 0, s1); cx.closePath();
          cx.fillStyle = lg; cx.fill(); cx.lineWidth = .8; cx.strokeStyle = rgba(vxc('--cyan-rgb'), .5 * ap); cx.stroke();
          cx.beginPath(); cx.moveTo(0, s1 * .8); cx.lineTo(0, -s1 * .6); cx.stroke();
        } else if (b.k === 'cf') {    /* konfeti */
          cx.fillStyle = rgba(vxc(b.tone < .4 ? '--cyan-rgb' : b.tone < .75 ? '--sky-rgb' : '--blue-rgb'), .95 * ap);
          cx.fillRect(-b.r, -b.r * .5, b.r * 2, b.r);
        } else {                      /* kilau emas */
          var sz = b.r * 1.4, tw = .55 + .45 * Math.sin(b.life * .15 + b.ph);
          cx.beginPath(); cx.moveTo(0, -sz); cx.quadraticCurveTo(0, 0, sz, 0); cx.quadraticCurveTo(0, 0, 0, sz);
          cx.quadraticCurveTo(0, 0, -sz, 0); cx.quadraticCurveTo(0, 0, 0, -sz);
          cx.shadowColor = rgba(vxc('--cyan-rgb'), .8 * ap); cx.shadowBlur = 8;
          cx.fillStyle = 'rgba(255,238,176,' + (.95 * ap * tw).toFixed(3) + ')'; cx.fill(); cx.shadowBlur = 0;
        }
        cx.restore(); continue;
      }
      var a = Math.min(1, b.life / 18) * clamp((b.y + b.r) / (VH * .22)) * mid;
      if (b.y < -b.r * 2 || b.y > VH + 260 || a <= 0) { bubbles.splice(i, 1); continue; }
      var g = cx.createRadialGradient(b.x - b.r * .35, b.y - b.r * .35, b.r * .1, b.x, b.y, b.r);
      g.addColorStop(0, 'rgba(255,255,255,' + (.8 * a).toFixed(3) + ')');
      g.addColorStop(.55, 'rgba(' + vxc('--sky-rgb') + ',' + (.3 * a).toFixed(3) + ')');
      g.addColorStop(1, 'rgba(' + vxc('--blue-rgb') + ',' + (.2 * a).toFixed(3) + ')');
      cx.beginPath(); cx.arc(b.x, b.y, b.r, 0, 6.283); cx.fillStyle = g; cx.fill();
      cx.lineWidth = 1.2; cx.strokeStyle = 'rgba(' + vxc('--cyan-rgb') + ',' + (.6 * a).toFixed(3) + ')'; cx.stroke();
      cx.beginPath(); cx.arc(b.x - b.r * .36, b.y - b.r * .4, Math.max(1, b.r * .2), 0, 6.283);
      cx.fillStyle = 'rgba(255,255,255,' + (.95 * a).toFixed(3) + ')'; cx.fill();
    }
    if (bubbles.length) requestAnimationFrame(tick); else { running = false; cx.clearRect(0, 0, W, VH); }
  }
  window.addEventListener('scroll', function () {
    var y = window.pageYOffset, dy = y - lastY, now = performance.now();
    lastY = y;
    svel = Math.max(-30, Math.min(30, svel * .5 + dy));
    if (Math.abs(dy) > 1 && now - lastSpawn > 50) { lastSpawn = now; spawn(Math.min(2, 1 + Math.floor(Math.abs(dy) / 40))); }
  }, { passive: true });
  setTimeout(function () { spawn(6); }, 700);
  new MutationObserver(function () { bubbles.length = 0; spawn(9); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-pal'] });

  function frame() {
    ticking = false;
    var vh = window.innerHeight, y = window.pageYOffset;
    var max = document.documentElement.scrollHeight - vh;
    bar.style.transform = 'scaleX(' + (max > 0 ? clamp(y / max) : 0).toFixed(4) + ')';
    if (nav) nav.classList.toggle('is-compact', y > 60);

    if (heroWrap && heroWrap.offsetParent !== null) {
      heroWrap.style.transform = 'translateY(' + (y * .22).toFixed(1) + 'px)';
      heroWrap.style.opacity = clamp(1 - y / (vh * .85)).toFixed(3);
    }

    scrub.forEach(function (h) {
      var r = h.getBoundingClientRect();
      if (!r.height) return;
      var p = clamp((vh * .92 - r.top) / (vh * .37)), n = h._w.length;
      for (var i = 0; i < n; i++) {
        var wp = clamp((p * (n + 2) - i) / 2), s = h._w[i].style;
        s.opacity = (.18 + .82 * wp).toFixed(3);
        s.transform = 'translateY(' + ((1 - ease(wp)) * 105).toFixed(1) + '%)';
      }
    });

    pins.forEach(function (pn) {
      if (pn.sec.offsetParent === null) return;
      var r = pn.sec.getBoundingClientRect(), total = pn.sec.offsetHeight - vh;
      var p = total > 0 ? clamp(-r.top / total) : 0, rot = [-6, 5, -5];
      pn.cards.forEach(function (c, i) {
        var e = ease(clamp((p - (.06 + i * .24)) / .26));
        c.style.opacity = clamp(e * 1.5).toFixed(3);
        c.style.transform = 'translateY(' + ((1 - e) * vh * .65).toFixed(1) + 'px) rotate(' + ((1 - e) * (rot[i % 3])).toFixed(2) + 'deg)';
      });
    });

    if (seq.length && seq[0].offsetParent !== null) {
      var best = 0, bd = 1e9;
      seq.forEach(function (c, i) {
        var r = c.getBoundingClientRect(), d = Math.abs(r.top + r.height / 2 - vh * .5);
        c.classList.toggle('on', r.top < vh * .8);
        if (d < bd) { bd = d; best = i; }
      });
      seq.forEach(function (c, i) { c.classList.toggle('cur', i === best); });
      marks.forEach(function (m, i) { m.classList.toggle('is-on', i === best); });
    }

    tiles.forEach(function (t) {
      var r = t.getBoundingClientRect();
      if (!r.height || r.bottom < 0 || r.top > vh) return;
      t.firstElementChild.style.translate = '0 ' + (((r.top + r.height / 2 - vh / 2) / vh) * r.height * -.16).toFixed(1) + 'px';
    });

    floaters.forEach(function (el) {
      var pr = el.parentElement.getBoundingClientRect();
      if (!pr.height || pr.bottom < -200 || pr.top > vh + 200) return;
      var off = (pr.top + pr.height / 2 - vh / 2) * -parseFloat(el.dataset.s);
      el.style.translate = '0 ' + off.toFixed(1) + 'px';
      if (el.classList.contains('hex')) el.style.rotate = (off * .12).toFixed(1) + 'deg';
    });
  }
  function req() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  window.addEventListener('scroll', req, { passive: true });
  window.addEventListener('resize', function () { fit(); req(); });
  window.addEventListener('hashchange', function () {
    var pg = document.getElementById((location.hash || '#beranda').slice(1));
    if (pg && io) {
      $$('.fx-rise.in, .fx-t.in', pg).forEach(function (el) {
        el.style.transition = 'none'; el.classList.remove('in'); void el.offsetWidth; el.style.transition = ''; io.observe(el);
      });
    }
    spawn(8); setTimeout(req, 30);
  });
  frame();
})();
