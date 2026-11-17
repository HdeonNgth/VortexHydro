/* Mesin simulasi prototipe Vortex Hydro.
   Satu sumber data untuk halaman Teknologi dan Dashboard. Berjalan terus,
   tidak peduli halaman mana yang sedang dibuka.
   Saat sensor asli tersedia, Dashboard memakai data sensor dan mesin ini
   hanya jadi cadangan. Ubah CFG setelah ada data pengujian. */
(function () {
  var CFG = { eta: .30, kRpm: 150, kv: .08, ledW: .75, tAmb: 27, leak: .5 };
  var S = { on: true, q: .5, h: .5, fault: "none", qe: 0, rpm: 0, tr: 0, temp: CFG.tAmb };
  var listeners = [], hist = [], last = Date.now();

  function step(dt) {
    var inflow = S.on ? S.q : 0;
    S.qe += (inflow - S.qe) * (1 - Math.exp(-dt * 2.2));
    var qt = S.qe * (S.fault === "leak" ? 1 - CFG.leak : 1);
    S.tr = S.fault === "jam" ? 0 : CFG.kRpm * Math.sqrt(S.h / .5) * Math.pow(qt / .5, .7);
    S.rpm += (S.tr - S.rpm) * (1 - Math.exp(-dt * (S.fault === "jam" ? 5 : 1.6)));
    var pe = S.tr > .5 ? CFG.eta * 9.81 * qt * S.h * Math.min(1, S.rpm / S.tr) : 0;
    var target = CFG.tAmb + 1.5 * pe + (S.fault === "jam" && S.on ? 25 : 0) + (S.fault === "heat" ? 22 : 0);
    S.temp += (target - S.temp) * (1 - Math.exp(-dt / 15));
    S.pe = pe;
  }

  function reading(noise) {
    var j = function (v, a) { return noise && v > 0 ? v * (1 + (Math.random() - .5) * a) : v; };
    var qt = S.qe * (S.fault === "leak" ? 1 - CFG.leak : 1);
    var ph = 9.81 * S.qe * S.h, pe = S.pe || 0, v = CFG.kv * S.rpm;
    var r = {
      debit: j(S.qe, .02), head: S.h, rpm: j(S.rpm, .015), volt: j(v, .015),
      amp: v > 0 ? pe / v : 0, daya: j(pe, .02),
      eff: ph > .01 ? Math.min(100, pe / ph * 100) : 0, temp: S.temp + (noise ? (Math.random() - .5) * .1 : 0),
      led: v < 3 ? 0 : Math.min(1, pe / CFG.ledW), on: S.on, fault: S.fault, ts: Date.now()
    };
    void qt;
    return r;
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
