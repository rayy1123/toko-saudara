# Panduan Deploy Toko Saudara ke Vercel & Supabase

> **Dari Pasar ke Rumah — Toko Saudara**

Aplikasi Toko Saudara telah siap 100% untuk dideploy ke **Vercel** dengan backend database cloud **Supabase (PostgreSQL)**.

---

## 1. Setup Backend Supabase (Gratis & Cepat)

1. Buka [https://supabase.com](https://supabase.com) dan login / buat akun.
2. Buat project baru, beri nama misalnya: `toko-saudara-db`.
3. Pilih region terdekat (misal: `Singapore (ap-southeast-1)`).
4. Catat kata sandi database (**Database Password**) yang Anda buat.

### Inisialisasi Database di Supabase
1. Masuk ke menu **SQL Editor** di dashboard Supabase Anda.
2. Buka file `supabase/schema.sql` dari project ini, copy seluruh isinya, paste ke SQL Editor Supabase, lalu klik **RUN**. (Semua tabel, relasi, indeks dibuat dalam 2 detik).
3. Buka file `supabase/seed.sql`, paste ke SQL Editor Supabase, lalu klik **RUN**. (Data awal komoditas sayur, sembako, kategori, area pengiriman, dan kupon promo langsung terisi otomatis).
4. *(Opsional)* Di menu **Storage**, buat bucket baru bernama `toko-saudara` dengan status **Public** untuk upload foto barang.

---

## 2. Ambil Connection String Supabase

Masuk ke **Project Settings** -> **Database**:

1. **Connection String (Transaction Pooler - Port 6543)**
   - Pilih tab **URI** & mode **Transaction** (port 6543).
   - Formatnya:
     ```text
     postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true
     ```
   - Gunakan ini sebagai nilai **`DATABASE_URL`**.

2. **Connection String (Direct Session - Port 5432)**
   - Pilih mode **Session** (port 5432).
   - Formatnya:
     ```text
     postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
     ```
   - Gunakan ini sebagai nilai **`DIRECT_URL`**.

3. **Supabase API Keys**
   - Masuk ke **Project Settings** -> **API**:
   - Salin **Project URL** -> untuk `NEXT_PUBLIC_SUPABASE_URL`
   - Salin **anon public** key -> untuk `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Salin **service_role secret** key -> untuk `SUPABASE_SERVICE_ROLE_KEY`

---

## 3. Langkah Deploy ke Vercel (1-Click Deploy)

1. Pastikan kode Anda sudah di-push ke GitHub repository Anda:
   ```bash
   git add .
   git commit -m "Siap deploy ke Vercel dan Supabase"
   git push origin master
   ```

2. Buka [https://vercel.com](https://vercel.com) dan klik **Add New...** -> **Project**.
3. Pilih repository `toko-saudara` Anda dan klik **Import**.
4. Di bagian **Environment Variables**, tambahkan variabel berikut:

| Nama Variabel | Nilai / Keterangan |
|---|---|
| `DATABASE_URL` | Supabase Pooler URI (port 6543 dengan `?pgbouncer=true`) |
| `DIRECT_URL` | Supabase Direct Session URI (port 5432) |
| `NEXT_PUBLIC_SUPABASE_URL` | URL Supabase Project Anda |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role secret key |
| `JWT_SECRET` | String acak pengaman JWT (misal: `toko-saudara-prod-secret-2026`) |
| `NODE_ENV` | `production` |

5. Klik tombol **Deploy**!
6. Vercel akan otomatis menjalankan `prisma generate` dan `next build`. Dalam ~1 menit toko online Anda langsung live dengan HTTPS gratis, CDN global Vercel, dan database cloud Supabase!

---

## 4. Beralih ke Supabase di Local Development (Opsional)

Jika ingin menjalankan server lokal langsung terkoneksi ke Supabase cloud:

1. Ganti provider schema menjadi postgresql:
   - Salin isi `prisma/schema.supabase.prisma` ke `prisma/schema.prisma`
2. Isi `DATABASE_URL` dan `DIRECT_URL` Supabase Anda di file `.env`.
3. Jalankan:
   ```bash
   npx prisma generate
   npm run dev
   ```
Toko Saudara lokal Anda akan langsung terhubung ke database cloud Supabase!
