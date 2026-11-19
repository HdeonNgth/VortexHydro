(function () {
  'use strict';

  var idToEn = {
    'Energi': 'Energy',
    'Energi dan Efisiensi': 'Energy and Efficiency',
    'Listrik PLN yang masuk ke pompa dibandingkan listrik yang dihasilkan generator.': 'Grid (PLN) electricity going into the pump compared with electricity produced by the generator.',
    'Menunggu data energi': 'Waiting for energy data',
    'Data energi mengalir': 'Energy data flowing',
    'Data energi berhenti': 'Energy data stopped',
    'Total energi PLN masuk': 'Total PLN energy input',
    'Total energi dihasilkan': 'Total energy generated',
    'Efisiensi sistem': 'System efficiency',
    'Waktu operasi': 'Operating time',
    'Daya PLN ke pompa': 'PLN power to pump',
    'Daya generator': 'Generator power',
    'Efisiensi rata-rata 5 jam': 'Average efficiency (5 h)',
    'Selisih energi': 'Energy difference',
    'Output generator vs input listrik PLN': 'Generator output vs PLN input',
    '2 menit': '2 min',
    '1 jam': '1 h',
    '5 jam': '5 h',
    '10 jam': '10 h',
    'Input PLN ke pompa (W)': 'PLN input to pump (W)',
    'Output generator (W)': 'Generator output (W)',
    'Laporan Excel per 10 jam': 'Excel report every 10 hours',
    'Unduh otomatis tiap 10 jam operasi': 'Auto-download every 10 operating hours',
    'Unduh laporan blok berjalan': 'Download current block report',
    'Unduh': 'Download',
    'Rata-rata dan puncak per 5 jam': 'Average and peak per 5 hours',
    'Jendela (jam operasi)': 'Window (operating hours)',
    'PLN rata-rata': 'PLN average',
    'PLN puncak': 'PLN peak',
    'Generator rata-rata': 'Generator average',
    'Generator puncak': 'Generator peak',
    'Efisiensi rata-rata': 'Average efficiency',
    'Efisiensi puncak': 'Peak efficiency',
    'Efisiensi terendah': 'Lowest efficiency',
    'Belum ada blok 10 jam yang selesai.': 'No completed 10-hour block yet.',
    'berjalan': 'running',
    'sebagian': 'partial',
    'terunduh': 'downloaded',
    'Dari PLN ke pompa sejak awal uji': 'From PLN to pump since test start',
    'Listrik masuk ke BESS dari generator': 'Electricity into BESS from generator',
    'PLN masuk dikurangi dihasilkan': 'PLN input minus generated',
    'Menunggu riwayat 5 jam': 'Waiting for 5-hour history',
    'Belum ada data untuk rentang ini': 'No data for this range yet',
    'Memuat Vortex Hydro': 'Loading Vortex Hydro',
    'Sebentar, kami menyiapkan halaman untuk Anda.': 'Please wait while we prepare the page for you.',
    'Beranda': 'Home',
    'Tentang': 'About',
    'Teknologi': 'Technology',
    'Dokumentasi': 'Documentation',
    'Tim': 'Team',
    'Struktur Tim': 'Team Structure',
    'Dashboard': 'Dashboard',
    'Pertanyaan yang sering diajukan': 'Frequently asked questions',
    'Lihat Dokumentasi': 'View Documentation',
    'Ganti bahasa ke Inggris': 'Switch language to English',
    'Ganti bahasa ke Bahasa Indonesia': 'Switch language to Indonesian',
    'Cari di situs': 'Search the site',
    'Cari (Ctrl+K)': 'Search (Ctrl+K)',
    'Buka menu': 'Open menu',
    'Tutup menu': 'Close menu',
    'Menu utama': 'Main menu',
    'Beranda Vortexhydro': 'Vortexhydro home',
    'Vortex Hydro, ke beranda': 'Vortex Hydro, home',
    'Vortexhydro, ke beranda': 'Vortexhydro, home',
    'Kembali ke beranda': 'Back to home',
    'Kembali ke atas': 'Back to top',
    'Proyek Kelas · Mikro-hidro': 'Class Project · Micro-hydro',
    'Simulator PLTA vortex skala laboratorium yang mengubah aliran air berketinggian rendah menjadi listrik, tanpa bendungan.': 'A laboratory-scale vortex hydropower simulator that turns low-head water flow into electricity, without a dam.',
    'Lihat Teknologi': 'See the Technology',
    'Buka Dashboard': 'Open Dashboard',
    "Air dipompa dari tangki penampung ke headbox, ditenangkan, dialirkan lewat saluran miring ke kincir 6 sudu, lalu jatuh kembali ke tangki. Putaran kincir menggerakkan generator.": "Water is pumped from the reservoir tank to the headbox, calmed, sent down a sloped channel to the 6-blade wheel, then falls back into the tank. The wheel's rotation drives the generator.",
    "Penampang samping prototipe: tangki penampung, pompa, pipa dorong dengan flow meter, headbox, saluran miring, kincir air 6 sudu, terjunan air, dan zona kering": "Side section of the prototype: reservoir tank, pump, pressure pipe with flow meter, headbox, sloped channel, 6-blade waterwheel, tailrace, and dry zone",
    "Penampang samping prototipe (tidak berskala). Garis putus-putus: transmisi dan generator di zona kering, di balik sekat.": "Side section of the prototype (not to scale). Dashed lines: transmission and generator in the dry zone, behind the partition.",
    "Tangki Penampung": "Reservoir Tank",
    "Silinder polikarbonat transparan Ø 520 mm menampung air sirkulasi. Air dari kincir jatuh kembali ke sini, jadi sistemnya tertutup.": "A transparent polycarbonate cylinder, Ø 520 mm, holds the circulating water. Water from the wheel falls back here, so the system is closed.",
    "Pompa & Pipa Hisap": "Pump & Suction Pipe",
    "Pompa sentrifugal menyedot air lewat pipa PVC 1\" yang melengkung di atas tepi tangki (over-the-top). Tangki tidak dilubangi di dasar, sehingga anti bocor.": "A centrifugal pump draws water through a 1\" PVC pipe that arches over the tank rim (over-the-top). The tank has no hole in its base, so it cannot leak.",
    "Pipa Dorong & Flow Meter": "Pressure Pipe & Flow Meter",
    "Air didorong naik di sisi kiri meja, melewati flow meter digital yang membaca debit, lalu masuk ke headbox lewat flensa kedap air dan nosel.": "Water is pushed up the left side of the table, passes a digital flow meter that reads the discharge, then enters the headbox through a watertight flange and nozzle.",
    "Headbox": "Headbox",
    "Kotak akrilik penenang. Sekat di dalamnya meredam turbulensi pancaran, lalu air dilepas tenang lewat celah bawah 45 mm.": "An acrylic calming box. An internal baffle damps the turbulence of the jet, then the water is released calmly through a 45 mm gap at the bottom.",
    "Saluran Miring": "Sloped Channel",
    "Dinding pengarah menyempitkan lebar aliran dari 0,416 m menjadi 0,28 m tepat di depan kincir, supaya seluruh debit mengenai sudu.": "Guide walls narrow the flow width from 0.416 m to 0.28 m right in front of the wheel, so the whole discharge hits the blades.",
    "Kincir Air 6 Sudu": "6-Blade Waterwheel",
    "Ø 330 mm, lebar sudu 250 mm. Dorongan air memutar kincir dan poros utama stainless Ø 30 mm.": "Ø 330 mm, blade width 250 mm. The push of the water turns the wheel and the Ø 30 mm stainless main shaft.",
    "Terjunan Air": "Tailrace",
    "Air yang meninggalkan kincir jatuh lewat cerobong akrilik dan bukaan meja kembali ke tangki penampung.": "Water leaving the wheel falls through an acrylic chute and the tabletop opening back into the reservoir tank.",
    "Zona Kering": "Dry Zone",
    "Dipisahkan sekat dari area basah. Pulley step-up 1:4 menggerakkan generator, yang mengisi baterai 12 V untuk lampu LED 12 W.": "Separated from the wet area by a partition. A 1:4 step-up pulley drives the generator, which charges the 12 V battery for the 12 W LED lamp.",
    "Zona kering": "Dry zone",
    "Dari Putaran Menjadi Listrik": "From Rotation to Electricity",
    "Kincir 6 sudu": "6-blade wheel",
    "Poros utama Ø 30 mm": "Ø 30 mm main shaft",
    "Pulley Ø 270 mm": "Ø 270 mm pulley",
    "Terpasang di poros utama": "Mounted on the main shaft",
    "V-belt step-up": "Step-up V-belt",
    "Rasio putaran 1 : 4": "Speed ratio 1 : 4",
    "Generator DC": "DC generator",
    "Pulley Ø 67,5 mm, magnet permanen": "Ø 67.5 mm pulley, permanent magnet",
    "Baterai 12 V": "12 V battery",
    "Lewat charge controller": "Via charge controller",
    "Lampu LED 12 W": "12 W LED lamp",
    "Beban dengan saklar": "Load with a switch",
    "Diameter kincir": "Waterwheel diameter",
    "Jumlah sudu kincir": "Number of wheel blades",
    "Lebar sudu": "Blade width",
    "Diameter poros utama": "Main shaft diameter",
    "Diameter tangki penampung": "Reservoir tank diameter",
    "Lebar saluran (masuk → depan kincir)": "Channel width (inlet → in front of wheel)",
    "Rasio putaran poros : generator": "Speed ratio shaft : generator",
    "Beban listrik (lampu LED)": "Electrical load (LED lamp)",
    'Turbin pusaran air': 'Vortex water turbine',
    'Listrik dari aliran rendah': 'Power from low-head water flows',
    'Fokus proyek': 'Project focus',
    'Mikro-hidro': 'Micro-hydro',
    'Head rendah': 'Low head',
    'Head Rendah': 'Low Head',
    'Tanpa bendungan': 'No dam',
    'Tanpa Bendungan': 'No Dam',
    'Turbin vortex': 'Vortex turbine',
    'Pendahuluan': 'Introduction',
    'Banyak aliran air kecil punya tinggi jatuh rendah, sehingga tidak bisa memutar turbin biasa. Vortex Hydro memakai pusaran air di dalam basin untuk mengubahnya menjadi listrik, tanpa bendungan.': 'Many small water flows have a low head and cannot turn conventional turbines. Vortex Hydro uses a water vortex in a basin to generate electricity without a dam.',
    'Irigasi dan pedesaan': 'Irrigation and rural areas',
    'Penerangan dan pompa kecil.': 'Lighting and small pumps.',
    'Sungai kecil dan saluran': 'Small rivers and canals',
    'Tanpa bendungan besar.': 'No large dam required.',
    'Edukasi dan riset': 'Education and research',
    'Rancangan terbuka untuk dipelajari.': 'An open design for learning.',
    'Peta website': 'Site map',
    'Jelajahi': 'Explore',
    'Komponen yang Digunakan': 'Components Used',
    'Saluran Masuk': 'Inlet Channel',
    'Nama komponen': 'Component name',
    'Spesifikasi': 'Specifications',
    'Basin Vortex': 'Vortex Basin',
    'Turbin': 'Turbine',
    'Poros': 'Shaft',
    'Generator': 'Generator',
    'Saluran Keluar': 'Outlet Channel',
    'Klik nama dan spesifikasi untuk mengisi. Tersimpan di browser ini.': 'Select a component name and specifications to fill them in. Saved in this browser.',
    'Terbaru dari Vortex Hydro': 'Latest from Vortex Hydro',
    'Berita': 'News',
    'Blog': 'Blog',
    'Anggota Tim': 'Team Members',
    'Mahasiswa & Akademik': 'Students & Academics',
    'Cerita Vortex Hydro': 'Vortex Hydro Stories',
    'Acara': 'Events',
    'Software yang Menunjang Proyek': 'Software Supporting the Project',
    'Perancangan, simulasi, dan pemrograman proyek ini dikerjakan dengan empat perangkat lunak berikut.': 'The project design, simulation, and programming use the following four software tools.',
    'Tentang Vortex Hydro': 'About Vortex Hydro',
    'Apa Itu Vortex Hydro?': 'What Is Vortex Hydro?',
    'Proyek kelas perancangan pembangkit listrik mikro-hidro. Air berputar di dalam basin, lalu putarannya menggerakkan turbin.': 'A class project to design a micro-hydro power generator. Water swirls in a basin, and the vortex turns a turbine.',
    'Aliran Air': 'Water Flow',
    'Pusaran': 'Vortex',
    'Listrik': 'Electricity',
    'Mengapa Memilih Turbin Vortex?': 'Why Choose a Vortex Turbine?',
    'Bekerja pada tinggi jatuh yang kecil.': 'Works with a low water head.',
    'Sederhana': 'Simple',
    'Konstruksi mudah dan murah dirawat.': 'Easy to build and inexpensive to maintain.',
    'Tidak memerlukan bendungan besar.': 'Does not require a large dam.',
    'Tujuan': 'Goals',
    'Rancangan Terhitung': 'Calculated Design',
    'Dimensi basin dan turbin.': 'Basin and turbine dimensions.',
    'Prototipe Teruji': 'Tested Prototype',
    'Dibuat dan diuji kinerjanya.': 'Built and tested for performance.',
    'Untuk dipelajari kelas berikutnya.': 'For future classes to study.',
    'Cara Kerja Turbin Vortex': 'How a Vortex Turbine Works',
    'Air masuk menyinggung basin, membentuk pusaran, lalu memutar turbin.': 'Water enters the basin tangentially, forms a vortex, and turns the turbine.',
    'Ilustrasi potongan melintang, tidak berskala.': 'Cross-section illustration, not to scale.',
    'Mengarahkan air ke basin dengan arah singgung agar mudah berputar.': 'Directs water tangentially into the basin to help it start swirling.',
    'Wadah silinder atau kerucut tempat pusaran terbentuk.': 'A cylindrical or conical vessel where the vortex forms.',
    'Bilah di tengah pusaran yang menangkap energi putaran air.': 'Blades at the center of the vortex capture the water’s rotational energy.',
    'Terhubung ke poros turbin untuk menghasilkan listrik.': 'Connected to the turbine shaft to generate electricity.',
    'Mengembalikan air ke aliran semula.': 'Returns water to its original flow.',
    'Simulasi': 'Simulation',
    'Sirkulasi Air pada Prototipe': 'Water Circulation in the Prototype',
    'Air dari ember dipompa naik ke bak masuk, mengalir di saluran di atas meja, memutar turbin, lalu jatuh kembali ke ember. Putaran turbin menggerakkan generator yang menyalakan lampu LED.': 'Water is pumped from a bucket to the inlet tank, flows through a channel on the table, turns the turbine, and falls back into the bucket. The turbine drives a generator that powers an LED.',
    'Pompa: hidup': 'Pump: on',
    'Pompa: mati': 'Pump: off',
    'Debit pompa:': 'Pump flow:',
    'Tinggi jatuh (head):': 'Water head:',
    'Diameter basin': 'Basin diameter',
    'Diameter lubang keluar': 'Outlet diameter',
    'Jumlah bilah turbin': 'Number of turbine blades',
    'Daya listrik target': 'Target electrical power',
    'Klik kolom nilai untuk mengisi. Tersimpan di browser ini.': 'Select a value cell to enter a value. Saved in this browser.',
    'Daya hidrolik': 'Hydraulic power',
    'Putaran turbin': 'Turbine speed',
    'Tegangan': 'Voltage',
    'Arus': 'Current',
    'Daya listrik': 'Electrical power',
    'Lampu LED': 'LED light',
    'Ember menampung air yang jatuh dari turbin.': 'The bucket collects water falling from the turbine.',
    'Pompa menyedot air dari ember.': 'The pump draws water from the bucket.',
    'Pipa mengirim air naik ke awal saluran.': 'The pipe sends water up to the start of the channel.',
    'Bak masuk menenangkan air sebelum mengalir.': 'The inlet tank calms the water before it flows onward.',
    'Saluran di atas meja mengarahkan air ke turbin.': 'The channel on the table directs water to the turbine.',
    'Turbin berputar oleh dorongan air, lalu air jatuh ke ember.': 'The water turns the turbine and then falls back into the bucket.',
    'Generator mengubah putaran jadi listrik untuk lampu LED.': 'The generator converts rotation into electricity for the LED.',
    'Model sederhana: P = ρ·g·Q·H·η. Nilai η (30%), konstanta RPM, dan tegangan adalah asumsi, bukan hasil ukur. Ubah nilainya di objek CFG pada skrip ini setelah ada data pengujian.': 'Simplified model: P = ρ·g·Q·H·η. The efficiency (30%), RPM constant, and voltage are assumptions, not measured results. Update the values in the CFG object after test data is available.',
    'Parameter Desain': 'Design Parameters',
    'Parameter': 'Parameter',
    'Simbol': 'Symbol',
    'Nilai': 'Value',
    'Satuan': 'Unit',
    'isi nilai': 'enter value',
    'buah': 'blades',
    'Tinggi jatuh (head)': 'Water head',
    'Bagan struktur organisasi': 'Organization chart',
    'Dosen Pembimbing': 'Faculty Advisor',
    'Nama belum diisi': 'Name not provided',
    'Klik divisi untuk melihat anggotanya di carousel di bawah.': 'Select a division to see its members in the carousel below.',
    'Pengurus utama & ketua divisi': 'Core Team & Division Leads',
    'Geser atau ketuk kartu di tengah untuk melihat anggota': 'Swipe or tap the center card to view team members',
    'Ketua Tim': 'Team Lead',
    'Sekretaris': 'Secretary',
    'Bendahara': 'Treasurer',
    'Anggota': 'Members',
    'Divisi': 'Division',
    'Ketua Divisi': 'Division Lead',
    'Ketua & anggota': 'Lead & members',
    'Pengurus utama': 'Core team',
    'Sekretaris Tim 1': 'Team Secretary 1',
    'Sekretaris Tim 2': 'Team Secretary 2',
    'Bendahara Tim 1': 'Treasurer 1',
    'Bendahara Tim 2': 'Treasurer 2',
    'Bendahara Tim 3': 'Treasurer 3',
    'Modeling': 'Modeling',
    'Mat Model': 'Materials & Modeling',
    'Software': 'Software',
    'Electrical': 'Electrical',
    'Mekanikal': 'Mechanical',
    'Perlengkapan': 'Equipment',
    'PDD': 'Publication & Documentation',
    'Draf singkat: pemodelan bentuk dan perilaku aliran air untuk membantu mengevaluasi rancangan turbin vortex.': 'Draft: modeling shapes and water-flow behavior to help evaluate the vortex turbine design.',
    'Draf singkat: kajian material dan model komponen yang digunakan pada proyek Vortex Hydro.': 'Draft: studying materials and component models used in the Vortex Hydro project.',
    'Draf singkat: pengembangan dan pengelolaan kebutuhan perangkat lunak untuk mendukung proyek Vortex Hydro.': 'Draft: developing and managing software needs to support the Vortex Hydro project.',
    'Draf singkat: dukungan sistem dan komponen kelistrikan untuk kebutuhan proyek Vortex Hydro.': 'Draft: supporting electrical systems and components for the Vortex Hydro project.',
    'Draf singkat: rancangan mekanis dan komponen turbin vortex dalam proyek Vortex Hydro.': 'Draft: designing mechanical systems and vortex turbine components for the Vortex Hydro project.',
    'Draf singkat: kebutuhan perlengkapan untuk mendukung kegiatan dan pengerjaan proyek Vortex Hydro.': 'Draft: providing equipment for Vortex Hydro project activities and work.',
    'Draf singkat: dukungan publikasi dan dokumentasi kegiatan proyek Vortex Hydro.': 'Draft: supporting publication and documentation of Vortex Hydro project activities.',
    'Klik nama divisi atau anggota untuk menggantinya.': 'Select a division or member name to replace it.',
    'Struktur Tim Vortex Hydro': 'Vortex Hydro Team Structure',
    'Foto bersama': 'Group photo',
    'Palet Vortex Biru': 'Vortex Blue palette',
    'Vortex Biru': 'Vortex Blue',
    'Palet asli situs': 'Original site palette',
    'Palet Karusel': 'Carousel palette',
    'Karusel': 'Carousel',
    'Palet Sakura Malam': 'Sakura Night palette',
    'Sakura Malam': 'Sakura Night',
    'Palet Teratai': 'Lotus palette',
    'Teratai': 'Lotus',
    'Kontak': 'Contact',
    'Hubungi Tim Vortex Hydro': 'Contact the Vortex Hydro Team',
    'Email': 'Email',
    'Lokasi': 'Location',
    'Jam konsultasi': 'Consultation hours',
    'Senin sampai Jumat': 'Monday to Friday',
    'Nama': 'Name',
    'Pesan': 'Message',
    'Kirim Pesan': 'Send Message',
    'Dashboard Pemantauan Prototipe': 'Prototype Monitoring Dashboard',
    'Turbin vortex, data diperbarui setiap detik': 'Vortex turbine, data updates every second',
    'Live · Simulasi': 'Live · Simulation',
    'Jeda': 'Pause',
    'Lanjut': 'Resume',
    'Sumber data': 'Data source',
    'Hubungkan': 'Connect',
    'Putuskan': 'Disconnect',
    'Pakai simulasi': 'Use simulation',
    'Format JSON: {"debit":50,"head":1.5,"rpm":160,"volt":16,"amp":1.2,"temp":27}. Untuk WebSocket/MQTT panggil': 'JSON format: {"debit":50,"head":1.5,"rpm":160,"volt":16,"amp":1.2,"temp":27}. For WebSocket/MQTT, call',
    '. Tanpa sumber data, dashboard memakai data simulasi.': '. Without a data source, the dashboard uses simulated data.',
    'Debit air': 'Water flow',
    'Head': 'Head',
    'Efisiensi': 'Efficiency',
    'Suhu air': 'Water temperature',
    'Grafik 60 detik terakhir': 'Last 60 seconds',
    'Daya': 'Power',
    'Debit': 'Flow',
    'Indikator': 'Indicators',
    'Log kejadian': 'Event log',
    'Riwayat kunjungan': 'Visit history',
    'Hapus riwayat': 'Clear history',
    'Tersimpan di browser ini saja. Untuk log seluruh pengunjung, isi': 'Saved only in this browser. To log all visitors, enter',
    'dengan alamat server Anda (misalnya Google Apps Script), dan setiap kunjungan akan dikirim ke sana.': 'with your server URL (for example, Google Apps Script), and each visit will be sent there.',
    'kunjungan': 'visits',
    'halaman dilihat': 'page views',
    'Pertama kali:': 'First visit:',
    'beranda': 'Home',
    'tentang': 'About',
    'teknologi': 'Technology',
    'dokumentasi': 'Documentation',
    'struktur-tim': 'Team Structure',
    'dashboard': 'Dashboard',
    'faq': 'FAQ',
    'Dashboard dimulai (mode simulasi)': 'Dashboard started (simulation mode)',
    'debit kembali normal': 'Water flow returned to normal',
    'rpm kembali normal': 'Turbine speed returned to normal',
    'temp kembali normal': 'Water temperature returned to normal',
    'Putaran melebihi batas': 'Turbine speed exceeded the limit',
    'Suhu air tinggi': 'Water temperature is high',
    'dtk': 'sec',
    'sekarang': 'now',
    'Turbin pusaran air untuk menghasilkan listrik dari aliran rendah, tanpa bendungan.': 'A water vortex turbine that generates electricity from low-head flows without a dam.',
    'Proyek Mikro-hidro': 'Micro-hydro Project',
    'Halaman': 'Pages',
    'Informasi': 'Information',
    'Fakultas': 'Faculty',
    'Fakultas Vokasi': 'Faculty of Vocational Studies',
    'Jurusan': 'Department',
    'Teknologi Rekayasa Pembangkit Energi': 'Energy Power Generation Engineering Technology',
    'Ikuti Kami': 'Follow Us',
    'Ke atas': 'Back to top',
    'Kalkulator Daya Mikro-hidro': 'Micro-hydro Power Calculator',
    'Kalkulator daya': 'Power calculator',
    'Debit air Q (liter/detik)': 'Water flow Q (liters/second)',
    'Head H (meter)': 'Head H (meters)',
    'Efisiensi η (%)': 'Efficiency η (%)',
    'Pilihan tersimpan di perangkat ini.': 'Your selection is saved on this device.',
    'Palet Warna': 'Color Palette',
    'Terang / gelap': 'Light / dark',
    'Palet warna': 'Color palette',
    'Animasi': 'Animations',
    'Ketik minimal 2 huruf. Pintasan: Ctrl+K atau tombol /.': 'Type at least 2 characters. Shortcut: Ctrl+K or the / key.',
    'Cari halaman, komponen, atau tim…': 'Search pages, components, or team members…',
    'Anggota tim merancang turbin di komputer': 'Team members designing a turbine on a computer',
    'Ilustrasi turbin pusaran': 'Vortex turbine illustration',
    'Komponen yang digunakan': 'Components used',
    'Komponen sebelumnya': 'Previous component',
    'Komponen berikutnya': 'Next component',
    'Potongan melintang basin vortex dengan saluran masuk, turbin, generator, dan saluran keluar': 'Cross-section of a vortex basin with inlet, turbine, generator, and outlet',
    'Simulasi sirkulasi air: ember, pompa, pipa naik, bak masuk, saluran, turbin, generator, dan lampu LED': 'Water circulation simulation: bucket, pump, rising pipe, inlet tank, channel, turbine, generator, and LED',
    'Ketua tim dan ketua divisi. Ketuk kartu di tengah untuk melihat anggota.': 'Team lead and division leads. Tap the center card to view members.',
    'Kartu sebelumnya': 'Previous card',
    'Kartu berikutnya': 'Next card',
    'URL data sensor': 'Sensor data URL',
    'Grafik data sensor': 'Sensor data chart',
    'TikTok Vortexa.Team': 'Vortexa.Team on TikTok',
    'Instagram vortexa.team': 'vortexa.team on Instagram',
    'Tutup': 'Close',
    'Pilih palet warna': 'Choose a color palette',
    'Mode terang/gelap': 'Light/dark mode',
    'Ganti palet warna': 'Change color palette',
    'Animasi on/off': 'Toggle animations',
    'Buka alat Vortex': 'Open Vortex tools',
    'Kata kunci pencarian': 'Search query',
    'Tutup pencarian': 'Close search',
    'Hasil pencarian': 'Search results',
    'Pertanyaan yang Sering Diajukan': 'Frequently Asked Questions',
    'Jawaban ringkas tentang tujuan proyek, prinsip kerja turbin, dan cara membaca data prototipe.': 'Quick answers about the project goals, how the turbine works, and how to read prototype data.',
    'Apa itu Vortex Hydro?': 'What is Vortex Hydro?',
    'Vortex Hydro adalah proyek prototipe pembangkit listrik mikro-hidro yang memanfaatkan pusaran air di dalam basin untuk memutar turbin dan menggerakkan generator.': 'Vortex Hydro is a micro-hydro power prototype project that uses a water vortex in a basin to turn a turbine and drive a generator.',
    'Bagaimana cara kerja turbin vortex?': 'How does a vortex turbine work?',
    'Air diarahkan secara tangensial ke basin hingga membentuk pusaran. Pusaran memutar turbin di tengah basin; poros turbin menggerakkan generator, lalu air dialirkan kembali ke saluran.': 'Water is directed tangentially into a basin to form a vortex. The vortex turns a turbine at the basin center; its shaft drives a generator, and the water then flows back into the channel.',
    'Apakah sistem ini membutuhkan bendungan besar?': 'Does the system require a large dam?',
    'Tidak. Konsep proyek dirancang untuk memanfaatkan aliran dengan tinggi jatuh rendah dan tidak memerlukan bendungan besar. Kinerja tetap bergantung pada kondisi aliran dan rancangan prototipe.': 'No. The project is designed to use low-head water flows and does not require a large dam. Performance still depends on flow conditions and the prototype design.',
    'Apakah angka pada dashboard merupakan hasil pengukuran langsung?': 'Are the dashboard values direct measurements?',
    'Tidak selalu. Dashboard menggunakan data simulasi secara bawaan. Nilai simulasi membantu menjelaskan cara kerja antarmuka dan bukan hasil pengujian lapangan. Data nyata memerlukan sumber sensor yang terhubung.': 'Not necessarily. The dashboard uses simulated data by default. These values demonstrate the interface and are not field-test results. Real data requires a connected sensor source.',
    'Faktor apa yang memengaruhi daya yang dihasilkan?': 'What affects the generated power?',
    'Daya dipengaruhi oleh debit air, tinggi jatuh, serta efisiensi turbin dan generator. Rumus pada halaman Teknologi adalah model sederhana; hasil aktual perlu diverifikasi melalui pengujian.': 'Power depends on water flow, head, and turbine and generator efficiency. The formula on the Technology page is a simplified model; actual results must be verified by testing.',
    'Perangkat lunak apa yang digunakan dalam proyek?': 'What software is used in the project?',
    'Proyek ini menggunakan ANSYS Fluent, AutoCAD, MATLAB, dan VS Code untuk mendukung simulasi, perancangan, dan pemrograman.': 'The project uses ANSYS Fluent, AutoCAD, MATLAB, and VS Code for simulation, design, and programming.',
    'Bagaimana cara menghubungi tim?': 'How can I contact the team?',
    'Tim dapat dihubungi melalui': 'You can contact the team at',
    '. Proyek ini dikembangkan di Universitas Negeri Malang.': '. The project is developed at Universitas Negeri Malang.',
    '© 2026 Vortex Hydro. Proyek kelas Mekanika Fluida, Universitas Negeri Malang.': '© 2026 Vortex Hydro. Fluid Mechanics class project, Universitas Negeri Malang.',
    'Vortex': 'Vortex',
    'Kami merancang, membangun, dan menguji simulator PLTA Vortex skala laboratorium secara mandiri. Air dipompa ke bak penenang, mengalir di saluran miring, lalu memutar kincir yang menggerakkan generator.': 'We design, build, and test a laboratory-scale Vortex hydropower simulator on our own. Water is pumped to the stilling headbox, flows down a sloped chute, then turns the waterwheel that drives the generator.',
    'Membuat desain 3D dan gambar kerja teknik untuk sistem sirkulasi air tertutup.': 'We made the 3D design and engineering drawings for a closed water circulation system.',
    'Merancang': 'Designing',
    'Seluruh sistem dibangun di atas rangka berukuran 2 × 0,8 meter.': 'The whole system is built on a frame measuring 2 × 0.8 meters.',
    'Rangka 2 × 0,8 m': '2 × 0.8 m frame',
    'Aliran sungai tidak mungkin dibawa ke kampus, jadi pompa mengalirkan air dari tangki penampung bawah secara terus-menerus menuju bak penenang (headbox) dan saluran miring yang menyempit.': 'A river cannot be brought to campus, so a pump continuously moves water from the lower storage tank to the stilling headbox and a narrowing sloped chute.',
    'Sirkulasi dengan pompa': 'Pump circulation',
    'Air melaju di saluran akrilik miring yang menyempit, lalu memutar kincir 6 sudu berdiameter 330 mm.': 'Water runs down a narrowing sloped acrylic chute, then turns a 6-blade waterwheel 330 mm in diameter.',
    'Saluran miring dan kincir': 'Sloped chute and waterwheel',
    'Poros kincir menembus dinding sekat ke zona kering, lalu terhubung ke generator lewat pulley dan belt 1:4 untuk menghasilkan listrik.': 'The waterwheel shaft passes through the splash partition into the dry zone, then connects to the generator through a 1:4 pulley and belt to produce electricity.',
    'Turbin dan generator': 'Turbine and generator',
    'Setelah semua komponen terpasang, kami mengukur debit air, kecepatan putaran turbin (RPM), dan daya listrik yang keluar. Teori dan rumus Mekanika Fluida pun terbukti secara nyata.': 'Once everything is assembled, we measure the water flow rate, turbine speed (RPM), and electrical power output, proving Fluid Mechanics theory and formulas in practice.',
    'Pengujian langsung': 'Hands-on testing',
    'Kita Ngapain Aja Sih?': 'What Do We Actually Do?',
    'Air dipompa ke bak masuk, diarahkan ke tabung pusaran berdiameter 750 mm, membentuk pusaran, lalu memutar turbin.': 'Water is pumped to the inlet tank, guided into a vortex tank 750 mm in diameter, forms a vortex, and then turns the turbine.',
    'Pompa mengalirkan air dari tangki penampung bawah ke bak masuk dan saluran pengarah yang menyempit.': 'A pump moves water from the lower storage tank to the inlet tank and a narrowing guide channel.',
    'Tabung pusaran berdiameter 750 mm tempat pusaran stabil terbentuk.': 'A 750 mm diameter vortex tank where a stable vortex forms.',
    'Sudu turbin dipasang tepat di pusat pusaran untuk menangkap energi putaran air.': 'Turbine blades mounted right at the vortex center to capture the rotational energy of the water.',
    'Dihubungkan ke turbin lewat transmisi pulley dan belt untuk menghasilkan listrik.': 'Connected to the turbine through a pulley and belt transmission to produce electricity.',
    'Mengembalikan air ke tangki penampung bawah dalam sistem sirkulasi tertutup.': 'Returns water to the lower storage tank in a closed circulation system.',
    'Pompa mengalirkan air dari tangki penampung bawah (ember) ke bak masuk. Air mengalir di saluran pengarah, memutar turbin, lalu jatuh kembali ke tangki. Putaran turbin menggerakkan generator yang menyalakan lampu LED. Simulasi ini disederhanakan: tabung pusaran 750 mm tidak digambarkan.': 'A pump moves water from the lower storage tank (bucket) to the inlet tank. The water flows through the guide channel, turns the turbine, and falls back into the tank. The turbine drives a generator that lights an LED lamp. This simulation is simplified: the 750 mm vortex tank is not drawn.',
    'Tangki penampung bawah menampung air yang jatuh dari turbin.': 'The lower storage tank collects water falling from the turbine.',
    'Pompa di sisi kiri menyedot air dari tangki penampung.': 'The pump on the left draws water from the storage tank.',
    'Saluran pengarah yang menyempit mengarahkan air ke turbin.': 'The narrowing guide channel directs the water to the turbine.',
    'Turbin berputar oleh dorongan air, lalu air jatuh kembali ke tangki.': 'The water pushes the turbine around, then falls back into the tank.',
    'Lewat transmisi pulley dan belt, generator mengubah putaran jadi listrik untuk lampu LED.': 'Through a pulley and belt transmission, the generator turns rotation into electricity for the LED lamp.',
    'Diameter tabung pusaran': 'Vortex tank diameter',
    'Ukuran rangka utama, zona basah (panjang × lebar)': 'Main frame size, wet zone (length × width)',
    'Vortex Hydro adalah simulator PLTA Vortex skala laboratorium yang kami rancang, bangun, dan uji secara mandiri. Aliran air dari bak penenang memutar kincir dan menggerakkan generator.': 'Vortex Hydro is a laboratory-scale Vortex hydropower simulator that we design, build, and test on our own. Water from the stilling headbox turns the waterwheel and drives the generator.',
    'Pompa mengalirkan air dari tangki penampung ke bak penenang (headbox), lalu air meluncur di saluran miring yang menyempit dan memutar kincir 6 sudu. Poros kincir terhubung lewat pulley dan belt ke generator untuk menghasilkan listrik.': 'The pump moves water from the storage tank to the stilling headbox, then the water slides down a narrowing sloped chute and turns a 6-blade waterwheel. The wheel shaft connects through a pulley and belt to the generator to produce electricity.',
    'Mengapa memakai pompa dan sirkulasi tertutup?': 'Why use a pump and a closed circulation system?',
    'Aliran sungai tidak mungkin dibawa langsung ke kampus. Karena itu pompa mengalirkan air secara terus-menerus dari tangki penampung bawah ke bak penenang, di atas rangka berukuran 2 × 0,8 meter.': 'A river cannot be brought straight to campus. So a pump continuously moves water from the lower storage tank to the stilling headbox, on a frame measuring 2 × 0.8 meters.',
    'Bagaimana prototipe diuji?': 'How is the prototype tested?',
    'Setelah semua komponen terpasang, kami melakukan pengujian langsung dengan mengukur debit air, kecepatan putaran turbin (RPM), dan daya listrik yang keluar, untuk membuktikan teori dan rumus Mekanika Fluida.': 'Once all components are installed, we run hands-on tests measuring water flow rate, turbine speed (RPM), and electrical power output, to prove Fluid Mechanics theory and formulas.',
    'RPM poros utama': 'Main shaft RPM',
    'RPM generator': 'Generator RPM',
    'Tegangan baterai': 'Battery voltage',
    'Sabuk': 'Belt',
    'Baterai': 'Battery',
    'Sabuk slip': 'Belt slip',
    'Baterai turun': 'Battery draining',
    'Debit air, tegangan baterai, RPM poros utama, dan RPM generator. Diperbarui setiap detik': 'Water flow, battery voltage, main shaft RPM, and generator RPM. Updated every second',
    'Putar Video Sinematik': 'Play Cinematic Video',
    'Animasi 3D prototipe Vortex Hydro, 8 bab, sekitar 1 menit': '3D animation of the Vortex Hydro prototype, 8 chapters, about 1 minute',
    'Layar penuh': 'Fullscreen',
  };

  var enToId = Object.create(null);
  Object.keys(idToEn).forEach(function (indonesian) {
    if (indonesian === 'faq') {
      enToId.FAQ = 'FAQ';
      return;
    }
    if (['beranda', 'tentang', 'teknologi', 'dokumentasi', 'struktur-tim', 'dashboard'].indexOf(indonesian) !== -1) return;
    enToId[idToEn[indonesian]] = indonesian;
  });

  var language = 'id';
  try {
    language = window.localStorage.getItem('vh-language') === 'en' ? 'en' : 'id';
  } catch (error) {
    console.warn('Could not read the saved language preference:', error);
  }

  function translateValue(value) {
    var leading = value.match(/^\s*/)[0];
    var trailing = value.match(/\s*$/)[0];
    var key = value.trim();
    var dictionary = language === 'en' ? idToEn : enToId;
    if (Object.prototype.hasOwnProperty.call(dictionary, key)) {
      return leading + dictionary[key] + trailing;
    }
    if (language === 'en') {
      var divisionNumber = key.match(/^Divisi (\d+)$/);
      if (divisionNumber) return leading + 'Division ' + divisionNumber[1] + trailing;
      var division = key.match(/^Divisi (.+)$/);
      if (division) return leading + (idToEn[division[1]] || division[1]) + ' Division' + trailing;
      var divisionLead = key.match(/^Ketua Divisi(?: (.+))?$/);
      if (divisionLead) return leading + (divisionLead[1] ? (idToEn[divisionLead[1]] || divisionLead[1]) + ' Division Lead' : 'Division Lead') + trailing;
      var officers = key.match(/^(\d+) pengurus$/);
      if (officers) return leading + officers[1] + ' officers' + trailing;
      var warning = key.match(/^Debit di bawah ambang \(([\d.,]+) L\/s\)$/);
      if (warning) return leading + 'Water flow below threshold (' + warning[1] + ' L/s)' + trailing;
      var elapsed = key.match(/^(-?\d+(?:[.,]\d+)?) dtk$/);
      if (elapsed) return leading + elapsed[1] + ' sec' + trailing;
      var firstVisit = key.match(/^Pertama kali:\s*(.+)$/);
      if (firstVisit) return leading + 'First visit: ' + firstVisit[1] + trailing;
      var members = key.match(/^(\d+) orang$/);
      if (members) return leading + members[1] + ' members' + trailing;
    } else {
      var englishDivision = key.match(/^(.+) Division$/);
      if (englishDivision) return leading + 'Divisi ' + (enToId[englishDivision[1]] || englishDivision[1]) + trailing;
      var englishDivisionLead = key.match(/^(?:(.+) )?Division Lead$/);
      if (englishDivisionLead) return leading + (englishDivisionLead[1] ? 'Ketua Divisi ' + (enToId[englishDivisionLead[1]] || englishDivisionLead[1]) : 'Ketua Divisi') + trailing;
      var englishDivisionNumber = key.match(/^Division (\d+)$/);
      if (englishDivisionNumber) return leading + 'Divisi ' + englishDivisionNumber[1] + trailing;
      var englishOfficers = key.match(/^(\d+) officers$/);
      if (englishOfficers) return leading + englishOfficers[1] + ' pengurus' + trailing;
      var englishWarning = key.match(/^Water flow below threshold \(([\d.,]+) L\/s\)$/);
      if (englishWarning) return leading + 'Debit di bawah ambang (' + englishWarning[1] + ' L/s)' + trailing;
      var englishElapsed = key.match(/^(-?\d+(?:[.,]\d+)?) sec$/);
      if (englishElapsed) return leading + englishElapsed[1] + ' dtk' + trailing;
      var englishFirstVisit = key.match(/^First visit:\s*(.+)$/);
      if (englishFirstVisit) return leading + 'Pertama kali: ' + englishFirstVisit[1] + trailing;
      var englishMembers = key.match(/^(\d+) members$/);
      if (englishMembers) return leading + englishMembers[1] + ' orang' + trailing;
    }
    return value;
  }

  function translateAttributes(element, attribute) {
    var attributes = attribute ? [attribute] : ['aria-label', 'title', 'placeholder', 'alt', 'data-l'];
    attributes.forEach(function (name) {
      if (!element.hasAttribute(name)) return;
      var value = element.getAttribute(name);
      var translated = translateValue(value);
      if (translated !== value) element.setAttribute(name, translated);
    });
  }

  function translatePhrases(root) {
    if (root.nodeType !== Node.ELEMENT_NODE) return;
    var selectors = 'h1, h2, h3, h4, p, summary, button, label, small, th, td, li, span';
    var elements = [];
    if (root.matches(selectors)) elements.push(root);
    elements = elements.concat(Array.prototype.slice.call(root.querySelectorAll(selectors)));
    elements.forEach(function (element) {
      if (!document.body.contains(element) || element.querySelector('a, button, input, svg, code, img, br, select, textarea')) return;
      var value = element.textContent;
      var translated = translateValue(value);
      if (translated !== value) element.textContent = translated;
    });
  }

  function translateNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      var value = node.nodeValue;
      var translated = translateValue(value);
      if (translated !== value) node.nodeValue = translated;
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE || /^(SCRIPT|STYLE|NOSCRIPT)$/.test(node.tagName)) return;
    translatePhrases(node);
    translateAttributes(node);
    node.querySelectorAll('[aria-label], [title], [placeholder], [alt]').forEach(function (element) {
      translateAttributes(element);
    });
    var walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, {
      acceptNode: function (textNode) {
        return /^(SCRIPT|STYLE|NOSCRIPT)$/.test(textNode.parentElement.tagName)
          ? NodeFilter.FILTER_REJECT
          : NodeFilter.FILTER_ACCEPT;
      }
    });
    var textNode;
    while ((textNode = walker.nextNode())) {
      var text = textNode.nodeValue;
      var result = translateValue(text);
      if (result !== text) textNode.nodeValue = result;
    }
  }

  function updateTitle() {
    var titles = {
      id: { beranda: 'Vortex Hydro', tentang: 'Tentang', teknologi: 'Teknologi', dokumentasi: 'Dokumentasi', 'struktur-tim': 'Struktur Tim', faq: 'FAQ', dashboard: 'Dashboard' },
      en: { beranda: 'Vortex Hydro', tentang: 'About', teknologi: 'Technology', dokumentasi: 'Documentation', 'struktur-tim': 'Team Structure', faq: 'FAQ', dashboard: 'Dashboard' }
    };
    var route = (window.location.hash || '#beranda').slice(1);
    var title = titles[language][route] || titles[language].beranda;
    document.title = route === 'beranda' ? title : title + ' | Vortex Hydro';
  }

  function updateLanguageControls() {
    document.querySelectorAll('[data-language-toggle]').forEach(function (button) {
      button.textContent = language === 'id' ? 'EN' : 'ID';
      var label = language === 'id' ? 'Ganti bahasa ke Inggris' : 'Ganti bahasa ke Bahasa Indonesia';
      button.setAttribute('aria-label', label);
      button.setAttribute('title', label);
    });
  }

  function applyLanguage() {
    document.documentElement.lang = language;
    translateNode(document.body);
    updateLanguageControls();
    updateTitle();
  }

  document.querySelectorAll('[data-language-toggle]').forEach(function (button) {
    button.addEventListener('click', function () {
      language = language === 'id' ? 'en' : 'id';
      try {
        window.localStorage.setItem('vh-language', language);
      } catch (error) {
        console.warn('Could not save the language preference:', error);
      }
      applyLanguage();
    });
  });

  window.addEventListener('hashchange', updateTitle);
  var observer = new MutationObserver(function (records) {
    records.forEach(function (record) {
      if (record.type === 'characterData') translateNode(record.target);
      else if (record.type === 'attributes') translateAttributes(record.target, record.attributeName);
      else record.addedNodes.forEach(translateNode);
    });
  });
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['aria-label', 'title', 'placeholder', 'alt']
  });

  applyLanguage();
})();
