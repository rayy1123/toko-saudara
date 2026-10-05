-- ===============================================================
-- TOKO SAUDARA — SUPABASE POSTGRESQL SEED DATA
-- ===============================================================

-- 1. Users (Passwords: AdminSaudara123! and Pelanggan123!)
INSERT INTO "User" ("id", "email", "phone", "passwordHash", "role", "status")
VALUES
  ('usr-admin-01', 'admin@tokosaudara.id', '081234567890', '$2b$10$w3U6vDkmM2lqR5Wd0z1eEuZfWJtTf2jT2S7h8m0A9B0C1D2E3F4G.', 'ADMIN', 'ACTIVE'),
  ('usr-cust-01', 'ibu.siti@gmail.com', '081987654321', '$2b$10$w3U6vDkmM2lqR5Wd0z1eEuZfWJtTf2jT2S7h8m0A9B0C1D2E3F4G.', 'CUSTOMER', 'ACTIVE')
ON CONFLICT ("email") DO NOTHING;

INSERT INTO "CustomerProfile" ("id", "userId", "name", "phone")
VALUES
  ('prof-admin-01', 'usr-admin-01', 'Bang Saudara (Admin Toko)', '081234567890'),
  ('prof-cust-01', 'usr-cust-01', 'Ibu Siti Rahmawati', '081987654321')
ON CONFLICT ("userId") DO NOTHING;

-- 2. Delivery Areas (Bandung)
INSERT INTO "DeliveryArea" ("id", "name", "shippingFee", "minOrderAmount", "isActive")
VALUES
  ('area-1', 'Kecamatan Sukasari, Bandung', 8000, 30000, true),
  ('area-2', 'Kecamatan Coblong, Bandung', 10000, 35000, true),
  ('area-3', 'Kecamatan Cicendo, Bandung', 12000, 40000, true),
  ('area-4', 'Kecamatan Andir, Bandung', 15000, 50000, true)
ON CONFLICT DO NOTHING;

-- 3. Categories
INSERT INTO "Category" ("id", "name", "slug", "sortOrder")
VALUES
  ('cat-1', 'Sayur Segar', 'sayur-segar', 1),
  ('cat-2', 'Bumbu Dapur', 'bumbu-dapur', 2),
  ('cat-3', 'Beras & Sembako', 'beras-sembako', 3),
  ('cat-4', 'Telur, Tahu & Tempe', 'telur-tahu-tempe', 4),
  ('cat-5', 'Buah-Buahan', 'buah-buahan', 5),
  ('cat-6', 'Paket Hemat Dapur', 'paket-hemat', 6)
ON CONFLICT ("slug") DO NOTHING;

-- 4. Products & Units
INSERT INTO "Product" ("id", "categoryId", "sku", "name", "slug", "description", "imageUrl", "isFresh", "harvestInfo", "isActive")
VALUES
  ('prod-1', 'cat-1', 'SAY-BAY-001', 'Bayam Hijau Segar', 'bayam-hijau-segar', 'Bayam cabut daun segar pilihan bebas pestisida berlebih dari kebun Ciwidey.', 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=600&auto=format&fit=crop', true, 'Panen subuh tadi pk 04.30 WIB', true),
  ('prod-2', 'cat-2', 'BUM-CBK-001', 'Cabai Merah Keriting', 'cabai-merah-keriting', 'Cabai merah keriting pedas segar padat dan tahan lama.', 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600&auto=format&fit=crop', true, 'Hasil bumi petani Garut', true),
  ('prod-3', 'cat-3', 'SMB-BRS-001', 'Beras Pandan Wangi Cianjur', 'beras-pandan-wangi-cianjur', 'Beras alami pulen dan wangi khas Cianjur tanpa pengawet.', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop', false, 'Kualitas beras super pilihan', true),
  ('prod-4', 'cat-3', 'SMB-MYK-002', 'Minyak Goreng Sawit Pouch 2L', 'minyak-goreng-sawit-2l', 'Minyak goreng bening murni 2x penyaringan.', 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop', false, 'Kemasan pouch 2 Liter higienis', true),
  ('prod-5', 'cat-4', 'LAK-TLR-001', 'Telur Ayam Negeri Segar', 'telur-ayam-negeri-segar', 'Telur ayam ras negeri segar langsung dari peternak lokal.', 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=600&auto=format&fit=crop', true, 'Segar datang setiap hari', true)
ON CONFLICT ("sku") DO NOTHING;

INSERT INTO "ProductUnit" ("id", "productId", "unitName", "unitCode", "quantityValue", "quantityUnit", "price", "costPrice", "stockQuantity", "lowStockThreshold", "isActive")
VALUES
  ('unit-1', 'prod-1', '1 Ikat (±250g)', 'ikat', 1.0, 'ikat', 3500, 2000, 45, 5, true),
  ('unit-2', 'prod-2', '1 Kilogram', 'kg', 1.0, 'kg', 44000, 35000, 15, 4, true),
  ('unit-3', 'prod-2', '250 Gram (1/4 kg)', 'g', 250.0, 'g', 12000, 9000, 30, 5, true),
  ('unit-4', 'prod-3', 'Karung 5 Kilogram', 'karung', 5.0, 'kg', 78000, 68000, 30, 5, true),
  ('unit-5', 'prod-4', 'Pouch 2 Liter', 'pouch', 2.0, 'liter', 34500, 31000, 28, 5, true),
  ('unit-6', 'prod-5', '1 Kilogram (±16 butir)', 'kg', 1.0, 'kg', 28500, 24000, 25, 5, true)
ON CONFLICT DO NOTHING;

-- 5. Promotions (including specific item promo for LANGGANAN)
INSERT INTO "Promotion" ("id", "name", "code", "type", "value", "minOrderAmount", "maxDiscount", "scope", "isActive")
VALUES
  ('promo-1', 'Diskon Khusus Pelanggan Langganan', 'LANGGANAN', 'FIXED', 0, 25000, NULL, 'SPECIFIC_ITEMS', true),
  ('promo-2', 'Promo Belanja Pertama Pasar Pagi', 'PASARPAGI', 'PERCENTAGE', 10, 50000, 15000, 'ALL', true),
  ('promo-3', 'Potongan Ongkir Toko Saudara', 'HEMATONGKIR', 'FIXED', 5000, 35000, NULL, 'ALL', true)
ON CONFLICT ("code") DO NOTHING;

-- Assign specific item discounts to LANGGANAN promo:
-- Beras 5kg potong Rp 8.000, Minyak 2L potong Rp 4.000, Telur 1kg potong Rp 3.500
INSERT INTO "PromotionItem" ("id", "promotionId", "productUnitId", "discountType", "discountValue")
VALUES
  ('pitem-1', 'promo-1', 'unit-4', 'FIXED', 8000), -- Beras 5kg
  ('pitem-2', 'promo-1', 'unit-5', 'FIXED', 4000), -- Minyak 2L
  ('pitem-3', 'promo-1', 'unit-6', 'FIXED', 3500)  -- Telur 1kg
ON CONFLICT DO NOTHING;
