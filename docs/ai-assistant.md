# Vortex Hydro AI Assistant

Asisten AI di pojok kiri bawah situs. Frontend (vanilla JS) -> Edge Function `chat-with-ai` -> Supabase DB -> Google Gemini -> DB -> Frontend. Kunci Gemini hanya ada di server.

## File
- `assets/js/ai-assistant.js`, `assets/css/ai-assistant.css`, `assets/js/ai-config.js` (frontend)
- `supabase/functions/chat-with-ai/index.ts` (backend)
- `supabase/migrations/create_ai_assistant_tables.sql` (tabel `conversations`, `messages`, RLS)

## Alur
1. Browser membuat token acak (`crypto.randomUUID`) di localStorage. Server hanya menyimpan SHA-256 token itu.
2. Tiap permintaan membawa token. Fungsi memeriksa kepemilikan percakapan (token hash + id) sebelum membaca/menulis.
3. Pesan pengguna disimpan (`pending`), 12 pesan terakhir dikirim ke Gemini bersama system prompt, jawaban disimpan (`completed`). Jika Gemini gagal, pesan pengguna ditandai `error`, tidak ada jawaban palsu yang disimpan.
4. Tabel memakai RLS tanpa policy untuk anon/authenticated; semua akses lewat service role di Edge Function.

Aksi API (POST JSON): `send`, `list`, `history`, `rename`, `delete`.

## Konfigurasi manual (wajib)
1. Buat API key di Google AI Studio.
2. Set secret: `supabase secrets set GEMINI_API_KEY=... GEMINI_MODEL=gemini-3.8-flash --project-ref gzzwjmcedymcdazckgbc` (atau Dashboard > Edge Functions > Secrets).
3. Tanpa `GEMINI_API_KEY`, fungsi membalas `not_configured` dan UI menampilkan pesan error yang jelas.
4. Model dapat diganti lewat `GEMINI_MODEL` tanpa mengubah frontend. Untuk beberapa model sekaligus, isi secret `GEMINI_MODELS` dengan daftar dipisah koma (contoh `gemini-4-hydrogen,gemini-3.6-flash`); dicoba berurutan sampai ada yang berhasil. Cek https://ai.google.dev/gemini-api/docs/models bila model dihentikan.

## Deploy
- Migrasi: jalankan `supabase/migrations/create_ai_assistant_tables.sql` (SQL Editor atau `supabase db push`).
- Fungsi: `supabase functions deploy chat-with-ai --no-verify-jwt --project-ref gzzwjmcedymcdazckgbc`. JWT dimatikan karena fungsi memakai token sesi sendiri dan origin allowlist.

## Batasan saat ini
- Respons tidak di-stream; jawaban penuh disimpan lalu ditampilkan dengan animasi mengetik.
- Rate limit hanya best-effort (memori per instance, 20 permintaan/menit).
- Belum ada knowledge base/RAG; AI hanya tahu fakta situs yang tertulis di system prompt.
- `user_id` pada `conversations` disiapkan untuk Supabase Auth, belum dipakai.

## Checklist uji
- [ ] Buka panel, kirim pesan, jawaban muncul
- [ ] Baris baru di tabel `messages` (user dan assistant)
- [ ] Pertanyaan lanjutan ("cara kerjanya?") dipahami
- [ ] New Chat membuat percakapan baru; refresh tidak menghilangkan riwayat
- [ ] Riwayat: buka, ganti judul, hapus
- [ ] Browser lain tidak bisa membuka percakapan ini
- [ ] Tidak ada API key di sumber halaman
- [ ] Desktop dan HP tanpa scroll horizontal
