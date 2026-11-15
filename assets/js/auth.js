(function () {
  var apiBase = String(window.VX_API_BASE || "").replace(/\/+$/, "");
  var state = { authenticated: false, role: null, displayName: "", offline: false };
  var forceOpen = false;

  function make(tag, className, text) {
    var element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function request(path, options) {
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
  var card = make("div", "vx-auth__card");
  var eyebrow = make("p", "vx-auth__eyebrow", "VORTEX HYDRO");
  var title = make("h1", "vx-auth__title", "Masuk ke Vortex Hydro");
  title.id = "vx-auth-title";
  var intro = make("p", "vx-auth__intro", "Silakan masuk untuk melihat halaman situs.");
  var tabs = make("div", "vx-auth__tabs");
  tabs.setAttribute("role", "tablist");
  tabs.setAttribute("aria-label", "Jenis login");
  var guestTab = make("button", "vx-auth__tab", "Masuk sebagai Tamu");
  guestTab.type = "button";
  guestTab.setAttribute("role", "tab");
  guestTab.setAttribute("aria-selected", "true");
  guestTab.setAttribute("aria-controls", "vx-auth-guest");
  var adminTab = make("button", "vx-auth__tab", "Admin");
  adminTab.type = "button";
  adminTab.setAttribute("role", "tab");
  adminTab.setAttribute("aria-selected", "false");
  adminTab.setAttribute("aria-controls", "vx-auth-admin");
  tabs.appendChild(guestTab);
  tabs.appendChild(adminTab);

  function makeField(form, labelText, name, type, autocomplete, minLength, maxLength) {
    var field = make("div", "vx-auth__field");
    var label = make("label", "", labelText);
    var input = make("input");
    input.name = name;
    input.type = type;
    input.autocomplete = autocomplete;
    input.required = true;
    if (minLength) input.minLength = minLength;
    if (maxLength) input.maxLength = maxLength;
    label.htmlFor = "vx-auth-" + name;
    input.id = label.htmlFor;
    field.appendChild(label);
    field.appendChild(input);
    form.appendChild(field);
    return input;
  }

  var guestForm = make("form", "vx-auth__form");
  guestForm.id = "vx-auth-guest";
  guestForm.setAttribute("role", "tabpanel");
  guestForm.setAttribute("aria-labelledby", "vx-auth-title");
  guestForm.appendChild(make("p", "vx-auth__hint", "Nama 2–30 karakter. Kata sandi tidak diperlukan."));
  var guestName = makeField(guestForm, "Nama", "guest-name", "text", "nickname", 2, 30);
  guestName.placeholder = "Nama Anda";
  var guestSubmit = make("button", "vx-auth__submit", "Masuk sebagai Tamu");
  guestSubmit.type = "submit";
  guestSubmit.disabled = true;
  guestForm.appendChild(guestSubmit);

  var adminForm = make("form", "vx-auth__form");
  adminForm.id = "vx-auth-admin";
  adminForm.hidden = true;
  adminForm.setAttribute("role", "tabpanel");
  adminForm.setAttribute("aria-labelledby", "vx-auth-title");
  adminForm.appendChild(make("p", "vx-auth__hint", "Gunakan akun admin yang disiapkan oleh pengelola."));
  var username = makeField(adminForm, "Username", "admin-username", "text", "username", 3, 32);
  username.autocapitalize = "none";
  username.spellcheck = false;
  var password = makeField(adminForm, "Kata sandi", "admin-password", "password", "current-password", 1, 128);
  var adminSubmit = make("button", "vx-auth__submit", "Masuk sebagai Admin");
  adminSubmit.type = "submit";
  adminSubmit.disabled = true;
  adminForm.appendChild(adminSubmit);

  var status = make("p", "vx-auth__status", "Memeriksa sesi...");
  status.id = "vx-auth-status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  var cancel = make("button", "vx-auth__cancel", "Kembali sebagai Tamu");
  cancel.type = "button";
  cancel.hidden = true;

  card.appendChild(eyebrow);
  card.appendChild(title);
  card.appendChild(intro);
  card.appendChild(tabs);
  card.appendChild(guestForm);
  card.appendChild(adminForm);
  card.appendChild(status);
  card.appendChild(cancel);
  dialog.appendChild(card);
  document.body.appendChild(dialog);

  var userBadge = make("div", "lg__session");
  userBadge.hidden = true;
  var userMeta = make("span", "lg__session-meta");
  var userName = make("b", "lg__session-name");
  var userRole = make("small", "lg__session-role");
  userMeta.appendChild(userName);
  userMeta.appendChild(userRole);
  var logout = make("button", "lg__session-logout", "Keluar");
  logout.type = "button";
  logout.addEventListener("click", function () {
    logout.disabled = true;
    request("auth/logout", { method: "POST" }).then(function () {
      setState({ authenticated: false, role: null, displayName: "", offline: false });
      setStatus("Anda telah keluar.", false);
    }).catch(function (error) {
      setStatus(error.message + " Sesi tetap aktif sampai server dapat dihubungi.", true);
    }).then(function () {
      logout.disabled = false;
    });
  });
  userBadge.appendChild(userMeta);
  userBadge.appendChild(logout);
  var navbar = document.getElementById("lg");
  if (navbar) navbar.appendChild(userBadge);

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
    userBadge.hidden = !state.authenticated;
    userName.textContent = state.displayName;
    userRole.textContent = state.role === "admin" ? "Admin" : "Tamu";
    if (dashboardLink) dashboardLink.hidden = !(state.authenticated && state.role === "admin");
    cancel.hidden = !state.authenticated;
    dialog.hidden = state.authenticated && !forceOpen;
    document.body.classList.toggle("vx-auth-open", !dialog.hidden);
  }

  function setStatus(message, isError) {
    status.textContent = message;
    status.classList.toggle("is-error", !!isError);
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

  function setTab(mode) {
    var admin = mode === "admin";
    guestTab.setAttribute("aria-selected", String(!admin));
    adminTab.setAttribute("aria-selected", String(admin));
    guestForm.hidden = admin;
    adminForm.hidden = !admin;
    setStatus(state.offline ? "Backend belum terhubung. Periksa server lalu coba lagi." : "", state.offline);
    if (admin) username.focus();
    else guestName.focus();
  }

  function showLogin(mode) {
    forceOpen = true;
    updateUi();
    setTab(mode === "admin" ? "admin" : "guest");
  }

  function submit(form, endpoint, payload, button) {
    button.disabled = true;
    setStatus("Memproses login...", false);
    request(endpoint, { method: "POST", body: JSON.stringify(payload) }).then(function (result) {
      setState(result);
      setStatus("Login berhasil.", false);
    }).catch(function (error) {
      if (!error.status) state.offline = true;
      setStatus(error.message, true);
    }).then(function () {
      button.disabled = false;
      if (form === guestForm) guestName.value = "";
      if (form === adminForm) password.value = "";
    });
  }

  guestTab.addEventListener("click", function () { setTab("guest"); });
  adminTab.addEventListener("click", function () { setTab("admin"); });
  guestForm.addEventListener("submit", function (event) {
    event.preventDefault();
    if (!guestForm.reportValidity()) return;
    submit(guestForm, "auth/guest", { name: guestName.value.trim() }, guestSubmit);
  });
  adminForm.addEventListener("submit", function (event) {
    event.preventDefault();
    if (!adminForm.reportValidity()) return;
    submit(adminForm, "auth/admin", { username: username.value.trim(), password: password.value }, adminSubmit);
  });
  cancel.addEventListener("click", function () {
    forceOpen = false;
    updateUi();
    setStatus("", false);
  });

  document.addEventListener("click", function (event) {
    var button = event.target.closest && event.target.closest("[data-vx-admin-login]");
    if (button) showLogin("admin");
  });

  var ready = request("auth/me").then(function (result) {
    state.authenticated = result.authenticated === true;
    state.role = state.authenticated ? result.role : null;
    state.displayName = state.authenticated ? result.displayName : "";
    state.offline = false;
    forceOpen = false;
    dispatchState();
    guestSubmit.disabled = false;
    adminSubmit.disabled = false;
    if (!state.authenticated) setStatus("Masuk sebagai tamu atau admin untuk melanjutkan.", false);
    if (!state.authenticated) guestName.focus();
    return snapshot();
  }).catch(function (error) {
    state.authenticated = false;
    state.role = null;
    state.displayName = "";
    state.offline = true;
    forceOpen = false;
    dispatchState();
    guestSubmit.disabled = false;
    adminSubmit.disabled = false;
    setStatus("Backend login tidak dapat dihubungi. " + error.message, true);
    return snapshot();
  });

  window.VXAuth = {
    ready: ready,
    state: snapshot,
    request: request,
    track: function (page) {
      return request("track", { method: "POST", body: JSON.stringify({ page: page }) });
    },
    showLogin: showLogin,
    expire: function () {
      setState({ authenticated: false, role: null, displayName: "", offline: false });
      setStatus("Sesi berakhir. Silakan masuk kembali.", true);
    },
    url: function (path) { return apiBase + "/api/" + path; }
  };
  updateUi();
})();
