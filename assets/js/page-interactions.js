
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
      var reduced = document.documentElement.classList.contains('vx-noanim');
      window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    });
  }
})();
/* Navigasi antar halaman (hash) */
(function () {
  var ids = ['beranda', 'tentang', 'dokumentasi', 'struktur-tim', 'faq', 'dashboard'];
  var names = { beranda: 'Vortex Hydro', tentang: 'Tentang', dokumentasi: 'Dokumentasi', 'struktur-tim': 'Struktur Tim', faq: 'FAQ', dashboard: 'Dashboard' };
  var dashboard = document.getElementById('dashboard');
  var dashboardContent = dashboard && dashboard.querySelector('.dash');
  var locked = document.createElement('section');
  locked.className = 'dashboard-locked';
  locked.setAttribute('aria-labelledby', 'dashboard-locked-title');
  locked.hidden = true;
  var lockedTitle = document.createElement('h1');
  lockedTitle.id = 'dashboard-locked-title';
  lockedTitle.textContent = 'Dashboard khusus admin';
  var lockedMessage = document.createElement('p');
  lockedMessage.textContent = 'Data sensor realtime dan riwayat kunjungan hanya dapat dilihat oleh admin.';
  var loginButton = document.createElement('button');
  loginButton.className = 'btn btn--navy';
  loginButton.type = 'button';
  loginButton.setAttribute('data-vx-admin-login', '');
  loginButton.textContent = 'Login Admin';
  locked.appendChild(lockedTitle);
  locked.appendChild(lockedMessage);
  locked.appendChild(loginButton);
  if (dashboard) dashboard.insertBefore(locked, dashboard.firstChild);

  function route() {
    var h = (location.hash || '#beranda').slice(1);
    if (ids.indexOf(h) < 0) h = 'beranda';
    var session = window.VXAuth ? window.VXAuth.state() : null;
    var isAdmin = !!(session && session.authenticated && session.role === 'admin');
    var isLockedDashboard = h === 'dashboard' && !isAdmin;
    ids.forEach(function (id) { document.getElementById(id).hidden = (id !== h); });
    if (dashboardContent) dashboardContent.hidden = isLockedDashboard;
    locked.hidden = !isLockedDashboard;
    document.body.classList.toggle('is-home', h === 'beranda');
    document.querySelectorAll('.nav__links a').forEach(function (a) {
      if (a.getAttribute('href') === '#' + h) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    document.title = h === 'beranda' ? 'Vortex Hydro' : names[h] + ' | Vortex Hydro';
    var p = document.getElementById('nav-panel'); if (p) p.classList.remove('is-open');
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);
  window.addEventListener('vx:authchange', route);
  route();
})();
