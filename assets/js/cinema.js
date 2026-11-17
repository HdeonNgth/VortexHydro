/* Video sinematik 3D sebagai latar hero beranda: autoplay, berulang, tanpa kontrol.
   Dimuat setelah halaman selesai, dibongkar saat hero tidak terlihat supaya halaman tetap ringan.
   Tidak dimuat bila perangkat meminta gerakan dikurangi atau mode hemat data. */
(function () {
  var box = document.querySelector(".hx__vid"), ifr = document.getElementById("vc-if"), hero = document.querySelector(".hx");
  if (!box || !ifr || !hero) return;
  var SRC = "ui-design/cinematic.html?embed=1&ui=0&titles=0&autoplay=1", on = false, ready = false;
  var rm = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var sd = navigator.connection && navigator.connection.saveData;
  if (rm || sd) return;

  function start() {
    if (on || !ready) return;
    on = true; ifr.src = SRC;
    ifr.onload = function () { setTimeout(function () { if (on) box.classList.add("on"); }, 1500); };
  }
  function stop() {
    if (!on) return;
    on = false; ifr.removeAttribute("src"); box.classList.remove("on");
  }
  function go() { ready = true; if (visible) start(); }

  var visible = true;
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (e) { visible = e[0].intersectionRatio > 0.02; visible ? start() : stop(); }, { threshold: [0, 0.02, 0.5] }).observe(hero);
  }
  if (document.readyState === "complete") setTimeout(go, 400);
  else window.addEventListener("load", function () { setTimeout(go, 400); });
})();
