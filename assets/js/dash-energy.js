/* Dashboard energi Vortex Hydro: total energi, efisiensi PLN → listrik dihasilkan, grafik tumpang-tindih,
   rata-rata & puncak per 5 jam, dan laporan Excel tiap 10 jam operasi.
   Data langsung datang dari database/supabase-live.js lewat event "vx:telemetry". Riwayat dan jendela 5 jam
   dibaca dari Supabase (tabel telemetry_log, fungsi report_windows). Semua totalan dihitung server. */
(function () {
  "use strict";
  var cfg = window.VX_SUPABASE, page = document.getElementById("dashboard");
  var dash = page && page.querySelector(".dash"), anchor = dash && dash.querySelector(".dgrid");
  if (!cfg || !cfg.url || !cfg.anonKey || !dash || !anchor) return;

  var base = String(cfg.url).replace(/\/+$/, "");
  var HDR = { apikey: cfg.anonKey, Authorization: "Bearer " + cfg.anonKey };
  var BLOCK_S = 36000, WIN_H = 5, LIVE_SPAN = 120, FRESH_MS = 6000;
  var COL_IN = "#f59e0b", COL_OUT = "#2ee6a6";
  var NS = "http://www.w3.org/2000/svg";

  /* ---------- pembantu ---------- */
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function sv(tag, attrs) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }
  function fmt(v, d) { return Number(v).toLocaleString("id-ID", { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function energy(wh) { return Math.abs(wh) >= 1000 ? [fmt(wh / 1000, 3), "kWh"] : [fmt(wh, 1), "Wh"]; }
  function hms(s) { s = Math.max(0, Math.floor(s)); var h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m + ":" + (x < 10 ? "0" : "") + x; }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} return null; }
  function visible() { return document.body.classList.contains("is-dash") && !document.hidden && dash.offsetParent !== null; }
  function isAdmin() { try { var s = window.VXAuth && VXAuth.state && VXAuth.state(); return !!(s && s.authenticated && s.role === "admin"); } catch (e) { return false; } }

  /* ---------- kerangka tampilan ---------- */
  var kpiDef = [
    ["ein", "Total energi PLN masuk", "in"], ["eout", "Total energi dihasilkan", "out"],
    ["eff", "Efisiensi sistem", "eff"], ["op", "Waktu operasi", "op"],
    ["pin", "Daya PLN ke pompa", "in"], ["pout", "Daya generator", "out"],
    ["effw", "Efisiensi rata-rata 5 jam", "eff"], ["gap", "Selisih energi", "gap"]
  ];
  var sec = el("section", "den"); sec.id = "den"; sec.setAttribute("aria-label", "Energi dan efisiensi");
  var h = '<div class="den__head"><div><h2>Energi dan Efisiensi</h2><p>Listrik PLN yang masuk ke pompa dibandingkan listrik yang dihasilkan generator.</p></div>' +
    '<span class="dpill off" id="den-st"><i></i><span>Menunggu data energi</span></span></div>' +
    '<p class="den__off" id="den-off" role="status">Belum ada data energi. Buka simulasi 3D terbaru, isi kunci simulator, lalu klik <b>Mulai Kirim</b>.</p>' +
    '<div class="den__kpi">';
  kpiDef.forEach(function (k) {
    h += '<div class="dc den__k" data-t="' + k[2] + '"><small>' + k[1] + '</small><b><span id="dk-' + k[0] + '">–</span><em id="dku-' + k[0] + '"></em></b><p class="den__sub" id="dks-' + k[0] + '">&nbsp;</p></div>';
  });
  h += '</div><div class="den__main"><div class="dc den__chart"><h3>Output generator vs input listrik PLN<span class="dtabs" id="den-rng">' +
    '<button type="button" aria-pressed="true" data-r="live">2 menit</button><button type="button" aria-pressed="false" data-r="60">1 jam</button>' +
    '<button type="button" aria-pressed="false" data-r="300">5 jam</button><button type="button" aria-pressed="false" data-r="600">10 jam</button></span></h3>' +
    '<div class="den__leg"><span><i style="background:' + COL_IN + '"></i>Input PLN ke pompa (W)</span><span><i style="background:' + COL_OUT + '"></i>Output generator (W)</span>' +
    '<span class="den__now" id="den-now"></span></div>' +
    '<div class="den__plot"><svg id="den-svg" viewBox="0 0 640 270" role="img" aria-label="Grafik daya PLN ke pompa dan daya generator, ditumpuk pada satu sumbu"></svg><div class="den__tip" id="den-tip" hidden></div></div>' +
    '<p class="dnote" id="den-note">Dua garis memakai satu sumbu agar selisih daya terlihat langsung. Jarak antar garis adalah daya yang tidak kembali sebagai listrik.</p></div>' +
    '<div class="dc den__rep"><h3>Laporan Excel per 10 jam</h3><div class="den__prog"><div class="den__bar"><i id="rp-bar"></i></div><div class="den__pt"><b id="rp-blk">Blok 1</b><span id="rp-hrs">0,00 dari 10 jam</span></div></div>' +
    '<p class="dnote" id="rp-next">Laporan terunduh otomatis saat blok selesai.</p>' +
    '<label class="den__chk"><input type="checkbox" id="rp-auto"> Unduh otomatis tiap 10 jam operasi</label>' +
    '<button class="dpill den__btn" id="rp-now" type="button">Unduh laporan blok berjalan</button>' +
    '<ul class="den__list" id="rp-list"></ul><p class="dnote" id="rp-msg" role="status"></p></div></div>' +
    '<div class="dc den__win"><h3>Rata-rata dan puncak per 5 jam<span class="den__tag" id="den-wt"></span></h3><div class="den__scroll"><table class="den__tbl"><thead><tr>' +
    '<th>Jendela (jam operasi)</th><th>PLN rata-rata</th><th>PLN puncak</th><th>Generator rata-rata</th><th>Generator puncak</th><th>Efisiensi rata-rata</th><th>Efisiensi puncak</th><th>Efisiensi terendah</th></tr></thead>' +
    '<tbody id="den-tb"><tr><td colspan="8" class="den__empty">Belum ada riwayat. Jendela pertama terisi setelah satu menit operasi.</td></tr></tbody></table></div>' +
    '<p class="dnote">Daya dalam watt (W). Efisiensi = energi dihasilkan ÷ energi PLN masuk ke pompa. Puncak dan terendah diambil dari efisiensi tiap menit operasi. Daya PLN ke pompa adalah hasil model simulator, bukan pembacaan wattmeter.</p></div>';
  sec.innerHTML = h;
  anchor.parentNode.insertBefore(sec, anchor.nextSibling);
  Array.prototype.forEach.call(sec.querySelectorAll(".dc"), function (c, i) { c.style.setProperty("--i", i + 8); });

  function kp(id, v, u, sub) {
    var a = $("dk-" + id), b = $("dku-" + id), c = $("dks-" + id);
    if (a) a.textContent = v; if (b) b.textContent = u || ""; if (c && sub != null) c.textContent = sub;
  }

  /* ---------- data langsung ---------- */
  var live = { pln: 0, gen: 0, soc: 0, op: 0, eIn: 0, eOut: 0, at: 0, seen: false };
  var buf = [], win = [], histRows = [], mode = "live", lastFetch = 0, reportBusy = false;

  window.addEventListener("vx:telemetry", function (e) {
    var r = e.detail || {};
    live.pln = +r.pln_in_w || 0; live.gen = +r.gen_out_w || 0; live.soc = +r.bess_soc || 0;
    live.op = +r.op_s || 0; live.eIn = +r.e_in_wh || 0; live.eOut = +r.e_out_wh || 0;
    live.at = Date.now(); live.seen = true;
  });

  function fresh() { return live.seen && Date.now() - live.at < FRESH_MS; }

  /* ---------- kartu KPI ---------- */
  function curWin() { return win.length ? win[0] : null; }
  function renderKpi() {
    var on = fresh() || live.eIn > 0 || live.op > 0, st = $("den-st"), off = $("den-off");
    off.hidden = live.seen && (live.op > 0 || live.eIn > 0 || live.pln > 0);
    st.classList.toggle("off", !fresh());
    st.lastChild.textContent = fresh() ? "Data energi mengalir" : (live.seen ? "Data energi berhenti" : "Menunggu data energi");
    var a = energy(live.eIn), b = energy(live.eOut), eff = live.eIn > 0 ? live.eOut / live.eIn * 100 : 0, gap = energy(live.eIn - live.eOut);
    var inst = live.pln > 1 ? live.gen / live.pln * 100 : 0, w = curWin();
    kp("ein", on ? a[0] : "–", on ? a[1] : "", "Dari PLN ke pompa sejak awal uji");
    kp("eout", on ? b[0] : "–", on ? b[1] : "", "Listrik masuk ke BESS dari generator");
    kp("eff", on ? fmt(eff, 1) : "–", on ? "%" : "", on ? "Sesaat " + fmt(inst, 1) + "% (daya)" : "");
    kp("op", on ? hms(live.op) : "–", "", on ? "Sudah " + fmt(live.op / 3600, 2) + " jam operasi" : "");
    kp("pin", on ? fmt(live.pln, 1) : "–", on ? "W" : "", w ? "5 jam: rata-rata " + fmt(w.in_avg_w, 1) + " · puncak " + fmt(w.in_peak_w, 1) : "Menunggu riwayat 5 jam");
    kp("pout", on ? fmt(live.gen, 1) : "–", on ? "W" : "", w ? "5 jam: rata-rata " + fmt(w.out_avg_w, 1) + " · puncak " + fmt(w.out_peak_w, 1) : "Menunggu riwayat 5 jam");
    kp("effw", w ? fmt(w.eff_pct, 1) : "–", w ? "%" : "", w ? "Puncak " + fmt(w.eff_peak_pct, 1) + "% · terendah " + fmt(w.eff_min_pct, 1) + "%" : "Menunggu riwayat 5 jam");
    kp("gap", on ? gap[0] : "–", on ? gap[1] : "", on && live.eIn > 0 ? fmt(100 - eff, 1) + "% dari energi PLN tidak kembali" : "PLN masuk dikurangi dihasilkan");
    var now = $("den-now"); now.textContent = on ? "Sekarang: " + fmt(live.pln, 1) + " W → " + fmt(live.gen, 1) + " W" : "";
    renderReportState();
  }

  /* ---------- grafik tumpang-tindih ---------- */
  var svg = $("den-svg"), tip = $("den-tip"), plotPts = [];
  var CW = 640, CH = 270, PL = 52, PR = 14, PT = 12, PB = 34;
  function niceMax(v) { if (v <= 0) return 10; var p = Math.pow(10, Math.floor(Math.log10(v))), n = v / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p; }

  function draw(pts, x0, x1, xlabel) {
    plotPts = pts; svg.innerHTML = "";
    var defs = sv("defs", {});
    [["gi", COL_IN], ["go", COL_OUT]].forEach(function (g) {
      var lg = sv("linearGradient", { id: "den-" + g[0], x1: 0, y1: 0, x2: 0, y2: 1 });
      lg.appendChild(sv("stop", { offset: "0%", "stop-color": g[1], "stop-opacity": ".34" })); lg.appendChild(sv("stop", { offset: "100%", "stop-color": g[1], "stop-opacity": ".02" }));
      defs.appendChild(lg);
    }); svg.appendChild(defs);
    var mx = 0; pts.forEach(function (p) { mx = Math.max(mx, p.a, p.b); });
    var top = niceMax(mx * 1.08), iw = CW - PL - PR, ih = CH - PT - PB;
    function X(x) { return PL + (x1 === x0 ? 0 : (x - x0) / (x1 - x0)) * iw; }
    function Y(v) { return PT + ih - v / top * ih; }
    for (var i = 0; i <= 4; i++) {
      var yv = top * i / 4, y = Y(yv);
      svg.appendChild(sv("line", { x1: PL, x2: CW - PR, y1: y, y2: y, class: "gl" }));
      var t = sv("text", { x: PL - 8, y: y + 4, "text-anchor": "end" }); t.textContent = fmt(yv, top < 10 ? 1 : 0); svg.appendChild(t);
    }
    var yt = sv("text", { x: 12, y: PT + ih / 2, transform: "rotate(-90 12 " + (PT + ih / 2) + ")", "text-anchor": "middle" }); yt.textContent = "Daya (W)"; svg.appendChild(yt);
    xlabel(function (x, label) { var t2 = sv("text", { x: X(x), y: CH - 12, "text-anchor": X(x) > CW - PR - 24 ? "end" : (X(x) < PL + 24 ? "start" : "middle") }); t2.textContent = label; svg.appendChild(t2); svg.appendChild(sv("line", { x1: X(x), x2: X(x), y1: PT + ih, y2: PT + ih + 4, class: "gl" })); });
    if (!pts.length) { var e = sv("text", { x: CW / 2, y: CH / 2, "text-anchor": "middle" }); e.textContent = "Belum ada data untuk rentang ini"; svg.appendChild(e); return; }
    function path(key) { return pts.map(function (p, i) { return (i ? "L" : "M") + X(p.x).toFixed(1) + " " + Y(p[key]).toFixed(1); }).join(""); }
    function area(key) { return path(key) + "L" + X(pts[pts.length - 1].x).toFixed(1) + " " + (PT + ih) + "L" + X(pts[0].x).toFixed(1) + " " + (PT + ih) + "Z"; }
    svg.appendChild(sv("path", { d: area("a"), fill: "url(#den-gi)" })); svg.appendChild(sv("path", { d: area("b"), fill: "url(#den-go)" }));
    svg.appendChild(sv("path", { d: path("a"), fill: "none", stroke: COL_IN, "stroke-width": 2.2, "stroke-linejoin": "round" }));
    svg.appendChild(sv("path", { d: path("b"), fill: "none", stroke: COL_OUT, "stroke-width": 2.2, "stroke-linejoin": "round" }));
    var cur = sv("g", { id: "den-cur", visibility: "hidden" });
    cur.appendChild(sv("line", { id: "den-cl", y1: PT, y2: PT + ih, class: "cl" })); cur.appendChild(sv("circle", { id: "den-ca", r: 4, fill: COL_IN })); cur.appendChild(sv("circle", { id: "den-cb", r: 4, fill: COL_OUT }));
    svg.appendChild(cur);
    var hit = sv("rect", { x: PL, y: PT, width: iw, height: ih, fill: "transparent", id: "den-hit" }); svg.appendChild(hit);
    svg._m = { X: X, Y: Y, x0: x0, x1: x1, iw: iw };
  }

  function hover(ev) {
    var m = svg._m; if (!m || !plotPts.length) return;
    var r = svg.getBoundingClientRect(), px = (ev.clientX - r.left) / r.width * CW, xv = m.x0 + (px - PL) / m.iw * (m.x1 - m.x0), best = 0, d = Infinity;
    plotPts.forEach(function (p, i) { var dd = Math.abs(p.x - xv); if (dd < d) { d = dd; best = i; } });
    var p = plotPts[best], cx = m.X(p.x), g = $("den-cur");
    g.setAttribute("visibility", "visible"); $("den-cl").setAttribute("x1", cx); $("den-cl").setAttribute("x2", cx);
    $("den-ca").setAttribute("cx", cx); $("den-ca").setAttribute("cy", m.Y(p.a)); $("den-cb").setAttribute("cx", cx); $("den-cb").setAttribute("cy", m.Y(p.b));
    tip.hidden = false; tip.innerHTML = "<b>" + p.label + "</b><span><i style='background:" + COL_IN + "'></i>PLN " + fmt(p.a, 1) + " W</span><span><i style='background:" + COL_OUT + "'></i>Generator " + fmt(p.b, 1) + " W</span><span>Efisiensi " + fmt(p.a > 1 ? p.b / p.a * 100 : 0, 1) + "%</span>";
    var left = cx / CW * r.width, w = tip.offsetWidth; tip.style.left = Math.max(4, Math.min(r.width - w - 4, left + 12)) + "px";
  }
  svg.addEventListener("pointermove", hover);
  svg.addEventListener("pointerleave", function () { var g = $("den-cur"); if (g) g.setAttribute("visibility", "hidden"); tip.hidden = true; });

  function drawLive() {
    var now = Date.now(), x0 = -LIVE_SPAN, pts = buf.filter(function (p) { return now - p.t <= LIVE_SPAN * 1000; }).map(function (p) {
      var s = (p.t - now) / 1000; return { x: s, a: p.a, b: p.b, label: new Date(p.t).toLocaleTimeString("id-ID") };
    });
    draw(pts, x0, 0, function (add) { [-120, -90, -60, -30, 0].forEach(function (s) { add(s, s === 0 ? "sekarang" : s + " d"); }); });
  }
  function drawHist() {
    var pts = histRows.map(function (r) {
      var dt = r.dt_s > 0 ? r.dt_s : 60; return { x: r.op_s / 3600, a: r.in_wh * 3600 / dt, b: r.out_wh * 3600 / dt, label: "Jam operasi " + fmt(r.op_s / 3600, 2) };
    });
    if (!pts.length) return draw([], 0, 1, function () {});
    var x0 = pts[0].x, x1 = pts[pts.length - 1].x; if (x1 - x0 < 0.02) x1 = x0 + 0.02;
    draw(pts, x0, x1, function (add) { for (var i = 0; i <= 5; i++) { var x = x0 + (x1 - x0) * i / 5; add(x, fmt(x, x1 - x0 < 2 ? 2 : 1) + " j"); } });
  }
  function drawChart() { if (mode === "live") drawLive(); else drawHist(); }

  $("den-rng").addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    Array.prototype.forEach.call(this.children, function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
    mode = b.dataset.r; $("den-note").textContent = mode === "live" ? "Dua garis memakai satu sumbu agar selisih daya terlihat langsung. Jarak antar garis adalah daya yang tidak kembali sebagai listrik."
      : "Data per menit operasi dari riwayat Supabase, sumbu bawah adalah jam operasi. Arahkan kursor untuk melihat nilai.";
    if (mode === "live") drawLive(); else loadHist(true);
  });

  /* ---------- Supabase ---------- */
  function get(path, extra) { return fetch(base + "/rest/v1/" + path, { headers: Object.assign({}, HDR, extra || {}), cache: "no-store" }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }); }
  function rpc(name, body) { return fetch(base + "/rest/v1/rpc/" + name, { method: "POST", headers: Object.assign({ "Content-Type": "application/json" }, HDR), body: JSON.stringify(body) }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }); }

  function loadHist(force) {
    if (mode === "live") return;
    get("telemetry_log?select=op_s,dt_s,in_wh,out_wh&order=op_s.desc&limit=" + Number(mode)).then(function (rows) { histRows = rows.reverse(); if (mode !== "live") drawHist(); }).catch(function () { if (force) { histRows = []; drawHist(); } });
  }
  function loadWin() {
    rpc("report_windows", { p_hours: WIN_H, p_limit: 6 }).then(function (rows) { win = rows.map(function (r) { var o = {}; for (var k in r) o[k] = Number(r[k]); return o; }); renderWin(); renderKpi(); }).catch(function () {});
  }
  function renderWin() {
    var tb = $("den-tb"), tag = $("den-wt");
    if (!win.length) { tag.textContent = ""; return; }
    tag.textContent = "Jendela berjalan: " + fmt(win[0].covered_s / 3600, 2) + " dari " + WIN_H + " jam";
    tb.innerHTML = win.map(function (w, i) {
      var h0 = w.win_idx * WIN_H, part = w.covered_s < WIN_H * 3600 * 0.995;
      return "<tr" + (i === 0 ? ' class="cur"' : "") + "><td><b>Jam " + h0 + " sampai " + (h0 + WIN_H) + "</b>" + (part ? ' <span class="den__tag">' + (i === 0 ? "berjalan" : "sebagian") + "</span>" : "") + "</td>" +
        "<td>" + fmt(w.in_avg_w, 1) + " W</td><td>" + fmt(w.in_peak_w, 1) + " W</td><td>" + fmt(w.out_avg_w, 1) + " W</td><td>" + fmt(w.out_peak_w, 1) + " W</td>" +
        '<td><span class="den__eff"><i style="width:' + Math.min(100, w.eff_pct).toFixed(1) + '%"></i><b>' + fmt(w.eff_pct, 1) + "%</b></span></td><td>" + fmt(w.eff_peak_pct, 1) + "%</td><td>" + fmt(w.eff_min_pct, 1) + "%</td></tr>";
    }).join("");
  }

  /* ---------- laporan Excel ---------- */
  function done() { return parseInt(store("vx_rep_done"), 10) || 0; }
  function dlList() { try { return JSON.parse(store("vx_rep_dl") || "[]"); } catch (e) { return []; } }
  function markDl(n) { var l = dlList(); if (l.indexOf(n) < 0) l.push(n); store("vx_rep_dl", JSON.stringify(l.slice(-200))); }
  function rmsg(t, bad) { var m = $("rp-msg"); m.textContent = t; m.classList.toggle("bad", !!bad); }

  function fetchBlockRows(block) {
    var a = (block - 1) * BLOCK_S, b = block * BLOCK_S, all = [];
    function page(off) {
      return get("telemetry_log?select=*&op_s=gte." + a + "&op_s=lt." + b + "&order=op_s.asc&limit=1000&offset=" + off).then(function (rows) {
        all = all.concat(rows); return rows.length === 1000 ? page(off + 1000) : all;
      });
    }
    return page(0);
  }
  function makeReport(block, final, auto) {
    if (reportBusy) return Promise.resolve();
    if (!window.VXReport) { rmsg("Modul laporan belum termuat.", true); return Promise.resolve(); }
    reportBusy = true; rmsg("Menyusun laporan Excel blok " + block + "…");
    return fetchBlockRows(block).then(function (rows) {
      if (!rows.length) { rmsg("Belum ada data pada blok " + block + ".", true); return; }
      var r = VXReport.build({ block: block, final: final, rows: rows, generatedAt: new Date() });
      VXReport.download(r);
      if (final) markDl(block);
      rmsg((auto ? "Otomatis: " : "") + r.filename + " diunduh (" + r.summary.rows + " baris, efisiensi " + fmt(r.summary.effPct, 1) + "%).");
      renderReportState();
    }).catch(function () { rmsg("Gagal mengambil data dari Supabase. Coba lagi sebentar.", true); }).then(function () { reportBusy = false; });
  }

  function renderReportState() {
    var op = live.op, blk = Math.floor(op / BLOCK_S) + 1, inBlk = op - (blk - 1) * BLOCK_S, completed = Math.floor(op / BLOCK_S), left = (BLOCK_S - inBlk) / 3600;
    $("rp-blk").textContent = "Blok " + blk;
    $("rp-hrs").textContent = fmt(inBlk / 3600, 2) + " dari 10 jam";
    $("rp-bar").style.width = (inBlk / BLOCK_S * 100).toFixed(1) + "%";
    $("rp-next").textContent = $("rp-auto").checked
      ? "Laporan blok " + blk + " otomatis diunduh saat jam operasi mencapai " + blk * 10 + " (sisa " + fmt(left, 2) + " jam). Dashboard harus terbuka."
      : "Unduh otomatis nonaktif. Laporan tetap bisa diunduh manual.";
    var ul = $("rp-list"), dl = dlList(), items = [], from = Math.max(1, completed - 4);
    for (var n = completed; n >= from; n--) items.push('<li><span><b>Blok ' + n + '</b> jam ' + (n - 1) * 10 + ' sampai ' + n * 10 + (dl.indexOf(n) >= 0 ? ' <span class="den__tag ok">terunduh</span>' : "") + '</span><button type="button" class="dpill" data-b="' + n + '">Unduh</button></li>');
    var sig = items.join(""); if (ul._sig !== sig) { ul._sig = sig; ul.innerHTML = sig || '<li class="den__empty">Belum ada blok 10 jam yang selesai.</li>'; }
    /* unduh otomatis: tunggu 90 detik setelah batas blok agar menit terakhir sudah tersimpan */
    if (isAdmin() && fresh() && $("rp-auto").checked) {
      var ready = Math.floor((op - 90) / BLOCK_S), d = done();
      if (ready < d) store("vx_rep_done", String(Math.max(0, ready)));
      else if (ready > d && !reportBusy) { store("vx_rep_done", String(d + 1)); makeReport(d + 1, true, true); }
    }
  }
  $("rp-list").addEventListener("click", function (e) { var b = e.target.closest("button[data-b]"); if (b) makeReport(+b.dataset.b, true, false); });
  $("rp-now").addEventListener("click", function () { var blk = Math.floor(live.op / BLOCK_S) + 1; makeReport(blk, false, false); });
  $("rp-auto").checked = store("vx_rep_auto") !== "0";
  $("rp-auto").addEventListener("change", function () { store("vx_rep_auto", this.checked ? "1" : "0"); renderReportState(); });
  /* pertama kali: blok lama tidak diunduh massal, hanya blok yang selesai sesudah ini */
  var seeded = false;
  function seed() { if (seeded || !live.seen) return; seeded = true; if (store("vx_rep_done") === null) store("vx_rep_done", String(Math.max(0, Math.floor((live.op - 90) / BLOCK_S)))); }

  /* ---------- siklus ---------- */
  setInterval(function () {
    if (fresh()) { buf.push({ t: Date.now(), a: live.pln, b: live.gen }); if (buf.length > 400) buf.shift(); }
    if (!visible()) return;
    seed(); renderKpi(); if (mode === "live") drawLive();
  }, 1000);
  setInterval(function () { if (!visible()) return; loadWin(); loadHist(false); }, 20000);
  setInterval(function () { if (live.seen) { seed(); if (!visible()) renderReportState(); } }, 5000);
  new MutationObserver(function () { if (visible() && Date.now() - lastFetch > 3000) { lastFetch = Date.now(); loadWin(); loadHist(false); renderKpi(); drawChart(); } })
    .observe(document.body, { attributes: true, attributeFilter: ["class"] });
  loadWin(); drawLive(); renderKpi();
  window.VXEnergy = { live: live, makeReport: makeReport };
})();
