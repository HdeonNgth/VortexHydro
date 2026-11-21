/* Vortex Hydro: router SPA & interaksi navigasi */
(function () {
  var ids = ['beranda', 'tentang', 'dokumentasi', 'struktur-tim', 'dashboard'];
  var names = {
    beranda: 'Vortex Hydro',
    tentang: 'Tentang & Teknologi',
    dokumentasi: 'Dokumentasi & FAQ',
    'struktur-tim': 'Struktur Tim',
    dashboard: 'Dashboard'
  };

  var dashboard = document.getElementById('dashboard');
  var dashboardContent = dashboard && dashboard.querySelector('.dash');
  var locked = document.createElement('section');
  locked.className = 'dashboard-locked';
  locked.setAttribute('aria-labelledby', 'dashboard-locked-title');
  locked.hidden = true;
  locked.innerHTML =
    '<div class="dashboard-locked__card">' +
      '<span class="dashboard-locked__icon" aria-hidden="true">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="10" width="16" height="11" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>' +
      '</span>' +
      '<span class="eyebrow">Akses Terbatas</span>' +
      '<h1 id="dashboard-locked-title">Dashboard Khusus Admin</h1>' +
      '<p>Panel telemetri sensor simulasi, grafik pemantauan 60 detik, dan diagnostik prototipe hanya dapat dibuka menggunakan akses Administrator.</p>' +
      '<div class="dashboard-locked__actions">' +
        '<button class="btn btn--primary" type="button" data-vx-admin-login>Login Admin</button>' +
        '<a class="btn btn--ghost" href="#tentang">Lihat Spesifikasi Alat</a>' +
      '</div>' +
      '<small class="dashboard-locked__hint">Mode Demo Aktif · Kata sandi demo: <code>pakcikiniv2</code></small>' +
    '</div>';
  if (dashboard) dashboard.insertBefore(locked, dashboard.firstChild);

  function route() {
    var rawHash = (location.hash || '#beranda').slice(1);
    var scrollToFaq = false;
    if (rawHash === 'faq') {
      rawHash = 'dokumentasi';
      scrollToFaq = true;
    } else if (rawHash === 'kalkulator' || rawHash === 'peralatan') {
      var targetSec = rawHash;
      rawHash = 'tentang';
      setTimeout(function () {
        var el = document.getElementById(targetSec);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 40);
    }

    var h = ids.indexOf(rawHash) >= 0 ? rawHash : 'beranda';
    var session = window.VXAuth ? window.VXAuth.state() : null;
    var isAdmin = !!(session && session.authenticated && session.role === 'admin');
    var isLockedDashboard = h === 'dashboard' && !isAdmin;

    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.hidden = (id !== h);
    });

    if (dashboardContent) dashboardContent.hidden = isLockedDashboard;
    locked.hidden = !isLockedDashboard;
    document.body.classList.toggle('is-home', h === 'beranda');

    document.querySelectorAll('[data-nav-link]').forEach(function (a) {
      var k = a.getAttribute('data-k') || (a.getAttribute('href') || '').slice(1);
      if (k === h) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });

    document.title = h === 'beranda' ? 'Vortex Hydro' : (names[h] || 'Vortex Hydro') + ' | Vortex Hydro';

    if (scrollToFaq) {
      setTimeout(function () {
        var faqEl = document.getElementById('faq-section');
        if (faqEl) faqEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 40);
    } else if (rawHash === h) {
      window.scrollTo(0, 0);
    }
  }

  window.addEventListener('hashchange', route);
  window.addEventListener('vx:authchange', route);
  route();
})();
