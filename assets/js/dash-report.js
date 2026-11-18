/* Pembuat laporan Excel (.xlsx) untuk Dashboard Vortex Hydro.
   Berjalan sepenuhnya di browser, tanpa pustaka tambahan: berkas .xlsx ditulis langsung (XML + ZIP tanpa
   kompresi). Isinya: ringkasan energi dan efisiensi, rata-rata dan puncak per 5 jam, data per menit operasi,
   dan grafik Excel asli (bisa diedit). Rumus tetap hidup, jadi angka bisa diperiksa di Excel.

   Pemakaian:
     var r = VXReport.build({ block: 1, final: true, rows: [...], generatedAt: new Date() });
     VXReport.download(r);              // r.blob, r.filename, r.summary
   Tiap baris rows = satu baris tabel telemetry_log (op_s, ts, dt_s, in_wh, out_wh, in_peak_w, out_peak_w,
   debit, vbat, rpm_shaft, rpm_gen, bess_soc). */
(function () {
  "use strict";

  var HOURS_BLOCK = 10, HOURS_WIN = 5;
  var DATA = "Data Menit", SUM = "Ringkasan", GRAF = "Grafik";
  var C_IN = "F59E0B", C_OUT = "10B981", C_LOSS = "F43F5E", C_EFF = "0077B6", C_DARK = "03045E", C_LITE = "90E0EF";

  /* ---------- ZIP tanpa kompresi ---------- */
  var enc = new TextEncoder();
  var crcTable = (function () {
    var t = new Uint32Array(256), n, c, k;
    for (n = 0; n < 256; n++) { c = n; for (k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); t[n] = c >>> 0; }
    return t;
  })();
  function crc32(u8) { var c = 0xFFFFFFFF, i; for (i = 0; i < u8.length; i++) c = crcTable[(c ^ u8[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function zip(files, mime) {
    var parts = [], central = [], offset = 0, d = new Date();
    var dosTime = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
    var dosDate = ((Math.max(d.getFullYear(), 1980) - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    files.forEach(function (f) {
      var name = enc.encode(f.name), data = typeof f.data === "string" ? enc.encode(f.data) : f.data, crc = crc32(data), size = data.length;
      var lh = new DataView(new ArrayBuffer(30));
      lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true);
      lh.setUint16(10, dosTime, true); lh.setUint16(12, dosDate, true); lh.setUint32(14, crc, true);
      lh.setUint32(18, size, true); lh.setUint32(22, size, true); lh.setUint16(26, name.length, true); lh.setUint16(28, 0, true);
      parts.push(new Uint8Array(lh.buffer), name, data);
      var ch = new DataView(new ArrayBuffer(46));
      ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(10, 0, true);
      ch.setUint16(12, dosTime, true); ch.setUint16(14, dosDate, true); ch.setUint32(16, crc, true);
      ch.setUint32(20, size, true); ch.setUint32(24, size, true); ch.setUint16(28, name.length, true);
      ch.setUint32(42, offset, true);
      central.push(new Uint8Array(ch.buffer), name);
      offset += 30 + name.length + size;
    });
    var cd = 0; central.forEach(function (p) { cd += p.length; });
    var end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
    end.setUint32(12, cd, true); end.setUint32(16, offset, true);
    return new Blob(parts.concat(central, [new Uint8Array(end.buffer)]), { type: mime });
  }

  /* ---------- Pembantu XML ---------- */
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function colL(i) { var s = ""; i++; while (i > 0) { var m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; }
  function num(v) { return String(Number(Number(v).toPrecision(12))); }
  function q(sheet) { return "'" + sheet + "'"; }
  var NS = 'xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';
  var XMLH = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';

  /* Indeks gaya (lihat stylesXml) */
  var S = { def: 0, title: 1, note: 2, section: 3, head: 4, label: 5, text: 6, n2: 7, n1: 8, n0: 9, dt: 10, pct: 11, n3: 12, n4: 13, ctr: 14 };

  function stylesXml() {
    var fonts = [
      '<font><sz val="11"/><name val="Calibri"/><family val="2"/></font>',
      '<font><b/><sz val="11"/><name val="Calibri"/><family val="2"/></font>',
      '<font><b/><sz val="16"/><color rgb="FF' + C_DARK + '"/><name val="Calibri"/><family val="2"/></font>',
      '<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/><family val="2"/></font>',
      '<font><i/><sz val="10"/><color rgb="FF5B6B7B"/><name val="Calibri"/><family val="2"/></font>',
      '<font><b/><sz val="12"/><color rgb="FF' + C_DARK + '"/><name val="Calibri"/><family val="2"/></font>'
    ];
    var fills = [
      '<fill><patternFill patternType="none"/></fill>',
      '<fill><patternFill patternType="gray125"/></fill>',
      '<fill><patternFill patternType="solid"><fgColor rgb="FF0077B6"/><bgColor indexed="64"/></patternFill></fill>',
      '<fill><patternFill patternType="solid"><fgColor rgb="FFCAF0F8"/><bgColor indexed="64"/></patternFill></fill>'
    ];
    var bd = '<border><left style="thin"><color rgb="FFD0D7DE"/></left><right style="thin"><color rgb="FFD0D7DE"/></right><top style="thin"><color rgb="FFD0D7DE"/></top><bottom style="thin"><color rgb="FFD0D7DE"/></bottom><diagonal/></border>';
    var borders = ['<border><left/><right/><top/><bottom/><diagonal/></border>', bd];
    var numFmts = [[164, "dd/mm/yyyy hh:mm:ss"], [165, '0.0"%"'], [166, "0.000"], [167, "0.0000"], [168, "0.0"]];
    function xf(numFmt, font, fill, border, align) {
      return '<xf numFmtId="' + numFmt + '" fontId="' + font + '" fillId="' + fill + '" borderId="' + border + '" xfId="0"' +
        (numFmt ? ' applyNumberFormat="1"' : "") + (font ? ' applyFont="1"' : "") + (fill ? ' applyFill="1"' : "") + (border ? ' applyBorder="1"' : "") +
        (align ? ' applyAlignment="1"><alignment ' + align + "/></xf>" : "/>");
    }
    var xfs = [
      xf(0, 0, 0, 0),                                             /* 0 def */
      xf(0, 2, 0, 0, 'vertical="center"'),                        /* 1 title */
      xf(0, 4, 0, 0, 'vertical="center"'),                        /* 2 note */
      xf(0, 5, 3, 0, 'vertical="center"'),                        /* 3 section */
      xf(0, 3, 2, 1, 'horizontal="center" vertical="center" wrapText="1"'), /* 4 head */
      xf(0, 1, 0, 1, 'vertical="center"'),                        /* 5 label */
      xf(0, 0, 0, 1, 'vertical="center" wrapText="1"'),           /* 6 text */
      xf(2, 0, 0, 1),                                             /* 7 0.00 */
      xf(168, 0, 0, 1),                                           /* 8 0.0 */
      xf(1, 0, 0, 1),                                             /* 9 0 */
      xf(164, 0, 0, 1),                                           /* 10 datetime */
      xf(165, 0, 0, 1),                                           /* 11 0.0 % */
      xf(166, 0, 0, 1),                                           /* 12 0.000 */
      xf(167, 0, 0, 1),                                           /* 13 0.0000 */
      xf(0, 0, 0, 1, 'horizontal="center" vertical="center"')     /* 14 center */
    ];
    return XMLH + '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      '<numFmts count="' + numFmts.length + '">' + numFmts.map(function (n) { return '<numFmt numFmtId="' + n[0] + '" formatCode="' + esc(n[1]) + '"/>'; }).join("") + "</numFmts>" +
      '<fonts count="' + fonts.length + '">' + fonts.join("") + "</fonts>" +
      '<fills count="' + fills.length + '">' + fills.join("") + "</fills>" +
      '<borders count="' + borders.length + '">' + borders.join("") + "</borders>" +
      '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
      '<cellXfs count="' + xfs.length + '">' + xfs.join("") + "</cellXfs>" +
      '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
  }

  /* ---------- Lembar kerja ---------- */
  function Sheet() { this.cells = {}; this.merges = []; this.widths = []; this.heights = {}; this.pane = null; this.drawing = false; }
  /* o: {v, s, f}; v teks atau angka; f = rumus (tanpa tanda "="); o.cache=false untuk menghilangkan nilai cadangan (uji) */
  Sheet.prototype.set = function (r, c, o) { (this.cells[r] = this.cells[r] || {})[c] = o; };
  Sheet.prototype.xml = function (noCache) {
    var self = this, rows = Object.keys(this.cells).map(Number).sort(function (a, b) { return a - b; }), maxR = 1, maxC = 0, out = [];
    rows.forEach(function (r) {
      var cols = Object.keys(self.cells[r]).map(Number).sort(function (a, b) { return a - b; });
      maxR = Math.max(maxR, r + 1);
      var cx = cols.map(function (c) {
        var o = self.cells[r][c], ref = colL(c) + (r + 1), st = ' s="' + (o.s || 0) + '"';
        maxC = Math.max(maxC, c);
        if (o.f != null) {
          var cached = (o.v != null && !noCache) ? "<v>" + (typeof o.v === "number" ? num(o.v) : esc(o.v)) + "</v>" : "";
          return '<c r="' + ref + '"' + st + (typeof o.v === "string" && !noCache ? ' t="str"' : "") + "><f>" + esc(o.f) + "</f>" + cached + "</c>";
        }
        if (o.v == null || o.v === "") return '<c r="' + ref + '"' + st + "/>";
        if (typeof o.v === "number") return isFinite(o.v) ? '<c r="' + ref + '"' + st + "><v>" + num(o.v) + "</v></c>" : '<c r="' + ref + '"' + st + "/>";
        return '<c r="' + ref + '"' + st + ' t="inlineStr"><is><t xml:space="preserve">' + esc(o.v) + "</t></is></c>";
      }).join("");
      var h = self.heights[r] ? ' ht="' + self.heights[r] + '" customHeight="1"' : "";
      out.push('<row r="' + (r + 1) + '"' + h + ">" + cx + "</row>");
    });
    var cols = this.widths.length ? "<cols>" + this.widths.map(function (w, i) { return '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + w + '" customWidth="1"/>'; }).join("") + "</cols>" : "";
    var view = '<sheetViews><sheetView workbookViewId="0" showGridLines="0"' + (this.first ? ' tabSelected="1"' : "") + ">" +
      (this.pane ? '<pane ySplit="' + this.pane + '" topLeftCell="A' + (this.pane + 1) + '" activePane="bottomLeft" state="frozen"/>' : "") + "</sheetView></sheetViews>";
    var merges = this.merges.length ? '<mergeCells count="' + this.merges.length + '">' + this.merges.map(function (m) { return '<mergeCell ref="' + m + '"/>'; }).join("") + "</mergeCells>" : "";
    return XMLH + "<worksheet " + NS + '><dimension ref="A1:' + colL(maxC) + maxR + '"/>' + view + '<sheetFormatPr defaultRowHeight="15"/>' + cols +
      "<sheetData>" + out.join("") + "</sheetData>" + merges +
      '<pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.3" footer="0.3"/><pageSetup orientation="landscape" paperSize="9" fitToHeight="0"/>' +
      (this.drawing ? '<drawing r:id="rId1"/>' : "") + "</worksheet>";
  };

  /* ---------- Grafik ---------- */
  var CNS = 'xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';
  function rich(text, sz, bold) {
    return '<c:tx><c:rich><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="' + sz + '" b="' + (bold ? 1 : 0) + '"/></a:pPr><a:r><a:rPr lang="id-ID" sz="' + sz + '" b="' + (bold ? 1 : 0) + '"/><a:t>' + esc(text) + "</a:t></a:r></a:p></c:rich></c:tx>";
  }
  function axTitle(text) { return text ? "<c:title>" + rich(text, 1000, false) + '<c:overlay val="0"/></c:title>' : ""; }
  var AXTX = '<c:txPr><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="900"/></a:pPr><a:endParaRPr lang="id-ID"/></a:p></c:txPr>';
  var GRID = '<c:majorGridlines><c:spPr><a:ln w="6350"><a:solidFill><a:srgbClr val="D9DEE4"/></a:solidFill></a:ln></c:spPr></c:majorGridlines>';
  var LNAX = '<c:spPr><a:ln w="9525"><a:solidFill><a:srgbClr val="9AA5B1"/></a:solidFill></a:ln></c:spPr>';

  function chartXml(kind, o) {
    var sers = o.series.map(function (s, i) {
      var sp = kind === "line"
        ? '<c:spPr><a:ln w="' + (s.w || 22225) + '" cap="rnd"><a:solidFill><a:srgbClr val="' + s.color + '"/></a:solidFill><a:round/></a:ln></c:spPr><c:marker><c:symbol val="none"/></c:marker>'
        : '<c:spPr><a:solidFill><a:srgbClr val="' + s.color + '"/></a:solidFill></c:spPr><c:invertIfNegative val="0"/>';
      var cat = o.catStr ? "<c:cat><c:strRef><c:f>" + esc(o.catRef) + "</c:f></c:strRef></c:cat>" : "<c:cat><c:numRef><c:f>" + esc(o.catRef) + "</c:f></c:numRef></c:cat>";
      return '<c:ser><c:idx val="' + i + '"/><c:order val="' + i + '"/><c:tx><c:strRef><c:f>' + esc(s.nameRef) + "</c:f></c:strRef></c:tx>" + sp + cat +
        "<c:val><c:numRef><c:f>" + esc(s.valRef) + "</c:f></c:numRef></c:val>" + (kind === "line" ? '<c:smooth val="0"/>' : "") + "</c:ser>";
    }).join("");
    var plot = kind === "line"
      ? '<c:lineChart><c:grouping val="standard"/><c:varyColors val="0"/>' + sers + '<c:marker val="1"/><c:axId val="5001"/><c:axId val="5002"/></c:lineChart>'
      : '<c:barChart><c:barDir val="col"/><c:grouping val="clustered"/><c:varyColors val="0"/>' + sers + '<c:gapWidth val="80"/><c:axId val="5001"/><c:axId val="5002"/></c:barChart>';
    var skip = o.skip ? '<c:tickLblSkip val="' + o.skip + '"/><c:tickMarkSkip val="' + o.skip + '"/>' : "";
    var catAx = '<c:catAx><c:axId val="5001"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="b"/>' + axTitle(o.xTitle) +
      '<c:numFmt formatCode="' + esc(o.xFmt || "General") + '" sourceLinked="0"/><c:majorTickMark val="out"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/>' + LNAX + AXTX +
      '<c:crossAx val="5002"/><c:crosses val="autoZero"/><c:auto val="1"/><c:lblAlgn val="ctr"/><c:lblOffset val="100"/>' + skip + '<c:noMultiLvlLbl val="0"/></c:catAx>';
    var valAx = '<c:valAx><c:axId val="5002"/><c:scaling><c:orientation val="minMax"/>' + (o.yMin != null ? '<c:min val="' + o.yMin + '"/>' : "") + '</c:scaling><c:delete val="0"/><c:axPos val="l"/>' + GRID + axTitle(o.yTitle) +
      '<c:numFmt formatCode="' + esc(o.yFmt || "General") + '" sourceLinked="0"/><c:majorTickMark val="out"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/>' + LNAX + AXTX +
      '<c:crossAx val="5001"/><c:crosses val="autoZero"/><c:crossBetween val="between"/></c:valAx>';
    return XMLH + "<c:chartSpace " + CNS + '><c:roundedCorners val="0"/><c:chart><c:title>' + rich(o.title, 1300, true) + '<c:overlay val="0"/></c:title><c:autoTitleDeleted val="0"/>' +
      "<c:plotArea><c:layout/>" + plot + catAx + valAx + '<c:spPr><a:noFill/></c:spPr></c:plotArea><c:legend><c:legendPos val="b"/><c:overlay val="0"/></c:legend><c:plotVisOnly val="1"/><c:dispBlanksAs val="gap"/></c:chart>' +
      '<c:spPr><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill><a:ln w="9525"><a:solidFill><a:srgbClr val="D0D7DE"/></a:solidFill></a:ln></c:spPr></c:chartSpace>';
  }
  function drawingXml(anchors) {
    return XMLH + '<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">' +
      anchors.map(function (a, i) {
        return "<xdr:twoCellAnchor><xdr:from><xdr:col>" + a.c0 + "</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>" + a.r0 + "</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from>" +
          "<xdr:to><xdr:col>" + a.c1 + "</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>" + a.r1 + "</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:to>" +
          '<xdr:graphicFrame macro=""><xdr:nvGraphicFramePr><xdr:cNvPr id="' + (i + 2) + '" name="Grafik ' + (i + 1) + '"/><xdr:cNvGraphicFramePr/></xdr:nvGraphicFramePr>' +
          '<xdr:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/></xdr:xfrm><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart">' +
          '<c:chart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:id="rId' + (i + 1) + '"/>' +
          "</a:graphicData></a:graphic></xdr:graphicFrame><xdr:clientData/></xdr:twoCellAnchor>";
      }).join("") + "</xdr:wsDr>";
  }
  function rels(items) {
    return XMLH + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      items.map(function (it) { return '<Relationship Id="' + it[0] + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/' + it[1] + '" Target="' + it[2] + '"/>'; }).join("") + "</Relationships>";
  }

  /* ---------- Hitungan ---------- */
  function pad(n, w) { n = String(n); while (n.length < (w || 2)) n = "0" + n; return n; }
  function wibParts(ms) { var d = new Date(ms + 7 * 3600000); return pad(d.getUTCDate()) + "/" + pad(d.getUTCMonth() + 1) + "/" + d.getUTCFullYear() + " " + pad(d.getUTCHours()) + ":" + pad(d.getUTCMinutes()) + ":" + pad(d.getUTCSeconds()); }
  function serialWib(ms) { return ms / 86400000 + 25569 + 7 / 24; }
  function fixN(v) { v = Number(v); return isFinite(v) ? v : 0; }

  function windowStats(rows, h0, h1) {
    var inWh = 0, outWh = 0, dur = 0, pkIn = 0, pkOut = 0, effMax = null, effMin = null;
    rows.forEach(function (r) {
      var h = r.op_s / 3600;
      if (h < h0 || h >= h1) return;
      inWh += r.in_wh; outWh += r.out_wh; dur += r.dt_s;
      if (r.in_peak_w > pkIn) pkIn = r.in_peak_w;
      if (r.out_peak_w > pkOut) pkOut = r.out_peak_w;
      if (r.in_wh > 0) { var e = r.out_wh / r.in_wh * 100; if (effMax === null || e > effMax) effMax = e; if (effMin === null || e < effMin) effMin = e; }
    });
    return { inWh: inWh, outWh: outWh, dur: dur, inAvg: dur > 0 ? inWh * 3600 / dur : 0, outAvg: dur > 0 ? outWh * 3600 / dur : 0, pkIn: pkIn, pkOut: pkOut,
      eff: inWh > 0 ? outWh / inWh * 100 : 0, effMax: effMax || 0, effMin: effMin || 0 };
  }

  function build(opt) {
    var block = Math.max(1, opt.block | 0), startH = (block - 1) * HOURS_BLOCK, endH = block * HOURS_BLOCK, final = opt.final !== false;
    var noCache = !!opt.noCache, gen = opt.generatedAt || new Date();
    var rows = (opt.rows || []).map(function (r) {
      return { op_s: fixN(r.op_s), ts: fixN(r.ts), dt_s: fixN(r.dt_s), in_wh: fixN(r.in_wh), out_wh: fixN(r.out_wh), in_peak_w: fixN(r.in_peak_w), out_peak_w: fixN(r.out_peak_w),
        debit: fixN(r.debit), vbat: fixN(r.vbat), rpm_shaft: fixN(r.rpm_shaft), rpm_gen: fixN(r.rpm_gen), bess_soc: fixN(r.bess_soc) };
    }).sort(function (a, b) { return a.op_s - b.op_s; });
    var n = rows.length, last = n + 1;
    function rng(col) { return q(DATA) + "!$" + col + "$2:$" + col + "$" + Math.max(last, 2); }

    /* --- Data Menit --- */
    var d = new Sheet();
    var head = ["Waktu Operasi (jam)", "Waktu (WIB)", "Debit (L/s)", "Tegangan Baterai (V)", "RPM Poros", "RPM Generator", "Daya PLN ke Pompa (W)", "Daya Generator (W)",
      "Puncak PLN (W)", "Puncak Generator (W)", "Efisiensi (%)", "Energi PLN (Wh)", "Energi Generator (Wh)", "Energi PLN Kumulatif (Wh)", "Energi Generator Kumulatif (Wh)", "SoC BESS (%)", "Durasi (detik)"];
    head.forEach(function (h, c) { d.set(0, c, { v: h, s: S.head }); });
    d.heights[0] = 45;
    var cumIn = 0, cumOut = 0;
    rows.forEach(function (r, i) {
      var rr = i + 1, x = rr + 1, effV = r.in_wh > 0 ? r.out_wh / r.in_wh * 100 : 0;
      cumIn += r.in_wh; cumOut += r.out_wh;
      d.set(rr, 0, { v: r.op_s / 3600, s: S.n3 });
      d.set(rr, 1, { v: serialWib(r.ts), s: S.dt });
      d.set(rr, 2, { v: r.debit, s: S.n3 });
      d.set(rr, 3, { v: r.vbat, s: S.n2 });
      d.set(rr, 4, { v: r.rpm_shaft, s: S.n1 });
      d.set(rr, 5, { v: r.rpm_gen, s: S.n1 });
      d.set(rr, 6, { v: r.dt_s > 0 ? r.in_wh * 3600 / r.dt_s : 0, s: S.n1 });
      d.set(rr, 7, { v: r.dt_s > 0 ? r.out_wh * 3600 / r.dt_s : 0, s: S.n1 });
      d.set(rr, 8, { v: r.in_peak_w, s: S.n1 });
      d.set(rr, 9, { v: r.out_peak_w, s: S.n1 });
      d.set(rr, 10, { f: "IF(L" + x + ">0,M" + x + "/L" + x + "*100,0)", v: effV, s: S.pct });
      d.set(rr, 11, { v: r.in_wh, s: S.n4 });
      d.set(rr, 12, { v: r.out_wh, s: S.n4 });
      d.set(rr, 13, { f: i === 0 ? "L" + x : "N" + (x - 1) + "+L" + x, v: cumIn, s: S.n3 });
      d.set(rr, 14, { f: i === 0 ? "M" + x : "O" + (x - 1) + "+M" + x, v: cumOut, s: S.n3 });
      d.set(rr, 15, { v: r.bess_soc, s: S.n1 });
      d.set(rr, 16, { v: r.dt_s, s: S.n0 });
    });
    d.widths = [14, 21, 11, 14, 11, 12, 16, 15, 13, 15, 13, 14, 16, 17, 19, 12, 11];
    d.pane = 1;

    /* --- Hitungan ringkasan --- */
    var sumIn = 0, sumOut = 0, sumDur = 0, pkIn = 0, pkOut = 0, effPk = 0, effMn = null, t0 = null, t1 = null;
    rows.forEach(function (r) {
      sumIn += r.in_wh; sumOut += r.out_wh; sumDur += r.dt_s;
      if (r.in_peak_w > pkIn) pkIn = r.in_peak_w; if (r.out_peak_w > pkOut) pkOut = r.out_peak_w;
      if (r.in_wh > 0) { var e = r.out_wh / r.in_wh * 100; if (e > effPk) effPk = e; if (effMn === null || e < effMn) effMn = e; }
      if (t0 === null || r.ts < t0) t0 = r.ts; if (t1 === null || r.ts > t1) t1 = r.ts;
    });
    var effAll = sumIn > 0 ? sumOut / sumIn * 100 : 0;
    var coveredH = n ? rows[n - 1].op_s / 3600 - startH : 0;

    /* --- Ringkasan --- */
    var s = new Sheet(); s.first = true;
    s.widths = [36, 14, 14, 15, 15, 16, 16, 16, 18, 16, 16, 16];
    s.set(0, 0, { v: "Laporan Energi Vortex Hydro: Blok " + block + " (jam operasi " + startH + " sampai " + endH + ")", s: S.title }); s.merges.push("A1:L1"); s.heights[0] = 30;
    s.set(1, 0, { v: "Prototipe pembangkit mikro-hidro vortex. Laporan dibuat otomatis oleh Dashboard Vortex Hydro dari data Supabase (tabel telemetry_log).", s: S.note }); s.merges.push("A2:L2");

    s.set(3, 0, { v: "INFORMASI LAPORAN", s: S.section }); s.merges.push("A4:L4");
    var info = [
      ["Status laporan", final ? "FINAL: 10 jam operasi penuh" : "SEMENTARA: " + coveredH.toFixed(2) + " jam dari 10 jam (blok belum selesai)"],
      ["Rentang jam operasi", startH.toFixed(2) + " sampai " + endH.toFixed(2) + " jam"],
      ["Periode data (WIB)", n ? wibParts(t0) + " sampai " + wibParts(t1) : "Belum ada data pada blok ini"],
      ["Dibuat (WIB)", wibParts(gen.getTime())],
      ["Jumlah data", n + " baris (1 baris per menit operasi)"]
    ];
    info.forEach(function (it, i) { s.set(4 + i, 0, { v: it[0], s: S.label }); s.set(4 + i, 1, { v: it[1], s: S.text }); s.merges.push("B" + (5 + i) + ":F" + (5 + i)); for (var k = 2; k <= 5; k++) s.set(4 + i, k, { s: S.text }); });

    s.set(10, 0, { v: "RINGKASAN ENERGI DAN EFISIENSI BLOK INI", s: S.section }); s.merges.push("A11:L11");
    ["Indikator", "Nilai", "Satuan"].forEach(function (h, c) { s.set(11, c, { v: h, s: S.head }); });
    var L = rng("L"), M = rng("M"), Q = rng("Q"), I = rng("I"), J = rng("J"), K = rng("K");
    var kpi = [
      ["Energi PLN masuk ke pompa", "SUM(" + L + ")", sumIn, "Wh", S.n3],
      ["Energi listrik dihasilkan generator", "SUM(" + M + ")", sumOut, "Wh", S.n3],
      ["Efisiensi sistem (dihasilkan / masuk)", "IF(B13>0,B14/B13*100,0)", effAll, "%", S.pct],
      ["Selisih energi (tidak kembali sebagai listrik)", "B13-B14", sumIn - sumOut, "Wh", S.n3],
      ["Daya PLN rata-rata", "IF(SUM(" + Q + ")>0,B13*3600/SUM(" + Q + "),0)", sumDur > 0 ? sumIn * 3600 / sumDur : 0, "W", S.n1],
      ["Daya PLN puncak", "MAX(" + I + ")", pkIn, "W", S.n1],
      ["Daya generator rata-rata", "IF(SUM(" + Q + ")>0,B14*3600/SUM(" + Q + "),0)", sumDur > 0 ? sumOut * 3600 / sumDur : 0, "W", S.n1],
      ["Daya generator puncak", "MAX(" + J + ")", pkOut, "W", S.n1],
      ["Efisiensi puncak (per menit operasi)", "MAX(" + K + ")", effPk, "%", S.pct],
      ["Efisiensi terendah (per menit operasi)", null, effMn || 0, "%", S.pct]
    ];
    kpi.forEach(function (k, i) {
      s.set(12 + i, 0, { v: k[0], s: S.label });
      s.set(12 + i, 1, k[1] ? { f: k[1], v: k[2], s: k[4] } : { v: k[2], s: k[4] });
      s.set(12 + i, 2, { v: k[3], s: S.ctr });
    });

    var WR = 24; /* baris judul tabel 5 jam (0-based 23 = baris 24) */
    s.set(22, 0, { v: "RATA-RATA DAN PUNCAK PER 5 JAM (DAYA DAN EFISIENSI)", s: S.section }); s.merges.push("A23:L23");
    ["Jendela", "Mulai (jam)", "Selesai (jam)", "PLN rata-rata (W)", "PLN puncak (W)", "Generator rata-rata (W)", "Generator puncak (W)", "Energi PLN (Wh)", "Energi generator (Wh)", "Efisiensi rata-rata (%)", "Efisiensi puncak (%)", "Efisiensi terendah (%)"]
      .forEach(function (h, c) { s.set(WR - 1, c, { v: h, s: S.head }); });
    s.heights[WR - 1] = 45;
    var nWin = HOURS_BLOCK / HOURS_WIN;
    for (var w = 0; w < nWin; w++) {
      var h0 = startH + w * HOURS_WIN, h1 = h0 + HOURS_WIN, st = windowStats(rows, h0, h1), r0 = WR + w, x = r0 + 1;
      var A = rng("A");
      var crit = L + "," + A + ',">="&B' + x + "," + A + ',"<"&C' + x;
      s.set(r0, 0, { v: "Jam " + h0 + " sampai " + h1, s: S.label });
      s.set(r0, 1, { v: h0, s: S.n0 });
      s.set(r0, 2, { v: h1, s: S.n0 });
      s.set(r0, 3, { f: "IF(SUMIFS(" + Q + "," + A + ',">="&B' + x + "," + A + ',"<"&C' + x + ")>0,H" + x + "*3600/SUMIFS(" + Q + "," + A + ',">="&B' + x + "," + A + ',"<"&C' + x + "),0)", v: st.inAvg, s: S.n1 });
      s.set(r0, 4, { v: st.pkIn, s: S.n1 });
      s.set(r0, 5, { f: "IF(SUMIFS(" + Q + "," + A + ',">="&B' + x + "," + A + ',"<"&C' + x + ")>0,I" + x + "*3600/SUMIFS(" + Q + "," + A + ',">="&B' + x + "," + A + ',"<"&C' + x + "),0)", v: st.outAvg, s: S.n1 });
      s.set(r0, 6, { v: st.pkOut, s: S.n1 });
      s.set(r0, 7, { f: "SUMIFS(" + crit + ")", v: st.inWh, s: S.n3 });
      s.set(r0, 8, { f: "SUMIFS(" + M + "," + A + ',">="&B' + x + "," + A + ',"<"&C' + x + ")", v: st.outWh, s: S.n3 });
      s.set(r0, 9, { f: "IF(H" + x + ">0,I" + x + "/H" + x + "*100,0)", v: st.eff, s: S.pct });
      s.set(r0, 10, { v: st.effMax, s: S.pct });
      s.set(r0, 11, { v: st.effMin, s: S.pct });
    }
    s.set(WR + nWin + 1, 0, { v: "Puncak dan terendah dihitung dari efisiensi tiap menit operasi. Rata-rata = energi dihasilkan dibagi energi PLN masuk ke pompa pada jendela itu.", s: S.note });
    s.merges.push("A" + (WR + nWin + 2) + ":L" + (WR + nWin + 2));

    /* --- Grafik --- */
    var charts = [], sumAnch = [], grafAnch = [];
    var catA = q(DATA) + "!$A$2:$A$" + last;
    function hdr(col) { return q(DATA) + "!$" + col + "$1"; }
    function line(title, cols, yTitle, yFmt, anch, target) {
      charts.push({ xml: chartXml("line", { title: title, catRef: catA, skip: Math.max(1, Math.min(60, Math.round(n / 10))), xTitle: "Waktu operasi (jam)", xFmt: "0.0", yTitle: yTitle, yFmt: yFmt, yMin: 0,
        series: cols.map(function (c) { return { nameRef: hdr(c[0]), valRef: rng(c[0]), color: c[1] }; }) }), target: target, anch: anch });
    }
    var winCat = q(SUM) + "!$A$" + WR + ":$A$" + (WR + nWin - 1);
    function wcol(col) { return { nameRef: q(SUM) + "!$" + col + "$" + (WR - 1 + 0 + 0), valRef: q(SUM) + "!$" + col + "$" + (WR + 1) + ":$" + col + "$" + (WR + nWin) }; }
    /* catatan: baris judul tabel = WR (1-based), baris data = WR+1 .. WR+nWin */
    winCat = q(SUM) + "!$A$" + (WR + 1) + ":$A$" + (WR + nWin);
    function bar(title, cols, yTitle, yFmt, anch) {
      charts.push({ xml: chartXml("bar", { title: title, catRef: winCat, catStr: true, yTitle: yTitle, yFmt: yFmt, yMin: 0,
        series: cols.map(function (c) { return { nameRef: q(SUM) + "!$" + c[0] + "$" + WR, valRef: q(SUM) + "!$" + c[0] + "$" + (WR + 1) + ":$" + c[0] + "$" + (WR + nWin), color: c[1] }; }) }), target: "sum", anch: anch });
    }
    var chartTop = WR + nWin + 3;
    if (n >= 2) {
      line("Output generator vs input listrik PLN ke pompa (W)", [["G", C_IN], ["H", C_OUT]], "Daya (W)", "0", { c0: 0, r0: chartTop, c1: 6, r1: chartTop + 22 }, "sum");
      bar("Daya rata-rata dan puncak per 5 jam (W)", [["D", C_IN], ["E", "FCD34D"], ["F", C_OUT], ["G", "6EE7B7"]], "Daya (W)", "0", { c0: 6, r0: chartTop, c1: 12, r1: chartTop + 22 });
      bar("Efisiensi per 5 jam (%)", [["J", C_EFF], ["K", C_OUT], ["L", C_LOSS]], "Efisiensi (%)", "0.0", { c0: 0, r0: chartTop + 23, c1: 6, r1: chartTop + 45 });
      line("Energi kumulatif dalam blok (Wh)", [["N", C_IN], ["O", C_OUT]], "Energi (Wh)", "0.0", { c0: 6, r0: chartTop + 23, c1: 12, r1: chartTop + 45 }, "sum");
      line("Efisiensi sistem per menit operasi (%)", [["K", C_EFF]], "Efisiensi (%)", "0.0", { c0: 0, r0: 0, c1: 10, r1: 22 }, "graf");
      line("Isi baterai BESS (%)", [["P", C_OUT]], "SoC (%)", "0", { c0: 10, r0: 0, c1: 20, r1: 22 }, "graf");
      line("Debit air (L/s)", [["C", C_EFF]], "Debit (L/s)", "0.00", { c0: 0, r0: 23, c1: 10, r1: 45 }, "graf");
      line("Putaran poros dan generator (RPM)", [["E", C_IN], ["F", C_DARK]], "RPM", "0", { c0: 10, r0: 23, c1: 20, r1: 45 }, "graf");
    }
    var gs = new Sheet();
    gs.widths = [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9];
    gs.set(0, 0, { s: S.def });

    var sumCharts = charts.filter(function (c) { return c.target === "sum" || c.target === undefined; });
    var grafCharts = charts.filter(function (c) { return c.target === "graf"; });
    /* bar() tidak mengisi target pada objek anchor; pastikan semua grafik ringkasan masuk lembar Ringkasan */
    sumCharts = charts.filter(function (c) { return c.target !== "graf"; });

    /* --- Berkas paket --- */
    var files = [], ct = [], chartNo = 0, drawNo = 0;
    var wbSheets = [
      { name: SUM, xml: s, rid: "rId1", file: "sheet1.xml", charts: sumCharts },
      { name: GRAF, xml: gs, rid: "rId2", file: "sheet2.xml", charts: grafCharts },
      { name: DATA, xml: d, rid: "rId3", file: "sheet3.xml", charts: [] }
    ];
    var sheetFiles = [];
    wbSheets.forEach(function (sh) {
      if (sh.charts.length) {
        drawNo++;
        sh.xml.drawing = true;
        var anchors = [], drelItems = [];
        sh.charts.forEach(function (c, i) {
          chartNo++;
          files.push({ name: "xl/charts/chart" + chartNo + ".xml", data: c.xml });
          ct.push('<Override PartName="/xl/charts/chart' + chartNo + '.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/>');
          anchors.push(c.anch); drelItems.push(["rId" + (i + 1), "chart", "../charts/chart" + chartNo + ".xml"]);
        });
        files.push({ name: "xl/drawings/drawing" + drawNo + ".xml", data: drawingXml(anchors) });
        files.push({ name: "xl/drawings/_rels/drawing" + drawNo + ".xml.rels", data: rels(drelItems) });
        ct.push('<Override PartName="/xl/drawings/drawing' + drawNo + '.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>');
        files.push({ name: "xl/worksheets/_rels/" + sh.file + ".rels", data: rels([["rId1", "drawing", "../drawings/drawing" + drawNo + ".xml"]]) });
      }
      sheetFiles.push({ name: "xl/worksheets/" + sh.file, data: sh.xml.xml(noCache) });
      ct.push('<Override PartName="/xl/worksheets/' + sh.file + '" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>');
    });
    var wb = XMLH + "<workbook " + NS + '><bookViews><workbookView xWindow="0" yWindow="0" windowWidth="28800" windowHeight="16000"/></bookViews><sheets>' +
      wbSheets.map(function (sh, i) { return '<sheet name="' + esc(sh.name) + '" sheetId="' + (i + 1) + '" r:id="' + sh.rid + '"/>'; }).join("") + '</sheets><calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>';
    var iso = gen.toISOString().replace(/\.\d+Z$/, "Z");
    var core = XMLH + '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
      "<dc:title>Laporan Energi Vortex Hydro Blok " + block + "</dc:title><dc:creator>Dashboard Vortex Hydro</dc:creator>" +
      '<dcterms:created xsi:type="dcterms:W3CDTF">' + iso + '</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">' + iso + "</dcterms:modified></cp:coreProperties>";
    var app = XMLH + '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Dashboard Vortex Hydro</Application></Properties>';
    var all = [
      { name: "[Content_Types].xml", data: XMLH + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
        '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>' + ct.join("") + "</Types>" },
      { name: "_rels/.rels", data: XMLH + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
        '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>' },
      { name: "docProps/core.xml", data: core },
      { name: "docProps/app.xml", data: app },
      { name: "xl/workbook.xml", data: wb },
      { name: "xl/_rels/workbook.xml.rels", data: rels([["rId1", "worksheet", "worksheets/sheet1.xml"], ["rId2", "worksheet", "worksheets/sheet2.xml"], ["rId3", "worksheet", "worksheets/sheet3.xml"], ["rId4", "styles", "styles.xml"]]) },
      { name: "xl/styles.xml", data: stylesXml() }
    ].concat(sheetFiles, files);

    var blob = zip(all, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    var filename = "VortexHydro_Laporan-Energi_Blok-" + pad(block) + "_Jam-" + startH + "-" + endH + (final ? "" : "_SEMENTARA") + ".xlsx";
    return { blob: blob, filename: filename, summary: { block: block, rows: n, inWh: sumIn, outWh: sumOut, effPct: effAll, final: final } };
  }

  function download(res) {
    var url = URL.createObjectURL(res.blob), a = document.createElement("a");
    a.href = url; a.download = res.filename; a.style.display = "none";
    document.body.appendChild(a); a.click();
    setTimeout(function () { a.remove(); URL.revokeObjectURL(url); }, 4000);
  }

  window.VXReport = { build: build, download: download, HOURS_BLOCK: HOURS_BLOCK, HOURS_WIN: HOURS_WIN };
})();
