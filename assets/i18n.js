(function () {
  'use strict';

  var idToEn = {
    'Mikro-hidro Lab': 'Micro-hydro Lab',
    'Cari': 'Search',
    'Admin': 'Admin',
    'Login Admin': 'Admin Login',
    'Ganti ke mode gelap': 'Switch to dark mode',
    'Ganti ke mode terang': 'Switch to light mode',
    'Navigasi seluler': 'Mobile navigation',
    'Turbin Pusaran Air': 'Water Vortex Turbine',
    'Listrik dari Aliran Rendah': 'Power from Low-Head Water Flows',
    'Kalkulator Daya': 'Power Calculator',
    'Pompa Sirkulasi': 'Circulation Pump',
    'Kincir Turbin': 'Turbine Wheel',
    '6 sudu · Poros Ø 30 mm': '6 blades · Ø 30 mm shaft',
    'Rasio Transmisi': 'Transmission Ratio',
    'Pulley & V-belt step-up': 'Step-up pulley & V-belt',
    'Beban Listrik': 'Electrical Load',
    'Arsitektur Prototipe Lab': 'Lab Prototype Architecture',
    'Sistem Sirkulasi Air Tertutup': 'Closed-Loop Water Circulation System',
    'Rangka 2 × 0,8 m': '2 × 0.8 m frame',
    'Buka Diagram Penampang Interaktif (8 Titik Komponen)': 'Open Interactive Cross-Section Diagram (8 Component Hotspots)',
    'Latar Belakang': 'Background',
    'Konsep Turbin Pusaran & Head Rendah': 'Vortex Turbine & Low-Head Concept',
    'Memanfaatkan energi potensial dan kinetik aliran air pada tinggi jatuh rendah.': 'Harnesses potential and kinetic energy of water flow at low head.',
    'Subsistem Alat': 'System Subsystems',
    'Enam bagian utama dalam rangkaian sirkulasi air tertutup dan konversi energi listrik prototipe.': 'Six main stages in the prototype closed-loop water circulation and electrical conversion system.',
    'Detail Peralatan': 'Equipment Details',
    'Pompa Wasser WD-101E & Pipa Ø 45 mm': 'Wasser WD-101E Pump & Ø 45 mm Pipe',
    'Pompa celup 220 V / 100 W menyirkulasikan air dari tangki bawah Ø 520 mm menuju bak penenang atas melalui pipa dorong.': 'A 220 V / 100 W submersible pump circulates water from the Ø 520 mm lower tank to the upper headbox via the pressure pipe.',
    'Headbox & Saluran': 'Headbox & Channel',
    'Bak Penenang & Saluran Miring': 'Stilling Headbox & Sloped Channel',
    'Meredam turbulensi aliran lalu mengarahkan air melewati saluran akrilik miring yang menyempit dari 0,416 m ke 0,28 m.': 'Damps flow turbulence and guides water down a sloped acrylic channel narrowing from 0.416 m to 0.28 m.',
    'Kincir Air 6 Sudu (Ø 330 mm)': '6-Blade Waterwheel (Ø 330 mm)',
    'Kincir berdiameter 330 mm dengan lebar sudu 250 mm menangkap dorongan aliran air untuk menghasilkan torsi mekanik.': 'A 330 mm diameter wheel with 250 mm blade width captures water thrust to produce mechanical torque.',
    'Poros & Transmisi': 'Shaft & Transmission',
    'Poros Stainless Ø 30 mm & Pulley 1:4': 'Ø 30 mm Stainless Shaft & 1:4 Pulley',
    'Poros utama menembus sekat ke zona kering, memutar transmisi pulley Ø 270 mm ke Ø 67,5 mm dengan V-belt step-up.': 'The main shaft passes through the partition into the dry zone, driving a Ø 270 mm to Ø 67.5 mm step-up pulley and V-belt.',
    'Unit generator magnet permanen mengubah putaran yang telah dinaikkan rasionya menjadi daya listrik arus searah (DC).': 'A permanent-magnet generator unit converts the stepped-up rotation into direct-current (DC) electrical power.',
    'Beban & Sirkulasi': 'Load & Circulation',
    'Baterai 12 V & 2 Lampu LED (10 W)': '12 V Battery & 2 LED Lamps (10 W)',
    'Listrik disalurkan untuk menyalakan 2 unit lampu LED (masing-masing 12 V / 5 W), sementara air jatuh kembali ke tangki.': 'Electricity powers two 12 V / 5 W LED lamps while water drops back into the reservoir tank.',
    'Jelajahi Vortex Hydro': 'Explore Vortex Hydro',
    'Diagram penampang interaktif 8 komponen, daftar spesifikasi alat, dan kalkulator daya mikro-hidro.': 'Interactive 8-component cross-section diagram, equipment specs, and micro-hydro power calculator.',
    'Parameter desain teknis, tahapan fabrikasi & metodologi pengujian laboratorium, serta daftar FAQ.': 'Technical design parameters, fabrication stages & lab testing methodology, plus FAQ.',
    'Susunan pengurus inti dan 7 divisi teknis: Modeling, Mat Model, Software, Electrical, Mekanikal, Perlengkapan, dan PDD.': 'Core management and 7 technical divisions: Modeling, Mat Model, Software, Electrical, Mechanical, Equipment, and PDD.',
    'Perangkat Rekayasa': 'Engineering Tools',
    'Simulasi CFD Aliran': 'CFD Flow Simulation',
    'Gambar Kerja & CAD': 'Engineering Drawings & CAD',
    'Pemodelan Matematis': 'Mathematical Modeling',
    'Web & Dashboard': 'Web & Dashboard',
    'Teknologi & Rancangan Alat': 'Technology & System Design',
    'Prinsip konversi energi tiga tahap dari sirkulasi air ber-head rendah hingga menghasilkan daya listrik DC.': 'Three-stage energy conversion principle from low-head water circulation to DC electricity generation.',
    'Pompa mengalirkan air dari tangki bawah menuju bak penenang (headbox) secara kontinu.': 'The pump continuously circulates water from the lower tank to the stilling headbox.',
    'Saluran pengarah menyempitkan aliran untuk memutar sudu turbin dan poros utama.': 'The guide channel narrows the flow to turn the turbine blades and main shaft.',
    'Transmisi pulley 1:4 memutar generator DC untuk mengisi baterai dan menyalakan beban LED.': 'A 1:4 pulley transmission drives the DC generator to charge the battery and light the LED load.',
    'Skema Interaktif': 'Interactive Schematic',
    '1 set': '1 set',
    'Simulasi Perhitungan': 'Calculation Simulator',
    'Skala Lab (1.5 L/s)': 'Lab Scale (1.5 L/s)',
    'Saluran Irigasi (50 L/s)': 'Irrigation Canal (50 L/s)',
    'Mikro-hidro Desa (150 L/s)': 'Village Micro-hydro (150 L/s)',
    'Estimasi Daya Listrik Output': 'Estimated Electrical Power Output',
    'Daya Hidrolik': 'Hydraulic Power',
    'Potensi Energi (24 Jam)': 'Energy Potential (24 Hours)',
    'Keunggulan Sistem': 'System Advantages',
    'Sasaran': 'Objectives',
    'Dokumentasi Teknis & Referensi': 'Technical Documentation & Reference',
    'Dokumentasi Proyek Vortex Hydro': 'Vortex Hydro Project Documentation',
    'Parameter dimensi prototipe, tahapan perancangan & pengujian laboratorium, serta jawaban atas pertanyaan teknis yang sering diajukan.': 'Prototype dimensional parameters, design & laboratory testing stages, and answers to frequently asked technical questions.',
    'Spesifikasi Prototipe': 'Prototype Specifications',
    'Data ukuran mekanis, sistem hidrolik, dan komponen kelistrikan pada simulator laboratorium.': 'Mechanical dimensions, hydraulic system data, and electrical components of the laboratory simulator.',
    'Spesifikasi / Nilai': 'Specification / Value',
    'Keterangan Teknis': 'Technical Notes',
    'Rangka penyangga utama saluran atas dan tangki bawah': 'Main support frame for upper channel and lower tank',
    'Silinder penampung air sirkulasi tertutup': 'Closed-loop circulating water reservoir cylinder',
    'Menyirkulasikan air lewat pipa dorong Ø 45 mm': 'Circulates water through the Ø 45 mm pressure pipe',
    'Saluran akrilik miring yang menyempit ke arah sudu': 'Sloped acrylic channel narrowing toward the blades',
    'Lebar sudu 250 mm pada poros utama stainless Ø 30 mm': '250 mm blade width on a Ø 30 mm stainless main shaft',
    'Transmisi pulley Ø 270 mm ke Ø 67,5 mm dengan V-belt': 'Ø 270 mm to Ø 67.5 mm pulley transmission with V-belt',
    'Dipasang di zona kering di balik sekat pelindung cipratan': 'Mounted in the dry zone behind the splash partition',
    'Disuplai melalui baterai 12 V dan pengontrol pengisian': 'Supplied via a 12 V battery and charge controller',
    'Metodologi Pengerjaan': 'Engineering Methodology',
    'Tahapan Perancangan & Pengujian': 'Design & Testing Stages',
    'Alur kerja tim mulai dari simulasi komputer hingga pengukuran langsung di laboratorium.': 'Team workflow from computer simulation to hands-on laboratory measurement.',
    'Tahap 01': 'Stage 01',
    'Tahap 02': 'Stage 02',
    'Tahap 03': 'Stage 03',
    'Tahap 04': 'Stage 04',
    'Membuat desain 3D dan gambar kerja teknik untuk sistem sirkulasi air tertutup menggunakan AutoCAD, ANSYS Fluent, dan MATLAB.': 'Creating 3D designs and engineering drawings for the closed-loop water circulation system using AutoCAD, ANSYS Fluent, and MATLAB.',
    'Vortex Hydro · FAQ': 'Vortex Hydro · FAQ',
    'Organisasi Proyek Kelas': 'Class Project Organization',
    'Kolaborasi mahasiswa Teknologi Rekayasa Pembangkit Energi, Fakultas Vokasi, Universitas Negeri Malang dalam kepengurusan inti dan 7 divisi teknis.': 'Collaboration of Energy Power Generation Engineering Technology students, Faculty of Vocational Studies, Universitas Negeri Malang across core management and 7 technical divisions.',
    'Pimpinan Proyek': 'Project Leadership',
    'Koordinator Utama Proyek Kelas': 'Lead Class Project Coordinator',
    'Administrasi & Dokumentasi': 'Administration & Documentation',
    'Anggaran & Logistik': 'Budget & Logistics',
    '7 Divisi Teknis & Operasional': '7 Technical & Operational Divisions',
    'Pemodelan geometri 3D dan simulasi perilaku aliran fluida untuk mengevaluasi rancangan turbin vortex.': '3D geometric modeling and fluid-flow behavior simulation to evaluate the vortex turbine design.',
    'Pemodelan matematis, perhitungan hidrodinamika, dan kajian material komponen prototipe.': 'Mathematical modeling, hydrodynamic calculations, and material analysis of prototype components.',
    'Pengembangan aplikasi web, dashboard telemetri simulasi, dan integrasi asisten AI Vortex Hydro.': 'Web application development, simulation telemetry dashboard, and Vortex Hydro AI assistant integration.',
    'Perancangan sistem pembangkitan DC, pengkondisian daya, sensor instrumentasi, dan beban lampu LED.': 'DC generation system design, power conditioning, instrumentation sensors, and LED lamp load.',
    'Fabrikasi struktur rangka, perakitan kincir 6 sudu, poros utama, serta transmisi pulley dan V-belt.': 'Frame structure fabrication, 6-blade wheel assembly, main shaft, and pulley/V-belt transmission.',
    'Pengadaan komponen teknik, logistik laboratorium, dan kesiapan peralatan pengujian prototipe.': 'Engineering component procurement, laboratory logistics, and prototype test equipment readiness.',
    'Publikasi ilmiah, desain visual, dan dokumentasi foto/video selama proses perakitan serta pengujian.': 'Scientific publication, visual design, and photo/video documentation during assembly and testing.',
    'Akses Terbatas': 'Restricted Access',
    'Dashboard Khusus Admin': 'Admin-Only Dashboard',
    'Panel telemetri sensor simulasi, grafik pemantauan 60 detik, dan diagnostik prototipe hanya dapat dibuka menggunakan akses Administrator.': 'The simulation sensor telemetry panel, 60-second monitoring chart, and prototype diagnostics require Administrator access.',
    'Lihat Spesifikasi Alat': 'View Equipment Specs',
    'Peralatan': 'Equipment',
    'Daftar Peralatan & Komponen': 'Equipment & Components List',
    'Komponen utama yang dipakai pada prototipe simulator.': 'Main components used in the simulator prototype.',
    'Jumlah': 'Quantity',
    'Generator XD 3240': 'Generator XD 3240',
    '1 unit': '1 unit',
    'Unit pembangkit daya': 'Power generating unit',
    'Pompa Celup Air Wasser WD-101E': 'Wasser WD-101E submersible water pump',
    'Pipa': 'Pipe',
    'Beranda': 'Home',
    'Tentang': 'About',
    'Dokumentasi': 'Documentation',
    'Tim': 'Team',
    'Struktur Tim': 'Team Structure',
    'Dashboard': 'Dashboard',
    'Lihat Dokumentasi': 'View Documentation',
    'Ganti bahasa ke Inggris': 'Switch language to English',
    'Ganti bahasa ke Bahasa Indonesia': 'Switch language to Indonesian',
    'Cari di situs': 'Search the site',
    'Cari (Ctrl+K)': 'Search (Ctrl+K)',
    'Menu utama': 'Main menu',
    'Vortex Hydro, ke beranda': 'Vortex Hydro, home',
    'Proyek Kelas · Mikro-hidro': 'Class Project · Micro-hydro',
    'Simulator PLTA vortex skala laboratorium yang mengubah aliran air berketinggian rendah menjadi listrik, tanpa bendungan.': 'A laboratory-scale vortex hydropower simulator that turns low-head water flow into electricity, without a dam.',
    'Cara Kerja': 'How It Works',
    'Klik bagian pada gambar untuk melihat fungsinya.': 'Click a part of the picture to see what it does.',
    'Pilih bagian': 'Pick a part',
    'Klik gambar atau tombol di bawah.': 'Click the picture or a button below.',
    'Penampang samping, tidak berskala. Garis putus-putus = zona kering.': 'Side view, not to scale. Dashed lines = dry zone.',
    'Tentang & Cara Kerja': 'About & How It Works',
    'Pompa dan Pipa Hisap': 'Pump & Suction Pipe',
    'Pipa Dorong dan Flow Meter': 'Pressure Pipe & Flow Meter',
    'Menampung air yang berputar. Air dari kincir jatuh kembali ke sini.': 'Holds the circulating water. Water from the wheel falls back here.',
    'Menyedot air dari tangki lalu mendorongnya naik ke headbox.': 'Draws water from the tank and pushes it up to the headbox.',
    'Mengalirkan air ke atas. Flow meter membaca debitnya.': 'Carries water upward. The flow meter reads the flow rate.',
    'Menenangkan air supaya aliran halus sebelum masuk saluran.': 'Calms the water so the flow is smooth before entering the channel.',
    'Menyempitkan dan mengarahkan air tepat ke sudu kincir.': 'Narrows the flow and aims it right at the wheel blades.',
    'Diputar oleh air untuk menggerakkan generator.': 'Spun by the water to drive the generator.',
    'Air bekas memutar kincir jatuh kembali ke tangki.': 'Water that has turned the wheel drops back into the tank.',
    'Pulley menaikkan putaran, generator mengisi baterai untuk lampu LED.': 'The pulley speeds up rotation, the generator charges the battery for the LED lamp.',
    'Lihat Cara Kerja': 'See How It Works',
    'Buka Dashboard': 'Open Dashboard',
    'Tangki Penampung': 'Reservoir Tank',
    'Pompa & Pipa Hisap': 'Pump & Suction Pipe',
    'Pipa Dorong & Flow Meter': 'Pressure Pipe & Flow Meter',
    'Headbox': 'Headbox',
    'Saluran Miring': 'Sloped Channel',
    'Kincir Air 6 Sudu': '6-Blade Waterwheel',
    'Terjunan Air': 'Tailrace',
    'Zona Kering': 'Dry Zone',
    'Diameter kincir': 'Waterwheel diameter',
    'Diameter tangki penampung': 'Reservoir tank diameter',
    'Lebar saluran (masuk → depan kincir)': 'Channel width (inlet → in front of wheel)',
    'Rasio putaran poros : generator': 'Speed ratio shaft : generator',
    'Beban listrik (lampu LED)': 'Electrical load (LED lamp)',
    'Mikro-hidro': 'Micro-hydro',
    'Head rendah': 'Low head',
    'Head Rendah': 'Low Head',
    'Tanpa bendungan': 'No dam',
    'Tanpa Bendungan': 'No Dam',
    'Pendahuluan': 'Introduction',
    'Banyak aliran air kecil punya tinggi jatuh rendah, sehingga tidak bisa memutar turbin biasa. Vortex Hydro memakai pusaran air di dalam basin untuk mengubahnya menjadi listrik, tanpa bendungan.': 'Many small water flows have a low head and cannot turn conventional turbines. Vortex Hydro uses a water vortex in a basin to generate electricity without a dam.',
    'Irigasi dan pedesaan': 'Irrigation and rural areas',
    'Penerangan dan pompa kecil.': 'Lighting and small pumps.',
    'Sungai kecil dan saluran': 'Small rivers and canals',
    'Tanpa bendungan besar.': 'No large dam required.',
    'Edukasi dan riset': 'Education and research',
    'Rancangan terbuka untuk dipelajari.': 'An open design for learning.',
    'Peta website': 'Site map',
    'Komponen yang Digunakan': 'Components Used',
    'Saluran Masuk': 'Inlet Channel',
    'Turbin': 'Turbine',
    'Generator': 'Generator',
    'Software yang Menunjang Proyek': 'Software Supporting the Project',
    'Perancangan, simulasi, dan pemrograman proyek ini dikerjakan dengan empat perangkat lunak berikut.': 'The project design, simulation, and programming use the following four software tools.',
    'Tentang Vortex Hydro': 'About Vortex Hydro',
    'Apa Itu Vortex Hydro?': 'What Is Vortex Hydro?',
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
    'Lampu LED': 'LED light',
    'Parameter Desain': 'Design Parameters',
    'Parameter': 'Parameter',
    'Ketua Tim': 'Team Lead',
    'Sekretaris': 'Secretary',
    'Bendahara': 'Treasurer',
    'Anggota': 'Member',
    'Divisi': 'Division',
    'Ketua Divisi': 'Division Lead',
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
    'Struktur Tim Vortex Hydro': 'Vortex Hydro Team Structure',
    'Live · Simulasi': 'Live · Simulation',
    'Jeda': 'Pause',
    'Lanjut': 'Resume',
    'Debit air': 'Water flow',
    'Grafik 60 detik terakhir': 'Last 60 seconds',
    'Debit': 'Flow',
    'Indikator': 'Indicators',
    'Log kejadian': 'Event log',
    'Riwayat kunjungan': 'Visit history',
    'Hapus riwayat': 'Clear history',
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
    'Kalkulator Daya Mikro-hidro': 'Micro-hydro Power Calculator',
    'Debit air Q (liter/detik)': 'Water flow Q (liters/second)',
    'Head H (meter)': 'Head H (meters)',
    'Efisiensi η (%)': 'Efficiency η (%)',
    'Ketik minimal 2 huruf. Pintasan: Ctrl+K atau tombol /.': 'Type at least 2 characters. Shortcut: Ctrl+K or the / key.',
    'Cari halaman, komponen, atau tim…': 'Search pages, components, or team members…',
    'Ilustrasi turbin pusaran': 'Vortex turbine illustration',
    'Grafik data sensor': 'Sensor data chart',
    'TikTok Vortexa.Team': 'Vortexa.Team on TikTok',
    'Instagram vortexa.team': 'vortexa.team on Instagram',
    'Tutup': 'Close',
    'Mode terang/gelap': 'Light/dark mode',
    'Kata kunci pencarian': 'Search query',
    'Tutup pencarian': 'Close search',
    'Hasil pencarian': 'Search results',
    'Pertanyaan yang Sering Diajukan': 'Frequently Asked Questions',
    'Jawaban ringkas tentang tujuan proyek, prinsip kerja turbin, dan cara membaca data prototipe.': 'Quick answers about the project goals, how the turbine works, and how to read prototype data.',
    'Apa itu Vortex Hydro?': 'What is Vortex Hydro?',
    'Bagaimana cara kerja turbin vortex?': 'How does a vortex turbine work?',
    'Apakah sistem ini membutuhkan bendungan besar?': 'Does the system require a large dam?',
    'Tidak. Konsep proyek dirancang untuk memanfaatkan aliran dengan tinggi jatuh rendah dan tidak memerlukan bendungan besar. Kinerja tetap bergantung pada kondisi aliran dan rancangan prototipe.': 'No. The project is designed to use low-head water flows and does not require a large dam. Performance still depends on flow conditions and the prototype design.',
    'Apakah angka pada dashboard merupakan hasil pengukuran langsung?': 'Are the dashboard values direct measurements?',
    'Tidak selalu. Dashboard menggunakan data simulasi secara bawaan. Nilai simulasi membantu menjelaskan cara kerja antarmuka dan bukan hasil pengujian lapangan. Data nyata memerlukan sumber sensor yang terhubung.': 'Not necessarily. The dashboard uses simulated data by default. These values demonstrate the interface and are not field-test results. Real data requires a connected sensor source.',
    'Faktor apa yang memengaruhi daya yang dihasilkan?': 'What affects the generated power?',
    'Daya dipengaruhi oleh debit air, tinggi jatuh, serta efisiensi turbin dan generator. Rumus pada Kalkulator Daya adalah model sederhana; hasil aktual perlu diverifikasi melalui pengujian.': 'Power depends on water flow, head, and turbine and generator efficiency. The formula in the Power Calculator is a simplified model; actual results must be verified by testing.',
    'Perangkat lunak apa yang digunakan dalam proyek?': 'What software is used in the project?',
    'Proyek ini menggunakan ANSYS Fluent, AutoCAD, MATLAB, dan VS Code untuk mendukung simulasi, perancangan, dan pemrograman.': 'The project uses ANSYS Fluent, AutoCAD, MATLAB, and VS Code for simulation, design, and programming.',
    'Bagaimana cara menghubungi tim?': 'How can I contact the team?',
    'Tim dapat dihubungi melalui': 'You can contact the team at',
    '. Proyek ini dikembangkan di Universitas Negeri Malang.': '. The project is developed at Universitas Negeri Malang.',
    '© 2026 Vortex Hydro. Proyek kelas Mekanika Fluida, Universitas Negeri Malang.': '© 2026 Vortex Hydro. Fluid Mechanics class project, Universitas Negeri Malang.',
    'Kami merancang, membangun, dan menguji simulator PLTA Vortex skala laboratorium secara mandiri. Air dipompa ke bak penenang, mengalir di saluran miring, lalu memutar kincir yang menggerakkan generator.': 'We design, build, and test a laboratory-scale Vortex hydropower simulator on our own. Water is pumped to the stilling headbox, flows down a sloped chute, then turns the waterwheel that drives the generator.',
    'Merancang': 'Designing',
    'Aliran sungai tidak mungkin dibawa ke kampus, jadi pompa mengalirkan air dari tangki penampung bawah secara terus-menerus menuju bak penenang (headbox) dan saluran miring yang menyempit.': 'A river cannot be brought to campus, so a pump continuously moves water from the lower storage tank to the stilling headbox and a narrowing sloped chute.',
    'Sirkulasi dengan pompa': 'Pump circulation',
    'Poros kincir menembus dinding sekat ke zona kering, lalu terhubung ke generator lewat pulley dan belt 1:4 untuk menghasilkan listrik.': 'The waterwheel shaft passes through the splash partition into the dry zone, then connects to the generator through a 1:4 pulley and belt to produce electricity.',
    'Turbin dan generator': 'Turbine and generator',
    'Setelah semua komponen terpasang, kami mengukur debit air, kecepatan putaran turbin (RPM), dan daya listrik yang keluar. Teori dan rumus Mekanika Fluida pun terbukti secara nyata.': 'Once everything is assembled, we measure the water flow rate, turbine speed (RPM), and electrical power output, proving Fluid Mechanics theory and formulas in practice.',
    'Pengujian langsung': 'Hands-on testing',
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
    'Baterai': 'Battery',
    'Tanya AI': 'Ask AI',
    'Tanya seputar Vortex Hydro…': 'Ask about Vortex Hydro…',
    'Simulasi': 'Simulator',
    'Proyek Kelas Mekanika Fluida · Universitas Negeri Malang': 'Fluid Mechanics Class Project · Universitas Negeri Malang',
    'Listrik bersih dari': 'Clean electricity from',
    'pusaran air head rendah': 'low-head water vortex',
    'Prototipe simulator PLTA vortex sirkulasi tertutup skala laboratorium — mengubah aliran air berketinggian rendah menjadi listrik tanpa bendungan besar.': 'Laboratory-scale closed-loop vortex micro-hydro simulator — turning low-head water flow into electricity without a large dam.',
    'Coba Simulasi Arus Air →': 'Try Water Flow Simulator →',
    'Pelajari Cara Kerja': 'Learn How It Works',
    'Prototipe dalam Angka': 'Prototype in Numbers',
    'Vortex Hydro dalam': 'Vortex Hydro in',
    'data teknis nyata': 'real engineering data',
    'Dirancang, dirakit, dan diuji di laboratorium pada rangka 2,0 × 0,8 meter dengan sirkulasi air tertutup.': 'Designed, built, and tested in the lab on a 2.0 × 0.8 m closed-loop water circulation frame.',
    'Diameter Kincir 6 Sudu': '6-Blade Waterwheel Diameter',
    'Transmisi Step-Up': 'Step-Up Transmission',
    'Beban Output LED': 'LED Output Load',
    'Coba Langsung': 'Try It Live',
    'Geser kecepatan arus air,': 'Slide the water flow speed,',
    'lihat turbin berputar': 'watch the turbine spin',
    'Atur debit air (Q), tinggi jatuh (H), dan efisiensi (η) untuk melihat perubahan putaran kincir, arus aliran, dan daya listrik secara real-time.': 'Adjust water flow (Q), head (H), and efficiency (η) to see live water current, turbine rotation, and electrical power output.',
    'Skala Lab': 'Lab Scale',
    'Saluran Irigasi': 'Irrigation Canal',
    'Mikro-hidro Desa': 'Village Micro-hydro',
    'Debit air Q (kecepatan arus)': 'Water flow Q (current speed)',
    'Tinggi jatuh / Head H': 'Water head H',
    'Efisiensi sistem η': 'System efficiency η',
    'Daya Listrik Output': 'Electrical Power Output',
    'Putaran Turbin': 'Turbine Speed',
    'Energi Harian (24 Jam)': 'Daily Energy (24 Hours)',
    'Anatomi Prototipe': 'Prototype Anatomy',
    'Cara kerja sistem,': 'How the system works,',
    'klik setiap komponen': 'click each component',
    'Dokumentasi & Pengujian': 'Documentation & Testing',
    'Dari desain CAD': 'From CAD design',
    'hingga uji laboratorium': 'to lab testing',
    'Simulasi CAD & CFD': 'CAD & CFD Simulation',
    'Rangka & Sirkulasi': 'Frame & Circulation',
    'Turbin & Generator': 'Turbine & Generator',
    'Pengujian Langsung': 'Hands-On Testing',
    'Tim Proyek Kelas': 'Class Project Team',
    'Dikerjakan bersama oleh': 'Built together by',
    '7 divisi teknis': '7 technical divisions',
    'Semua Divisi': 'All Divisions',
    'Pengurus Inti': 'Core Team',
    'Pertanyaan yang': 'Frequently',
    'sering diajukan': 'asked questions',
    'Pantau simulasi telemetri': 'Monitor live prototype',
    'prototipe secara langsung': 'telemetry simulation',
    'Buka Dashboard Admin →': 'Open Admin Dashboard →',
    'Tentang Kami': 'About Us',
    'Ketua Tim &': 'Team Lead &',
    'Ketua Divisi': 'Division Leads',
    'Lihat seluruh anggota divisi →': 'View all division members →',
    'Mode Terang / Gelap': 'Light / Dark Mode',
    'Ganti Bahasa (ID/EN)': 'Switch Language (ID/EN)',
    'Buka halaman →': 'Open page →',
    'Jelajahi Proyek': 'Explore Project',
    'Akses halaman': 'Access pages',
    'sesuai kebutuhan': 'as needed',
    'Tim Kepemimpinan': 'Leadership Team',
    'Klik ketua divisi untuk melihat seluruh anggota': 'Click a division lead to view all members',
    'Kami adalah perancang': 'We are builders',
    'Alur Konversi Energi': 'Energy Conversion Flow',
    'Tiga tahap dari': 'Three stages from',
    'aliran air ke listrik': 'water flow to electricity',
    'Sirkulasi Air Tertutup': 'Closed-Loop Water Circulation',
    'Fokus Aliran & Kincir 6 Sudu': 'Focused Flow & 6-Blade Wheel',
    'Transmisi 1:4 & Pembangkit DC': '1:4 Step-Up & DC Generation',
    'Gulir untuk menjelajah': 'Scroll to explore',
    'Mode Warna & Tema': 'Color Palette & Theme',
    'Ganti Mode Terang / Gelap': 'Switch Light / Dark Mode'
  };

  var enToId = Object.create(null);
  Object.keys(idToEn).forEach(function (indonesian) {
    enToId[idToEn[indonesian]] = indonesian;
  });

  var language = 'id';
  try {
    language = window.localStorage.getItem('vh-language') === 'en' ? 'en' : 'id';
  } catch (error) {}

  function translateValue(value) {
    var leading = value.match(/^\s*/)[0];
    var trailing = value.match(/\s*$/)[0];
    var key = value.trim();
    if (!key) return value;
    var dictionary = language === 'en' ? idToEn : enToId;
    if (Object.prototype.hasOwnProperty.call(dictionary, key)) {
      return leading + dictionary[key] + trailing;
    }
    if (language === 'en') {
      var divisionNumber = key.match(/^Divisi (\d+)$/);
      if (divisionNumber) return leading + 'Division ' + divisionNumber[1] + trailing;
      var members = key.match(/^(\d+) orang$/);
      if (members) return leading + members[1] + ' members' + trailing;
    } else {
      var englishDivisionNumber = key.match(/^Division (\d+)$/);
      if (englishDivisionNumber) return leading + 'Divisi ' + englishDivisionNumber[1] + trailing;
      var englishMembers = key.match(/^(\d+) members$/);
      if (englishMembers) return leading + englishMembers[1] + ' orang' + trailing;
    }
    return value;
  }

  function translateAttributes(element, attribute) {
    var attributes = attribute ? [attribute] : ['aria-label', 'title', 'placeholder', 'alt'];
    attributes.forEach(function (name) {
      if (!element.hasAttribute(name)) return;
      var value = element.getAttribute(name);
      var translated = translateValue(value);
      if (translated !== value) element.setAttribute(name, translated);
    });
  }

  function translatePhrases(root) {
    if (root.nodeType !== Node.ELEMENT_NODE) return;
    var selectors = 'h1, h2, h3, h4, p, summary, button, label, small, th, td, li, span, dt, b, strong, em';
    var elements = [];
    if (root.matches(selectors)) elements.push(root);
    elements = elements.concat(Array.prototype.slice.call(root.querySelectorAll(selectors)));
    elements.forEach(function (element) {
      if (!document.body.contains(element) || element.querySelector('a, button, input, svg, code, img, br, select, textarea, span, b, strong, em, small')) return;
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
      id: { beranda: 'Vortex Hydro', tentang: 'Tentang & Teknologi', dokumentasi: 'Dokumentasi & FAQ', 'struktur-tim': 'Struktur Tim', dashboard: 'Dashboard' },
      en: { beranda: 'Vortex Hydro', tentang: 'About & Technology', dokumentasi: 'Documentation & FAQ', 'struktur-tim': 'Team Structure', dashboard: 'Dashboard' }
    };
    var route = (window.location.hash || '#beranda').slice(1);
    if (route === 'faq') route = 'dokumentasi';
    var title = titles[language][route] || titles[language].beranda;
    document.title = route === 'beranda' ? title : title + ' | Vortex Hydro';
  }

  function updateLanguageControls() {
    document.querySelectorAll('[data-language-toggle]').forEach(function (button) {
      var lblEl = button.querySelector('[data-lang-label]');
      if (lblEl) {
        lblEl.textContent = language === 'id' ? 'Ganti Bahasa (ID → EN)' : 'Switch Language (EN → ID)';
      } else {
        button.textContent = language === 'id' ? 'EN' : 'ID';
      }
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
      } catch (error) {}
      applyLanguage();
    });
  });

  window.addEventListener('hashchange', updateTitle);
  var observer = new MutationObserver(function (records) {
    if (language !== 'en') return;
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

  if (language === 'en') applyLanguage();
  else {
    updateLanguageControls();
    updateTitle();
  }
})();
