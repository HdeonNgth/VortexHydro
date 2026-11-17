/* Pengaturan koneksi website ke Firebase Realtime Database.
   Isi databaseURL setelah database dibuat (lihat database/README.md, langkah 2).
   Selama databaseURL kosong, Dashboard memakai simulasi prototipe seperti biasa. */
window.VX_FIREBASE = window.VX_FIREBASE || {
  /* Contoh: "https://vortex-hydro-default-rtdb.asia-southeast1.firebasedatabase.app" */
  databaseURL: "",
  /* Lokasi data di database. Harus sama dengan yang dipakai simulasi 3D. */
  path: "vortexhydro/live"
};
