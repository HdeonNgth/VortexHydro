"""Pengirim data ke Firebase Realtime Database dengan Python 3 (tanpa library tambahan).

Dipakai bila simulasi 3D berupa program Python (Blender, PyBullet, Ursina, dll.).

    from send_from_python import VortexFirebaseSender
    s = VortexFirebaseSender(
        "https://NAMA-PROYEK-default-rtdb.asia-southeast1.firebasedatabase.app",
        api_key="API_KEY_WEB_FIREBASE",
        email="simulator@vortexhydro.app", password="PASSWORD_SIMULATOR")
    s.sign_in()
    s.send(debit=0.5, vbat=12.6, rpm_shaft=150, rpm_gen=330)   # panggil di tiap langkah simulasi

Uji cepat tanpa Firebase (jalankan mock server lebih dulu):
    python database/simulator/send_from_python.py http://localhost:9000
"""
import json
import math
import sys
import time
import urllib.error
import urllib.parse
import urllib.request


class VortexFirebaseSender:
    def __init__(self, database_url, path="vortexhydro/live", api_key="", email="", password="",
                 min_interval=0.2):
        self.base = database_url.rstrip("/")
        self.path = path.strip("/")
        self.api_key, self.email, self.password = api_key, email, password
        self.min_interval = min_interval
        self.id_token = self.refresh_token = None
        self.expires_at = 0.0
        self.last_sent = 0.0

    def _request(self, url, method, payload=None, form=False):
        if form:
            data = urllib.parse.urlencode(payload).encode()
            headers = {"Content-Type": "application/x-www-form-urlencoded"}
        else:
            data = json.dumps(payload).encode() if payload is not None else None
            headers = {"Content-Type": "application/json"}
        req = urllib.request.Request(url, data=data, method=method, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=10) as r:
                return json.loads(r.read().decode() or "null")
        except urllib.error.HTTPError as e:
            raise RuntimeError("Firebase menolak (%s): %s" % (e.code, e.read().decode()))

    def sign_in(self):
        if not self.email:
            return False
        r = self._request("https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key="
                          + self.api_key, "POST",
                          {"email": self.email, "password": self.password, "returnSecureToken": True})
        self._store(r["idToken"], r["refreshToken"], r["expiresIn"])
        return True

    def _store(self, id_token, refresh, expires):
        self.id_token, self.refresh_token = id_token, refresh
        self.expires_at = time.time() + float(expires) - 60

    def _token(self):
        if not self.id_token:
            return None
        if time.time() >= self.expires_at:
            r = self._request("https://securetoken.googleapis.com/v1/token?key=" + self.api_key, "POST",
                              {"grant_type": "refresh_token", "refresh_token": self.refresh_token}, form=True)
            self._store(r["id_token"], r["refresh_token"], r["expires_in"])
        return self.id_token

    def send(self, debit, vbat, rpm_shaft, rpm_gen):
        """Kirim satu pembacaan. Mengembalikan False bila dilewati karena terlalu cepat."""
        now = time.time()
        if now - self.last_sent < self.min_interval:
            return False
        self.last_sent = now
        body = {"debit": round(float(debit), 3), "vbat": round(float(vbat), 3),
                "rpmShaft": round(float(rpm_shaft), 3), "rpmGen": round(float(rpm_gen), 3),
                "ts": int(now * 1000)}
        token = self._token()
        url = "%s/%s.json%s" % (self.base, self.path, "?auth=" + urllib.parse.quote(token) if token else "")
        self._request(url, "PUT", body)
        return True


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit("Pemakaian: python send_from_python.py <databaseURL>")
    sender = VortexFirebaseSender(sys.argv[1], min_interval=0.1)
    t0 = time.time()
    print("Mengirim data contoh ke", sys.argv[1], "(Ctrl+C untuk berhenti)")
    while True:
        t = time.time() - t0
        q = 0.5 + 0.05 * math.sin(t / 4)
        shaft = 150 * (q / 0.5) ** 0.7
        sender.send(q, 12.6 + 0.1 * math.sin(t / 7), shaft, shaft * 2.2)
        time.sleep(0.2)
