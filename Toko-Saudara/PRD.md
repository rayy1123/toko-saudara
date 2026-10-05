# Toko Saudara — Product Requirements Document

## 1. Product Identity

**Nama:** Toko Saudara  
**Tagline:** Dari Pasar ke Rumah  
**Konsep:** Toko sembako online dengan pengalaman pasar tradisional yang dibuat modern.

Toko Saudara adalah **single-store commerce platform**, bukan marketplace multi-vendor.

## 2. Product Vision

Membuat pelanggan dapat membeli kebutuhan dapur dan hasil bumi dari toko lokal tanpa harus datang langsung, tetapi tetap mempertahankan rasa belanja di toko/pasar tradisional: produk segar, harga harian, satuan fleksibel, paket kebutuhan, dan hubungan dekat dengan pelanggan.

## 3. Target Users

### Customer
Rumah tangga, anak kos, pekerja, dan pelanggan toko lokal.

### Admin
Pemilik toko dan pegawai.

### Courier
Petugas pengiriman, opsional pada MVP.

## 4. Core Problems

Customer:
- harus datang ke toko;
- tidak tahu stok/harga sebelum datang;
- repeat order manual;
- tidak punya riwayat belanja yang nyaman.

Toko:
- pencatatan order manual;
- stok sulit dilacak;
- harga hasil bumi berubah;
- sulit melihat produk terlaris;
- pengiriman belum terorganisir.

## 5. Product Goals

1. Customer dapat belanja dari rumah.
2. Harga dan stok dikelola terpusat.
3. Order dapat diproses admin dari satu dashboard.
4. Inventory memiliki histori perubahan.
5. Repeat order mudah.
6. Sistem aman terhadap manipulasi harga, stok, ownership, dan status order.
7. MVP cukup sederhana untuk benar-benar dibangun dan dipakai.

## 6. Product Scope

### Customer
- landing/home;
- kategori;
- search;
- product detail;
- pilihan satuan;
- cart;
- alamat;
- checkout;
- pembayaran;
- order history;
- order tracking;
- repeat order;
- profil.

### Admin
- dashboard;
- category management;
- product management;
- unit/variant;
- price management;
- inventory;
- orders;
- customers;
- delivery;
- promotion;
- bundles;
- reports.

### Courier
- daftar tugas;
- detail pengiriman;
- update status.

## 7. Product Differentiators

### Harga Hari Ini
Harga aktif dapat berubah berdasarkan waktu/periode.

### Produk Segar
Produk dapat menampilkan tanggal panen, kondisi, sumber, dan catatan.

### Satuan Tradisional
Gram, kilogram, liter, botol, pcs, ikat, rak, dan satuan custom.

### Paket Hemat
Bundle kebutuhan rumah tangga.

### Belanja Lagi
Satu klik untuk mengulangi order lama.

### Nuansa Pasar
Visual menggunakan bahasa dan pola belanja yang familiar bagi pelanggan toko tradisional.

## 8. Product Categories

- Beras & Bahan Pokok
- Minyak & Gula
- Tepung
- Sayur
- Buah
- Bumbu Dapur
- Telur
- Tahu & Tempe
- Hasil Bumi
- Makanan Kering
- Minuman
- Paket Hemat

Admin dapat menambah/mengubah kategori.

## 9. Order Lifecycle

`PENDING_PAYMENT`
→ `PAID`
→ `PROCESSING`
→ `READY_FOR_PICKUP`
→ `OUT_FOR_DELIVERY`
→ `DELIVERED`

Alternative:
- `CANCELLED`
- `REFUNDED`

## 10. Business Rules

1. Harga final dihitung backend.
2. Stok final dihitung backend.
3. Customer hanya dapat melihat order miliknya.
4. Admin hanya dapat melakukan aksi sesuai role.
5. Perubahan inventory harus tercatat.
6. Order menyimpan snapshot nama produk, unit, dan harga.
7. Produk nonaktif tidak dapat dibeli baru.
8. Checkout menggunakan transaction.
9. Order status hanya boleh berpindah melalui transition yang valid.
10. Customer tidak boleh menentukan discount, shipping fee, grand total, atau status pembayaran.

## 11. MVP Non-Goals

- marketplace multi-vendor;
- loyalty kompleks;
- AI recommendation;
- live chat;
- ERP/accounting penuh;
- native Android/iOS terpisah;
- integrasi banyak ekspedisi.

## 12. Success Metrics

- orders/day;
- average order value;
- repeat order rate;
- conversion rate;
- cancellation rate;
- stock-out rate;
- delivery completion rate;
- checkout success rate.

## 13. Acceptance Criteria

MVP dapat dianggap siap jika:
- customer dapat mendaftar/login;
- katalog dapat dijelajahi;
- produk dapat dibeli dengan satuan;
- checkout menghasilkan order yang valid;
- harga dihitung server;
- stok divalidasi server;
- admin dapat memproses order;
- customer dapat melihat status order;
- repeat order berjalan;
- inventory memiliki ledger;
- authorization test lulus;
- lint/typecheck/test lulus.
