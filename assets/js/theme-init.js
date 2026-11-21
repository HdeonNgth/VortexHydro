if (location.hash === "#teknologi") location.replace("#tentang");
try {
  var t = localStorage.getItem("vxt");
  if (t === "dark" || t === "light") document.documentElement.dataset.theme = t;
} catch (e) {}
