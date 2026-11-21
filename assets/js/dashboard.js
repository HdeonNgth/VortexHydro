/* Vortex Hydro: diagram interaktif Cara Kerja & modal detail dokumentasi */
(function () {
  var $ = function (q, r) { return Array.prototype.slice.call((r || document).querySelectorAll(q)); };

  /* Diagram Cara Kerja: klik bagian atau tombol nomor untuk menampilkan penjelasan */
  var dia = document.getElementById('vx-diagram');
  var dtxt = document.getElementById('dinfo-txt');
  if (dia && dtxt) {
    var spots = $('.hs', dia);
    var chips = $('#dchips button');
    var cur = 0;

    function show(i) {
      var t = document.querySelector('template[data-i="' + i + '"]');
      if (!t) return;
      cur = i;
      dtxt.innerHTML = t.innerHTML;
      spots.forEach(function (s) { s.classList.toggle('is-on', +s.dataset.i === cur); });
      chips.forEach(function (c) {
        var active = +c.dataset.i === cur;
        c.classList.toggle('is-on', active);
        c.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
    }

    spots.forEach(function (s) {
      s.addEventListener('click', function () { show(+s.dataset.i); });
      s.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          show(+s.dataset.i);
        }
      });
    });

    chips.forEach(function (c) {
      c.addEventListener('click', function () { show(+c.dataset.i); });
    });

    /* Tampilkan bagian 1 secara bawaan agar panel informasi langsung informatif */
    show(1);
  }
})();
