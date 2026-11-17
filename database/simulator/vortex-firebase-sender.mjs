/* Pengirim data dari simulasi 3D ke Firebase Realtime Database (REST).
   Bisa dipakai di browser (Three.js, Babylon.js, A-Frame, dll.) dan di Node.js 18 ke atas.

   Contoh pemakaian di simulasi 3D:

     import { VortexFirebaseSender } from "./vortex-firebase-sender.mjs";
     const sender = new VortexFirebaseSender({
       databaseURL: "https://NAMA-PROYEK-default-rtdb.asia-southeast1.firebasedatabase.app",
       apiKey: "API_KEY_WEB_FIREBASE",
       email: "simulator@vortexhydro.app",
       password: "PASSWORD_SIMULATOR"
     });
     await sender.signIn();
     // di dalam loop simulasi (aman dipanggil tiap frame, pengiriman dibatasi otomatis):
     sender.send({ debit: 0.5, vbat: 12.6, rpmShaft: 150, rpmGen: 330 });

   Satuan: debit L/s, vbat Volt, rpmShaft dan rpmGen RPM. Pakai titik untuk desimal. */
export class VortexFirebaseSender {
  constructor(o) {
    this.base = String(o.databaseURL || "").replace(/\/+$/, "");
    this.path = String(o.path || "vortexhydro/live").replace(/^\/+|\/+$/g, "");
    this.apiKey = o.apiKey || "";
    this.email = o.email || "";
    this.password = o.password || "";
    this.minIntervalMs = o.minIntervalMs == null ? 200 : o.minIntervalMs;
    this.historyEverySec = o.historyEverySec || 0;
    this.idToken = null; this.refreshToken = null; this.expiresAt = 0;
    this.lastSent = 0; this.lastHistory = 0; this.busy = false;
    if (!this.base) throw new Error("databaseURL wajib diisi");
  }

  /* Masuk dengan akun simulator. Lewati bila memakai rules quickstart atau mock server. */
  async signIn() {
    if (!this.email) return false;
    if (!this.apiKey) throw new Error("apiKey wajib diisi bila memakai email dan password");
    const r = await fetch("https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=" + this.apiKey, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: this.email, password: this.password, returnSecureToken: true })
    });
    const j = await r.json();
    if (!r.ok) throw new Error("Login Firebase gagal: " + (j.error && j.error.message));
    this._store(j.idToken, j.refreshToken, j.expiresIn);
    return true;
  }
  _store(id, refresh, expires) { this.idToken = id; this.refreshToken = refresh; this.expiresAt = Date.now() + (+expires - 60) * 1000; }
  async _token() {
    if (!this.idToken) return null;
    if (Date.now() < this.expiresAt) return this.idToken;
    const r = await fetch("https://securetoken.googleapis.com/v1/token?key=" + this.apiKey, {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "grant_type=refresh_token&refresh_token=" + encodeURIComponent(this.refreshToken)
    });
    const j = await r.json();
    if (!r.ok) throw new Error("Token Firebase gagal diperbarui: " + (j.error && j.error.message));
    this._store(j.id_token, j.refresh_token, j.expires_in);
    return this.idToken;
  }

  /* Kirim satu pembacaan. Mengembalikan true bila terkirim, false bila dilewati (terlalu cepat). */
  async send(v) {
    const now = Date.now();
    if (this.busy || now - this.lastSent < this.minIntervalMs) return false;
    this.busy = true; this.lastSent = now;
    try {
      const body = {
        debit: round(v.debit), vbat: round(v.vbat),
        rpmShaft: round(v.rpmShaft), rpmGen: round(v.rpmGen), ts: now
      };
      const t = await this._token(), q = t ? "?auth=" + encodeURIComponent(t) : "";
      await put(this.base + "/" + this.path + ".json" + q, "PUT", body);
      if (this.historyEverySec && now - this.lastHistory >= this.historyEverySec * 1000) {
        this.lastHistory = now;
        await put(this.base + "/vortexhydro/history.json" + q, "POST", body);
      }
      return true;
    } finally { this.busy = false; }
  }
}

function round(n) {
  n = Number(n);
  if (!Number.isFinite(n)) throw new Error("Nilai bukan angka: " + n);
  return Math.round(n * 1000) / 1000;
}
async function put(url, method, body) {
  const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error("Firebase menolak data (" + r.status + "): " + (await r.text()));
}
