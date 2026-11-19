/* Mesin simulasi prototipe Vortex Hydro.
   Satu sumber data untuk Dashboard (data prototipe di browser).
   Prototipe hanya mengukur 4 besaran:
     debit      aliran air (L/s)
     vbat       tegangan baterai (V)
     rpmShaft   putaran poros utama turbin (RPM)
     rpmGen     putaran generator (RPM)
   Sisanya (head, daya) hanya hitungan model.
   Ubah CFG setelah ada data pengujian. */
(function () {
  var CFG = {
    eta: .30, kRpm: 150, ratio: 2.2, ledW: .75,   /* efisiensi, konstanta RPM, rasio pulley generator/poros */
    leak: .6, belt: .5,                           /* bagian air yang bocor, faktor slip sabuk saat gangguan */
    chg: .003, drain: .0006, fastDrain: .02,      /* pengisian per watt, beban normal, beban berlebih (per detik) */
    vRest0: 10.6, vRestSpan: 2.4, vChg: .6        /* tegangan baterai: kosong, rentang, kenaikan saat diisi */
  };
  var S = { on: true, q: .5, h: .5, fault: "none", qe: 0, rpm: 0, rpmg: 0, tr: 0, pe: 0, soc: .7, vbat: 0 };
  S.vbat = CFG.vRest0 + CFG.vRestSpan * S.soc;
  var listeners = [], hist = [], last = Date.now();

  function ratioNow() { return CFG.ratio * (S.fault === "belt" ? CFG.belt : 1); }

  function step(dt) {
    var inflow = S.on ? S.q : 0;
    S.qe += (inflow - S.qe) * (1 - Math.exp(-dt * 2.2));
    var qt = S.qe * (S.fault === "leak" ? 1 - CFG.leak : 1);
    S.tr = S.fault === "jam" ? 0 : CFG.kRpm * Math.sqrt(S.h / .5) * Math.pow(qt / .5, .7);
    S.rpm += (S.tr - S.rpm) * (1 - Math.exp(-dt * (S.fault === "jam" ? 5 : 1.6)));
    S.rpmg += (S.rpm * ratioNow() - S.rpmg) * (1 - Math.exp(-dt * 4));
    var pe = S.tr > .5 ? CFG.eta * 9.81 * qt * S.h * Math.min(1, S.rpm / S.tr) : 0;
    if (S.fault === "belt") pe *= CFG.belt;
    S.pe = pe;
    S.soc += (pe * CFG.chg - (S.on ? CFG.drain : CFG.drain * .5) - (S.fault === "batt" ? CFG.fastDrain : 0)) * dt;
    S.soc = Math.max(0, Math.min(1, S.soc));
    var target = CFG.vRest0 + CFG.vRestSpan * S.soc + CFG.vChg * Math.min(1, pe / CFG.ledW);
    S.vbat += (target - S.vbat) * (1 - Math.exp(-dt * 3));
  }

  function reading(noise) {
    var j = function (v, a) { return noise && v > 0 ? v * (1 + (Math.random() - .5) * a) : v; };
    var v = S.vbat;
    return {
      debit: j(S.qe, .02), vbat: noise ? v + (Math.random() - .5) * .02 : v,
      rpmShaft: j(S.rpm, .015), rpmGen: j(S.rpmg, .015),
      head: S.h, daya: j(S.pe, .02), led: S.rpmg * 1 > 60 ? Math.min(1, S.pe / CFG.ledW) : 0,
      on: S.on, fault: S.fault, ts: Date.now()
    };
  }

  function emit(what) { listeners.forEach(function (f) { try { f(what, S); } catch (e) {} }); }

  setInterval(function () {
    var now = Date.now(), dt = Math.min(.5, (now - last) / 1000);
    last = now; step(dt);
  }, 100);
  setInterval(function () {
    hist.push(reading(true));
    if (hist.length > 60) hist.shift();
  }, 1000);

  window.VXSim = {
    CFG: CFG,
    state: S,
    read: function () { return reading(true); },
    history: function () { return hist.slice(); },
    set: function (o) {
      var ch = {};
      ["on", "q", "h", "fault"].forEach(function (k) {
        if (o[k] != null && o[k] !== S[k]) { ch[k] = o[k]; S[k] = o[k]; }
      });
      if (Object.keys(ch).length) emit(ch);
    },
    onChange: function (f) { listeners.push(f); }
  };
})();
