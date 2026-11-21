(function () {
  var apiBase = String(window.VX_API_BASE || "").replace(/\/+$/, "");
  var isDemo = window.VX_DEMO_MODE === true;
  var demoSessionKey = "vx-demo-role-v2";
  var demoAdminPassword = "pakcikiniv2";
  var state = { authenticated: false, role: null, displayName: "", offline: false };
  var forceOpen = false;
  var svgNs = "http://www.w3.org/2000/svg";

  function make(tag, className, text) {
    var el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }

  function request(path, options) {
    if (isDemo) return Promise.reject(new Error("Backend tidak tersedia di mode demo."));
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
      var p1 = document.createElementNS(svgNs, "path");
      p1.setAttribute("d", "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z");
      var c1 = document.createElementNS(svgNs, "circle");
      c1.setAttribute("cx", "12");
      c1.setAttribute("cy", "12");
      c1.setAttribute("r", "3");
      svg.appendChild(p1);
      svg.appendChild(c1);
    } else if (name === "lock") {
      var r1 = document.createElementNS(svgNs, "rect");
      r1.setAttribute("x", "4");
      r1.setAttribute("y", "10");
      r1.setAttribute("width", "16");
      r1.setAttribute("height", "11");
      r1.setAttribute("rx", "2.5");
      var p2 = document.createElementNS(svgNs, "path");
      p2.setAttribute("d", "M8 10V7a4 4 0 0 1 8 0v3");
      svg.appendChild(r1);
      svg.appendChild(p2);
    }
    return svg;
  }

  var dialog = make("section", "vx-auth");
  dialog.id = "vx-auth";
  dialog.hidden = true;
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");
  dialog.setAttribute("aria-labelledby", "vx-auth-admin-title");

  var card = make("div", "vx-auth__card");

  var closeBtn = make("button", "vx-auth__close", "\u00d7");
  closeBtn.type = "button";
  closeBtn.setAttribute("aria-label", "Tutup dan kembali ke website");
  card.appendChild(closeBtn);

  var adminForm = make("form", "vx-auth__pane");
  adminForm.id = "vx-auth-pane-admin";

  var headRow = make("div", "vx-auth__head");
  var adminBadge = make("span", "vx-auth__badge");
  adminBadge.appendChild(makeIcon("lock"));
  headRow.appendChild(adminBadge);
  var headText = make("div", "vx-auth__htxt");
  var adminTitle = make("h2", "", "Login Admin");
  adminTitle.id = "vx-auth-admin-title";
  headText.appendChild(adminTitle);
  headText.appendChild(make("p", "vx-auth__sub", isDemo
    ? "Masukkan kata sandi demo untuk membuka Dashboard simulasi."
    : "Gunakan akun admin untuk membuka Dashboard pemantauan."));
  headRow.appendChild(headText);
  adminForm.appendChild(headRow);

  var status = make("p", "vx-auth__flash", "");
  status.id = "vx-auth-status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  adminForm.appendChild(status);

  function makeField(form, labelText, name, type, autocomplete, minLength, maxLength) {
    var field = make("div", "vx-auth__field");
    var label = make("label", "vx-auth__label", labelText);
    var wrap = make("div", "vx-auth__input-wrap");
    var input = make("input", "vx-auth__input");
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
    wrap.appendChild(input);
    field.appendChild(wrap);
    form.appendChild(field);
    return { input: input, wrap: wrap };
  }

  var username = null;
  if (!isDemo) {
    var uField = makeField(adminForm, "Username", "admin-username", "text", "username", 3, 32);
    username = uField.input;
    username.autocapitalize = "none";
    username.spellcheck = false;
  }
  var pField = makeField(adminForm, isDemo ? "Kata sandi demo" : "Kata sandi", "admin-password", "password", isDemo ? "off" : "current-password", 1, 128);
  var password = pField.input;
  password.autocapitalize = "none";

  var eye = make("button", "vx-auth__eye", "");
  eye.type = "button";
  eye.setAttribute("aria-label", "Tampilkan kata sandi");
  eye.setAttribute("aria-pressed", "false");
  eye.appendChild(makeIcon("eye"));
  pField.wrap.appendChild(eye);

  var actions = make("div", "vx-auth__actions");
  var backBtn = make("button", "vx-auth__button vx-auth__button--ghost", "Batal");
  backBtn.type = "button";
  var adminSubmit = make("button", "vx-auth__button vx-auth__button--primary", "Masuk ke Dashboard");
  adminSubmit.type = "submit";
  actions.appendChild(backBtn);
  actions.appendChild(adminSubmit);
  adminForm.appendChild(actions);

  card.appendChild(adminForm);
  dialog.appendChild(card);
  document.body.appendChild(dialog);

  var navbar = document.getElementById("lg");
  var logout = make("button", "lg__logout", "Keluar");
  logout.type = "button";
  logout.title = "Keluar dari sesi Admin";
  logout.setAttribute("aria-label", "Keluar dari akun");
  logout.hidden = true;
  logout.addEventListener("click", function () {
    logout.disabled = true;
    var finish = function () {
      if (location.hash === "#dashboard") location.hash = "#beranda";
      return becomeGuest();
    };
    if (isDemo) {
      try { window.sessionStorage.removeItem(demoSessionKey); } catch (e) {}
      finish().then(function () { logout.disabled = false; });
      return;
    }
    request("auth/logout", { method: "POST" }).then(finish).catch(function () {
      try { window.sessionStorage.removeItem(demoSessionKey); } catch (e) {}
      return finish();
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
    var isAdmin = state.authenticated && state.role === "admin";
    logout.hidden = !isAdmin;
    document.querySelectorAll('[data-vx-admin-badge]').forEach(function (el) {
      el.hidden = !isAdmin;
    });
    dialog.hidden = !forceOpen;
    document.body.classList.toggle("vx-auth-open", !dialog.hidden);
  }

  function setStatus(message, isError) {
    status.textContent = message;
    status.hidden = !message;
    status.classList.toggle("is-error", !!isError);
    status.classList.toggle("is-demo", isDemo && !!message && !isError);
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
    resetForm();
    forceOpen = true;
    updateUi();
    setStatus(isDemo
      ? "Mode Demo — gunakan kata sandi demo untuk membuka Dashboard simulasi."
      : "", false);
    window.setTimeout(function () {
      (username || password).focus();
    }, 30);
  }

  function closeLogin() {
    if (dialog.hidden) return;
    forceOpen = false;
    resetForm();
    updateUi();
    if (lastFocus && lastFocus.focus) lastFocus.focus();
    lastFocus = null;
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

  function enterDemo(role) {
    try { window.sessionStorage.setItem(demoSessionKey, role); } catch (e) {}
    setState({ authenticated: true, role: role, displayName: "Admin Demo", offline: true });
    openDashboard();
  }

  backBtn.addEventListener("click", closeLogin);
  closeBtn.addEventListener("click", closeLogin);
  dialog.addEventListener("mousedown", function (e) {
    if (e.target === dialog) closeLogin();
  });

  adminForm.addEventListener("submit", function (event) {
    event.preventDefault();
    if (!adminForm.reportValidity()) return;
    if (isDemo) {
      if (password.value !== demoAdminPassword) {
        password.value = "";
        password.setAttribute("aria-invalid", "true");
        setStatus("Kata sandi demo salah. Silakan coba lagi.", true);
        password.focus();
        return;
      }
      password.value = "";
      password.removeAttribute("aria-invalid");
      enterDemo("admin");
      return;
    }
    var enteredPass = password.value;
    adminSubmit.disabled = true;
    setStatus("Memproses login...", false);
    request("auth/admin", { method: "POST", body: JSON.stringify({ username: username ? username.value.trim() : "admin", password: enteredPass }) })
      .then(function (result) {
        setState(result);
        openDashboard();
      })
      .catch(function (error) {
        if (enteredPass === demoAdminPassword) {
          isDemo = true;
          window.VX_DEMO_MODE = true;
          enterDemo("admin");
          return;
        }
        state.offline = true;
        setStatus(error.message, true);
      })
      .then(function () {
        adminSubmit.disabled = false;
        password.value = "";
      });
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
    if (status.classList.contains("is-error")) {
      setStatus(isDemo ? "Mode Demo — gunakan kata sandi demo untuk membuka Dashboard simulasi." : "", false);
    }
  });

  document.addEventListener("click", function (event) {
    var button = event.target.closest && event.target.closest("[data-vx-admin-login]");
    if (!button) return;
    event.preventDefault();
    if (state.authenticated && state.role === "admin") location.hash = "#dashboard";
    else showLogin();
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !dialog.hidden) closeLogin();
  });

  var ready;
  if (isDemo) {
    var demoRole = null;
    try { demoRole = window.sessionStorage.getItem(demoSessionKey); } catch (e) {}
    state.authenticated = true;
    state.role = demoRole === "admin" ? "admin" : "guest";
    state.displayName = demoRole === "admin" ? "Admin Demo" : "";
    state.offline = true;
    forceOpen = false;
    dispatchState();
    ready = Promise.resolve(snapshot());
  } else {
    ready = request("auth/me").then(function (result) {
      if (result && result.authenticated === true) {
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
      if (isDemo || state.offline) return Promise.resolve(null);
      return request("track", { method: "POST", body: JSON.stringify({ page: page }) });
    },
    showLogin: showLogin,
    expire: function () {
      try { window.sessionStorage.removeItem(demoSessionKey); } catch (e) {}
      becomeGuest().then(function () {
        showLogin();
        setStatus("Sesi berakhir. Silakan masuk kembali.", true);
      });
    },
    url: function (path) { return apiBase + "/api/" + path; }
  };
  updateUi();
})();
