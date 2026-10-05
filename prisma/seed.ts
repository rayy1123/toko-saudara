import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Toko Saudara database...");

  // 1. Clean existing records
  await prisma.auditEvent.deleteMany({});
  await prisma.bundleItem.deleteMany({});
  await prisma.bundle.deleteMany({});
  await prisma.promotion.deleteMany({});
  await prisma.delivery.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.orderStatusHistory.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.cartItem.deleteMany({});
  await prisma.cart.deleteMany({});
  await prisma.inventoryMovement.deleteMany({});
  await prisma.priceHistory.deleteMany({});
  await prisma.productUnit.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.address.deleteMany({});
  await prisma.customerProfile.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.deliveryArea.deleteMany({});

  // 2. Users & Profiles
  const adminPassword = await bcrypt.hash("AdminSaudara123!", 10);
  const customerPassword = await bcrypt.hash("Pelanggan123!", 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@tokosaudara.id",
      phone: "081234567890",
      passwordHash: adminPassword,
      role: "ADMIN",
      status: "ACTIVE",
      profile: {
        create: {
          name: "Bang Saudara (Admin)",
          phone: "081234567890",
        },
      },
    },
  });

  const customer = await prisma.user.create({
    data: {
      email: "ibu.siti@gmail.com",
      phone: "081987654321",
      passwordHash: customerPassword,
      role: "CUSTOMER",
      status: "ACTIVE",
      profile: {
        create: {
          name: "Ibu Siti Rahmawati",
          phone: "081987654321",
        },
      },
      addresses: {
        create: [
          {
            label: "Rumah Utama",
            recipientName: "Ibu Siti Rahmawati",
            phone: "081987654321",
            addressLine: "Jl. Sukajadi No. 45, RT 03 / RW 05",
            district: "Sukasari",
            city: "Kota Bandung",
            province: "Jawa Barat",
            postalCode: "40152",
            isDefault: true,
          },
        ],
      },
    },
  });

  // 3. Delivery Areas
  await prisma.deliveryArea.createMany({
    data: [
      { name: "Kecamatan Sukasari, Bandung", shippingFee: 8000, minOrderAmount: 30000, isActive: true },
      { name: "Kecamatan Coblong, Bandung", shippingFee: 10000, minOrderAmount: 35000, isActive: true },
      { name: "Kecamatan Cicendo, Bandung", shippingFee: 12000, minOrderAmount: 40000, isActive: true },
      { name: "Kecamatan Andir, Bandung", shippingFee: 15000, minOrderAmount: 50000, isActive: true },
    ],
  });

  // 4. Promotions
  await prisma.promotion.create({
    data: {
      name: "Diskon Khusus Pelanggan Langganan Setia",
      code: "LANGGANAN",
      type: "PERCENTAGE",
      value: 15,
      minOrderAmount: 30000,
      maxDiscount: 20000,
      isActive: true,
    },
  });

  await prisma.promotion.create({
    data: {
      name: "Promo Pasar Pagi",
      code: "PASARPAGI",
      type: "PERCENTAGE",
      value: 10,
      minOrderAmount: 50000,
      maxDiscount: 15000,
      isActive: true,
    },
  });

  await prisma.promotion.create({
    data: {
      name: "Potongan Ongkir Toko",
      code: "HEMATONGKIR",
      type: "FIXED",
      value: 5000,
      minOrderAmount: 40000,
      isActive: true,
    },
  });

  // 5. Categories
  const catSayur = await prisma.category.create({
    data: { name: "Sayur Segar", slug: "sayur-segar", sortOrder: 1 },
  });
  const catBumbu = await prisma.category.create({
    data: { name: "Bumbu Dapur", slug: "bumbu-dapur", sortOrder: 2 },
  });
  const catSembako = await prisma.category.create({
    data: { name: "Beras & Sembako", slug: "beras-sembako", sortOrder: 3 },
  });
  const catLauk = await prisma.category.create({
    data: { name: "Telur, Tahu & Tempe", slug: "telur-tahu-tempe", sortOrder: 4 },
  });
  const catBuah = await prisma.category.create({
    data: { name: "Buah-Buahan", slug: "buah-buahan", sortOrder: 5 },
  });
  const catPaket = await prisma.category.create({
    data: { name: "Paket Hemat Dapur", slug: "paket-hemat", sortOrder: 6 },
  });

  // Helper to create product with units & stock movements
  async function createProductWithUnits(p: {
    category: any;
    sku: string;
    name: string;
    slug: string;
    desc: string;
    imageUrl?: string;
    isFresh?: boolean;
    harvestInfo?: string;
    units: Array<{
      unitName: string;
      unitCode: string;
      quantityValue: number;
      quantityUnit: string;
      price: number;
      costPrice: number;
      stockQuantity: number;
      lowStockThreshold?: number;
    }>;
  }) {
    const prod = await prisma.product.create({
      data: {
        categoryId: p.category.id,
        sku: p.sku,
        name: p.name,
        slug: p.slug,
        description: p.desc,
        imageUrl: p.imageUrl,
        isFresh: p.isFresh ?? false,
        harvestInfo: p.harvestInfo,
        isActive: true,
      },
    });

    for (const u of p.units) {
      const unit = await prisma.productUnit.create({
        data: {
          productId: prod.id,
          unitName: u.unitName,
          unitCode: u.unitCode,
          quantityValue: u.quantityValue,
          quantityUnit: u.quantityUnit,
          price: u.price,
          costPrice: u.costPrice,
          stockQuantity: u.stockQuantity,
          lowStockThreshold: u.lowStockThreshold ?? 5,
          isActive: true,
        },
      });

      // Price history
      await prisma.priceHistory.create({
        data: {
          productUnitId: unit.id,
          price: u.price,
          createdBy: admin.id,
        },
      });

      // Initial inventory ledger
      await prisma.inventoryMovement.create({
        data: {
          productUnitId: unit.id,
          type: "PURCHASE",
          quantityDelta: u.stockQuantity,
          referenceType: "INITIAL_SEED",
          note: "Stok awal pembukaan toko saudara",
          createdBy: admin.id,
        },
      });
    }
    return prod;
  }

  // Create products
  await createProductWithUnits({
    category: catSayur,
    sku: "SAY-BAY-001",
    name: "Bayam Hijau Segar",
    slug: "bayam-hijau-segar",
    desc: "Bayam cabut daun segar pilihan, bebas pestisida berlebih, segar renyah langsung dari kebun Ciwidey.",
    imageUrl: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=600&auto=format&fit=crop",
    isFresh: true,
    harvestInfo: "Panen subuh tadi pk 04.30 WIB",
    units: [
      { unitName: "1 Ikat (±250g)", unitCode: "ikat", quantityValue: 1, quantityUnit: "ikat", price: 3500, costPrice: 2000, stockQuantity: 45 },
      { unitName: "3 Ikat Hemat", unitCode: "ikat", quantityValue: 3, quantityUnit: "ikat", price: 9500, costPrice: 6000, stockQuantity: 20 },
    ],
  });

  await createProductWithUnits({
    category: catSayur,
    sku: "SAY-KNG-002",
    name: "Kangkung Petik Segar",
    slug: "kangkung-petik-segar",
    desc: "Kangkung akar segar berdaun hijau lebar, cocok untuk tumis terasi gurih hangat keluarga.",
    imageUrl: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop",
    isFresh: true,
    harvestInfo: "Dipetik segar kemarin sore",
    units: [
      { unitName: "1 Ikat (±300g)", unitCode: "ikat", quantityValue: 1, quantityUnit: "ikat", price: 3000, costPrice: 1800, stockQuantity: 50 },
    ],
  });

  await createProductWithUnits({
    category: catBumbu,
    sku: "BUM-CBK-001",
    name: "Cabai Merah Keriting",
    slug: "cabai-merah-keriting",
    desc: "Cabai merah keriting pedas segar, warna merah cerah, tidak berair, padat dan awet.",
    imageUrl: "https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600&auto=format&fit=crop",
    isFresh: true,
    harvestInfo: "Hasil bumi petani Garut",
    units: [
      { unitName: "250 Gram (1/4 kg)", unitCode: "g", quantityValue: 250, quantityUnit: "g", price: 12000, costPrice: 9000, stockQuantity: 30 },
      { unitName: "500 Gram (1/2 kg)", unitCode: "g", quantityValue: 500, quantityUnit: "g", price: 23000, costPrice: 18000, stockQuantity: 20 },
      { unitName: "1 Kilogram", unitCode: "kg", quantityValue: 1, quantityUnit: "kg", price: 44000, costPrice: 35000, stockQuantity: 15 },
    ],
  });

  await createProductWithUnits({
    category: catBumbu,
    sku: "BUM-BWM-002",
    name: "Bawang Merah Brebes Super",
    slug: "bawang-merah-brebes-super",
    desc: "Bawang merah Brebes asli, kering sempurna, wangi pekat, butiran sedang-besar, tahan lama.",
    imageUrl: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop",
    isFresh: false,
    harvestInfo: "Kering gantung kualitas super",
    units: [
      { unitName: "250 Gram", unitCode: "g", quantityValue: 250, quantityUnit: "g", price: 9000, costPrice: 6500, stockQuantity: 40 },
      { unitName: "500 Gram", unitCode: "g", quantityValue: 500, quantityUnit: "g", price: 17500, costPrice: 13000, stockQuantity: 25 },
      { unitName: "1 Kilogram", unitCode: "kg", quantityValue: 1, quantityUnit: "kg", price: 34000, costPrice: 25000, stockQuantity: 15, lowStockThreshold: 4 },
    ],
  });

  await createProductWithUnits({
    category: catBumbu,
    sku: "BUM-BWP-003",
    name: "Bawang Putih Honan Bersih",
    slug: "bawang-putih-honan-bersih",
    desc: "Bawang putih Honan bersih siung besar padat, mudah dikupas untuk masakan harian.",
    imageUrl: "https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?w=600&auto=format&fit=crop",
    units: [
      { unitName: "250 Gram", unitCode: "g", quantityValue: 250, quantityUnit: "g", price: 10000, costPrice: 7500, stockQuantity: 35 },
      { unitName: "500 Gram", unitCode: "g", quantityValue: 500, quantityUnit: "g", price: 19000, costPrice: 15000, stockQuantity: 20 },
      { unitName: "1 Kilogram", unitCode: "kg", quantityValue: 1, quantityUnit: "kg", price: 37000, costPrice: 29000, stockQuantity: 12 },
    ],
  });

  await createProductWithUnits({
    category: catSembako,
    sku: "SMB-BRS-001",
    name: "Beras Pandan Wangi Cianjur",
    slug: "beras-pandan-wangi-cianjur",
    desc: "Beras alami pulen dan wangi alami khas Cianjur, tanpa pemutih, tanpa pengawet sintetis.",
    imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop",
    units: [
      { unitName: "Karung 5 Kilogram", unitCode: "karung", quantityValue: 5, quantityUnit: "kg", price: 78000, costPrice: 68000, stockQuantity: 30 },
      { unitName: "Karung 10 Kilogram", unitCode: "karung", quantityValue: 10, quantityUnit: "kg", price: 154000, costPrice: 135000, stockQuantity: 15 },
    ],
  });

  await createProductWithUnits({
    category: catSembako,
    sku: "SMB-MYK-002",
    name: "Minyak Goreng Sawit Pouch 2L",
    slug: "minyak-goreng-sawit-2l",
    desc: "Minyak goreng bening murni 2 kali penyaringan, renyah untuk menggoreng segala hidangan.",
    imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop",
    units: [
      { unitName: "Pouch 2 Liter", unitCode: "pouch", quantityValue: 2, quantityUnit: "liter", price: 34500, costPrice: 31000, stockQuantity: 28 },
    ],
  });

  await createProductWithUnits({
    category: catLauk,
    sku: "LAK-TLR-001",
    name: "Telur Ayam Negeri Segar",
    slug: "telur-ayam-negeri-segar",
    desc: "Telur ayam ras negeri segar langsung dari peternak lokal, cangkang tebal bersih, kuning telur bulat segar.",
    imageUrl: "https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=600&auto=format&fit=crop",
    isFresh: true,
    harvestInfo: "Segar datang setiap hari",
    units: [
      { unitName: "1/2 Kilogram (±8 butir)", unitCode: "kg", quantityValue: 0.5, quantityUnit: "kg", price: 14500, costPrice: 12000, stockQuantity: 30 },
      { unitName: "1 Kilogram (±16 butir)", unitCode: "kg", quantityValue: 1, quantityUnit: "kg", price: 28500, costPrice: 24000, stockQuantity: 25 },
      { unitName: "1 Tray / Rak (30 butir)", unitCode: "rak", quantityValue: 1, quantityUnit: "rak", price: 54000, costPrice: 46000, stockQuantity: 10 },
    ],
  });

  await createProductWithUnits({
    category: catLauk,
    sku: "LAK-TMP-002",
    name: "Tempe Tradisional Daun Pisang",
    slug: "tempe-tradisional-daun-pisang",
    desc: "Tempe kedelai bungkus daun pisang alami, gurih manis aromatik, kedelai padat berkualitas.",
    imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop",
    isFresh: true,
    harvestInfo: "Dibuat pengrajin tempe lokal tadi malam",
    units: [
      { unitName: "1 Papan Sedang", unitCode: "papan", quantityValue: 1, quantityUnit: "pcs", price: 5000, costPrice: 3500, stockQuantity: 25 },
      { unitName: "Paket 3 Papan", unitCode: "papan", quantityValue: 3, quantityUnit: "pcs", price: 14000, costPrice: 10000, stockQuantity: 10 },
    ],
  });

  await createProductWithUnits({
    category: catPaket,
    sku: "PKT-SOP-001",
    name: "Paket Sayur Sop Komplit",
    slug: "paket-sayur-sop-komplit",
    desc: "Paket siap masak: wortel, kentang, kubis, seledri, daun bawang, dan bumbu racik sop segar.",
    imageUrl: "https://images.unsplash.com/photo-1547592180-85f173990554?w=600&auto=format&fit=crop",
    isFresh: true,
    harvestInfo: "Dipacking higienis setiap pagi",
    units: [
      { unitName: "1 Paket (Porsi 3-4 Orang)", unitCode: "paket", quantityValue: 1, quantityUnit: "paket", price: 12000, costPrice: 8500, stockQuantity: 20 },
    ],
  });

  await createProductWithUnits({
    category: catPaket,
    sku: "PKT-SBL-002",
    name: "Paket Sambal Terasi",
    slug: "paket-sambal-terasi",
    desc: "Paket komplit cabai rawit merah, cabai keriting, bawang merah, tomat rampai segar, dan terasi udang sangrai.",
    imageUrl: "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600&auto=format&fit=crop",
    isFresh: true,
    harvestInfo: "Racikan bumbu subuh pasar",
    units: [
      { unitName: "1 Paket Komplit", unitCode: "paket", quantityValue: 1, quantityUnit: "paket", price: 15000, costPrice: 10000, stockQuantity: 18 },
    ],
  });

  await createProductWithUnits({
    category: catPaket,
    sku: "PKT-SRP-003",
    name: "Paket Sarapan Hemat",
    slug: "paket-sarapan-hemat",
    desc: "Kombinasi 1/2 kg telur ayam negeri segar + 1 papan tempe daun pisang + 1 ikat bayam.",
    imageUrl: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&auto=format&fit=crop",
    isFresh: true,
    harvestInfo: "Paling laris untuk sarapan sehat",
    units: [
      { unitName: "1 Paket Sarapan", unitCode: "paket", quantityValue: 1, quantityUnit: "paket", price: 21500, costPrice: 16000, stockQuantity: 15 },
    ],
  });

  await createProductWithUnits({
    category: catBuah,
    sku: "BUA-PSG-001",
    name: "Pisang Cavendish Matang Alami",
    slug: "pisang-cavendish-matang-alami",
    desc: "Pisang cavendish mulus manis alami, kulit kuning bersih, kaya kalium untuk stamina keluarga.",
    imageUrl: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&auto=format&fit=crop",
    isFresh: true,
    harvestInfo: "Matang pohon dari kebun",
    units: [
      { unitName: "1 Sisir (±1.2 kg)", unitCode: "sisir", quantityValue: 1.2, quantityUnit: "kg", price: 22000, costPrice: 16000, stockQuantity: 20 },
    ],
  });

  await createProductWithUnits({
    category: catBuah,
    sku: "BUA-JRK-002",
    name: "Jeruk Medan Manis Segar",
    slug: "jeruk-medan-manis-segar",
    desc: "Jeruk Medan pilihan berkulit tipis, air melimpah, rasa manis segar kaya vitamin C.",
    imageUrl: "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=600&auto=format&fit=crop",
    isFresh: true,
    harvestInfo: "Segar tiba dari Sumatera Utara",
    units: [
      { unitName: "500 Gram", unitCode: "g", quantityValue: 500, quantityUnit: "g", price: 14000, costPrice: 10000, stockQuantity: 25 },
      { unitName: "1 Kilogram", unitCode: "kg", quantityValue: 1, quantityUnit: "kg", price: 26000, costPrice: 19000, stockQuantity: 20 },
    ],
  });

  // 6. Create sample past orders for Customer Siti (for order tracking & repeat order testing)
  const sampleUnit1 = await prisma.productUnit.findFirst({ where: { unitName: { contains: "1 Ikat" } } });
  const sampleUnit2 = await prisma.productUnit.findFirst({ where: { unitName: { contains: "250 Gram (1/4 kg)" } } });
  const sampleUnit3 = await prisma.productUnit.findFirst({ where: { unitName: { contains: "Pouch 2 Liter" } } });

  if (sampleUnit1 && sampleUnit2 && sampleUnit3) {
    const addressJson = JSON.stringify({
      recipientName: "Ibu Siti Rahmawati",
      phone: "081987654321",
      addressLine: "Jl. Sukajadi No. 45, RT 03 / RW 05",
      district: "Sukasari",
      city: "Kota Bandung",
      postalCode: "40152",
    });

    const pastOrder = await prisma.order.create({
      data: {
        orderNumber: "ORD-20261001-0012",
        userId: customer.id,
        addressSnapshot: addressJson,
        subtotal: 50000,
        discountTotal: 5000,
        shippingFee: 8000,
        grandTotal: 53000,
        paymentStatus: "PAID",
        orderStatus: "DELIVERED",
        notes: "Tolong gantung di pagar depan ya mas",
        createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000),
        items: {
          create: [
            {
              productId: sampleUnit1.productId,
              productUnitId: sampleUnit1.id,
              productNameSnapshot: "Bayam Hijau Segar",
              unitNameSnapshot: sampleUnit1.unitName,
              unitPrice: 3500,
              quantity: 2,
              subtotal: 7000,
            },
            {
              productId: sampleUnit2.productId,
              productUnitId: sampleUnit2.id,
              productNameSnapshot: "Cabai Merah Keriting",
              unitNameSnapshot: sampleUnit2.unitName,
              unitPrice: 12000,
              quantity: 1,
              subtotal: 12000,
            },
            {
              productId: sampleUnit3.productId,
              productUnitId: sampleUnit3.id,
              productNameSnapshot: "Minyak Goreng Sawit Pouch 2L",
              unitNameSnapshot: sampleUnit3.unitName,
              unitPrice: 34500,
              quantity: 1,
              subtotal: 34500,
            },
          ],
        },
        statusHistory: {
          create: [
            { fromStatus: null, toStatus: "PENDING_PAYMENT", changedBy: customer.id, note: "Pesanan dibuat" },
            { fromStatus: "PENDING_PAYMENT", toStatus: "PAID", changedBy: admin.id, note: "Pembayaran terverifikasi" },
            { fromStatus: "PAID", toStatus: "PROCESSING", changedBy: admin.id, note: "Pesanan disiapkan tim toko" },
            { fromStatus: "PROCESSING", toStatus: "OUT_FOR_DELIVERY", changedBy: admin.id, note: "Kurir Toko mengantar pesanan" },
            { fromStatus: "OUT_FOR_DELIVERY", toStatus: "DELIVERED", changedBy: admin.id, note: "Pesanan diterima pelanggan" },
          ],
        },
        payment: {
          create: {
            method: "COD",
            status: "COMPLETED",
            amount: 53000,
            paidAt: new Date(Date.now() - 3 * 24 * 3600 * 1000),
          },
        },
        delivery: {
          create: {
            method: "KURIR_TOKO",
            status: "DELIVERED",
            scheduledDate: "2026-10-01",
            slotStart: "07:00",
            slotEnd: "10:00",
            trackingNote: "Diterima oleh Ibu Siti langsung di rumah",
          },
        },
      },
    });

    // Create one active processing order
    await prisma.order.create({
      data: {
        orderNumber: "ORD-20261004-0001",
        userId: customer.id,
        addressSnapshot: addressJson,
        subtotal: 38500,
        discountTotal: 0,
        shippingFee: 8000,
        grandTotal: 46500,
        paymentStatus: "PAID",
        orderStatus: "PROCESSING",
        notes: "Pilihkan bayam yang paling segar ya",
        items: {
          create: [
            {
              productId: sampleUnit1.productId,
              productUnitId: sampleUnit1.id,
              productNameSnapshot: "Bayam Hijau Segar",
              unitNameSnapshot: sampleUnit1.unitName,
              unitPrice: 3500,
              quantity: 1,
              subtotal: 3500,
            },
            {
              productId: sampleUnit3.productId,
              productUnitId: sampleUnit3.id,
              productNameSnapshot: "Minyak Goreng Sawit Pouch 2L",
              unitNameSnapshot: sampleUnit3.unitName,
              unitPrice: 34500,
              quantity: 1,
              subtotal: 34500,
            },
          ],
        },
        statusHistory: {
          create: [
            { fromStatus: null, toStatus: "PENDING_PAYMENT", changedBy: customer.id, note: "Pesanan dibuat" },
            { fromStatus: "PENDING_PAYMENT", toStatus: "PAID", changedBy: admin.id, note: "Pembayaran terverifikasi" },
            { fromStatus: "PAID", toStatus: "PROCESSING", changedBy: admin.id, note: "Pesanan sedang disiapkan" },
          ],
        },
        payment: {
          create: {
            method: "BANK_TRANSFER",
            status: "COMPLETED",
            amount: 46500,
            providerReference: "TRF-BCA-987123",
            paidAt: new Date(),
          },
        },
        delivery: {
          create: {
            method: "KURIR_TOKO",
            status: "PENDING",
            scheduledDate: "2026-10-04",
            slotStart: "13:00",
            slotEnd: "16:00",
            trackingNote: "Sedang dikemas di toko",
          },
        },
      },
    });
  }

  console.log("Seeding Toko Saudara completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
