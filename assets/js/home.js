
(function () {
  var hx = document.querySelector('.hx');
  function chk() { document.body.classList.toggle('past-hero', window.pageYOffset > hx.offsetHeight - 90); }
  window.addEventListener('scroll', chk, { passive: true }); window.addEventListener('resize', chk);
  window.addEventListener('hashchange', function () { setTimeout(chk, 0); }); chk();
  var m = document.getElementById('hx-menu'), l = document.getElementById('hx-links');
  if (m) m.addEventListener('click', function () { var o = l.classList.toggle('open'); m.setAttribute('aria-expanded', o ? 'true' : 'false'); });
  if (l) l.addEventListener('click', function () { l.classList.remove('open'); m.setAttribute('aria-expanded', 'false'); });
})();
