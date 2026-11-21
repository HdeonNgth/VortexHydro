(function () {
  var TEAM_LEADERS = [
    {
      division: 'Modeling',
      folder: 'modeling',
      leader: 'Kristoforus Rizkiano Tembang Langit',
      description: 'Pemodelan geometri 3D dan simulasi perilaku aliran fluida untuk mengevaluasi rancangan turbin vortex.',
      members: ['Muhammad Firdhie Andalas', 'M. Rangga Satria Noorfando', 'Rakha Aribawa Rahman', 'Lutfi Ahmad Suriyana']
    },
    {
      division: 'Mat Model',
      folder: 'mat-model',
      leader: 'Muhammad Alfian Firmansyah',
      description: 'Pemodelan matematis, perhitungan hidrodinamika, dan kajian material komponen prototipe.',
      members: ['Muhammad Iqbal Maulana', 'Khalidatul Aliyah Safitri', 'Muhamad Ferly Farnando']
    },
    {
      division: 'Software',
      folder: 'software',
      leader: 'Fattar Davino Aulia Rahman',
      description: 'Pengembangan aplikasi web, dashboard telemetri simulasi, dan integrasi asisten AI Vortex Hydro.',
      members: ['Muhamad Supriyadi', 'Muhammad Aryaputra Manda', 'M. Nauval Al-Ghafary Wardoyo', "Haudh Al Maa'uun"]
    },
    {
      division: 'Electrical',
      folder: 'electrical',
      leader: 'Muhammad Nur Faizin',
      description: 'Perancangan sistem pembangkitan DC, pengkondisian daya, sensor instrumentasi, dan beban lampu LED.',
      members: ['Muhammad Farrel Caesar', 'Mokhamad Rayhan Faturahman', 'Dava Maulana Yudha', 'Iltizamul Haqqi', 'Mexcelino Perwira Dirganesia', 'Mochammad Ardiansyah Tri Wicaksono']
    },
    {
      division: 'Mekanikal',
      folder: 'mekanikal',
      leader: 'M. Salman Alfarizi Ramadani',
      description: 'Fabrikasi struktur rangka, perakitan kincir 6 sudu, poros utama, serta transmisi pulley dan V-belt.',
      members: ['Mukhamad Nur Alfan', "Mohammad Miftah Yusron Hana'i", 'Febrian Patria Yoni', 'Muhammad Fadil', 'Mohamad Rizky Fadilah', 'Mohammad Hisyam Rifai']
    },
    {
      division: 'Perlengkapan',
      folder: 'perlengkapan',
      leader: 'Handhika Hidayatullah',
      description: 'Pengadaan komponen teknik, logistik laboratorium, dan kesiapan peralatan pengujian prototipe.',
      members: ['Loudy Firza Aulia', 'Keihan Daafa Parsya', 'Girendra Hangestubrata', 'Jalalludin Satriya Nayaka']
    },
    {
      division: 'PDD',
      folder: 'pdd',
      leader: "Mohammad Miftah Yusron Hana'i",
      description: 'Publikasi ilmiah, desain visual, dan dokumentasi foto/video selama proses perakitan serta pengujian.',
      members: ['Legison Satria Manik Allo', 'Maritza Aprilia Putri']
    }
  ];

  var TEAM_MANAGEMENT = [
    { position: 'Ketua Tim', name: 'Mochammad Ardiansyah Tri Wicaksono' },
    { position: 'Sekretaris Tim 1', name: "Mohammad Miftah Yusron Hana'i" },
    { position: 'Sekretaris Tim 2', name: 'Mohamad Supriyadi' },
    { position: 'Bendahara Tim 1', name: 'Khalidatul Aliyah Safitri' },
    { position: 'Bendahara Tim 2', name: 'Loudy Firza Aulia' },
    { position: 'Bendahara Tim 3', name: 'Maritza Aprilia Putri' }
  ];

  var PHOTO_BY_SLUG = {
    "mexcelino-perwira-dirganesia": "assets/team/electrical/mexcelino-perwira-dirganesia.jpg",
    "mokhamad-rayhan-faturahman": "assets/team/electrical/mokhamad-rayhan-faturahman.jpg",
    "muhammad-farrel-caesar": "assets/team/electrical/muhammad-farrel-caesar.jpg",
    "muhammad-nur-faizin": "assets/team/electrical/muhammad-nur-faizin.jpg",
    "khalidatul-aliyah-safitri": "assets/team/mat-model/khalidatul-aliyah-safitri.jpg",
    "muhammad-alfian-firmansyah": "assets/team/mat-model/muhammad-alfian-firmansyah.jpg",
    "muhammad-iqbal-maulana": "assets/team/mat-model/muhammad-iqbal-maulana.jpg",
    "febrian-patria-yoni": "assets/team/mekanikal/febrian-patria-yoni.jpg",
    "m-salman-alfarizi-ramadani": "assets/team/mekanikal/m-salman-alfarizi-ramadani.jpg",
    "mohamad-rizky-fadilah": "assets/team/mekanikal/mohamad-rizky-fadilah.jpg",
    "mohammad-hisyam-rifai": "assets/team/mekanikal/mohammad-hisyam-rifai.jpg",
    "muhammad-fadil": "assets/team/mekanikal/muhammad-fadil.jpg",
    "kristoforus-rizkiano-tembang-langit": "assets/team/modeling/kristoforus-rizkiano-tembang-langit.jpg",
    "lutfi-ahmad-suriyana": "assets/team/modeling/lutfi-ahmad-suriyana.jpg",
    "m-rangga-satria-noorfando": "assets/team/modeling/m-rangga-satria-noorfando.jpg",
    "maritza-aprilia-putri": "assets/team/pdd/maritza-aprilia-putri.jpg",
    "mohamad-supriyadi": "assets/team/pengurus/mohamad-supriyadi.jpg",
    "muhamad-supriyadi": "assets/team/pengurus/mohamad-supriyadi.jpg",
    "handhika-hidayatullah": "assets/team/perlengkapan/handhika-hidayatullah.jpg",
    "jalalludin-satriya-nayaka": "assets/team/perlengkapan/jalalludin-satriya-nayaka.jpg",
    "keihan-daafa-parsya": "assets/team/perlengkapan/keihan-daafa-parsya.jpg",
    "loudy-firza-aulia": "assets/team/perlengkapan/loudy-firza-aulia.jpg"
  };

  function slugify(name) {
    return String(name)
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
  }

  function initials(name) {
    var parts = String(name).replace(/[^A-Za-z\s]/g, '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return 'VH';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function avatarHtml(name) {
    var src = PHOTO_BY_SLUG[slugify(name)];
    if (src) {
      return '<span class="avatar avatar--photo"><img src="' + src + '" alt="Foto ' + escapeHtml(name) + '" loading="lazy" decoding="async"></span>';
    }
    return '<span class="avatar avatar--init" aria-hidden="true">' + escapeHtml(initials(name)) + '</span>';
  }

  var host = document.getElementById('org-dyn');
  if (!host) return;

  var ket = TEAM_MANAGEMENT[0];
  var sek = TEAM_MANAGEMENT.filter(function (m) { return m.position.indexOf('Sekretaris') === 0; });
  var ben = TEAM_MANAGEMENT.filter(function (m) { return m.position.indexOf('Bendahara') === 0; });

  function mgmtCard(title, roleBadge, list) {
    return '<article class="node mgmt__c">' +
      '<header class="node__head"><span class="tag">' + escapeHtml(roleBadge) + '</span><h3>' + escapeHtml(title) + '</h3></header>' +
      '<div class="slots">' +
      list.map(function (m) {
        return '<div class="slot">' + avatarHtml(m.name) +
          '<div class="slot__txt"><strong>' + escapeHtml(m.name) + '</strong><em>' + escapeHtml(m.position) + '</em></div></div>';
      }).join('') +
      '</div></article>';
  }

  var html = '<div class="mgmt">' +
    '<article class="node mgmt__c mgmt__lead">' +
      '<header class="node__head"><span class="tag tag--primary">Pimpinan Proyek</span><h3>Ketua Tim</h3></header>' +
      '<div class="lead-profile">' + avatarHtml(ket.name) +
        '<div class="lead-profile__txt"><strong>' + escapeHtml(ket.name) + '</strong><em>Koordinator Utama Proyek Kelas</em></div>' +
      '</div>' +
    '</article>' +
    mgmtCard('Sekretaris', 'Administrasi & Dokumentasi', sek) +
    mgmtCard('Bendahara', 'Anggaran & Logistik', ben) +
  '</div>' +
  '<div class="org-divider"><span>7 Divisi Teknis &amp; Operasional</span></div>' +
  '<div class="divisions">';

  TEAM_LEADERS.forEach(function (t, i) {
    var rows = [{ n: t.leader, s: 'Ketua Divisi', isLead: true }].concat(
      t.members.map(function (n) { return { n: n, s: 'Anggota', isLead: false }; })
    );
    html += '<article class="node division">' +
      '<header class="division__head">' +
        '<div class="division__meta"><span class="tag">Divisi ' + (i + 1) + '</span><span class="division__count">' + rows.length + ' orang</span></div>' +
        '<h3>' + escapeHtml(t.division) + '</h3>' +
        '<p class="division__desc">' + escapeHtml(t.description) + '</p>' +
      '</header>' +
      '<div class="slots">' +
      rows.map(function (r) {
        return '<div class="slot' + (r.isLead ? ' slot--lead' : '') + '">' +
          avatarHtml(r.n) +
          '<div class="slot__txt"><strong>' + escapeHtml(r.n) + '</strong>' +
          '<em>' + escapeHtml(r.s) + '</em></div></div>';
      }).join('') +
      '</div></article>';
  });

  host.innerHTML = html + '</div>';
})();
