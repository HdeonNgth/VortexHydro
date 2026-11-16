(function () {
  var apiBase = String(window.VX_API_BASE || "").replace(/\/+$/, "");
  var isDemo = window.VX_DEMO_MODE === true;
  var demoSessionKey = "vx-demo-role-v2";
  var demoAdminPassword = "pakcikiniv2";
  var state = { authenticated: false, role: null, displayName: "", offline: false };
  var forceOpen = false;

  function make(tag, className, text) {
    var element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function request(path, options) {
    if (isDemo) return Promise.reject(new Error("Backend tidak tersedia di mode demo GitHub Pages."));
    options = options || {};
    options.credentials = "include";
    options.headers = Object.assign({}, options.headers || {});
    if (options.body && !options.headers["Content-Type"]) options.headers["Content-Type"] = "application/json";
    return fetch(apiBase + "/api/" + path, options).then(function (response) {
      if (response.status === 204) return null;
      return response.json().catch(function () { return {}; }).then(function (body) {
        if (!response.ok) {
          var error = new Error(body.error || "Permintaan gagal (" + response.status + ").");
          error.status = response.status;
          throw error;
        }
        return body;
      });
    });
  }

  var dialog = make("section", "vx-auth");
  dialog.id = "vx-auth";
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");
  dialog.setAttribute("aria-labelledby", "vx-auth-title");
  var svgNs = "http://www.w3.org/2000/svg";
  var scene = make("div", "vx-auth__scene");
  scene.setAttribute("aria-hidden", "true");
  [
    ["top w2", "M0 90 Q180 30 360 90 T720 90 T1080 90 T1440 90 V200 H0 Z"],
    ["top w1", "M0 70 Q180 10 360 70 T720 70 T1080 70 T1440 70 V200 H0 Z"],
    ["bottom w4", "M0 90 Q180 30 360 90 T720 90 T1080 90 T1440 90 V200 H0 Z"],
    ["bottom w3", "M0 110 Q180 50 360 110 T720 110 T1080 110 T1440 110 V200 H0 Z"]
  ].forEach(function (wave) {
    var svg = document.createElementNS(svgNs, "svg");
    svg.setAttribute("class", "vx-auth__wave " + wave[0]);
    svg.setAttribute("viewBox", "0 0 1440 200");
    svg.setAttribute("preserveAspectRatio", "none");
    var path = document.createElementNS(svgNs, "path");
    path.setAttribute("d", wave[1]);
    svg.appendChild(path);
    scene.appendChild(svg);
  });
  var bubbles = make("div", "vx-auth__bubbles");
  for (var bubbleIndex = 0; bubbleIndex < (window.innerWidth < 760 ? 10 : 16); bubbleIndex++) {
    var bubble = make("i", "vx-auth__bubble");
    bubble.style.setProperty("--s", (8 + Math.random() * 26).toFixed(0) + "px");
    bubble.style.setProperty("--x", (Math.random() * 100).toFixed(1) + "%");
    bubble.style.setProperty("--d", (14 + Math.random() * 16).toFixed(1) + "s");
    bubble.style.setProperty("--delay", (-Math.random() * 30).toFixed(1) + "s");
    bubble.style.setProperty("--sway", ((Math.random() - .5) * 60).toFixed(0) + "px");
    bubbles.appendChild(bubble);
  }
  scene.appendChild(bubbles);
  dialog.appendChild(scene);

  function makeIcon(name) {
    var svg = document.createElementNS(svgNs, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "1.8");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("aria-hidden", "true");
    if (name === "eye") {
      var eyePath = document.createElementNS(svgNs, "path");
      eyePath.setAttribute("d", "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z");
      svg.appendChild(eyePath);
      var eyePupil = document.createElementNS(svgNs, "circle");
      eyePupil.setAttribute("cx", "12");
      eyePupil.setAttribute("cy", "12");
      eyePupil.setAttribute("r", "3");
      svg.appendChild(eyePupil);
    } else if (name === "lock") {
      var rect = document.createElementNS(svgNs, "rect");
      rect.setAttribute("x", "4");
      rect.setAttribute("y", "10");
      rect.setAttribute("width", "16");
      rect.setAttribute("height", "11");
      rect.setAttribute("rx", "3");
      svg.appendChild(rect);
      var lockArc = document.createElementNS(svgNs, "path");
      lockArc.setAttribute("d", "M8 10V7a4 4 0 0 1 8 0v3");
      svg.appendChild(lockArc);
    } else {
      var head = document.createElementNS(svgNs, "circle");
      head.setAttribute("cx", "12");
      head.setAttribute("cy", "8");
      head.setAttribute("r", "4");
      svg.appendChild(head);
      var shoulders = document.createElementNS(svgNs, "path");
      shoulders.setAttribute("d", "M4 21c1-4 4-6 8-6s7 2 8 6");
      svg.appendChild(shoulders);
    }
    return svg;
  }

  var brand = make("div", "vx-auth__brand");
  var brandMark = document.createElementNS(svgNs, "svg");
  brandMark.setAttribute("viewBox", "0 0 32 32");
  brandMark.setAttribute("aria-hidden", "true");
  var brandSquare = document.createElementNS(svgNs, "rect");
  brandSquare.setAttribute("width", "32");
  brandSquare.setAttribute("height", "32");
  brandSquare.setAttribute("rx", "9");
  brandSquare.setAttribute("fill", "#eaf8fb");
  brandMark.appendChild(brandSquare);
  var brandDrop = document.createElementNS(svgNs, "path");
  brandDrop.setAttribute("d", "M16 6.5c3.8 4.6 6 7.7 6 10.7a6 6 0 0 1-12 0c0-3 2.2-6.1 6-10.7z");
  brandDrop.setAttribute("fill", "#0b5577");
  brandMark.appendChild(brandDrop);
  var brandDot = document.createElementNS(svgNs, "circle");
  brandDot.setAttribute("cx", "16");
  brandDot.setAttribute("cy", "17.5");
  brandDot.setAttribute("r", "2.2");
  brandDot.setAttribute("fill", "#8fe3f5");
  brandMark.appendChild(brandDot);
  brand.appendChild(brandMark);
  brand.appendChild(make("span", "", "Vortex Hydro"));
  var title = make("h1", "vx-auth__sr-only", "Masuk ke Vortex Hydro");
  title.id = "vx-auth-title";
  var status = make("p", "vx-auth__flash", "");
  status.id = "vx-auth-status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");

  function makeField(form, labelText, name, type, autocomplete, minLength, maxLength) {
    var field = make("div", "vx-auth__field");
    var label = make("label", "vx-auth__sr-only", labelText);
    var input = make("input");
    input.name = name;
    input.type = type;
    input.autocomplete = autocomplete;
    input.required = true;
    if (minLength) input.minLength = minLength;
    if (maxLength) input.maxLength = maxLength;
    label.htmlFor = "vx-auth-" + name;
    input.id = label.htmlFor;
    input.placeholder = labelText;
    field.appendChild(label);
    field.appendChild(input);
    form.appendChild(field);
    return input;
  }

  var card = make("div", "vx-auth__card");
  card.dataset.mode = "cover";

  var adminForm = make("form", "vx-auth__pane vx-auth__pane--admin");
  adminForm.id = "vx-auth-pane-admin";
  adminForm.inert = true;
  adminForm.setAttribute("role", "tabpanel");
  adminForm.setAttribute("aria-labelledby", "vx-auth-admin-title");
  var adminBadge = make("span", "vx-auth__badge");
  adminBadge.appendChild(makeIcon("lock"));
  adminForm.appendChild(adminBadge);
  var adminTitle = make("h2", "", "Login Admin");
  adminTitle.id = "vx-auth-admin-title";
  adminForm.appendChild(adminTitle);
  adminForm.appendChild(make("p", "vx-auth__sub", isDemo
    ? "Masukkan kata sandi demo untuk membuka Dashboard simulasi."
    : "Gunakan akun admin untuk membuka Dashboard."));
  var username = null;
  if (!isDemo) {
    username = makeField(adminForm, "Username", "admin-username", "text", "username", 3, 32);
    username.autocapitalize = "none";
    username.spellcheck = false;
  }
  var password = makeField(adminForm, isDemo ? "Kata sandi demo" : "Kata sandi", "admin-password", "password", isDemo ? "off" : "current-password", 1, 128);
  password.autocapitalize = "none";
  var eye = make("button", "vx-auth__eye", "");
  eye.type = "button";
  eye.setAttribute("aria-label", "Tampilkan kata sandi");
  eye.setAttribute("aria-pressed", "false");
  eye.appendChild(makeIcon("eye"));
  password.parentNode.appendChild(eye);
  var adminSubmit = make("button", "vx-auth__button vx-auth__button--primary", "Masuk");
  adminSubmit.type = "submit";
  adminSubmit.disabled = false;
  adminForm.appendChild(adminSubmit);


  var overlay = make("div", "vx-auth__overlay");
  var coverCopy = make("div", "vx-auth__overlay-copy vx-auth__overlay-copy--cover");
  coverCopy.appendChild(make("h3", "", "Selamat Datang!"));
  coverCopy.appendChild(make("p", "vx-auth__sub", "Panel admin pemantauan turbin vortex mikro-hidro."));
  var adminCopy = make("div", "vx-auth__overlay-copy vx-auth__overlay-copy--admin");
  adminCopy.appendChild(make("h3", "", "Halo, Admin!"));
  adminCopy.appendChild(make("p", "vx-auth__sub", "Masuk dengan akun admin untuk membuka Dashboard pemantauan."));
  var backBtn = make("button", "vx-auth__button vx-auth__button--ghost", "Kembali ke Website");
  backBtn.type = "button";
  adminCopy.appendChild(backBtn);
  overlay.appendChild(coverCopy);
  overlay.appendChild(adminCopy);

  card.appendChild(adminForm);
  card.appendChild(overlay);
  var closeBtn = make("button", "vx-auth__close", "\u00d7");
  closeBtn.type = "button";
  closeBtn.setAttribute("aria-label", "Tutup dan kembali ke website");
  dialog.appendChild(closeBtn);
  dialog.appendChild(title);
  dialog.appendChild(brand);
  dialog.appendChild(status);
  dialog.appendChild(card);
  document.body.appendChild(dialog);

  var navbar = document.getElementById("lg");
  var logout = make("button", "lg__logout", "Keluar");
  logout.type = "button";logout.title = "Keluar";logout.setAttribute("aria-label", "Keluar");
  logout.hidden = true;
  logout.addEventListener("click", function () {
    logout.disabled = true;
    var storageError = null;
    var finish = function () {
      if (location.hash === "#dashboard") location.hash = "#beranda";
      return becomeGuest();
    };
    if (isDemo) {
      try {
        window.sessionStorage.removeItem(demoSessionKey);
      } catch (error) {
        storageError = error;
      }
      finish().then(function () {
        logout.disabled = false;
      });
      return;
    }
    request("auth/logout", { method: "POST" }).then(finish).catch(function (error) {
      setStatus(error.message + " Sesi tetap aktif sampai server dapat dihubungi.", true);
      forceOpen = true;
      updateUi();
    }).then(function () {
      logout.disabled = false;
    });
  });
  if (navbar) navbar.appendChild(logout);

  function snapshot() {
    return {
      authenticated: state.authenticated,
      role: state.role,
      displayName: state.displayName,
      offline: state.offline
    };
  }

  function updateUi() {
    var dashboardLink = document.querySelector('#lgn a[data-k="dashboard"]');
    logout.hidden = !(state.authenticated && state.role === "admin");
    if (dashboardLink) dashboardLink.hidden = !(state.authenticated && state.role === "admin");
    dialog.hidden = !forceOpen;
    document.body.classList.toggle("vx-auth-open", !dialog.hidden);
  }

  function setStatus(message, isError) {
    status.textContent = message;
    status.classList.toggle("is-error", !!isError);
    status.classList.toggle("is-demo", isDemo && !!message);
  }

  function slideDelay() {
    return (document.documentElement.classList.contains("vx-noanim") || window.matchMedia("(max-width: 760px)").matches) ? 0 : 1250;
  }

  function setMode(mode, shouldFocus) {
    var adminMode = mode === "admin";
    var nextMode = adminMode ? "admin" : "cover";
    if (card.dataset.mode !== nextMode && !dialog.hidden) {
      card.classList.add("is-gx");
      window.setTimeout(function () { card.classList.remove("is-gx"); }, 1500);
    }
    card.dataset.mode = nextMode;
    adminForm.inert = !adminMode;
    if (shouldFocus && adminMode) {
      window.setTimeout(function () {
        (username || password).focus();
      }, slideDelay() ? 1300 : 60);
    }
  }

  function dispatchState() {
    updateUi();
    window.dispatchEvent(new CustomEvent("vx:authchange", { detail: snapshot() }));
  }

  function setState(next) {
    state.authenticated = next.authenticated === true;
    state.role = state.authenticated ? next.role : null;
    state.displayName = state.authenticated ? next.displayName : "";
    state.offline = next.offline === true;
    forceOpen = false;
    dispatchState();
  }

  var lastFocus = null;
  var openTimer = 0;
  var closing = false;

  function resetForm() {
    if (username) username.value = "";
    password.value = "";
    password.type = "password";
    eye.setAttribute("aria-pressed", "false");
    eye.setAttribute("aria-label", "Tampilkan kata sandi");
    password.removeAttribute("aria-invalid");
  }

  function showLogin() {
    if (dialog.hidden) lastFocus = document.activeElement;
    closing = false;
    window.clearTimeout(openTimer);
    resetForm();
    card.classList.add("no-anim");
    card.dataset.mode = "cover";
    adminForm.inert = true;
    forceOpen = true;
    updateUi();
    void card.offsetWidth;
    card.classList.remove("no-anim");
    setStatus(isDemo
      ? "DEMO — password dicek di browser dan dapat dilewati."
      : (state.offline ? "Backend belum terhubung. Periksa server lalu coba lagi." : ""), !isDemo && state.offline);
    openTimer = window.setTimeout(function () { setMode("admin", true); }, 90);
  }

  /* Panel kembali menutup formulir (seperti di video), lalu aksi lanjutan dijalankan. */
  function playExit(done) {
    window.clearTimeout(openTimer);
    adminForm.inert = true;
    var delay = slideDelay();
    if (!delay) {
      done();
      return;
    }
    setMode("cover");
    window.setTimeout(done, delay - 100);
  }

  function closeLogin() {
    if (dialog.hidden || closing) return;
    closing = true;
    playExit(function () {
      closing = false;
      forceOpen = false;
      resetForm();
      updateUi();
      if (lastFocus && lastFocus.focus) lastFocus.focus();
      lastFocus = null;
    });
  }

  function becomeGuest() {
    if (isDemo) {
      setState({ authenticated: true, role: "guest", displayName: "", offline: true });
      return Promise.resolve(snapshot());
    }
    return request("auth/guest", { method: "POST", body: JSON.stringify({}) }).then(function (result) {
      setState(result);
    }).catch(function () {
      setState({ authenticated: true, role: "guest", displayName: "", offline: true });
    }).then(function () {
      return snapshot();
    });
  }

  function openDashboard() {
    if (state.authenticated && state.role === "admin") location.hash = "#dashboard";
  }

  function submit(form, endpoint, payload, button) {
    button.disabled = true;
    setStatus("Memproses login...", false);
    request(endpoint, { method: "POST", body: JSON.stringify(payload) }).then(function (result) {
      setStatus("Login berhasil.", false);
      playExit(function () {
        setState(result);
        openDashboard();
      });
    }).catch(function (error) {
      if (!error.status) state.offline = true;
      setStatus(error.message, true);
    }).then(function () {
      button.disabled = false;
      if (form === adminForm) {
        password.value = "";
        if (username) username.value = "";
      }
    });
  }

  function enterDemo(role) {
    var storageError = null;
    try {
      window.sessionStorage.setItem(demoSessionKey, role);
    } catch (error) {
      storageError = error;
    }
    setState({ authenticated: true, role: role, displayName: "", offline: true });
    openDashboard();
    setStatus(storageError
      ? "Mode demo dibuka, tetapi sesi tidak tersimpan: " + storageError.message
      : (role === "admin"
        ? "Mode demo dibuka. Password hanya diperiksa di browser dan tidak aman."
        : "Mode demo Tamu dibuka."), !!storageError);
  }

  backBtn.addEventListener("click", closeLogin);
  closeBtn.addEventListener("click", closeLogin);
  adminForm.addEventListener("submit", function (event) {
    event.preventDefault();
    if (!adminForm.reportValidity()) return;
    if (isDemo) {
      if (password.value !== demoAdminPassword) {
        password.value = "";
        password.setAttribute("aria-invalid", "true");
        setStatus("Kata sandi demo salah. Dashboard Admin tidak dibuka.", true);
        password.focus();
        return;
      }
      password.value = "";
      password.removeAttribute("aria-invalid");
      setStatus("Login berhasil.", false);
      playExit(function () { enterDemo("admin"); });
      return;
    }
    submit(adminForm, "auth/admin", { username: username.value.trim(), password: password.value }, adminSubmit);
  });
  eye.addEventListener("click", function () {
    var visible = password.type === "password";
    password.type = visible ? "text" : "password";
    eye.setAttribute("aria-pressed", String(visible));
    eye.setAttribute("aria-label", visible ? "Sembunyikan kata sandi" : "Tampilkan kata sandi");
    password.focus();
  });
  password.addEventListener("input", function () {
    password.removeAttribute("aria-invalid");
    if (status.classList.contains("is-error")) setStatus(isDemo
      ? "DEMO — password dicek di browser dan dapat dilewati."
      : "Masukkan akun admin yang disiapkan oleh pengelola.", false);
  });

  document.addEventListener("click", function (event) {
    var button = event.target.closest && event.target.closest("[data-vx-admin-login]");
    if (button) showLogin("admin");
  });

  /* Klik logo Vortex Hydro di navbar -> halaman login admin (admin yang sudah masuk tetap ke beranda). */
  document.addEventListener("click", function (event) {
    var logo = event.target.closest && event.target.closest(".lg__brand");
    if (!logo || event.button || event.metaKey || event.ctrlKey || event.shiftKey) return;
    if (state.authenticated && state.role === "admin") return;
    event.preventDefault();
    event.stopImmediatePropagation();
    showLogin("admin");
  }, true);

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !dialog.hidden) closeLogin();
  });

  adminForm.inert = true;
  var ready;
  if (isDemo) {
    var demoRole = null;
    try {
      demoRole = window.sessionStorage.getItem(demoSessionKey);
    } catch (error) {
      demoRole = null;
    }
    state.authenticated = true;
    state.role = demoRole === "admin" ? "admin" : "guest";
    state.displayName = "";
    state.offline = true;
    forceOpen = false;
    dispatchState();
    ready = Promise.resolve(snapshot());
  } else {
    ready = request("auth/me").then(function (result) {
      if (result.authenticated === true) {
        state.authenticated = true;
        state.role = result.role;
        state.displayName = result.displayName;
        state.offline = false;
        forceOpen = false;
        dispatchState();
        return snapshot();
      }
      return becomeGuest();
    }).catch(function () {
      return becomeGuest();
    });
  }

  window.VXAuth = {
    ready: ready,
    state: snapshot,
    request: request,
    track: function (page) {
      if (isDemo) return Promise.resolve(null);
      return request("track", { method: "POST", body: JSON.stringify({ page: page }) });
    },
    showLogin: showLogin,
    expire: function () {
      if (isDemo) {
        try {
          window.sessionStorage.removeItem(demoSessionKey);
        } catch (error) {
          setStatus("Sesi demo tidak dapat dihapus: " + error.message, true);
        }
      }
      becomeGuest().then(function () {
        showLogin("admin");
        setStatus("Sesi berakhir. Silakan masuk kembali.", true);
      });
    },
    url: function (path) { return apiBase + "/api/" + path; }
  };
  updateUi();
})();
