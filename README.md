# Sistem Informasi Kependudukan Desa Bantarsari

Project terpisah untuk Desa Bantarsari. Salinan awal sengaja tidak membawa data contoh, konfigurasi lokal, metadata GitHub/Vercel lama, atau aset pribadi dari project Kertajaya.

## Status persiapan

- Login menggunakan Supabase Auth dengan email dan kata sandi.
- Sesi Supabase disimpan dengan cookie melalui `@supabase/ssr`.
- Akses tabel dibatasi dengan Row Level Security berdasarkan profil serta wilayah tugas.
- Tidak ada pendaftaran mandiri atau akun PIN demo.
- Tidak ada data KK/warga yang di-seed.
- Impor massal, ekspor, OCR, dan pengelolaan akun dari aplikasi dinonaktifkan sampai alur aman diselesaikan.
- Wilayah yang tercantum di `src/lib/territory.ts` masih placeholder. Jangan buat akun petugas atau masukkan data sungguhan sebelum wilayah resmi menggantikannya.
- Skema database baru ada sebagai draft di `supabase/schema.sql`. Belum diterapkan atau ditinjau terhadap project Supabase tujuan.

## Pengaturan lokal

Salin `.env.example` menjadi `.env.local`, lalu sesuaikan nama desa serta URL dan publishable key milik project Supabase desa tujuan:

- `NEXT_PUBLIC_NAMA_DESA`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Publishable key memang digunakan dari browser. Jangan pernah menaruh Supabase secret/service-role key pada variabel `NEXT_PUBLIC_*`, source code, atau GitHub.

Instal dependensi, lalu jalankan:

```bash
npm install
npm run dev
```

## Bootstrap database dan akun awal

Langkah ini perlu project Supabase Bantarsari yang benar-benar terpisah dan skemanya sudah ditinjau:

1. Pastikan project tujuan kosong atau sudah ditinjau. Jangan jalankan draft ini pada database yang berisi data tanpa rencana migrasi dan backup.
2. Tinjau `supabase/schema.sql`, lalu terapkan melalui prosedur migration yang disetujui.
3. Buat akun admin pertama melalui Supabase Auth.
4. Tambahkan baris `profiles` dengan UUID yang sama dengan akun Auth, `role='admin'`, dan `active=true`.
5. Masuk ke aplikasi, isi identitas desa, lalu ganti peta wilayah placeholder dengan dusun/RW/RT resmi sebelum membuat akun petugas.
6. Buat akun Auth terpisah untuk setiap petugas dan tetapkan peran serta wilayahnya melalui prosedur admin yang diaudit.

Aplikasi membaca hanya baris yang diizinkan RLS. Memeriksa peran di tampilan bukan pengganti RLS.

## Sebelum data penduduk nyata digunakan

Masih diperlukan: tinjauan skema dan RLS pada project yang tepat, alur provisioning/nonaktif akun yang aman, pencatatan audit, backup/restore, proses impor yang tervalidasi, kebijakan ekspor, serta uji akses admin/kadus/RW/RT termasuk kasus penolakan lintas wilayah. Jangan masukkan NIK, No. KK, atau dokumen asli sebelum langkah-langkah ini selesai.
