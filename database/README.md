# Menghubungkan Simulasi 3D ke Website lewat Firebase Realtime Database

Panduan ini menjelaskan cara membuat angka dari simulasi 3D tampil langsung di Dashboard Vortex Hydro.

```
Simulasi 3D  ──(kirim angka tiap 0,2 detik)──▶  Firebase Realtime Database  ──(aliran data langsung)──▶  Dashboard website
```

Jawaban singkatnya: **bisa**. Simulasi 3D hanya perlu mengirim permintaan HTTP ke Firebase. Website membaca perubahan itu secara langsung tanpa memuat ulang halaman.

## Data yang dikirim

Prototipe hanya memantau empat besaran:

| Kolom | Arti | Satuan | Contoh |
|---|---|---|---|
| `debit` | Debit air | L/s | `0.5` |
| `vbat` | Tegangan baterai | Volt | `12.6` |
| `rpmShaft` | Putaran poros utama turbin | RPM | `150` |
| `rpmGen` | Putaran generator | RPM | `330` |
| `ts` | Waktu pengiriman | milidetik sejak 1970 (`Date.now()`) | `1763350000000` |

Aturan penting:

- Semua nilai berupa **angka**, bukan teks. Gunakan **titik** sebagai desimal (`0.5`, bukan `0,5`).
- Kolom `ts` wajib ada dan harus berubah di tiap pengiriman. Dashboard memakainya untuk tahu bahwa data masih masuk. Bila tidak ada pesan baru selama 10 detik, status berubah menjadi OFFLINE.
- Data disimpan di satu lokasi: `vortexhydro/live`. Setiap pengiriman menimpa isinya, jadi isinya selalu pembacaan terbaru. Contoh ada di `simulator/sample-payload.json`.

## Isi folder ini

| File | Fungsi |
|---|---|
| `firebase-config.js` | Tempat Anda mengisi alamat database. Dibaca oleh website. |
| `firebase-live.js` | Kode website yang membaca data Firebase lalu mengirimnya ke Dashboard. |
| `database.rules.json` | Aturan keamanan (disarankan). Semua orang boleh membaca, hanya akun simulator yang boleh menulis. |
| `database.rules.quickstart.json` | Aturan terbuka untuk uji coba cepat. **Jangan dipakai lama.** |
| `firebase.json` | Konfigurasi bila Anda mengunggah rules lewat Firebase CLI. |
| `simulator/vortex-firebase-sender.mjs` | Pengirim JavaScript (browser dan Node.js). Cocok untuk Three.js, Babylon.js, A-Frame. |
| `simulator/send_from_python.py` | Pengirim Python (Blender, PyBullet, dan sejenisnya). |
| `simulator/VortexFirebaseSender.cs` | Pengirim Unity (C#). |
| `simulator/demo-sender.mjs` | Pengirim contoh dengan angka tiruan, untuk menguji website. |
| `tools/mock-rtdb.js` | Firebase palsu di komputer Anda, untuk latihan tanpa akun Firebase. |

## Langkah 1. Uji dulu tanpa Firebase (5 menit)

Langkah ini membuktikan bahwa website dan pengirim bekerja sebelum Anda menyentuh Firebase. Butuh Node.js 18 atau lebih baru.

1. Jalankan database palsu:
   ```bash
   node database/tools/mock-rtdb.js
   ```
2. Jalankan website lokal di terminal lain (dari folder proyek):
   ```bash
   python3 -m http.server 8123
   ```
3. Buka `database/firebase-config.js`, isi `databaseURL: "http://localhost:9000"`, simpan.
4. Buka `http://localhost:8123`, klik logo Vortex Hydro, masuk sebagai admin, lalu buka Dashboard. Statusnya OFFLINE · MENUNGGU DATA.
5. Di terminal ketiga, kirim data contoh:
   ```bash
   node database/simulator/demo-sender.mjs --url http://localhost:9000
   ```
   Dashboard berubah menjadi LIVE · FIREBASE · NORMAL dan angkanya bergerak.
6. Coba gangguan: hentikan pengirim (Ctrl+C), lalu jalankan dengan `--scenario jam`, `leak`, `belt`, `lowbat`, `highbat`, atau `stop`. Status berubah warna dan log kejadian terisi.

Catatan: pada `localhost`, login admin berjalan lewat backend di folder `Upcoming/`. Untuk uji lokal tanpa backend, tambahkan baris `window.VX_DEMO_MODE = true;` di paling atas `database/firebase-config.js` (hanya saat uji, hapus sebelum push). Login demo memakai password yang sama dengan situs publik. Pada alamat `github.io` dan `vercel.app` mode demo sudah aktif otomatis.

## Langkah 2. Buat project dan database Firebase

1. Buka <https://console.firebase.google.com> dan masuk dengan akun Google.
2. Klik **Add project**, beri nama (misalnya `vortex-hydro`). Google Analytics boleh dimatikan.
3. Di menu kiri pilih **Build → Realtime Database → Create Database**.
4. Pilih lokasi. Untuk Indonesia, pilih **Singapore (asia-southeast1)**.
5. Pilih **Start in locked mode** (nanti kita pasang rules sendiri).
6. Setelah database jadi, salin alamat di bagian atas halaman Data. Bentuknya:
   ```
   https://vortex-hydro-default-rtdb.asia-southeast1.firebasedatabase.app
   ```
   Alamat ini adalah `databaseURL`.

## Langkah 3. Pasang rules (aturan akses)

Pilih salah satu.

**A. Cepat untuk belajar (tanpa login).** Buka tab **Rules** di Realtime Database, tempel isi `database.rules.quickstart.json`, lalu klik **Publish**. Siapa pun yang tahu alamat database bisa menulis. Pakai hanya untuk uji beberapa jam, lalu ganti ke pilihan B.

**B. Aman (disarankan).**

1. Buka **Build → Authentication → Get started → Sign-in method**, aktifkan **Email/Password**.
2. Buka tab **Users → Add user**, buat akun simulator:
   - Email: `simulator@vortexhydro.app` (alamat ini tidak perlu benar-benar ada)
   - Password: buat yang kuat, lalu simpan.
3. Buka tab **Rules** di Realtime Database, tempel isi `database.rules.json`, klik **Publish**.
   Jika Anda memakai email lain, ganti `simulator@vortexhydro.app` di file itu dengan email Anda.
4. Ambil **API key**: klik ikon roda gigi → **Project settings** → tab **General** → bagian **Your apps** → tambahkan aplikasi **Web** (ikon `</>`), lalu salin nilai `apiKey`.

Dengan rules ini, siapa pun boleh **membaca** `vortexhydro/live` (website tidak perlu login), tetapi hanya akun simulator yang boleh **menulis**. Rules juga menolak nilai yang bukan angka atau di luar rentang wajar.

## Langkah 4. Hubungkan website

Buka `database/firebase-config.js` dan isi:

```js
window.VX_FIREBASE = window.VX_FIREBASE || {
  databaseURL: "https://vortex-hydro-default-rtdb.asia-southeast1.firebasedatabase.app",
  path: "vortexhydro/live"
};
```

Simpan, lalu commit dan push ke GitHub. Vercel dan GitHub Pages akan memperbarui situs otomatis.

Begitu `databaseURL` terisi, Dashboard tidak lagi memakai simulasi prototipe dan hanya menampilkan data dari Firebase. Kosongkan lagi `databaseURL` untuk kembali ke simulasi.

Data publik: karena website statis, alamat database ada di kode yang bisa dilihat siapa pun, dan rules di atas mengizinkan siapa pun membaca. Itu aman selama isinya hanya empat angka ini. Jangan menaruh data pribadi di path yang sama.

## Langkah 5. Hubungkan simulasi 3D

Pilih sesuai jenis simulasi Anda.

### JavaScript (Three.js, Babylon.js, A-Frame, atau halaman web lain)

Salin `simulator/vortex-firebase-sender.mjs` ke proyek Anda.

```js
import { VortexFirebaseSender } from "./vortex-firebase-sender.mjs";

const sender = new VortexFirebaseSender({
  databaseURL: "https://vortex-hydro-default-rtdb.asia-southeast1.firebasedatabase.app",
  apiKey: "API_KEY_DARI_LANGKAH_3",
  email: "simulator@vortexhydro.app",
  password: "PASSWORD_SIMULATOR"
});
await sender.signIn();

function animate() {
  // ... hitung fisika dan gerakkan model 3D ...
  sender.send({
    debit: flowLps,          // L/s
    vbat: batteryVolt,       // Volt
    rpmShaft: shaftRpm,      // RPM poros utama
    rpmGen: generatorRpm     // RPM generator
  });
  requestAnimationFrame(animate);
}
```

`send()` aman dipanggil tiap frame. Pengiriman dibatasi otomatis (bawaan paling cepat tiap 0,2 detik). Peringatan: jangan menaruh password simulator di halaman web yang dipublikasikan ke orang lain. Jalankan simulasi hanya di komputer Anda, atau gunakan pilihan Python atau Unity.

### Python

```python
from send_from_python import VortexFirebaseSender

s = VortexFirebaseSender(
    "https://vortex-hydro-default-rtdb.asia-southeast1.firebasedatabase.app",
    api_key="API_KEY_DARI_LANGKAH_3",
    email="simulator@vortexhydro.app", password="PASSWORD_SIMULATOR")
s.sign_in()

# di dalam loop simulasi
s.send(debit=0.5, vbat=12.6, rpm_shaft=150, rpm_gen=330)
```

Hanya memakai pustaka bawaan Python 3.

### Unity (C#)

1. Salin `simulator/VortexFirebaseSender.cs` ke folder `Assets`.
2. Tambahkan ke sebuah GameObject, isi Database Url, Api Key, Email, dan Password di Inspector.
3. Dari skrip simulasi: `sender.Send(debit, vbat, rpmShaft, rpmGen);`

Catatan: skrip Unity belum diuji di Unity oleh pembuat repo ini. Uji dulu dengan database palsu (Langkah 1) agar jika ada galat, mudah dicari sumbernya. Jika simulasi Anda memakai mesin lain (Godot, Unreal, MATLAB, dan lainnya), prinsipnya sama: kirim `PUT` berisi JSON ke `<databaseURL>/vortexhydro/live.json?auth=<token>`.

### Bahasa atau program lain

Cukup satu permintaan HTTP:

```
PUT https://<databaseURL>/vortexhydro/live.json?auth=<idToken>
Content-Type: application/json

{"debit":0.5,"vbat":12.6,"rpmShaft":150,"rpmGen":330,"ts":1763350000000}
```

`idToken` didapat dengan `POST https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=<apiKey>` berisi `{"email":"...","password":"...","returnSecureToken":true}`. Token berlaku 1 jam dan bisa diperbarui dengan refresh token (lihat contoh di folder `simulator/`). Bila memakai rules quickstart, bagian `?auth=` tidak diperlukan.

## Cara Dashboard menilai kondisi

Dashboard mengubah angka menjadi peringatan berwarna (hijau, kuning, merah) dan mencatatnya di Log kejadian.

| Kondisi | Cara terdeteksi |
|---|---|
| Pompa mati | Debit di bawah 0,03 L/s |
| Turbin macet | Debit mengalir tetapi `rpmShaft` di bawah 8 |
| Dugaan kebocoran | Debit normal tetapi `rpmShaft` di bawah 60% dari yang diharapkan untuk debit itu |
| Sabuk slip atau putus | Perbandingan `rpmGen` terhadap `rpmShaft` turun jauh dari rasio pulley (2,2) |
| Putaran terlalu tinggi | `rpmShaft` di atas 290 (waspada) atau 340 (bahaya) |
| Baterai rendah atau terlalu tinggi | `vbat` di bawah 11,5 V atau 11,0 V, di atas 14,4 V atau 14,8 V |
| Data berhenti masuk | Tidak ada pembaruan selama 10 detik |

Semua ambang ini adalah asumsi untuk skala prototipe. Setelah ada data pengujian, sesuaikan lewat `window.VX_LIMITS` (misalnya di `firebase-config.js`):

```js
window.VX_LIMITS = { ratio: 2.5, rpmWarn: 400, rpmBad: 480, vLowWarn: 11.8 };
```

Nama yang bisa diubah: `flowMin`, `flowLow`, `rpmWarn`, `rpmBad`, `jamRpm`, `ratio`, `ratioWarn`, `ratioBad`, `rpmRef`, `qRef`, `leakFrac`, `vLowWarn`, `vLowBad`, `vHighWarn`, `vHighBad`, `staleMs`. Nilai `rpmRef` adalah RPM poros pada debit acuan `qRef` (L/s) dan dipakai untuk menilai kebocoran, jadi isi dengan hasil ukur prototipe Anda.

## Jika tidak berjalan

| Gejala | Penyebab dan solusi |
|---|---|
| Status tetap OFFLINE · MENUNGGU DATA | Belum ada data masuk. Buka `<databaseURL>/vortexhydro/live.json` di browser. Jika hasilnya `null`, pengirim belum berhasil menulis. |
| Log berisi "Firebase menolak akses" | Rules belum dipublikasikan, atau `.read` bukan `true`. Ulangi Langkah 3. |
| Log berisi "Alamat database tidak ditemukan" | `databaseURL` salah. Salin ulang dari halaman Data Firebase, tanpa garis miring di akhir. |
| Pengirim error 401 atau "Permission denied" | Email, password, atau `apiKey` salah. Email di rules harus sama dengan akun simulator. |
| Pengirim error `Login Firebase gagal: OPERATION_NOT_ALLOWED` | Email/Password belum diaktifkan di Authentication. |
| Nilai di Dashboard selalu 0 | Nama kolom tidak sama. Harus `debit`, `vbat`, `rpmShaft`, `rpmGen` (huruf besar kecil berpengaruh). |
| Angka desimal salah atau data ditolak (Unity, bahasa Indonesia) | Pastikan memakai titik, bukan koma. Skrip Unity sudah memakai `InvariantCulture`. |
| Data tertahan beberapa detik | Normal bila aliran langsung terputus. Dashboard otomatis beralih ke polling 1 detik. |

## Batas dan catatan

- Paket gratis Firebase (Spark) cukup untuk keperluan ini, tetapi memiliki batas unduhan dan koneksi. Kirim sekitar 5 kali per detik sudah lebih dari cukup. Jangan kirim ratusan kali per detik.
- Rules membatasi nilai wajar (misalnya `vbat` 0 sampai 60 V). Ubah di `database.rules.json` bila skala prototipe Anda berbeda.
- Riwayat opsional: pengirim JavaScript dapat menyimpan riwayat ke `vortexhydro/history` bila Anda mengisi `historyEverySec`. Dashboard belum menampilkan riwayat ini, tetapi data bisa diekspor dari konsol Firebase untuk laporan.
- Login admin di situs publik (GitHub Pages dan Vercel) memakai mode demo dan tidak aman. Data Firebase yang dibaca situs bersifat publik, jadi jangan menaruh informasi sensitif.
