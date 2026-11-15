
/* Vortex Hydro: interaksi halaman */
(function () {
  var toggle = document.querySelector('.nav__toggle');
  var panel = document.getElementById('nav-panel');
  if (toggle && panel) {
    toggle.addEventListener('click', function () {
      var open = panel.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  var form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var s = document.getElementById('form-status');
      s.hidden = false;
      s.textContent = 'Ini tampilan contoh. Hubungkan formulir ke layanan email sebelum situs dipublikasikan.';
    });
  }

  var fab = document.querySelector('.fab');
  if (fab) {
    fab.addEventListener('click', function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
})();
/* Navigasi antar halaman (hash) */
(function () {
  var ids = ['beranda', 'tentang', 'teknologi', 'dokumentasi', 'struktur-tim', 'faq', 'dashboard'];
  var names = { beranda: 'Vortex Hydro', tentang: 'Tentang', teknologi: 'Teknologi', dokumentasi: 'Dokumentasi', 'struktur-tim': 'Struktur Tim', faq: 'FAQ', dashboard: 'Dashboard' };
  function route() {
    var h = (location.hash || '#beranda').slice(1);
    if (ids.indexOf(h) < 0) h = 'beranda';
    ids.forEach(function (id) { document.getElementById(id).hidden = (id !== h); });
    document.body.classList.toggle('is-home', h === 'beranda');
    document.querySelectorAll('.nav__links a').forEach(function (a) {
      if (a.getAttribute('href') === '#' + h) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    document.title = h === 'beranda' ? 'Vortex Hydro' : names[h] + ' | Vortex Hydro';
    var p = document.getElementById('nav-panel'); if (p) p.classList.remove('is-open');
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);
  route();
})();
