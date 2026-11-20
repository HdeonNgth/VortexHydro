/* Variasi gerak muncul untuk kartu informasi di halaman Tentang: tiap kartu masuk dari arah dan gaya berbeda.
   Hanya menambahkan kelas "in" saat kartu terlihat; tanpa JS atau dengan "kurangi gerakan", semua kartu langsung tampil. */
(function () {
  "use strict";
  var sec = document.querySelector(".eqx");
  if (!sec) return;
  var cards = Array.prototype.slice.call(sec.querySelectorAll(".eqx__c"));
  var calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (calm || !("IntersectionObserver" in window)) { cards.forEach(function (c) { c.classList.add("in"); }); return; }
  sec.setAttribute("data-ready", "");
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      var c = e.target, i = cards.indexOf(c);
      setTimeout(function () { c.classList.add("in"); }, (i % 2) * 140);
      io.unobserve(c);
    });
  }, { threshold: .18, rootMargin: "0px 0px -6% 0px" });
  cards.forEach(function (c) { io.observe(c); });
})();
