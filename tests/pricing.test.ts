import assert from "node:assert/strict";
import prisma from "../src/lib/db";
import { calculateOrderTotals } from "../src/lib/pricing";

export async function runPricingTests() {
  console.log("\n--- Menjalankan tests/pricing.test.ts ---");

  // Fetch some seeded units
  const bayamUnit = await prisma.productUnit.findFirst({
    where: { unitName: { contains: "1 Ikat" } },
  });
  const berasUnit = await prisma.productUnit.findFirst({
    where: { unitName: { contains: "Karung 5 Kilogram" } },
  });
  const areaSukasari = await prisma.deliveryArea.findFirst({
    where: { name: { contains: "Sukasari" } },
  });

  assert.ok(bayamUnit, "Bayam unit harus tersedia di database");
  assert.ok(berasUnit, "Beras unit harus tersedia di database");
  assert.ok(areaSukasari, "Area pengiriman Sukasari harus tersedia di database");

  // 1. Test Server Authoritative Pricing (Client Price Manipulation Ignored)
  console.log("  [TEST] Otoritas harga server (manipulasi harga client diabaikan)");
  const manipulatedInput: any = [
    {
      productUnitId: bayamUnit.id,
      quantity: 2,
      price: 1, // Client tries to buy bayam for Rp 1
      subtotal: 2,
    },
  ];

  const result1 = await calculateOrderTotals(manipulatedInput, null, null);
  // Expected price is database price (3500 * 2 = 7000)
  assert.equal(result1.items[0].unitPrice, bayamUnit.price, "Harga satuan harus berasal dari DB, bukan client");
  assert.equal(result1.subtotal, bayamUnit.price * 2, "Subtotal harus dihitung berdasarkan harga DB");
  assert.notEqual(result1.subtotal, 2, "Harga manipulasi client Rp 2 tidak boleh digunakan");

  // 2. Test Shipping Fee Calculation
  console.log("  [TEST] Perhitungan biaya ongkos kirim area");
  const resultWithShipping = await calculateOrderTotals(
    [{ productUnitId: bayamUnit.id, quantity: 2 }],
    null,
    areaSukasari.id
  );
  assert.equal(resultWithShipping.shippingFee, areaSukasari.shippingFee, "Ongkir harus sesuai database area");
  assert.equal(
    resultWithShipping.grandTotal,
    resultWithShipping.subtotal + areaSukasari.shippingFee,
    "Grand total harus penjumlahan subtotal + ongkir"
  );

  // 3. Test Promo Code "PASARPAGI" (10% discount, max 15.000, min 50.000)
  console.log("  [TEST] Perhitungan kode promo PASARPAGI (Persentase 10% maks Rp 15.000)");
  // Beras 5kg = Rp 78.000 (>= 50.000 min order)
  const resultPromo1 = await calculateOrderTotals(
    [{ productUnitId: berasUnit.id, quantity: 1 }],
    "PASARPAGI",
    null
  );
  // 10% of 78.000 = 7.800
  assert.equal(resultPromo1.discountTotal, 7800, "Diskon 10% dari 78.000 harus 7.800");
  assert.equal(resultPromo1.grandTotal, 78000 - 7800, "Grand total harus 70.200");
  assert.ok(resultPromo1.promotion, "Objek promosi harus disertakan dalam response");
  assert.equal(resultPromo1.promotion?.code, "PASARPAGI");

  // Test Max Discount Cap on PASARPAGI (buy 3 karung = 234.000, 10% = 23.400 -> capped at 15.000)
  const resultPromoCapped = await calculateOrderTotals(
    [{ productUnitId: berasUnit.id, quantity: 3 }],
    "PASARPAGI",
    null
  );
  assert.equal(resultPromoCapped.discountTotal, 15000, "Diskon harus dipotong maksimal 15.000");

  // 4. Test Promo Code "HEMATONGKIR" (Fixed discount Rp 5.000, min 40.000)
  console.log("  [TEST] Perhitungan kode promo HEMATONGKIR (Potongan tetap Rp 5.000)");
  const resultFixedPromo = await calculateOrderTotals(
    [{ productUnitId: berasUnit.id, quantity: 1 }],
    "HEMATONGKIR",
    null
  );
  assert.equal(resultFixedPromo.discountTotal, 5000, "Diskon harus bernilai flat 5.000");
  assert.equal(resultFixedPromo.grandTotal, 78000 - 5000);

  // 5. Test Promo Code "LANGGANAN" (15% discount for loyal/regular customers, max 20.000, min 30.000)
  console.log("  [TEST] Perhitungan kode promo LANGGANAN (Khusus langganan diskon 15% maks Rp 20.000)");
  // Ensure LANGGANAN exists
  let langgananPromo = await prisma.promotion.findUnique({ where: { code: "LANGGANAN" } });
  if (!langgananPromo) {
    langgananPromo = await prisma.promotion.create({
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
  }

  // Belanja beras Rp 78.000 (15% = 11.700)
  const resultLangganan = await calculateOrderTotals(
    [{ productUnitId: berasUnit.id, quantity: 1 }],
    "LANGGANAN",
    null
  );
  assert.equal(resultLangganan.discountTotal, 11700, "Diskon 15% dari 78.000 harus bernilai 11.700");
  assert.equal(resultLangganan.grandTotal, 78000 - 11700);
  assert.equal(resultLangganan.promotion?.code, "LANGGANAN");

  // 6. Test Edge Cases: Minimum Order Amount Not Met
  console.log("  [TEST] Edge Case: Nilai belanja di bawah minimum promo");
  // 2 bayam = 7.000 (< 50.000 min for PASARPAGI)
  const resultUnderMin = await calculateOrderTotals(
    [{ productUnitId: bayamUnit.id, quantity: 2 }],
    "PASARPAGI",
    null
  );
  assert.equal(resultUnderMin.discountTotal, 0, "Diskon harus 0 jika subtotal di bawah minimum order");
  assert.equal(resultUnderMin.promotion, null, "Promosi tidak boleh aktif jika syarat tidak terpenuhi");

  // 7. Test Edge Cases: Expired / Inactive Promo Code
  console.log("  [TEST] Edge Case: Kode promo kadaluarsa / non-aktif");
  const expiredPromo = await prisma.promotion.create({
    data: {
      name: "Promo Kemarin",
      code: "PROMOEXPIRED",
      type: "FIXED",
      value: 10000,
      minOrderAmount: 20000,
      startsAt: new Date(Date.now() - 10 * 24 * 3600 * 1000),
      endsAt: new Date(Date.now() - 1 * 24 * 3600 * 1000), // Expired yesterday
      isActive: true,
    },
  });

  const resultExpired = await calculateOrderTotals(
    [{ productUnitId: berasUnit.id, quantity: 1 }],
    "PROMOEXPIRED",
    null
  );
  assert.equal(resultExpired.discountTotal, 0, "Promo kadaluarsa tidak boleh memberikan diskon");

  // Cleanup temporary expired promo
  await prisma.promotion.delete({ where: { id: expiredPromo.id } });

  // 8. Test Promo Potongan Khusus Barang Tertentu yang Ditentukan Admin
  console.log("  [TEST] Promo potongan harga khusus barang tertentu yang ditentukan admin");
  const specificPromo = await prisma.promotion.create({
    data: {
      name: "Promo Khusus Beras & Minyak Langganan",
      code: "PROMOBARANG",
      type: "FIXED",
      value: 0,
      minOrderAmount: 20000,
      isActive: true,
    },
  });

  // Assign specific discount: Beras dapat potongan Rp 8.000 per unit
  await prisma.$executeRawUnsafe(
    `INSERT INTO "PromotionItem" ("id", "promotionId", "productUnitId", "discountType", "discountValue", "createdAt")
     VALUES (?, ?, ?, 'FIXED', 8000, CURRENT_TIMESTAMP)`,
    `pi_test_${Date.now()}`,
    specificPromo.id,
    berasUnit.id
  );

  // Case A: Cart contains 2 Beras + 2 Bayam
  // Beras: 2 x 8.000 = Rp 16.000 discount
  // Bayam: Rp 0 discount (karena tidak masuk daftar barang promo admin)
  const resultSpecificA = await calculateOrderTotals(
    [
      { productUnitId: berasUnit.id, quantity: 2 },
      { productUnitId: bayamUnit.id, quantity: 2 },
    ],
    "PROMOBARANG",
    null
  );

  assert.equal(resultSpecificA.discountTotal, 16000, "Potongan hanya boleh diterapkan pada barang tertentu (Beras)");
  assert.equal(resultSpecificA.promotion?.itemBreakdowns?.length, 1, "Rincian breakdown barang promo harus ada 1");
  assert.equal(resultSpecificA.promotion?.itemBreakdowns?.[0].productUnitId, berasUnit.id);
  assert.equal(resultSpecificA.promotion?.itemBreakdowns?.[0].subtotalDiscount, 16000);

  // Case B: Cart only contains Bayam (Barang tidak memenuhi promo)
  const resultSpecificB = await calculateOrderTotals(
    [{ productUnitId: bayamUnit.id, quantity: 10 }], // Subtotal 35.000 >= 20.000
    "PROMOBARANG",
    null
  );
  assert.equal(resultSpecificB.discountTotal, 0, "Diskon harus 0 jika barang dalam keranjang tidak masuk daftar barang promo");

  // Cleanup test promo
  await prisma.$executeRawUnsafe(`DELETE FROM "PromotionItem" WHERE "promotionId" = ?`, specificPromo.id);
  await prisma.promotion.delete({ where: { id: specificPromo.id } });

  console.log("  ✓ Semua pengujian pricing.test.ts berhasil!");
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}`) {
  runPricingTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
