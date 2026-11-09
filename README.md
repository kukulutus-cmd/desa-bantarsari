# Sistem Informasi Kependudukan Desa Bantarsari

Project terpisah untuk Desa Bantarsari. Salinan awal sengaja tidak membawa data contoh, konfigurasi lokal, metadata GitHub/Vercel lama, atau aset pribadi dari project Kertajaya.

## Status persiapan

- Login menggunakan username dan kata sandi. Email akun hanya dipakai sebagai identitas internal Supabase atau alamat pemulihan opsional.
- Sesi Supabase disimpan dengan cookie melalui `@supabase/ssr`.
- Akses tabel dibatasi dengan Row Level Security berdasarkan profil serta wilayah tugas.
- Tidak ada pendaftaran mandiri atau akun PIN demo. Admin mengelola akun, peran, wilayah, status aktif, dan penggantian kata sandi dari halaman Pengaturan.
- Tidak ada data KK/warga yang di-seed.
- Impor massal, ekspor, dan OCR masih dinonaktifkan.
- Wilayah yang tercantum di `src/lib/territory.ts` masih placeholder. Jangan buat akun petugas atau masukkan data sungguhan sebelum wilayah resmi menggantikannya.
- Skema database baru ada sebagai draft di `supabase/schema.sql`. Belum diterapkan atau ditinjau terhadap project Supabase tujuan.

## Pengaturan lokal

Salin `.env.example` menjadi `.env.local`, lalu sesuaikan nama desa serta URL dan publishable key milik project Supabase desa tujuan:

- `NEXT_PUBLIC_NAMA_DESA`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Publishable key memang digunakan dari browser. Jangan pernah menaruh Supabase secret/service-role key pada variabel `NEXT_PUBLIC_*`, source code, atau GitHub.

Pengelolaan akun memerlukan `SUPABASE_SECRET_KEY` (atau `SUPABASE_SERVICE_ROLE_KEY`) pada environment server. Tambahkan di pengaturan environment Vercel untuk Production dan Preview. Nilainya hanya boleh berasal dari Supabase Dashboard dan jangan dibagikan lewat chat atau commit ke Git.

Instal dependensi, lalu jalankan:

```bash
npm install
npm run dev
```

## Bootstrap database dan akun awal

Langkah ini perlu project Supabase Bantarsari yang benar-benar terpisah dan skemanya sudah ditinjau:

1. Pastikan project tujuan kosong atau sudah ditinjau. Jangan jalankan draft ini pada database yang berisi data tanpa rencana migrasi dan backup.
2. Pastikan skema inti `supabase/schema.sql` sudah diterapkan pada project tujuan.
3. Terapkan migration `supabase/migrations/20261109093859_add_username_login.sql` untuk menambah username dan menyiapkan username admin pertama `adminbantarsari`.
4. Masuk ke aplikasi dengan username admin, isi identitas desa, lalu ganti peta wilayah placeholder dengan dusun/RW/RT resmi sebelum membuat akun petugas.
5. Dari halaman Pengaturan, admin dapat membuat akun petugas, mengatur peran/wilayah, memperbarui username atau kata sandi, serta menonaktifkan/mengaktifkan akun.

Akun baru memakai username untuk login. Email pemulihan bersifat opsional; jika tidak diisi, penggantian kata sandi harus dilakukan oleh admin.

Aplikasi membaca hanya baris yang diizinkan RLS. Memeriksa peran di tampilan bukan pengganti RLS.

## Sebelum data penduduk nyata digunakan

Masih diperlukan: penerapan migration username, konfigurasi secret server di Vercel, pencatatan audit untuk perubahan akun, backup/restore, proses impor yang tervalidasi, kebijakan ekspor, serta uji akses admin/kadus/RW/RT termasuk kasus penolakan lintas wilayah. Jangan masukkan NIK, No. KK, atau dokumen asli sebelum langkah-langkah ini selesai.
