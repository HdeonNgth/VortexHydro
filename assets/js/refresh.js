/* Penyegaran Beranda: progres scroll untuk hero, dan gerak masuk bertahap untuk bagian di bawahnya.
   Aman dimatikan: tanpa file ini (atau dengan "kurangi gerakan") semua elemen tetap tampil normal. */
(function () {
  "use strict";
  var hero = document.querySelector("#beranda .hx");
  if (!hero) return;
  var root = document.documentElement;
  var calm = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var lite = root.classList.contains("vx-noanim");

  /* 1) Progres scroll hero (0 saat di atas, 1 saat hero hampir lewat) sebagai variabel CSS --rf-p */
  if (!calm) {
    var ticking = false;
    var update = function () {
      ticking = false;
      var h = hero.offsetHeight || 1;
      var p = Math.min(1, Math.max(0, (window.pageYOffset || 0) / (h * 0.7)));
      hero.style.setProperty("--rf-p", p.toFixed(3));
    };
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  /* Pengaman: bila video 3D gagal siap (mis. CDN Three.js diblokir), tampilkan foto cadangan, bukan layar hitam */
  var vid = hero.querySelector(".hx__vid"), ifr = document.getElementById("vc-if");
  function guard() {
    if (!vid || !ifr || !vid.classList.contains("on")) return;
    try { if (!ifr.contentWindow || typeof ifr.contentWindow.THREE === "undefined") vid.classList.remove("on"); } catch (e) { /* lintas-origin: biarkan */ }
  }
  [3200, 6000].forEach(function (t) { setTimeout(guard, t); });

  /* 2) Gerak masuk: kartu Jelajahi miring dari bawah, teks dan foto naik/menyamping */
  if (calm || lite || !("IntersectionObserver" in window)) return;
  var targets = [];
  function tag(sel, mode, step) {
    Array.prototype.forEach.call(document.querySelectorAll(sel), function (el, i) {
      el.setAttribute("data-rf", mode);
      el.style.transitionDelay = (i * (step || 0)) + "ms";
      targets.push(el);
    });
  }
  tag("#beranda .intro .collage", "left");
  tag("#beranda .intro__grid > div:first-child", "up");
  tag("#beranda .bento__intro", "up");
  tag("#beranda .bento .tile", "tilt", 130);

  root.classList.add("rf-js");
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add("rf-in");
      io.unobserve(e.target);
      /* setelah animasi selesai, lepas delay supaya efek hover tetap responsif */
      setTimeout(function () { e.target.style.transitionDelay = ""; }, 1400);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
  targets.forEach(function (el) { io.observe(el); });
})();
