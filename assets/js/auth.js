(function () {
  var apiBase = String(window.VX_API_BASE || "").replace(/\/+$/, "");
  var isDemo = window.VX_DEMO_MODE === true;
  var demoSessionKey = "vx-demo-role";
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
  var card = make("div", "vx-auth__card");
  var eyebrow = make("p", "vx-auth__eyebrow", "VORTEX HYDRO");
  var title = make("h1", "vx-auth__title", "Masuk ke Vortex Hydro");
  title.id = "vx-auth-title";
  var intro = make("p", "vx-auth__intro", isDemo
    ? "Mode demo publik. Akses Admin tidak diverifikasi dan Dashboard hanya simulasi."
    : "Pilih akses untuk melanjutkan.");

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

  var choices = make("div", "vx-auth__choices");
  var guestSubmit = make("button", "vx-auth__submit", "Masuk sebagai Tamu");
  guestSubmit.type = "button";
  guestSubmit.disabled = true;
  var adminChoice = make("button", "vx-auth__alternate", "Masuk sebagai Admin");
  adminChoice.type = "button";
  choices.appendChild(guestSubmit);
  choices.appendChild(adminChoice);

  var adminForm = make("form", "vx-auth__form");
  adminForm.id = "vx-auth-admin";
  adminForm.hidden = true;
  adminForm.setAttribute("role", "tabpanel");
  adminForm.setAttribute("aria-labelledby", "vx-auth-title");
  adminForm.appendChild(make("p", "vx-auth__hint", isDemo
    ? "Mode demo: kombinasi username dan kata sandi apa pun diterima. Jangan masukkan kata sandi asli."
    : "Gunakan akun admin yang disiapkan oleh pengelola."));
  var username = makeField(adminForm, "Username", "admin-username", "text", "username", 3, 32);
  username.autocapitalize = "none";
  username.spellcheck = false;
  var password = makeField(adminForm, "Kata sandi", "admin-password", "password", "current-password", 1, 128);
  var adminSubmit = make("button", "vx-auth__submit", "Masuk sebagai Admin");
  adminSubmit.type = "submit";
  adminSubmit.disabled = true;
  adminForm.appendChild(adminSubmit);

  var back = make("button", "vx-auth__back", "Kembali ke pilihan akses");
  back.type = "button";
  back.hidden = true;
  var status = make("p", "vx-auth__status", "Memeriksa sesi...");
  status.id = "vx-auth-status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");

  card.appendChild(eyebrow);
  card.appendChild(title);
  card.appendChild(intro);
  card.appendChild(choices);
  card.appendChild(adminForm);
  card.appendChild(back);
  card.appendChild(status);
  dialog.appendChild(card);
  document.body.appendChild(dialog);

  var navbar = document.getElementById("lg");
  var logout = make("button", "lg__logout", "Keluar");
  logout.type = "button";
  logout.hidden = true;
  logout.addEventListener("click", function () {
    logout.disabled = true;
    if (isDemo) {
      var storageError = null;
      try {
        window.sessionStorage.removeItem(demoSessionKey);
      } catch (error) {
        storageError = error;
      }
      setState({ authenticated: false, role: null, displayName: "", offline: false });
      showChoices();
      setStatus(storageError ? "Sesi demo tidak dapat dihapus: " + storageError.message : "Anda telah keluar.", !!storageError);
      logout.disabled = false;
      return;
    }
    request("auth/logout", { method: "POST" }).then(function () {
      setState({ authenticated: false, role: null, displayName: "", offline: false });
      showChoices();
      setStatus("Anda telah keluar.", false);
    }).catch(function (error) {
      setStatus(error.message + " Sesi tetap aktif sampai server dapat dihubungi.", true);
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
    logout.hidden = !state.authenticated;
    if (dashboardLink) dashboardLink.hidden = !(state.authenticated && state.role === "admin");
    dialog.hidden = state.authenticated && !forceOpen;
    document.body.classList.toggle("vx-auth-open", !dialog.hidden);
  }

  function setStatus(message, isError) {
    status.textContent = message;
    status.classList.toggle("is-error", !!isError);
    status.classList.toggle("is-demo", isDemo && !!message);
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

  function showChoices() {
    choices.hidden = false;
    adminForm.hidden = true;
    back.hidden = true;
    username.value = "";
    password.value = "";
    setStatus(isDemo
      ? "DEMO — jangan gunakan kata sandi asli; login tidak diverifikasi."
      : (state.offline ? "Backend belum terhubung. Periksa server lalu coba lagi." : ""), !isDemo && state.offline);
  }

  function showAdminForm() {
    choices.hidden = true;
    adminForm.hidden = false;
    back.hidden = false;
    setStatus(isDemo
      ? "DEMO — isian tidak diperiksa server dan tidak mengamankan Dashboard."
      : (state.offline ? "Backend belum terhubung. Periksa server lalu coba lagi." : ""), !isDemo && state.offline);
    username.focus();
  }

  function showLogin(mode) {
    forceOpen = true;
    updateUi();
    if (mode === "admin") showAdminForm();
    else showChoices();
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
      if (form === adminForm) password.value = "";
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
    setStatus(storageError
      ? "Mode demo dibuka, tetapi sesi tidak tersimpan: " + storageError.message
      : "Mode demo dibuka. Kredensial tidak diverifikasi.", !!storageError);
  }

  guestSubmit.addEventListener("click", function () {
    if (isDemo) {
      enterDemo("guest");
      return;
    }
    submit(null, "auth/guest", {}, guestSubmit);
  });
  adminChoice.addEventListener("click", showAdminForm);
  adminForm.addEventListener("submit", function (event) {
    event.preventDefault();
    if (!adminForm.reportValidity()) return;
    if (isDemo) {
      password.value = "";
      username.value = "";
      enterDemo("admin");
      return;
    }
    submit(adminForm, "auth/admin", { username: username.value.trim(), password: password.value }, adminSubmit);
  });
  back.addEventListener("click", showChoices);

  document.addEventListener("click", function (event) {
    var button = event.target.closest && event.target.closest("[data-vx-admin-login]");
    if (button) showLogin("admin");
  });

  var ready;
  if (isDemo) {
    var demoRole = null;
    var demoStorageError = null;
    try {
      demoRole = window.sessionStorage.getItem(demoSessionKey);
    } catch (error) {
      demoStorageError = error;
    }
    state.authenticated = demoRole === "guest" || demoRole === "admin";
    state.role = state.authenticated ? demoRole : null;
    state.displayName = "";
    state.offline = true;
    forceOpen = false;
    dispatchState();
    guestSubmit.disabled = false;
    adminSubmit.disabled = false;
    if (!state.authenticated) {
      showChoices();
      if (demoStorageError) setStatus("Sesi demo tidak dapat dipulihkan: " + demoStorageError.message, true);
    }
    ready = Promise.resolve(snapshot());
  } else {
    ready = request("auth/me").then(function (result) {
      state.authenticated = result.authenticated === true;
      state.role = state.authenticated ? result.role : null;
      state.displayName = state.authenticated ? result.displayName : "";
      state.offline = false;
      forceOpen = false;
      dispatchState();
      guestSubmit.disabled = false;
      adminSubmit.disabled = false;
      if (!state.authenticated) {
        showChoices();
        setStatus("Pilih Tamu atau Admin untuk melanjutkan.", false);
      }
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
      showChoices();
      setStatus("Backend login tidak dapat dihubungi. " + error.message, true);
      return snapshot();
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
      setState({ authenticated: false, role: null, displayName: "", offline: false });
      showChoices();
      setStatus("Sesi berakhir. Silakan masuk kembali.", true);
    },
    url: function (path) { return apiBase + "/api/" + path; }
  };
  updateUi();
})();
