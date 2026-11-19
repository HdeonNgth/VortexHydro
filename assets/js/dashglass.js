/* Dashboard: sidebar kategori, judul tiap tampilan, dan penyaring bagian (atribut data-sec).
   Setiap bagian dashboard menulis data-sec="kategori1 kategori2"; hanya yang memuat nama
   tampilan aktif yang ditampilkan. Semua id lama dipertahankan agar navigation.js tetap jalan. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var page = $("dashboard"), bar = $("dsbn"), lens = $("dsbl");
  var dash = page && page.querySelector(".dash");
  if (!dash || !bar) return;

  var VIEWS = {
    ringkasan: ["Ringkasan", "sekilas", "Kondisi prototipe saat ini: sensor, tren, dan peringatan. Diperbarui setiap detik."],
    sensor: ["Sensor", "langsung", "Debit air, tegangan baterai, RPM poros utama, dan RPM generator, lengkap dengan indikator dan log kejadian."],
    grafik: ["Grafik", "pemantauan", "Tren sensor 60 detik terakhir. Arahkan kursor ke grafik untuk melihat nilainya."],
    riwayat: ["Riwayat", "kunjungan", "Halaman yang dibuka pengunjung website dan kapan mereka datang."]
  };
  var btns = [].slice.call(bar.querySelectorAll("button[data-v]"));
  var ttl = $("dtitle"), sub = $("dsub"), crumb = $("dcrumb");

  function filter() {
    var v = dash.dataset.pane;
    [].forEach.call(dash.querySelectorAll("[data-sec]"), function (el) { el.hidden = el.dataset.sec.split(" ").indexOf(v) < 0; });
    [].forEach.call(dash.querySelectorAll(".drow"), function (row) {
      var n = 0; [].forEach.call(row.children, function (c) { if (!c.hidden) n++; });
      row.dataset.n = n; row.hidden = n === 0;
    });
  }
  function placeLens() {
    var a = bar.querySelector("[aria-current]");
    if (!a || !lens || !a.offsetWidth) return;
    lens.style.width = a.offsetWidth + "px"; lens.style.height = a.offsetHeight + "px";
    lens.style.transform = "translate(" + a.offsetLeft + "px," + a.offsetTop + "px)";
    if (!lens.classList.contains("on")) { void lens.offsetWidth; lens.classList.add("on"); }
  }
  function replay() { page.classList.remove("vx-enter"); void page.offsetWidth; page.classList.add("vx-enter"); }

  function show(v, byUser) {
    if (!VIEWS[v]) v = "ringkasan";
    dash.dataset.pane = v;
    btns.forEach(function (b) { if (b.dataset.v === v) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current"); });
    var t = VIEWS[v], em = document.createElement("em");
    em.textContent = t[1]; ttl.textContent = t[0] + " "; ttl.appendChild(em);
    sub.textContent = t[2];
    var cur = bar.querySelector("[aria-current]"); if (crumb && cur) crumb.textContent = cur.dataset.tip;
    filter(); placeLens();
    try { sessionStorage.setItem("vx-dash-pane", v); } catch (e) {}
    if (byUser) { replay(); window.scrollTo(0, 0); }
  }
  bar.addEventListener("click", function (e) {
    var b = e.target.closest("button[data-v]"); if (b) show(b.dataset.v, true);
  });

  /* bagian yang dibuat belakangan (energi, penjelasan masalah) ikut disaring */
  new MutationObserver(filter).observe(dash, { childList: true });
  /* sidebar baru terlihat setelah masuk mode dashboard: pasang ulang penanda aktif */
  new MutationObserver(function () { requestAnimationFrame(function () { requestAnimationFrame(placeLens); }); })
    .observe(document.body, { attributes: true, attributeFilter: ["class"] });
  window.addEventListener("resize", placeLens);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeLens);

  [].forEach.call(dash.querySelectorAll(".dc"), function (c, i) { c.style.setProperty("--i", i); });

  /* akun: nama di pojok kanan atas, tombol keluar akun memakai tombol Keluar bawaan */
  function who(s) {
    var n = (s && s.displayName) || "Admin";
    if ($("dwho")) $("dwho").textContent = n;
    if ($("dav")) $("dav").textContent = n.charAt(0).toUpperCase();
  }
  window.addEventListener("vx:authchange", function (e) { who(e.detail); });
  try { if (window.VXAuth && VXAuth.state) who(VXAuth.state()); } catch (e) {}
  var out = $("dlogout");
  if (out) out.addEventListener("click", function () { var l = document.querySelector(".lg__logout"); if (l) l.click(); });

  /* tombol Jeda/Lanjut: label dibaca pembaca layar, teksnya disembunyikan oleh CSS */
  var pause = $("dpause");
  if (pause) {
    var sync = function () { var t = pause.textContent.trim(); if (!t) return; pause.title = t; pause.setAttribute("aria-label", t); pause.dataset.s = t.toLowerCase(); };
    sync(); new MutationObserver(sync).observe(pause, { childList: true, characterData: true, subtree: true });
  }

  var saved = null; try { saved = sessionStorage.getItem("vx-dash-pane"); } catch (e) {}
  show(saved, false);
})();
