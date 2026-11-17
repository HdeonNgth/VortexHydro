/* Video sinematik di beranda: file HTML 3D dimuat di iframe hanya saat tombol Putar ditekan,
   dan dibongkar lagi saat bagian ini keluar dari layar supaya halaman tetap ringan. */
(function () {
  var frame = document.getElementById("vc-frame"), ifr = document.getElementById("vc-if"),
      play = document.getElementById("vc-play"), full = document.getElementById("vc-full");
  if (!frame || !ifr || !play) return;
  var SRC = "assets/video/vortex-hydro-cinematic.html", on = false;

  function start() {
    if (on) return;
    on = true; ifr.src = SRC; frame.classList.add("on"); play.hidden = true; full.hidden = false;
  }
  function stop() {
    if (!on) return;
    on = false; ifr.removeAttribute("src"); frame.classList.remove("on"); play.hidden = false; full.hidden = true;
  }
  function isFull() { return document.fullscreenElement || document.webkitFullscreenElement; }
  function goFull() {
    if (isFull()) { (document.exitFullscreen || document.webkitExitFullscreen).call(document); return; }
    var el = frame;
    (el.requestFullscreen || el.webkitRequestFullscreen || function () { start(); }).call(el);
  }

  play.addEventListener("click", start);
  full.addEventListener("click", goFull);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (e) { if (e[0].intersectionRatio < 0.02 && !isFull()) stop(); }, { threshold: [0, 0.02, 0.5] }).observe(frame);
  }
  /* pindah halaman (router memakai hash) juga membongkar video */
  window.addEventListener("hashchange", function () { if (!isFull()) stop(); });
})();
